import { Prisma, PromptServiceType } from '@prisma/client';
import { prisma } from '../../shared/db.js';
import { generatePublicId } from '../../shared/utils/id.js';

export async function listPromptTemplates(serviceType?: PromptServiceType) {
  return prisma.promptTemplate.findMany({
    where: serviceType ? { serviceType } : undefined,
    orderBy: [{ serviceType: 'asc' }, { version: 'desc' }],
    select: {
      publicId: true,
      serviceType: true,
      version: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function getPromptTemplateByPublicId(publicId: string) {
  return prisma.promptTemplate.findUnique({ where: { publicId } });
}

export async function createPromptTemplate(data: {
  serviceType: PromptServiceType;
  templateContent: string;
  outputSchema?: Prisma.InputJsonValue;
}) {
  // Wrap in serializable transaction to prevent concurrent version number races
  return prisma.$transaction(async (tx) => {
    const latest = await tx.promptTemplate.findFirst({
      where: { serviceType: data.serviceType },
      orderBy: { version: 'desc' },
    });
    const nextVersion = (latest?.version ?? 0) + 1;

    return tx.promptTemplate.create({
      data: {
        publicId: generatePublicId(),
        serviceType: data.serviceType,
        version: nextVersion,
        templateContent: data.templateContent,
        outputSchema: data.outputSchema ?? undefined,
        isActive: false,
      },
    });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function activatePromptTemplate(publicId: string) {
  const template = await prisma.promptTemplate.findUnique({ where: { publicId } });
  if (!template) return null;

  return prisma.$transaction(async (tx) => {
    // Deactivate all templates of the same service type
    await tx.promptTemplate.updateMany({
      where: { serviceType: template.serviceType, isActive: true },
      data: { isActive: false },
    });

    // Activate the target template
    return tx.promptTemplate.update({
      where: { id: template.id },
      data: { isActive: true },
    });
  });
}
