// Helpers for identity data as returned by the API (snake_case, per contracts/api-v1.md)

export const AUDIT_LABELS: Record<string, string> = {
  financial: "Financial",
  time: "Time",
  skills: "Skills",
  risk: "Risk",
  horizon: "Horizon",
};

export interface SubScore {
  label: string;
  value: number;
}

/** sub_scores arrives as { financial: 68, time: 75, ... }; components render a labeled list. */
export function toSubScoreList(subScores: Record<string, number> | null | undefined): SubScore[] {
  if (!subScores) return [];
  return Object.entries(subScores).map(([key, value]) => ({
    label: AUDIT_LABELS[key] ?? key,
    value: Number(value) || 0,
  }));
}
