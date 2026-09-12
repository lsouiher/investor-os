import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from '../../shared/middleware/error-handler.js';
import { callClaudeWithRetry, parseJsonResponse } from '../../shared/ai/retry.js';
import { loadActiveTemplate, assemblePrompt } from '../../shared/ai/prompt-loader.js';
import { prisma } from '../../shared/db.js';
import * as simulationRepo from './repository.js';

const MAX_SIMULATIONS_PER_24H = 3;


/**
 * Zod schema for runtime validation of the AI simulation response.
 */
// Keys match the simulation prompt template's JSON output format
const SimulationResultSchema = z.object({
  archetype: z.string().min(1).max(100),
  readiness_score: z.number().min(0).max(100),
  sub_scores: z.record(z.string(), z.number().min(0).max(100)).default({}),
  radar_data: z.record(z.string(), z.number().min(0).max(100)).default({}),
  headline_insight: z.string().max(2000).default(''),
  strategy_changes: z.union([z.string().max(2000), z.array(z.string().max(2000))]).default(''),
});
type SimulationResult = z.infer<typeof SimulationResultSchema>;

export async function runSimulation(
  userId: number,
  tenantId: number,
  modifiedParameters: Record<string, unknown>,
) {
  // Check rate limit
  const recentCount = await simulationRepo.getSimulationCountLast24h(userId, tenantId);
  if (recentCount >= MAX_SIMULATIONS_PER_24H) {
    throw new AppError(
      'RATE_LIMITED',
      `Maximum ${MAX_SIMULATIONS_PER_24H} simulations per 24 hours. Please try again later.`,
      429,
    );
  }

  // Get current identity version
  const currentIdentity = await prisma.identityVersion.findFirst({
    where: { userId, tenantId },
    orderBy: { version: 'desc' },
  });

  if (!currentIdentity) {
    throw new AppError(
      'VALIDATION_ERROR',
      'No identity profile found. Complete all 5 audits and synthesize your identity first.',
      400,
    );
  }

  // Load prompt template and call AI
  const template = await loadActiveTemplate('simulation');
  const prompt = assemblePrompt(template.templateContent, {
    CURRENT_IDENTITY: JSON.stringify(
      {
        archetype: currentIdentity.archetype,
        readiness_score: currentIdentity.readinessScore,
        sub_scores: currentIdentity.subScores,
        radar_data: currentIdentity.radarData,
      },
      null,
      2,
    ),
    MODIFICATIONS: JSON.stringify(modifiedParameters, null, 2),
  });

  const aiResult = await callClaudeWithRetry({
    tenantId,
    userId,
    serviceType: 'simulation',
    promptTemplateId: template.id,
    systemPrompt: prompt,
    userContent: `Run a simulation with these modified parameters: ${JSON.stringify(modifiedParameters)}`,
  });

  const parsed = parseJsonResponse<SimulationResult>(aiResult.content, SimulationResultSchema);

  // Compute delta
  const resultDelta = {
    original: {
      archetype: currentIdentity.archetype,
      readinessScore: currentIdentity.readinessScore,
      subScores: currentIdentity.subScores,
      radarData: currentIdentity.radarData,
    },
    simulated: {
      archetype: parsed.archetype,
      readinessScore: parsed.readiness_score,
      subScores: parsed.sub_scores,
      radarData: parsed.radar_data,
      headlineInsight: parsed.headline_insight,
      strategyChanges: Array.isArray(parsed.strategy_changes) ? parsed.strategy_changes.join(' ') : parsed.strategy_changes,
    },
    scoreDelta: parsed.readiness_score - currentIdentity.readinessScore,
    archetypeChanged: parsed.archetype !== currentIdentity.archetype,
  };

  // Store simulation
  const simulation = await simulationRepo.createSimulation(
    tenantId,
    userId,
    currentIdentity.id,
    modifiedParameters as Prisma.InputJsonValue,
    resultDelta as unknown as Prisma.InputJsonValue,
  );

  const remaining = MAX_SIMULATIONS_PER_24H - recentCount - 1;

  return {
    id: simulation.publicId,
    delta: resultDelta,
    remaining,
  };
}

export async function listSimulations(userId: number, tenantId: number) {
  const simulations = await simulationRepo.getUserSimulations(userId, tenantId);
  return simulations.map((s) => ({
    id: s.publicId,
    modifiedParameters: s.modifiedParameters,
    resultDelta: s.resultDelta,
    baseIdentity: {
      id: s.identityVersion.publicId,
      archetype: s.identityVersion.archetype,
      readinessScore: s.identityVersion.readinessScore,
    },
    createdAt: s.createdAt.toISOString(),
  }));
}
