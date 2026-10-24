import { Router, Request, Response, NextFunction } from 'express';
import { validateRecsDeal } from './validation.js';
import * as recsDealService from './service.js';

// Deals sent from RECS calculators (RECS docs/spec.md §10.8, contracts/recs-deals-api.md)
const router = Router();

// GET /recs-deals — the caller's live deals, newest first
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deals = await recsDealService.listRecsDeals(req.user!.userId, req.user!.tenantId);
    res.json({ data: deals });
  } catch (err) {
    next(err);
  }
});

// POST /recs-deals — save a deal; no dedup, every save is a row
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = validateRecsDeal(req.body);
    const deal = await recsDealService.createRecsDeal(req.user!.userId, req.user!.tenantId, input);
    res.status(201).json({ data: deal });
  } catch (err) {
    next(err);
  }
});

// DELETE /recs-deals/:dealId — soft delete one of the caller's deals
router.delete('/:dealId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await recsDealService.deleteRecsDeal(req.user!.userId, req.user!.tenantId, String(req.params.dealId));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
