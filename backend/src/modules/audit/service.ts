import { AuditType } from '@prisma/client';
import * as auditRepo from './repository.js';
import { validateCompletionRequirements } from './validation.js';
import { calculateSubScore } from './scoring.js';
import { logAuditCompleted } from '../logging/service.js';
import { autoTriggerSynthesis } from '../identity/service.js';
import type { AuditSummary, AuditDetail } from './types.js';

export async function getAuditSummaries(userId: number, tenantId: number): Promise<AuditSummary[]> {
  const audits = await auditRepo.getLatestAuditsByUser(userId, tenantId);
  return audits.map((a) => ({
    id: a.publicId,
    auditType: a.auditType,
    status: a.status,
    version: a.version,
    subScore: a.subScore,
    lastSavedAt: a.lastSavedAt.toISOString(),
    completedAt: a.completedAt?.toISOString() ?? null,
  }));
}

export async function getAuditDetail(userId: number, tenantId: number, auditType: AuditType): Promise<AuditDetail | null> {
  const audit = await auditRepo.getCurrentAudit(userId, tenantId, auditType);
  if (!audit) return null;

  return {
    id: audit.publicId,
    auditType: audit.auditType,
    status: audit.status,
    version: audit.version,
    subScore: audit.subScore,
    lastSavedAt: audit.lastSavedAt.toISOString(),
    completedAt: audit.completedAt?.toISOString() ?? null,
    responses: audit.responses as Record<string, unknown>,
  };
}

export async function saveAudit(
  userId: number,
  tenantId: number,
  auditType: AuditType,
  responses: Record<string, unknown>,
  complete: boolean,
): Promise<AuditSummary> {
  if (complete) {
    validateCompletionRequirements(auditType, responses);
    const subScore = calculateSubScore(auditType, responses);
    const audit = await auditRepo.completeAudit(userId, tenantId, auditType, responses, subScore);

    // Fire-and-forget: log audit completion and check if identity synthesis should trigger
    logAuditCompleted({ tenantId, userId }, auditType, audit.version).catch(() => {});
    autoTriggerSynthesis(userId, tenantId).catch(() => {});

    return {
      id: audit.publicId,
      auditType: audit.auditType,
      status: audit.status,
      version: audit.version,
      subScore: audit.subScore,
      lastSavedAt: audit.lastSavedAt.toISOString(),
      completedAt: audit.completedAt?.toISOString() ?? null,
    };
  }

  const audit = await auditRepo.upsertDraft(userId, tenantId, auditType, responses);
  return {
    id: audit.publicId,
    auditType: audit.auditType,
    status: audit.status,
    version: audit.version,
    subScore: audit.subScore,
    lastSavedAt: audit.lastSavedAt.toISOString(),
    completedAt: audit.completedAt?.toISOString() ?? null,
  };
}

export async function getAuditHistory(userId: number, tenantId: number, auditType: AuditType) {
  const history = await auditRepo.getAuditHistory(userId, tenantId, auditType);
  return history.map((h) => ({
    id: h.publicId,
    version: h.version,
    subScore: h.subScore,
    completedAt: h.completedAt?.toISOString() ?? null,
  }));
}
