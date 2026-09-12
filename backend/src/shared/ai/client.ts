import Anthropic from '@anthropic-ai/sdk';
import { createHash } from 'crypto';
import { prisma } from '../db.js';
import { logger } from '../logger.js';
import { encryptField } from '../encryption/field-encryption.js';
import type { PromptServiceType } from '@prisma/client';

let client: Anthropic | null = null;

// Model is env-configurable so it can be upgraded without a deploy.
export const AI_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';

function getClient(): Anthropic {
  if (!client) {
    // Org-level keys (not scoped to a workspace) must name the workspace on every request.
    const workspaceId = process.env.ANTHROPIC_WORKSPACE_ID;
    client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      defaultHeaders: workspaceId ? { 'anthropic-workspace-id': workspaceId } : undefined,
    });
  }
  return client;
}

let credentialsVerified: boolean | null = null;

/**
 * One-time startup probe: confirms the API key is valid and the configured model exists.
 * Cached so the health endpoint can report it without hitting the API on every ping.
 */
export async function verifyAiCredentials(): Promise<boolean> {
  if (credentialsVerified !== null) return credentialsVerified;
  if (!process.env.ANTHROPIC_API_KEY) {
    credentialsVerified = false;
    return false;
  }
  try {
    await getClient().models.retrieve(AI_MODEL, { timeout: 5000 });
    credentialsVerified = true;
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      logger.error('ANTHROPIC_API_KEY is invalid — all AI features will fail');
    } else if (err instanceof Anthropic.BadRequestError && /workspace/i.test(err.message)) {
      logger.error(
        'ANTHROPIC_API_KEY is an org-level key: set ANTHROPIC_WORKSPACE_ID (console → Settings → Workspaces) or use a workspace-scoped key',
      );
    } else if (err instanceof Anthropic.NotFoundError) {
      logger.error({ model: AI_MODEL }, 'Configured ANTHROPIC_MODEL does not exist');
    } else {
      logger.warn({ err }, 'Could not verify Anthropic credentials at startup');
    }
    credentialsVerified = false;
  }
  return credentialsVerified;
}

export function aiCredentialsOk(): boolean {
  return credentialsVerified === true;
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
    // SDK-level timeout aborts the underlying request (a Promise.race would leave it running)
    const response = await anthropic.messages.create(
      {
        model: AI_MODEL,
        max_tokens: 8192,
        system: options.systemPrompt,
        messages: [{ role: 'user', content: options.userContent }],
      },
      { timeout, maxRetries: 0 },
    );

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
        model: AI_MODEL,
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
        model: AI_MODEL,
        latencyMs,
        success: false,
        errorMessage: err instanceof Error ? err.message : 'Unknown error',
      },
    }).catch((logErr) => logger.error({ logErr }, 'Failed to log AI call error'));

    throw err;
  }
}
