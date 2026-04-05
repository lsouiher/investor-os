import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from '../../shared/middleware/error-handler.js';
import { callClaudeWithRetry, parseJsonResponse } from '../../shared/ai/retry.js';
import { loadActiveTemplate, assemblePrompt } from '../../shared/ai/prompt-loader.js';
import { prisma } from '../../shared/db.js';
import * as simulationRepo from './repository.js';

const MAX_SIMULATIONS_PER_24H = 3;

interface SimulationResult {
  archetype: string;
  readinessScore: number;
  subScores: Record<string, number>;
  radarData: Record<string, number>;
  headlineInsight: string;
  strategyChanges: string[];
}

/**
 * Zod schema for runtime validation of the AI simulation response.
 */
const SimulationResultSchema = z.object({
  archetype: z.string().min(1).max(100),
  readinessScore: z.number().min(0).max(100),
  subScores: z.record(z.string(), z.number().min(0).max(100)),
  radarData: z.record(z.string(), z.number().min(0).max(100)),
  headlineInsight: z.string().min(1).max(2000),
  strategyChanges: z.array(z.string().max(2000)),
});

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
    archetype: currentIdentity.archetype,
    readinessScore: String(currentIdentity.readinessScore),
    subScores: JSON.stringify(currentIdentity.subScores),
    radarData: JSON.stringify(currentIdentity.radarData),
    modifiedParameters: JSON.stringify(modifiedParameters),
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
      readinessScore: parsed.readinessScore,
      subScores: parsed.subScores,
      radarData: parsed.radarData,
      headlineInsight: parsed.headlineInsight,
      strategyChanges: parsed.strategyChanges,
    },
    scoreDelta: parsed.readinessScore - currentIdentity.readinessScore,
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
