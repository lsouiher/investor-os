import { Router, Request, Response, NextFunction } from 'express';
import { AppError } from '../../shared/middleware/error-handler.js';
import * as identityService from './service.js';

const router = Router();

// GET /identity — latest identity
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const identity = await identityService.getLatestIdentity(req.user!.userId, req.user!.tenantId);
    if (!identity) {
      throw new AppError('NOT_FOUND', 'No identity found. Complete your audits first.', 404);
    }
    res.json({ data: identity });
  } catch (err) {
    next(err);
  }
});

// GET /identity/history — all versions
router.get('/history', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const history = await identityService.getIdentityHistory(req.user!.userId, req.user!.tenantId);
    res.json({ data: history });
  } catch (err) {
    next(err);
  }
});

// GET /identity/status — is a synthesis running, what's the latest version, did the last one fail
router.get('/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = await identityService.getSynthesisStatus(req.user!.userId, req.user!.tenantId);
    res.json({ data: status });
  } catch (err) {
    next(err);
  }
});

// POST /identity/synthesize — start a synthesis; 202 straight away, poll GET /identity/status
router.post('/synthesize', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const before = await identityService.getSynthesisStatus(req.user!.userId, req.user!.tenantId);
    if (!before.generating) {
      identityService.startSynthesis(req.user!.userId, req.user!.tenantId);
    }
    res.status(202).json({ data: { status: 'generating', latest_version: before.latestVersion } });
  } catch (err) {
    next(err);
  }
});

// PUT /identity/:identityId/rate — submit rating
router.put('/:identityId/rate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const identityId = String(req.params.identityId);
    const { rating } = req.body;

    if (rating === undefined || rating === null) {
      throw new AppError('VALIDATION_ERROR', 'rating is required.', 400);
    }

    const feedback = typeof req.body.feedback === 'string' ? req.body.feedback.trim() || null : null;
    const result = await identityService.rateIdentity(identityId, req.user!.tenantId, Number(rating), feedback);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

export default router;
