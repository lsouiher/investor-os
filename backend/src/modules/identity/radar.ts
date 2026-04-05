/**
 * Map audit data to 6 radar axes for identity visualization.
 *
 * Axes:
 *   capital        — derived from financial audit (assets, income)
 *   time           — derived from time audit (availability, flexibility)
 *   skills         — derived from skills audit (experience, professional, transferable)
 *   risk_tolerance — derived from risk audit (self-assessment, comfort zones)
 *   network        — derived from skills audit network section
 *   goal_clarity   — derived from horizon audit (targets, timeline, constraints)
 *
 * Each axis is 0-100.
 */

export interface RadarData {
  capital: number;
  time: number;
  skills: number;
  risk_tolerance: number;
  network: number;
  goal_clarity: number;
}

interface AuditResponses {
  [section: string]: Record<string, unknown> | undefined;
}

/**
 * Count how many fields in a set of sections are filled (non-null, non-empty).
 * Returns a 0-100 completeness score.
 */
function sectionScore(responses: AuditResponses, sections: string[]): number {
  let filled = 0;
  let total = 0;

  for (const section of sections) {
    const data = responses[section];
    if (!data || typeof data !== 'object') continue;
    for (const value of Object.values(data)) {
      total++;
      if (value !== null && value !== undefined && value !== '' && value !== 0) {
        filled++;
      }
    }
  }

  if (total === 0) return 0;
  return Math.round((filled / total) * 100);
}

/**
 * Compute the network score from the skills audit network section.
 * Each network contact category (agents, lenders, etc.) contributes.
 * Having at least 1 in a category = full credit for that category.
 */
function networkScore(networkData: Record<string, unknown> | undefined): number {
  if (!networkData || typeof networkData !== 'object') return 0;

  const categories = ['agents', 'lenders', 'contractors', 'attorneys', 'cpas', 'mentors', 'partners'];
  let filledCategories = 0;

  for (const cat of categories) {
    const val = networkData[cat];
    if (typeof val === 'number' && val > 0) {
      filledCategories++;
    }
  }

  return Math.round((filledCategories / categories.length) * 100);
}

/**
 * Build radar data from completed audit responses.
 *
 * @param audits - Map of auditType to decrypted responses
 */
export function buildRadarData(
  audits: Record<string, AuditResponses>,
): RadarData {
  const financial = audits['financial'] ?? {};
  const time = audits['time'] ?? {};
  const skills = audits['skills'] ?? {};
  const risk = audits['risk'] ?? {};
  const horizon = audits['horizon'] ?? {};

  return {
    capital: sectionScore(financial, ['income', 'assets']),
    time: sectionScore(time, ['availability', 'flexibility']),
    skills: sectionScore(skills, ['re_experience', 'professional', 'transferable']),
    risk_tolerance: sectionScore(risk, ['self_assessment', 'comfort_zones']),
    network: networkScore(skills['network'] as Record<string, unknown> | undefined),
    goal_clarity: sectionScore(horizon, ['financial_targets', 'timeline', 'constraints']),
  };
}
