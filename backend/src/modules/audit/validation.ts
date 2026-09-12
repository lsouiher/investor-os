import { AuditType } from '@prisma/client';
import { AppError } from '../../shared/middleware/error-handler.js';

const VALID_AUDIT_TYPES = ['financial', 'time', 'skills', 'risk', 'horizon'] as const;

export function validateAuditType(auditType: string): AuditType {
  if (!VALID_AUDIT_TYPES.includes(auditType as AuditType)) {
    throw new AppError('VALIDATION_ERROR', `Invalid audit type: ${auditType}`, 400);
  }
  return auditType as AuditType;
}

// Required sections per audit type for completion
const REQUIRED_SECTIONS: Record<string, string[]> = {
  financial: ['income', 'assets', 'liabilities', 'credit', 'tax'],
  time: ['availability', 'flexibility', 'preferences', 'runway'],
  skills: ['re_experience', 'professional', 'transferable', 'education', 'network'],
  risk: ['self_assessment', 'scenarios', 'safety', 'behavioral', 'comfort_zones'],
  horizon: ['objectives', 'financial_targets', 'timeline', 'lifestyle', 'constraints'],
};

export function validateCompletionRequirements(
  auditType: string,
  responses: Record<string, unknown>,
): void {
  const requiredSections = REQUIRED_SECTIONS[auditType];
  if (!requiredSections) {
    throw new AppError('VALIDATION_ERROR', `Unknown audit type: ${auditType}`, 400);
  }

  const missingSections = requiredSections.filter((section) => {
    const sectionData = responses[section];
    if (!sectionData || typeof sectionData !== 'object') return true;
    // Section must have at least one non-empty field
    return Object.values(sectionData as Record<string, unknown>).every(
      (v) => v === null || v === undefined || v === '',
    );
  });

  if (missingSections.length > 0) {
    throw new AppError('VALIDATION_ERROR', 'All required sections must have at least one field completed.', 400, [
      { missing_sections: missingSections },
    ]);
  }
}
