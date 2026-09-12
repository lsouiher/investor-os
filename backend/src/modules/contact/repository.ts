import { ContactRoleType, Prisma } from '@prisma/client';
import { prisma } from '../../shared/db.js';
import { generatePublicId } from '../../shared/utils/id.js';

export async function createContact(
  tenantId: number,
  userId: number,
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
  return prisma.contact.create({
    data: {
      publicId: generatePublicId(),
      tenantId,
      userId,
      name: data.name,
      email: data.email ?? null,
      phone: data.phone ?? null,
      roleType: data.roleType,
      notes: data.notes ?? null,
      strategyRelevance: data.strategyRelevance ?? [],
      networkGapFilled: data.networkGapFilled ?? null,
    },
  });
}

export async function updateContact(
  contactId: number,
  tenantId: number,
  data: {
    name?: string;
    email?: string;
    phone?: string;
    roleType?: ContactRoleType;
    notes?: string;
    strategyRelevance?: Prisma.InputJsonValue;
    networkGapFilled?: string;
    lastContactedAt?: Date;
  },
) {
  return prisma.contact.update({
    where: { id: contactId, tenantId, deletedAt: null },
    data,
  });
}

export async function softDeleteContact(contactId: number, tenantId: number) {
  return prisma.contact.update({
    where: { id: contactId, tenantId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
}

export async function listContacts(
  userId: number,
  tenantId: number,
  roleType?: ContactRoleType,
) {
  return prisma.contact.findMany({
    where: {
      userId,
      tenantId,
      deletedAt: null,
      ...(roleType ? { roleType } : {}),
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function findContactByPublicId(publicId: string, tenantId: number) {
  return prisma.contact.findFirst({
    where: { publicId, tenantId, deletedAt: null },
  });
}

export async function getNetworkScore(userId: number, tenantId: number) {
  const contacts = await prisma.contact.findMany({
    where: { userId, tenantId, deletedAt: null },
    select: { roleType: true, networkGapFilled: true },
  });

  return contacts;
}
