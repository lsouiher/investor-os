import { Router, Request, Response, NextFunction } from 'express';
import { AppError } from '../../shared/middleware/error-handler.js';
import * as strategyService from './service.js';

const router = Router();

// GET /strategies — list all strategies
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const strategies = await strategyService.getStrategies(req.user!.userId, req.user!.tenantId);
    res.json({ data: strategies });
  } catch (err) {
    next(err);
  }
});

// PUT /strategies/:strategyId/activate — activate a strategy
router.put('/:strategyId/activate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const strategyId = String(req.params.strategyId);
    const result = await strategyService.activateStrategy(strategyId, req.user!.userId, req.user!.tenantId);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

// GET /strategies/:strategyId/action-plan — get action plan
router.get('/:strategyId/action-plan', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const strategyId = String(req.params.strategyId);
    const actionPlan = await strategyService.getActionPlan(strategyId, req.user!.tenantId);
    res.json({ data: actionPlan });
  } catch (err) {
    next(err);
  }
});

// GET /strategies/:strategyId/roadmap — get roadmap
router.get('/:strategyId/roadmap', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const strategyId = String(req.params.strategyId);
    const roadmap = await strategyService.getRoadmap(strategyId, req.user!.tenantId);
    res.json({ data: roadmap });
  } catch (err) {
    next(err);
  }
});

// GET /strategies/:strategyId/micro-plan — get micro-plan
router.get('/:strategyId/micro-plan', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const strategyId = String(req.params.strategyId);
    const microPlan = await strategyService.getMicroPlan(strategyId, req.user!.tenantId);
    res.json({ data: microPlan });
  } catch (err) {
    next(err);
  }
});

// PUT /strategies/action-items/:itemId — update action item completion
router.put('/action-items/:itemId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const itemId = String(req.params.itemId);
    const { is_completed } = req.body;

    if (typeof is_completed !== 'boolean') {
      throw new AppError('VALIDATION_ERROR', 'is_completed (boolean) is required.', 400);
    }

    await strategyService.updateItemCompletion(
      'action-item',
      itemId,
      is_completed,
      req.user!.userId,
      req.user!.tenantId,
    );
    res.json({ data: { id: itemId, is_completed } });
  } catch (err) {
    next(err);
  }
});

// PUT /strategies/milestones/:milestoneId — update milestone completion
router.put('/milestones/:milestoneId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const milestoneId = String(req.params.milestoneId);
    const { is_completed } = req.body;

    if (typeof is_completed !== 'boolean') {
      throw new AppError('VALIDATION_ERROR', 'is_completed (boolean) is required.', 400);
    }

    await strategyService.updateItemCompletion(
      'milestone',
      milestoneId,
      is_completed,
      req.user!.userId,
      req.user!.tenantId,
    );
    res.json({ data: { id: milestoneId, is_completed } });
  } catch (err) {
    next(err);
  }
});

// PUT /strategies/micro-tasks/:taskId — update micro-task completion
router.put('/micro-tasks/:taskId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const taskId = String(req.params.taskId);
    const { is_completed } = req.body;

    if (typeof is_completed !== 'boolean') {
      throw new AppError('VALIDATION_ERROR', 'is_completed (boolean) is required.', 400);
    }

    await strategyService.updateItemCompletion(
      'micro-task',
      taskId,
      is_completed,
      req.user!.userId,
      req.user!.tenantId,
    );
    res.json({ data: { id: taskId, is_completed } });
  } catch (err) {
    next(err);
  }
});

export default router;
