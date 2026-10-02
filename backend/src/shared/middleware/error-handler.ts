import { Request, Response, NextFunction } from 'express';
import {
  DEFAULT_LOCALE,
  isLocalizedText,
  render,
  t,
  type Locale,
  type LocalizedText,
  type MessageKey,
  type MessageParams,
} from '../i18n.js';

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'AI_SERVICE_ERROR'
  | 'AI_PARSE_ERROR'
  | 'INTERNAL_ERROR';

export class AppError extends Error {
  /** Set by `AppError.localized`: the key the response is rendered from */
  public text?: LocalizedText;
  private localizedDetails?: unknown[];

  constructor(
    public code: ErrorCode,
    message: string,
    public statusCode: number = 500,
    public details: unknown[] = [],
  ) {
    super(message);
    this.name = 'AppError';
  }

  /**
   * An error a user can meet: its text comes from the server dictionary and is written in the
   * language of the request when the response is sent. `message` and `details` hold the
   * English text, for logs. In `details`, a value given as `{ key, params }` is translated
   * the same way. Admin-only and developer-facing errors keep the plain constructor.
   */
  static localized(
    code: ErrorCode,
    key: MessageKey,
    params: MessageParams = {},
    statusCode: number = 500,
    details: unknown[] = [],
  ): AppError {
    const err = new AppError(code, t(DEFAULT_LOCALE, key, params), statusCode, renderDetails(DEFAULT_LOCALE, details));
    err.text = { key, params };
    err.localizedDetails = details;
    return err;
  }

  /** The message and details as a client reading in `locale` should see them */
  render(locale: Locale): { message: string; details: unknown[] } {
    if (!this.text) return { message: this.message, details: this.details };
    return {
      message: render(locale, this.text),
      details: renderDetails(locale, this.localizedDetails ?? []),
    };
  }
}

function renderDetails(locale: Locale, details: unknown[]): unknown[] {
  return details.map((detail) => {
    if (!detail || typeof detail !== 'object' || Array.isArray(detail)) return detail;
    return Object.fromEntries(
      Object.entries(detail).map(([name, value]) => [name, isLocalizedText(value) ? render(locale, value) : value]),
    );
  });
}

/**
 * What to keep of a failure that a later request will read (a polled job, a background
 * synthesis): the key when there is one, so it is rendered in that request's language.
 */
export function deferredMessage(err: unknown, fallback: MessageKey): LocalizedText | string {
  if (err instanceof AppError && err.text) return err.text;
  // A plain-English AppError is kept only when it is the client's fault; a server failure
  // ("No active prompt template found ...") is internal detail, so the reader gets the fallback
  if (err instanceof AppError && err.statusCode < 500) return err.message;
  return { key: fallback };
}

const ERROR_STATUS_MAP: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  RATE_LIMITED: 429,
  AI_SERVICE_ERROR: 503,
  AI_PARSE_ERROR: 503,
  INTERNAL_ERROR: 500,
};

// express.json() refusals: the client's fault, so a 4xx in the request's language, not a 500
const BODY_PARSER_ERRORS: Record<string, { status: number; key: MessageKey }> = {
  'entity.parse.failed': { status: 400, key: 'validation.body_invalid_json' },
  'entity.too.large': { status: 413, key: 'validation.body_too_large' },
};

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  // The account's language when signed in, the page's otherwise (set by resolveLocale)
  const locale = req.locale ?? DEFAULT_LOCALE;

  const parserError = err as Error & { type?: string; status?: number };
  const bodyError = BODY_PARSER_ERRORS[parserError.type ?? ''];
  if (bodyError) {
    res.status(bodyError.status).json({
      error: { code: 'VALIDATION_ERROR', message: t(locale, bodyError.key), details: [] },
    });
    return;
  }
  // Any other body the parser refuses as the client's fault (unsupported charset or encoding,
  // aborted upload): keep its 4xx status rather than answering 500
  if (typeof parserError.type === 'string' && parserError.status && parserError.status >= 400 && parserError.status < 500) {
    res.status(parserError.status).json({
      error: { code: 'VALIDATION_ERROR', message: t(locale, 'validation.body_unreadable'), details: [] },
    });
    return;
  }

  if (err instanceof AppError) {
    const statusCode = err.statusCode || ERROR_STATUS_MAP[err.code] || 500;
    const { message, details } = err.render(locale);
    res.status(statusCode).json({
      error: {
        code: err.code,
        message,
        details,
      },
    });
    return;
  }

  // Unexpected error — log and return generic
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: t(locale, 'error.internal'),
      details: [],
    },
  });
}
