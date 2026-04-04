import { Router, Request, Response, NextFunction } from 'express';
import { AppError } from '../../shared/middleware/error-handler.js';
import * as simulationService from './service.js';

const router = Router();

/**
 * Allowed parameter keys for what-if simulations.
 * Maps to identity sub-score keys and radar data axes.
 */
const ALLOWED_PARAMETER_KEYS = new Set([
  // Sub-score keys (audit dimensions)
  'financial',
  'time',
  'skills',
  'risk',
  'horizon',
  // Radar data axes
  'capital',
  'risk_tolerance',
  'network',
  'goal_clarity',
  // Composite score
  'readinessScore',
]);

const PARAM_MIN = 0;
const PARAM_MAX = 100;

/**
 * Validate modifiedParameters: only known keys with numeric values in range.
 * Rejects string values and unexpected keys to prevent prompt injection.
 */
function validateModifiedParameters(
  params: unknown,
): Record<string, number> {
  if (!params || typeof params !== 'object' || Array.isArray(params)) {
    throw new AppError('VALIDATION_ERROR', 'modifiedParameters must be a non-array object.', 400);
  }

  const validated: Record<string, number> = {};

  for (const [key, value] of Object.entries(params as Record<string, unknown>)) {
    if (!ALLOWED_PARAMETER_KEYS.has(key)) {
      throw new AppError(
        'VALIDATION_ERROR',
        `Unknown parameter key: "${key}". Allowed keys: ${[...ALLOWED_PARAMETER_KEYS].join(', ')}`,
        400,
      );
    }

    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new AppError(
        'VALIDATION_ERROR',
        `Parameter "${key}" must be a finite number.`,
        400,
      );
    }

    if (value < PARAM_MIN || value > PARAM_MAX) {
      throw new AppError(
        'VALIDATION_ERROR',
        `Parameter "${key}" must be between ${PARAM_MIN} and ${PARAM_MAX}.`,
        400,
      );
    }

    validated[key] = value;
  }

  if (Object.keys(validated).length === 0) {
    throw new AppError('VALIDATION_ERROR', 'modifiedParameters must contain at least one parameter.', 400);
  }

  return validated;
}

// POST /simulations — run a what-if simulation
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const modifiedParameters = validateModifiedParameters(req.body.modifiedParameters);

    const result = await simulationService.runSimulation(
      req.user!.userId,
      req.user!.tenantId,
      modifiedParameters,
    );
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
});

// GET /simulations — list user's simulations
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const simulations = await simulationService.listSimulations(
      req.user!.userId,
      req.user!.tenantId,
    );
    res.json({ data: simulations });
  } catch (err) {
    next(err);
  }
});

export default router;
