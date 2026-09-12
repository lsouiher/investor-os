/**
 * Weighted composite readiness score (0-100).
 *
 * Weights:
 *   financial  20%
 *   time       15%
 *   skills     20%
 *   risk       20%
 *   horizon    25%
 */

export interface AuditSubScores {
  financial: number;
  time: number;
  skills: number;
  risk: number;
  horizon: number;
}

const WEIGHTS: Record<keyof AuditSubScores, number> = {
  financial: 0.20,
  time: 0.15,
  skills: 0.20,
  risk: 0.20,
  horizon: 0.25,
};

/**
 * Calculate the weighted composite readiness score from audit sub-scores.
 * Each sub-score is 0-100; result is 0-100.
 */
export function calculateReadinessScore(subScores: AuditSubScores): number {
  let total = 0;
  for (const key of Object.keys(WEIGHTS) as (keyof AuditSubScores)[]) {
    const score = subScores[key] ?? 0;
    total += score * WEIGHTS[key];
  }
  return Math.round(total);
}

/**
 * Build the sub-scores object from completed audits.
 * Falls back to 0 for any missing audit type.
 */
export function buildSubScores(
  audits: Array<{ auditType: string; subScore: number | null }>,
): AuditSubScores {
  const scores: AuditSubScores = {
    financial: 0,
    time: 0,
    skills: 0,
    risk: 0,
    horizon: 0,
  };

  for (const audit of audits) {
    const key = audit.auditType as keyof AuditSubScores;
    if (key in scores) {
      scores[key] = audit.subScore ?? 0;
    }
  }

  return scores;
}
