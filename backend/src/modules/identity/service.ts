import { AuditType } from '@prisma/client';
import * as identityRepo from './repository.js';
import { getCompletedAuditsForSynthesis } from '../audit/repository.js';
import { buildSubScores, calculateReadinessScore } from './scoring.js';
import { buildRadarData } from './radar.js';
import { loadActiveTemplate, assemblePrompt } from '../../shared/ai/prompt-loader.js';
import { callClaudeWithRetry, parseJsonResponse } from '../../shared/ai/retry.js';
import { AppError } from '../../shared/middleware/error-handler.js';
import { logger } from '../../shared/logger.js';
import type { IdentityDetail, IdentitySummary, AiSynthesisResponse } from './types.js';
import { AiSynthesisResponseSchema } from './types.js';

const ALL_AUDIT_TYPES: AuditType[] = ['financial', 'time', 'skills', 'risk', 'horizon'];

// In-memory deduplication lock to prevent concurrent synthesis for the same user
const synthesisInProgress = new Map<number, Promise<IdentityDetail | null>>();

/**
 * Get the latest identity version for a user, formatted for API response.
 */
export async function getLatestIdentity(
  userId: number,
  tenantId: number,
): Promise<IdentityDetail | null> {
  const identity = await identityRepo.getLatestIdentity(userId, tenantId);
  if (!identity) return null;

  return {
    id: identity.publicId,
    version: identity.version,
    archetype: identity.archetype,
    readinessScore: identity.readinessScore,
    subScores: identity.subScores as Record<string, number>,
    radarData: identity.radarData as Record<string, number>,
    headlineInsight: identity.headlineInsight,
    aiInsights: identity.aiInsights as Record<string, unknown>,
    generatedAt: identity.generatedAt.toISOString(),
  };
}

/**
 * Get all identity versions (history) for score trend display.
 */
export async function getIdentityHistory(
  userId: number,
  tenantId: number,
): Promise<IdentitySummary[]> {
  const versions = await identityRepo.getIdentityHistory(userId, tenantId);
  return versions.map((v) => ({
    id: v.publicId,
    version: v.version,
    archetype: v.archetype,
    readinessScore: v.readinessScore,
    generatedAt: v.generatedAt.toISOString(),
  }));
}

/**
 * Synthesize a new identity version from all completed audits.
 * Gathers audit data, computes scores, calls AI for archetype + insights,
 * then creates a new append-only identity version.
 */
export async function synthesizeIdentity(
  userId: number,
  tenantId: number,
): Promise<IdentityDetail> {
  // 1. Gather all completed audits
  const completedAudits = await getCompletedAuditsForSynthesis(userId, tenantId);

  if (completedAudits.length === 0) {
    throw new AppError(
      'VALIDATION_ERROR',
      'At least one audit must be completed before identity synthesis.',
      400,
    );
  }

  // 2. Build sub-scores and composite readiness score
  const subScores = buildSubScores(completedAudits);
  const readinessScore = calculateReadinessScore(subScores);

  // 3. Build radar data from audit responses
  const auditResponsesMap: Record<string, Record<string, Record<string, unknown> | undefined>> = {};
  for (const audit of completedAudits) {
    auditResponsesMap[audit.auditType] = audit.responses as Record<string, Record<string, unknown> | undefined>;
  }
  const radarData = buildRadarData(auditResponsesMap);

  // 4. Build audit snapshot (version references)
  const auditSnapshot: Record<string, number> = {};
  for (const audit of completedAudits) {
    auditSnapshot[audit.auditType] = audit.version;
  }

  // 5. Call AI for archetype determination and insights
  const template = await loadActiveTemplate('identity_synthesis');
  const auditSummary = completedAudits.map((a) => ({
    type: a.auditType,
    version: a.version,
    subScore: a.subScore,
    responses: a.responses,
  }));

  // Placeholder names must match the identity_synthesis template exactly (case-sensitive)
  const userContent = assemblePrompt(template.templateContent, {
    AUDIT_DATA: JSON.stringify(
      { audits: auditSummary, sub_scores: subScores, readiness_score: readinessScore, radar_data: radarData },
      null,
      2,
    ),
  });

  const aiResult = await callClaudeWithRetry({
    tenantId,
    userId,
    serviceType: 'identity_synthesis',
    promptTemplateId: template.id,
    systemPrompt: `You are an expert real estate investment advisor. Analyze the investor's audit data and determine their investor archetype, provide a headline insight, and detailed analysis. Respond with valid JSON only.`,
    userContent,
    timeoutMs: 30000,
  });

  const parsed = parseJsonResponse<AiSynthesisResponse>(aiResult.content, AiSynthesisResponseSchema);

  // 6. Create the identity version (append-only)
  const identity = await identityRepo.createIdentityVersion({
    tenantId,
    userId,
    archetype: parsed.archetype,
    readinessScore,
    subScores: subScores as unknown as Record<string, number>,
    radarData: radarData as unknown as Record<string, number>,
    headlineInsight: parsed.headline_insight,
    aiInsights: parsed.ai_insights as unknown as Record<string, unknown>,
    auditSnapshot,
  });

  logger.info(
    { userId, tenantId, version: identity.version, archetype: parsed.archetype },
    'Identity synthesized',
  );

  // FR-6: strategy generation is chained to synthesis. Isolated so an AI hiccup here
  // never fails the synthesis itself — GET /strategies self-heals by generating on demand.
  try {
    const strategyService = await import('../strategy/service.js');
    await strategyService.generateStrategies(userId, tenantId);
  } catch (err) {
    logger.error({ err, userId }, 'Chained strategy generation failed (non-blocking)');
  }

  // Growth strategy hooks (fire-and-forget)
  try {
    const growthService = await import('../growth/service.js');
    // Auto-create if feature flag is on and no strategy exists
    await growthService.maybeCreateGrowthStrategy(userId, tenantId, identity.id);
    // Check if score delta warrants regeneration suggestion
    await growthService.checkRegenerationSuggestion(userId, tenantId, readinessScore);
  } catch (err) {
    logger.error({ err, userId }, 'Failed to run growth strategy hooks (non-blocking)');
  }

  return {
    id: identity.publicId,
    version: identity.version,
    archetype: identity.archetype,
    readinessScore: identity.readinessScore,
    subScores: identity.subScores as Record<string, number>,
    radarData: identity.radarData as Record<string, number>,
    headlineInsight: identity.headlineInsight,
    aiInsights: identity.aiInsights as Record<string, unknown>,
    generatedAt: identity.generatedAt.toISOString(),
  };
}

/**
 * Check if identity synthesis should auto-trigger after an audit is completed.
 * Triggers when all 5 audits are completed (first synthesis) or when any audit
 * version is newer than the latest identity's audit snapshot.
 */
export async function autoTriggerSynthesis(
  userId: number,
  tenantId: number,
): Promise<IdentityDetail | null> {
  // Deduplicate: if synthesis is already running for this user, return the same promise
  const existing = synthesisInProgress.get(userId);
  if (existing) {
    logger.debug({ userId }, 'Synthesis already in progress, deduplicating');
    return existing;
  }

  const promise = doAutoTriggerSynthesis(userId, tenantId).finally(() => {
    synthesisInProgress.delete(userId);
  });
  synthesisInProgress.set(userId, promise);
  return promise;
}

async function doAutoTriggerSynthesis(
  userId: number,
  tenantId: number,
): Promise<IdentityDetail | null> {
  const completedAudits = await getCompletedAuditsForSynthesis(userId, tenantId);

  // Need all 5 audits completed for auto-trigger
  const completedTypes = new Set(completedAudits.map((a) => a.auditType));
  const allComplete = ALL_AUDIT_TYPES.every((t) => completedTypes.has(t));

  if (!allComplete) {
    logger.debug({ userId, completedTypes: [...completedTypes] }, 'Not all audits complete, skipping auto-synthesis');
    return null;
  }

  // Check if any audit is newer than the latest identity snapshot
  const latestIdentity = await identityRepo.getLatestIdentity(userId, tenantId);

  if (!latestIdentity) {
    // First synthesis — all audits complete, no identity yet
    logger.info({ userId }, 'Auto-triggering first identity synthesis');
    return synthesizeIdentity(userId, tenantId);
  }

  const snapshot = latestIdentity.auditSnapshot as Record<string, number>;
  const hasNewerAudit = completedAudits.some(
    (a) => a.version > (snapshot[a.auditType] ?? 0),
  );

  if (hasNewerAudit) {
    logger.info({ userId }, 'Auto-triggering identity re-synthesis (newer audits detected)');
    return synthesizeIdentity(userId, tenantId);
  }

  return null;
}

/**
 * Submit a user rating (1-5) for an identity version.
 */
export async function rateIdentity(
  identityPublicId: string,
  tenantId: number,
  rating: number,
): Promise<{ id: string; userRating: number }> {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new AppError('VALIDATION_ERROR', 'Rating must be an integer between 1 and 5.', 400);
  }

  const identity = await identityRepo.getIdentityByPublicId(identityPublicId, tenantId);
  if (!identity) {
    throw new AppError('NOT_FOUND', 'Identity version not found.', 404);
  }

  const updated = await identityRepo.updateUserRating(identity.id, rating);
  return {
    id: updated.publicId,
    userRating: updated.userRating!,
  };
}
