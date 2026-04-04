import * as loggingRepo from './repository.js';

interface LogContext {
  tenantId: number;
  userId: number;
}

export async function logAuditCompleted(ctx: LogContext, auditType: string, version: number) {
  return loggingRepo.createActivityLog({
    tenantId: ctx.tenantId,
    userId: ctx.userId,
    eventType: 'audit.completed',
    payload: { auditType, version },
  });
}

export async function logIdentitySynthesized(ctx: LogContext, version: number, archetype: string) {
  return loggingRepo.createActivityLog({
    tenantId: ctx.tenantId,
    userId: ctx.userId,
    eventType: 'identity.synthesized',
    payload: { version, archetype },
  });
}

export async function logStrategyGenerated(ctx: LogContext, strategyCount: number) {
  return loggingRepo.createActivityLog({
    tenantId: ctx.tenantId,
    userId: ctx.userId,
    eventType: 'strategy.generated',
    payload: { strategyCount },
  });
}

export async function logContactAdded(ctx: LogContext, roleType: string) {
  return loggingRepo.createActivityLog({
    tenantId: ctx.tenantId,
    userId: ctx.userId,
    eventType: 'contact.added',
    payload: { roleType },
  });
}

export async function logTaskCompleted(ctx: LogContext, taskId: string) {
  return loggingRepo.createActivityLog({
    tenantId: ctx.tenantId,
    userId: ctx.userId,
    eventType: 'task.completed',
    payload: { taskId },
  });
}

export async function logSimulationRun(ctx: LogContext, simulationId: string) {
  return loggingRepo.createActivityLog({
    tenantId: ctx.tenantId,
    userId: ctx.userId,
    eventType: 'simulation.run',
    payload: { simulationId },
  });
}

export async function logBlueprintDownloaded(ctx: LogContext) {
  return loggingRepo.createActivityLog({
    tenantId: ctx.tenantId,
    userId: ctx.userId,
    eventType: 'blueprint.downloaded',
    payload: {},
  });
}
