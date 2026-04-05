import { Router, Request, Response, NextFunction } from 'express';
import { AppError } from '../../shared/middleware/error-handler.js';
import { validateAuditType } from './validation.js';
import * as auditService from './service.js';

const router = Router();

// GET /audits — list all audits for current user
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const summaries = await auditService.getAuditSummaries(req.user!.userId, req.user!.tenantId);
    res.json({ data: summaries });
  } catch (err) {
    next(err);
  }
});

// GET /audits/:auditType — get current audit for type
router.get('/:auditType', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auditType = validateAuditType(String(req.params.auditType));
    const detail = await auditService.getAuditDetail(req.user!.userId, req.user!.tenantId, auditType);
    if (!detail) {
      // Return empty audit (not started)
      res.json({
        data: {
          id: null,
          audit_type: auditType,
          status: 'not_started',
          version: 0,
          responses: {},
          sub_score: null,
          last_saved_at: null,
        },
      });
      return;
    }
    res.json({ data: detail });
  } catch (err) {
    next(err);
  }
});

// PUT /audits/:auditType — save audit progress (draft or complete)
router.put('/:auditType', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auditType = validateAuditType(String(req.params.auditType));
    const { responses, complete } = req.body;

    if (!responses || typeof responses !== 'object') {
      throw new AppError('VALIDATION_ERROR', 'responses object is required.', 400);
    }

    const result = await auditService.saveAudit(
      req.user!.userId,
      req.user!.tenantId,
      auditType,
      responses,
      complete === true,
    );
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

// GET /audits/:auditType/history — get all completed versions
router.get('/:auditType/history', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auditType = validateAuditType(String(req.params.auditType));
    const history = await auditService.getAuditHistory(req.user!.userId, req.user!.tenantId, auditType);
    res.json({ data: history });
  } catch (err) {
    next(err);
  }
});

export default router;
