// Helpers for identity data as returned by the API (snake_case, per contracts/api-v1.md)

type Translate = (key: string) => string;

/** The five sub-scores, in display order. Their labels are the `identity.sub_score.*` texts. */
export const SUB_SCORE_KEYS = ["financial", "time", "skills", "risk", "horizon"];

/** The label of a sub-score in the current language; an unknown dimension shows its raw key. */
export function subScoreLabel(key: string, t: Translate): string {
  return SUB_SCORE_KEYS.includes(key) ? t(`identity.sub_score.${key}`) : key;
}

export interface SubScore {
  label: string;
  value: number;
}

/** sub_scores arrives as { financial: 68, time: 75, ... }; components render a labeled list. */
export function toSubScoreList(
  subScores: Record<string, number> | null | undefined,
  t: Translate
): SubScore[] {
  if (!subScores) return [];
  return Object.entries(subScores).map(([key, value]) => ({
    label: subScoreLabel(key, t),
    value: Number(value) || 0,
  }));
}
