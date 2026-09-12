import { Router, Request, Response, NextFunction } from 'express';
import { TaskSource } from '@prisma/client';
import { AppError } from '../../shared/middleware/error-handler.js';
import * as taskService from './service.js';

const router = Router();

const VALID_SOURCES = new Set<string>(['ai_generated', 'identity_gap', 'manual']);

// GET /tasks — list tasks with filters and pagination
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const isCompletedParam = req.query.is_completed;
    const sourceParam = req.query.source ? String(req.query.source) : undefined;
    const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1);
    const perPage = Math.min(100, Math.max(1, parseInt(String(req.query.per_page ?? '20'), 10) || 20));

    if (sourceParam && !VALID_SOURCES.has(sourceParam)) {
      throw new AppError('VALIDATION_ERROR', `Invalid source: ${sourceParam}`, 400);
    }

    let isCompleted: boolean | undefined;
    if (isCompletedParam === 'true') isCompleted = true;
    else if (isCompletedParam === 'false') isCompleted = false;

    const result = await taskService.listTasks(
      req.user!.userId,
      req.user!.tenantId,
      {
        isCompleted,
        source: sourceParam as TaskSource | undefined,
        page,
        perPage,
      },
    );
    res.json({ data: result.tasks, pagination: result.pagination });
  } catch (err) {
    next(err);
  }
});

// POST /tasks — create a manual task
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Request keys are snake_case per the API contract
    const { title, description, due_date: dueDate, estimated_minutes: estimatedMinutes } = req.body;

    if (!title || typeof title !== 'string') {
      throw new AppError('VALIDATION_ERROR', 'title is required.', 400);
    }

    const task = await taskService.createManualTask(
      req.user!.userId,
      req.user!.tenantId,
      { title, description, dueDate, estimatedMinutes },
    );
    res.status(201).json({ data: task });
  } catch (err) {
    next(err);
  }
});

// PUT /tasks/:taskId — update a task
router.put('/:taskId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const taskId = String(req.params.taskId);
    const { title, description, due_date: dueDate, is_completed: isCompleted, estimated_minutes: estimatedMinutes } = req.body;

    const task = await taskService.updateTask(
      req.user!.userId,
      req.user!.tenantId,
      taskId,
      { title, description, dueDate, isCompleted, estimatedMinutes },
    );
    res.json({ data: task });
  } catch (err) {
    next(err);
  }
});

// DELETE /tasks/:taskId — soft delete a task
router.delete('/:taskId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const taskId = String(req.params.taskId);
    await taskService.deleteTask(
      req.user!.userId,
      req.user!.tenantId,
      taskId,
    );
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
