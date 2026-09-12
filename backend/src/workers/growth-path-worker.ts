import Bull from 'bull';
import { logger } from '../shared/logger.js';
import { generatePath } from '../modules/growth/generation.js';
import { generateCrossPathAnalysis } from '../modules/growth/generation.js';
import * as growthRepo from '../modules/growth/repository.js';
import type { PathGenerationJobData, CrossPathAnalysisJobData } from '../modules/growth/types.js';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Path generation queue
export const pathGenerationQueue = new Bull<PathGenerationJobData>('growth-path-generation', REDIS_URL, {
  settings: {
    stalledInterval: 60000, // 60s — auto-detect stalled jobs
    maxStalledCount: 1, // Revert after 1 stalled detection
  },
  defaultJobOptions: {
    attempts: 1, // No auto-retry — we handle failure explicitly
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 200, // Keep last 200 failed jobs
    timeout: 45000, // 45s job timeout (30s AI + buffer)
  },
});

// Cross-path analysis queue (separate, enqueued after path generation)
export const crossPathAnalysisQueue = new Bull<CrossPathAnalysisJobData>('growth-cross-path-analysis', REDIS_URL, {
  settings: {
    stalledInterval: 60000,
    maxStalledCount: 1,
  },
  defaultJobOptions: {
    attempts: 1,
    removeOnComplete: 100,
    removeOnFail: 200,
    timeout: 30000, // 30s
  },
});

// --- Path Generation Worker ---

pathGenerationQueue.process(async (job) => {
  const { tenantId, userId, growthStrategyId, growthPathId, pathType, identityVersionId, strategyId } = job.data;

  logger.info({ jobId: job.id, pathType, userId }, 'Processing path generation job');

  try {
    await generatePath({
      tenantId,
      userId,
      growthStrategyId,
      growthPathId,
      pathType,
      identityVersionId,
      strategyId,
    });

    logger.info({ jobId: job.id, pathType }, 'Path generation completed');

    // Enqueue cross-path analysis as follow-up
    const paths = await growthRepo.getAllCurrentPaths(growthStrategyId, tenantId);
    const generatedPaths = paths.filter((p) => p.status === 'generated');
    if (generatedPaths.length >= 2) {
      await crossPathAnalysisQueue.add({
        tenantId,
        userId,
        growthStrategyId,
        identityVersionId,
      });
      logger.info({ growthStrategyId }, 'Enqueued cross-path analysis');
    }
  } catch (err) {
    logger.error({ err, jobId: job.id, pathType }, 'Path generation failed');

    // Revert path status to unlocked on failure
    try {
      await growthRepo.revertPathToUnlocked(growthPathId, tenantId);
    } catch (revertErr) {
      logger.error({ revertErr, growthPathId }, 'Failed to revert path status');
    }

    throw err; // Let Bull mark job as failed
  }
});

// --- Cross-Path Analysis Worker ---

crossPathAnalysisQueue.process(async (job) => {
  const { tenantId, userId, growthStrategyId, identityVersionId } = job.data;

  logger.info({ jobId: job.id, growthStrategyId }, 'Processing cross-path analysis');

  try {
    await generateCrossPathAnalysis({
      tenantId,
      userId,
      growthStrategyId,
      identityVersionId,
    });

    logger.info({ jobId: job.id, growthStrategyId }, 'Cross-path analysis completed');
  } catch (err) {
    logger.error({ err, jobId: job.id, growthStrategyId }, 'Cross-path analysis failed');
    // Non-critical — don't revert anything, just log
    throw err;
  }
});

// --- Stalled Job Handling ---

pathGenerationQueue.on('stalled', async (jobId) => {
  logger.warn({ jobId }, 'Path generation job stalled — will be retried or failed');
});

crossPathAnalysisQueue.on('stalled', async (jobId) => {
  logger.warn({ jobId }, 'Cross-path analysis job stalled');
});

pathGenerationQueue.on('failed', async (job, err) => {
  logger.error({ jobId: job.id, err: err.message }, 'Path generation job failed');
});

crossPathAnalysisQueue.on('failed', async (job, err) => {
  logger.error({ jobId: job.id, err: err.message }, 'Cross-path analysis job failed');
});

logger.info('Growth path workers initialized');
