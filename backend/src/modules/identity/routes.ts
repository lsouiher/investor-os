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

// POST /identity/synthesize — trigger synthesis
router.post('/synthesize', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const identity = await identityService.synthesizeIdentity(req.user!.userId, req.user!.tenantId);
    res.json({ data: identity });
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

    const result = await identityService.rateIdentity(identityId, req.user!.tenantId, Number(rating));
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

export default router;
