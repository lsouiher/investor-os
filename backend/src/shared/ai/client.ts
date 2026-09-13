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
let credentialsProbe: Promise<boolean> | null = null;

/**
 * One-time startup probe: confirms the API key is valid and the configured model exists.
 * Cached so the health endpoint can report it without hitting the API on every ping; a real
 * call later overrides the verdict (see noteAiOutcome) — the model list is readable even when
 * the account can no longer pay for messages.
 */
export function verifyAiCredentials(): Promise<boolean> {
  if (!credentialsProbe) credentialsProbe = probeCredentials();
  return credentialsProbe;
}

async function probeCredentials(): Promise<boolean> {
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

/**
 * Feed the health check from real traffic: an account-level refusal (bad key, no credits)
 * fails every call the same way, so say so once, loudly, and flip `ai` to false until a call
 * succeeds again — nobody should have to read request logs to learn the account needs funding.
 */
function noteAiOutcome(err?: unknown): void {
  if (err === undefined) {
    if (credentialsVerified !== true) credentialsProbe = Promise.resolve(true);
    credentialsVerified = true;
    return;
  }
  let reason: string | null = null;
  if (err instanceof Anthropic.AuthenticationError) {
    reason = 'ANTHROPIC_API_KEY was rejected — all AI features will fail';
  } else if (err instanceof Anthropic.PermissionDeniedError) {
    reason = 'ANTHROPIC_API_KEY is not allowed to use this model/workspace';
  } else if (err instanceof Anthropic.BadRequestError && /credit balance/i.test(err.message)) {
    reason = 'Anthropic account has no credits — add funds at console.anthropic.com → Plans & Billing';
  }
  if (reason) {
    logger.error({ model: AI_MODEL }, reason);
    credentialsVerified = false;
    credentialsProbe = Promise.resolve(false);
  }
}

// Real generation of a few thousand JSON tokens takes tens of seconds; the mock server answers
// instantly, so keep every per-call budget generous enough for production, not for the mock.
const DEFAULT_TIMEOUT_MS = 120_000;
const MAX_OUTPUT_TOKENS = 8192;

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
  const timeout = options.timeoutMs || DEFAULT_TIMEOUT_MS;
  const fullPrompt = `${options.systemPrompt}\n\n${options.userContent}`;
  const inputHash = createHash('sha256').update(fullPrompt).digest('hex');
  const start = Date.now();

  // Stream so the connection stays active while the model generates (a non-streaming request
  // sits idle until the whole response exists). The SDK's `timeout` only covers the time to the
  // first byte of a stream, so the total budget is enforced with our own abort signal — aborting
  // tears down the request instead of leaving it running the way a Promise.race would.
  const controller = new AbortController();
  const deadline = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await anthropic.messages
      .stream(
        {
          model: AI_MODEL,
          max_tokens: MAX_OUTPUT_TOKENS,
          system: options.systemPrompt,
          messages: [{ role: 'user', content: options.userContent }],
        },
        { signal: controller.signal, maxRetries: 0 },
      )
      .finalMessage()
      .catch((err: unknown) => {
        if (controller.signal.aborted) {
          throw new Anthropic.APIConnectionTimeoutError({
            message: `Request timed out after ${timeout}ms (${options.serviceType}).`,
          });
        }
        throw err;
      });

    const latencyMs = Date.now() - start;

    if (response.stop_reason === 'max_tokens') {
      // The JSON is almost certainly cut off — the parse step will fail, but say why here.
      logger.warn(
        { serviceType: options.serviceType, maxTokens: MAX_OUTPUT_TOKENS },
        'AI response hit max_tokens and is likely truncated',
      );
    }

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

    logger.info(
      {
        serviceType: options.serviceType,
        latencyMs,
        inputTokens: response.usage?.input_tokens,
        outputTokens: response.usage?.output_tokens,
        stopReason: response.stop_reason,
      },
      'AI call completed',
    );
    noteAiOutcome();

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
    noteAiOutcome(err);

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
  } finally {
    clearTimeout(deadline);
  }
}
