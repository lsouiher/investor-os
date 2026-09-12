import { ContactRoleType, Prisma } from '@prisma/client';
import { AppError } from '../../shared/middleware/error-handler.js';
import * as contactRepo from './repository.js';
import * as strategyRepo from '../strategy/repository.js';
import { logContactAdded } from '../logging/service.js';

// Role types that are considered essential for a real estate investment network
const ESSENTIAL_ROLES: ContactRoleType[] = [
  'agent',
  'lender',
  'contractor',
  'attorney',
  'cpa',
];

export async function createContact(
  userId: number,
  tenantId: number,
  data: {
    name: string;
    email?: string;
    phone?: string;
    roleType: ContactRoleType;
    notes?: string;
    strategyRelevance?: Prisma.InputJsonValue;
    networkGapFilled?: string;
  },
) {
  // A new contact fills a network gap when it is the first of an essential role
  let networkGapFilled = data.networkGapFilled;
  if (!networkGapFilled && ESSENTIAL_ROLES.includes(data.roleType)) {
    const existing = await contactRepo.getNetworkScore(userId, tenantId);
    if (!existing.some((c) => c.roleType === data.roleType)) {
      networkGapFilled = data.roleType;
    }
  }

  const contact = await contactRepo.createContact(tenantId, userId, { ...data, networkGapFilled });

  // Fire-and-forget: log contact creation (don't block the response)
  logContactAdded({ tenantId, userId }, data.roleType).catch(() => {});

  return {
    id: contact.publicId,
    name: contact.name,
    email: contact.email,
    phone: contact.phone,
    roleType: contact.roleType,
    notes: contact.notes,
    strategyRelevance: contact.strategyRelevance,
    networkGapFilled: contact.networkGapFilled,
    lastContactedAt: contact.lastContactedAt?.toISOString() ?? null,
    createdAt: contact.createdAt.toISOString(),
  };
}

export async function updateContact(
  userId: number,
  tenantId: number,
  contactPublicId: string,
  data: {
    name?: string;
    email?: string;
    phone?: string;
    roleType?: ContactRoleType;
    notes?: string;
    strategyRelevance?: Prisma.InputJsonValue;
    networkGapFilled?: string;
    lastContactedAt?: string;
  },
) {
  const existing = await contactRepo.findContactByPublicId(contactPublicId, tenantId);
  if (!existing || existing.userId !== userId) {
    throw new AppError('NOT_FOUND', 'Contact not found.', 404);
  }

  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.roleType !== undefined) updateData.roleType = data.roleType;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.strategyRelevance !== undefined) updateData.strategyRelevance = data.strategyRelevance;
  if (data.networkGapFilled !== undefined) updateData.networkGapFilled = data.networkGapFilled;
  if (data.lastContactedAt !== undefined) updateData.lastContactedAt = new Date(data.lastContactedAt);

  const contact = await contactRepo.updateContact(existing.id, tenantId, updateData as Parameters<typeof contactRepo.updateContact>[2]);

  return {
    id: contact.publicId,
    name: contact.name,
    email: contact.email,
    phone: contact.phone,
    roleType: contact.roleType,
    notes: contact.notes,
    strategyRelevance: contact.strategyRelevance,
    networkGapFilled: contact.networkGapFilled,
    lastContactedAt: contact.lastContactedAt?.toISOString() ?? null,
    updatedAt: contact.updatedAt.toISOString(),
  };
}

export async function deleteContact(userId: number, tenantId: number, contactPublicId: string) {
  const existing = await contactRepo.findContactByPublicId(contactPublicId, tenantId);
  if (!existing || existing.userId !== userId) {
    throw new AppError('NOT_FOUND', 'Contact not found.', 404);
  }

  await contactRepo.softDeleteContact(existing.id, tenantId);
}

export async function getNetworkScore(userId: number, tenantId: number) {
  const contacts = await contactRepo.getNetworkScore(userId, tenantId);

  // Calculate completeness: what percentage of essential roles are covered
  const coveredRoles = new Set(contacts.map((c) => c.roleType));
  const essentialCovered = ESSENTIAL_ROLES.filter((r) => coveredRoles.has(r));
  const completeness = Math.round((essentialCovered.length / ESSENTIAL_ROLES.length) * 100);

  // Detect gaps: which essential roles are missing
  const missingRoles = ESSENTIAL_ROLES.filter((r) => !coveredRoles.has(r));

  // Detect strategy-specific gaps by checking active strategy
  const activeStrategy = await strategyRepo.getActiveStrategy(userId, tenantId);

  const strategyGaps: string[] = [];
  if (activeStrategy) {
    // For any real estate strategy, mentor and property_manager are valuable
    if (!coveredRoles.has('mentor')) strategyGaps.push('mentor');
    if (!coveredRoles.has('property_manager')) strategyGaps.push('property_manager');
  }

  return {
    totalContacts: contacts.length,
    completeness,
    essentialCovered: essentialCovered.length,
    essentialTotal: ESSENTIAL_ROLES.length,
    missingRoles,
    strategyGaps,
  };
}

export async function listContacts(
  userId: number,
  tenantId: number,
  roleType?: ContactRoleType,
) {
  const contacts = await contactRepo.listContacts(userId, tenantId, roleType);
  return contacts.map((c) => ({
    id: c.publicId,
    name: c.name,
    email: c.email,
    phone: c.phone,
    roleType: c.roleType,
    notes: c.notes,
    strategyRelevance: c.strategyRelevance,
    networkGapFilled: c.networkGapFilled,
    lastContactedAt: c.lastContactedAt?.toISOString() ?? null,
    createdAt: c.createdAt.toISOString(),
  }));
}
