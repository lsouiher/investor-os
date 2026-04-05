import { AuditType, Prisma } from '@prisma/client';
import { prisma } from '../../shared/db.js';
import { generatePublicId } from '../../shared/utils/id.js';
import { encryptSensitiveFields, decryptSensitiveFields } from '../../shared/encryption/field-encryption.js';

export async function getLatestAuditsByUser(userId: number, tenantId: number) {
  // Use raw DISTINCT ON to fetch only the latest version per audit type,
  // avoiding over-fetching all rows and deduplicating in JS.
  const audits = await prisma.$queryRaw<Array<{
    id: number;
    public_id: string;
    tenant_id: number;
    user_id: number;
    audit_type: AuditType;
    status: string;
    version: number;
    responses: Prisma.JsonValue;
    sub_score: number | null;
    last_saved_at: Date;
    completed_at: Date | null;
    created_at: Date;
  }>>`
    SELECT DISTINCT ON (audit_type) *
    FROM audits
    WHERE user_id = ${userId} AND tenant_id = ${tenantId}
    ORDER BY audit_type, version DESC
  `;

  return audits.map((a) => ({
    id: a.id,
    publicId: a.public_id,
    tenantId: a.tenant_id,
    userId: a.user_id,
    auditType: a.audit_type,
    status: a.status,
    version: a.version,
    responses: a.responses,
    subScore: a.sub_score,
    lastSavedAt: a.last_saved_at,
    completedAt: a.completed_at,
    createdAt: a.created_at,
  }));
}

export async function getCurrentAudit(userId: number, tenantId: number, auditType: AuditType) {
  const audit = await prisma.audit.findFirst({
    where: { userId, tenantId, auditType },
    orderBy: { version: 'desc' },
  });

  if (audit) {
    audit.responses = decryptSensitiveFields(
      audit.responses as Record<string, unknown>,
      auditType,
    ) as Prisma.JsonValue;
  }

  return audit;
}

export async function getAuditHistory(userId: number, tenantId: number, auditType: AuditType) {
  return prisma.audit.findMany({
    where: { userId, tenantId, auditType, status: 'completed' },
    orderBy: { version: 'desc' },
    select: {
      publicId: true,
      version: true,
      subScore: true,
      completedAt: true,
    },
  });
}

export async function upsertDraft(
  userId: number,
  tenantId: number,
  auditType: AuditType,
  responses: Record<string, unknown>,
) {
  const encryptedResponses = encryptSensitiveFields(responses, auditType);

  // Use serializable transaction to prevent race conditions:
  // - Concurrent requests creating duplicate drafts
  // - Concurrent version number reads producing duplicates
  return prisma.$transaction(async (tx) => {
    // Find existing draft (in_progress or not_started) for this type
    const existing = await tx.audit.findFirst({
      where: {
        userId,
        tenantId,
        auditType,
        status: { in: ['not_started', 'in_progress'] },
      },
      orderBy: { version: 'desc' },
    });

    if (existing) {
      return tx.audit.update({
        where: { id: existing.id },
        data: {
          responses: encryptedResponses as Prisma.InputJsonValue,
          status: 'in_progress',
          lastSavedAt: new Date(),
        },
      });
    }

    // Compute next version inside the transaction to prevent duplicates
    const latestCompleted = await tx.audit.findFirst({
      where: { userId, tenantId, auditType, status: 'completed' },
      orderBy: { version: 'desc' },
    });
    const nextVersion = (latestCompleted?.version ?? 0) + 1;

    return tx.audit.create({
      data: {
        publicId: generatePublicId(),
        tenantId,
        userId,
        auditType,
        status: 'in_progress',
        version: nextVersion,
        responses: encryptedResponses as Prisma.InputJsonValue,
        lastSavedAt: new Date(),
      },
    });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function completeAudit(
  userId: number,
  tenantId: number,
  auditType: AuditType,
  responses: Record<string, unknown>,
  subScore: number,
) {
  const encryptedResponses = encryptSensitiveFields(responses, auditType);

  // Use serializable transaction to prevent race conditions:
  // - Concurrent completes creating duplicate completed versions
  // - Version number read-then-increment without atomicity
  return prisma.$transaction(async (tx) => {
    // Find existing draft and lock on its status (optimistic locking via status check)
    const existing = await tx.audit.findFirst({
      where: {
        userId,
        tenantId,
        auditType,
        status: { in: ['not_started', 'in_progress'] },
      },
      orderBy: { version: 'desc' },
    });

    if (existing) {
      // Use updateMany with status filter as optimistic lock: if another request
      // already completed this draft, the update will affect 0 rows.
      const updated = await tx.audit.updateMany({
        where: {
          id: existing.id,
          status: { in: ['not_started', 'in_progress'] },
        },
        data: {
          responses: encryptedResponses as Prisma.InputJsonValue,
          status: 'completed',
          subScore,
          lastSavedAt: new Date(),
          completedAt: new Date(),
        },
      });

      if (updated.count === 0) {
        throw new Error('Audit was already completed by a concurrent request.');
      }

      // Re-fetch the updated row to return it
      return tx.audit.findUniqueOrThrow({ where: { id: existing.id } });
    }

    // Create new completed row with version computed inside the transaction
    const latestCompleted = await tx.audit.findFirst({
      where: { userId, tenantId, auditType, status: 'completed' },
      orderBy: { version: 'desc' },
    });
    const nextVersion = (latestCompleted?.version ?? 0) + 1;

    return tx.audit.create({
      data: {
        publicId: generatePublicId(),
        tenantId,
        userId,
        auditType,
        status: 'completed',
        version: nextVersion,
        responses: encryptedResponses as Prisma.InputJsonValue,
        subScore,
        lastSavedAt: new Date(),
        completedAt: new Date(),
      },
    });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function getCompletedAuditsForSynthesis(userId: number, tenantId: number) {
  // Use raw DISTINCT ON to fetch only the latest completed version per audit type,
  // avoiding over-fetching all completed rows and deduplicating in JS.
  const audits = await prisma.$queryRaw<Array<{
    id: number;
    public_id: string;
    tenant_id: number;
    user_id: number;
    audit_type: AuditType;
    status: string;
    version: number;
    responses: Prisma.JsonValue;
    sub_score: number | null;
    last_saved_at: Date;
    completed_at: Date | null;
    created_at: Date;
  }>>`
    SELECT DISTINCT ON (audit_type) *
    FROM audits
    WHERE user_id = ${userId} AND tenant_id = ${tenantId} AND status = 'completed'
    ORDER BY audit_type, version DESC
  `;

  // Map to camelCase and decrypt sensitive fields
  return audits.map((a) => ({
    id: a.id,
    publicId: a.public_id,
    tenantId: a.tenant_id,
    userId: a.user_id,
    auditType: a.audit_type,
    status: a.status,
    version: a.version,
    responses: decryptSensitiveFields(a.responses as Record<string, unknown>, a.audit_type),
    subScore: a.sub_score,
    lastSavedAt: a.last_saved_at,
    completedAt: a.completed_at,
    createdAt: a.created_at,
  }));
}
