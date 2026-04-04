// Deterministic sub-score calculation per audit type (0-100)
// Based on completeness and quality of responses

function countFilledFields(obj: Record<string, unknown>): { filled: number; total: number } {
  let filled = 0;
  let total = 0;
  for (const value of Object.values(obj)) {
    total++;
    if (value !== null && value !== undefined && value !== '') {
      filled++;
    }
  }
  return { filled, total };
}

function sectionCompleteness(responses: Record<string, unknown>, sections: string[]): number {
  let totalFilled = 0;
  let totalFields = 0;

  for (const section of sections) {
    const sectionData = responses[section];
    if (sectionData && typeof sectionData === 'object') {
      const { filled, total } = countFilledFields(sectionData as Record<string, unknown>);
      totalFilled += filled;
      totalFields += total;
    }
  }

  if (totalFields === 0) return 0;
  return Math.round((totalFilled / totalFields) * 100);
}

export function calculateSubScore(auditType: string, responses: Record<string, unknown>): number {
  switch (auditType) {
    case 'financial':
      return sectionCompleteness(responses, ['income', 'assets', 'liabilities', 'credit', 'tax']);
    case 'time':
      return sectionCompleteness(responses, ['availability', 'flexibility', 'preference', 'runway']);
    case 'skills':
      return sectionCompleteness(responses, ['re_experience', 'professional', 'transferable', 'education', 'network']);
    case 'risk':
      return sectionCompleteness(responses, ['self_assessment', 'scenarios', 'financial_safety', 'behavioral', 'comfort_zones']);
    case 'horizon':
      return sectionCompleteness(responses, ['primary_objective', 'financial_targets', 'timeline', 'lifestyle', 'constraints']);
    default:
      return 0;
  }
}
