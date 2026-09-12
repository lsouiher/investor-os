import { type ZodType, ZodError } from 'zod';
import { AppError } from '../middleware/error-handler.js';
import { logger } from '../logger.js';
import { callClaude, type AiCallOptions, type AiCallResult } from './client.js';

const STRICTER_FORMAT_SUFFIX = `

IMPORTANT: Your response MUST be valid JSON only. No markdown, no code fences, no explanation. Only output the JSON object.`;

/**
 * Returns true if the error is a JSON parse or Zod validation failure
 * (i.e. the AI returned a response but it was malformed).
 * Network, timeout, and other transient errors should NOT trigger a
 * format-stricter retry — they should propagate immediately.
 */
function isFormatError(err: unknown): boolean {
  if (err instanceof ZodError) return true;
  if (err instanceof AppError && err.code === 'AI_PARSE_ERROR') return true;
  return false;
}

export async function callClaudeWithRetry(options: AiCallOptions): Promise<AiCallResult> {
  try {
    return await callClaude(options);
  } catch (firstError) {
    // Only retry with stricter format on parse/validation failures.
    // Network errors, timeouts, and other transient errors propagate immediately.
    if (!isFormatError(firstError)) {
      logger.error({ err: firstError }, 'AI call failed with non-format error, not retrying');
      throw firstError instanceof AppError
        ? firstError
        : new AppError(
            'AI_SERVICE_ERROR',
            "We couldn't process your request right now. Please try again.",
            503,
          );
    }

    logger.warn({ err: firstError }, 'AI response format error, retrying with stricter format');

    try {
      return await callClaude({
        ...options,
        userContent: options.userContent + STRICTER_FORMAT_SUFFIX,
      });
    } catch (secondError) {
      logger.error({ err: secondError }, 'Second AI call failed');
      throw new AppError(
        'AI_SERVICE_ERROR',
        "We couldn't process your request right now. Please try again.",
        503,
      );
    }
  }
}

/**
 * Parse an AI response as JSON and optionally validate it against a Zod schema.
 *
 * @param content  - Raw AI response text (may include markdown code fences)
 * @param schema   - Optional Zod schema for runtime validation
 * @returns Validated and typed result
 */
export function parseJsonResponse<T>(content: string, schema?: ZodType<T>): T {
  // Strip markdown code fences if present
  let cleaned = content.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new AppError(
      'AI_PARSE_ERROR',
      'Failed to parse AI response as JSON. Please try again.',
      503,
    );
  }

  if (!schema) {
    return parsed as T;
  }

  const result = schema.safeParse(parsed);
  if (!result.success) {
    logger.warn(
      { zodErrors: result.error.flatten() },
      'AI response failed Zod validation',
    );
    throw result.error;
  }

  return result.data;
}
