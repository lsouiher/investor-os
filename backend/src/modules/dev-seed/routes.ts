/**
 * Dev-only persona routes, behind the same gate as the CLI (guard.ts). main.ts mounts this
 * router only when the gate is open, and requireDevSeed re-checks it on every request.
 *
 *   GET  /dev/personas                   — the ten fixtures (label, summary, audits) for the fill panel
 *   POST /dev/personas/:letter/fill-all  — complete all five audits for the signed-in user, through
 *                                          auditService.saveAudit exactly as the form does (so the
 *                                          fifth completion auto-triggers synthesis, as it would)
 */
import { Router, Request, Response, NextFunction } from 'express';
import { requireDevSeed } from './guard.js';
import { AUDIT_TYPES, loadAllPersonas, loadPersona, normalizeLetter } from './fixtures.js';
import * as auditService from '../audit/service.js';
import { AppError } from '../../shared/middleware/error-handler.js';

const router = Router();
router.use(requireDevSeed);

router.get('/personas', (_req: Request, res: Response, next: NextFunction) => {
  try {
    const personas = loadAllPersonas().map((p) => ({
      letter: p.letter,
      doc_number: p.doc_number,
      label: p.label,
      summary: p.summary,
      audits: p.audits,
    }));
    res.json({ data: personas });
  } catch (err) {
    next(err);
  }
});

router.post('/personas/:letter/fill-all', async (req: Request, res: Response, next: NextFunction) => {
  try {
    let letter;
    try {
      letter = normalizeLetter(String(req.params.letter));
    } catch (err) {
      throw new AppError('VALIDATION_ERROR', (err as Error).message, 400);
    }
    const persona = loadPersona(letter);
    const filled: Array<{ audit_type: string; version: number; fields: number }> = [];
    for (const type of AUDIT_TYPES) {
      const result = await auditService.saveAudit(req.user!.userId, req.user!.tenantId, type, persona.audits[type], true);
      const fields = Object.values(persona.audits[type]).reduce((n, s) => n + Object.keys(s).length, 0);
      filled.push({ audit_type: type, version: result.version, fields });
    }
    res.json({ data: { persona: letter, label: persona.label, filled } });
  } catch (err) {
    next(err);
  }
});

export default router;
