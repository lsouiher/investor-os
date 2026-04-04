import Anthropic from '@anthropic-ai/sdk';
import { createHash } from 'crypto';
import { prisma } from '../db.js';
import { logger } from '../logger.js';
import { encryptField } from '../encryption/field-encryption.js';
import type { PromptServiceType } from '@prisma/client';

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

export interface AiCallOptions {
  tenantId: number;
  userId: number;
  serviceType: PromptServiceType;
  promptTemplateId?: number;
  systemPrompt: string;
  userContent: string;
  timeoutMs?: number;
}

export interface AiCallResult {
  content: string;
  tokensUsed: number;
  latencyMs: number;
}

export async function callClaude(options: AiCallOptions): Promise<AiCallResult> {
  const anthropic = getClient();
  const timeout = options.timeoutMs || 15000;
  const fullPrompt = `${options.systemPrompt}\n\n${options.userContent}`;
  const inputHash = createHash('sha256').update(fullPrompt).digest('hex');
  const start = Date.now();

  try {
    const response = await Promise.race([
      anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: options.systemPrompt,
        messages: [{ role: 'user', content: options.userContent }],
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI_TIMEOUT')), timeout),
      ),
    ]);

    const latencyMs = Date.now() - start;

    // Concatenate all text blocks; warn on non-text blocks
    const textParts: string[] = [];
    for (const block of response.content) {
      if (block.type === 'text') {
        textParts.push(block.text);
      } else {
        logger.warn(
          { blockType: block.type },
          'Non-text content block in AI response — skipping',
        );
      }
    }
    const content = textParts.join('');

    const tokensUsed = (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0);

    // Log the AI call (encrypt prompt/response — may contain decrypted financial data)
    await prisma.aiCallLog.create({
      data: {
        tenantId: options.tenantId,
        userId: options.userId,
        serviceType: options.serviceType,
        promptTemplateId: options.promptTemplateId ?? null,
        inputHash,
        fullPrompt: encryptField(fullPrompt),
        fullResponse: encryptField(content),
        model: 'claude-sonnet-4-20250514',
        tokensUsed,
        latencyMs,
        success: true,
      },
    }).catch((err) => logger.error({ err }, 'Failed to log AI call'));

    return { content, tokensUsed, latencyMs };
  } catch (err) {
    const latencyMs = Date.now() - start;

    await prisma.aiCallLog.create({
      data: {
        tenantId: options.tenantId,
        userId: options.userId,
        serviceType: options.serviceType,
        promptTemplateId: options.promptTemplateId ?? null,
        inputHash,
        fullPrompt: encryptField(fullPrompt),
        fullResponse: '',
        model: 'claude-sonnet-4-20250514',
        latencyMs,
        success: false,
        errorMessage: err instanceof Error ? err.message : 'Unknown error',
      },
    }).catch((logErr) => logger.error({ logErr }, 'Failed to log AI call error'));

    throw err;
  }
}
