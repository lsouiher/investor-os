/**
 * Compare two identity versions: compute score deltas, detect archetype changes,
 * and generate narrative text for the user.
 */

export interface IdentityVersionSnapshot {
  version: number;
  archetype: string;
  readinessScore: number;
  subScores: Record<string, number>;
  radarData: Record<string, number>;
  generatedAt: Date | string;
}

export interface IdentityComparison {
  scoreDelta: number;
  archetypeChanged: boolean;
  previousArchetype: string;
  currentArchetype: string;
  subScoreDeltas: Record<string, number>;
  radarDeltas: Record<string, number>;
  narrative: string;
}

/**
 * Compare current vs previous identity version.
 */
export function compareIdentityVersions(
  current: IdentityVersionSnapshot,
  previous: IdentityVersionSnapshot,
): IdentityComparison {
  const scoreDelta = current.readinessScore - previous.readinessScore;
  const archetypeChanged = current.archetype !== previous.archetype;

  // Sub-score deltas
  const subScoreDeltas: Record<string, number> = {};
  for (const key of Object.keys(current.subScores)) {
    subScoreDeltas[key] = (current.subScores[key] ?? 0) - (previous.subScores[key] ?? 0);
  }

  // Radar deltas
  const radarDeltas: Record<string, number> = {};
  for (const key of Object.keys(current.radarData)) {
    radarDeltas[key] = (current.radarData[key] ?? 0) - (previous.radarData[key] ?? 0);
  }

  const narrative = generateNarrative(current, previous, scoreDelta, archetypeChanged, subScoreDeltas);

  return {
    scoreDelta,
    archetypeChanged,
    previousArchetype: previous.archetype,
    currentArchetype: current.archetype,
    subScoreDeltas,
    radarDeltas,
    narrative,
  };
}

function generateNarrative(
  current: IdentityVersionSnapshot,
  previous: IdentityVersionSnapshot,
  scoreDelta: number,
  archetypeChanged: boolean,
  subScoreDeltas: Record<string, number>,
): string {
  const parts: string[] = [];

  // Overall score change
  if (scoreDelta > 0) {
    parts.push(`Your readiness score improved by ${scoreDelta} points to ${current.readinessScore}.`);
  } else if (scoreDelta < 0) {
    parts.push(`Your readiness score decreased by ${Math.abs(scoreDelta)} points to ${current.readinessScore}.`);
  } else {
    parts.push(`Your readiness score remains at ${current.readinessScore}.`);
  }

  // Archetype change
  if (archetypeChanged) {
    parts.push(
      `Your investor archetype evolved from "${previous.archetype}" to "${current.archetype}".`,
    );
  }

  // Biggest improvement
  const improvements = Object.entries(subScoreDeltas)
    .filter(([, delta]) => delta > 0)
    .sort(([, a], [, b]) => b - a);

  if (improvements.length > 0) {
    const [topArea, topDelta] = improvements[0];
    parts.push(`Biggest improvement: ${topArea} (+${topDelta}).`);
  }

  // Biggest decline
  const declines = Object.entries(subScoreDeltas)
    .filter(([, delta]) => delta < 0)
    .sort(([, a], [, b]) => a - b);

  if (declines.length > 0) {
    const [declineArea, declineDelta] = declines[0];
    parts.push(`Area to watch: ${declineArea} (${declineDelta}).`);
  }

  return parts.join(' ');
}
