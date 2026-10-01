import type { Request, Response, NextFunction } from 'express';
import { parseAcceptLanguage, type Locale } from '../i18n.js';

declare global {
  namespace Express {
    interface Request {
      locale: Locale;
    }
  }
}

// The language of the page making the request (the web client sends its interface language
// as Accept-Language). For signed-in requests, `authenticate` replaces it with the
// account's language.
export function resolveLocale(req: Request, _res: Response, next: NextFunction): void {
  req.locale = parseAcceptLanguage(req.headers['accept-language']);
  next();
}
