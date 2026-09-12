import { PromptServiceType } from '@prisma/client';
import { prisma } from '../db.js';
import { AppError } from '../middleware/error-handler.js';

export async function loadActiveTemplate(serviceType: PromptServiceType) {
  const template = await prisma.promptTemplate.findFirst({
    where: { serviceType, isActive: true },
  });

  if (!template) {
    throw new AppError(
      'INTERNAL_ERROR',
      `No active prompt template found for service type: ${serviceType}`,
      500,
    );
  }

  return template;
}

export function assemblePrompt(templateContent: string, variables: Record<string, string>): string {
  let assembled = templateContent;
  for (const [key, value] of Object.entries(variables)) {
    assembled = assembled.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }
  return assembled;
}
