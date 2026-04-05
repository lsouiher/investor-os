"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { useTranslation } from "@/lib/i18n";
import RadarChart, { type RadarData } from "@/components/identity/radar-chart";
import ScoreSparkline from "@/components/identity/score-sparkline";
import { SkeletonCard } from "@/components/shared/loading-states";
import AiErrorState from "@/components/shared/ai-error-state";

interface IdentityVersion {
  id: string;
  version: number;
  archetype: string;
  readiness_score: number;
  headline_insight: string;
  radar_data: RadarData;
  sub_scores: Record<string, number>;
  generated_at: string;
}

function scoreColorClass(score: number): string {
  if (score < 40) return "text-red-600";
  if (score < 70) return "text-amber-600";
  return "text-emerald-600";
}

export default function IdentityHistoryPage() {
  const { t } = useTranslation();
  const [versions, setVersions] = useState<IdentityVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [compareA, setCompareA] = useState<number | null>(null);
  const [compareB, setCompareB] = useState<number | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<IdentityVersion[]>("/identity/history");
      setVersions(data);
      if (data.length >= 2) {
        setCompareA(0);
        setCompareB(1);
      } else if (data.length === 1) {
        setCompareA(0);
      }
    } catch {
      setError(t("identity_history.error.load_failed"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const scoreHistory = versions.map((v) => v.readiness_score).reverse();

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <SkeletonCard lines={3} />
        <SkeletonCard lines={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl">
        <AiErrorState severity="medium" message={error} onRetry={fetchHistory} />
      </div>
    );
  }

  const versionA = compareA !== null ? versions[compareA] : null;
  const versionB = compareB !== null ? versions[compareB] : null;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground-strong">{t("identity_history.title")}</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            {t("identity_history.subtitle")}
          </p>
        </div>
        <Link
          href="/identity"
          className="text-sm font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700"
        >
          {t("identity_history.back")}
        </Link>
      </div>

      {/* Score trend */}
      {scoreHistory.length > 1 && (
        <div className="rounded-lg border border-border bg-surface-card p-6">
          <h3 className="mb-3 text-sm font-medium text-foreground-secondary">{t("identity_history.score_trend")}</h3>
          <ScoreSparkline scores={scoreHistory} width={400} height={60} />
        </div>
      )}

      {/* Version timeline */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground-secondary">{t("identity_history.versions")}</h3>
        {versions.map((version, idx) => {
          const isSelected = compareA === idx || compareB === idx;
          return (
            <button
              key={version.id}
              onClick={() => {
                if (compareA === idx) {
                  setCompareA(compareB);
                  setCompareB(null);
                } else if (compareB === idx) {
                  setCompareB(null);
                } else if (compareA === null) {
                  setCompareA(idx);
                } else if (compareB === null) {
                  setCompareB(idx);
                } else {
                  setCompareB(idx);
                }
              }}
              className={`flex w-full items-center gap-4 rounded-lg border p-4 text-left transition-colors ${
                isSelected
                  ? "border-amber-400 bg-amber-50 dark:bg-amber-950"
                  : "border-border bg-surface-card hover:border-border"
              }`}
            >
              {/* Timeline dot */}
              <div className="flex flex-col items-center">
                <div
                  className={`h-3 w-3 rounded-full ${
                    isSelected ? "bg-amber-600" : "bg-foreground-tertiary"
                  }`}
                />
                {idx < versions.length - 1 && (
                  <div className="mt-1 h-6 w-px bg-border" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground-strong">
                    v{version.version}
                  </span>
                  <span className="text-xs text-foreground-tertiary">
                    {new Date(version.generated_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-foreground-secondary">{version.archetype}</p>
              </div>

              <span className={`text-lg font-bold ${scoreColorClass(version.readiness_score)}`}>
                {version.readiness_score}
              </span>
            </button>
          );
        })}
      </div>

      {/* Side-by-side comparison */}
      {versionA && (
        <div className="rounded-lg border border-border bg-surface-card p-6">
          <h3 className="mb-4 text-sm font-medium text-foreground-secondary">
            {t("identity_history.comparison")}{versionB ? ` (v${versionA.version} vs v${versionB.version})` : ""}
          </h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Version A */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-foreground-tertiary">
                  v{versionA.version}
                </span>
                <span className={`text-xl font-bold ${scoreColorClass(versionA.readiness_score)}`}>
                  {versionA.readiness_score}
                </span>
              </div>
              <p className="text-sm font-medium" style={{ color: "#D97706" }}>
                {versionA.archetype}
              </p>
              <RadarChart data={versionA.radar_data} size={200} />
              <p className="text-xs text-foreground-muted">{versionA.headline_insight}</p>
            </div>

            {/* Version B */}
            {versionB ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-foreground-tertiary">
                    v{versionB.version}
                  </span>
                  <span className={`text-xl font-bold ${scoreColorClass(versionB.readiness_score)}`}>
                    {versionB.readiness_score}
                  </span>
                </div>
                <p className="text-sm font-medium" style={{ color: "#D97706" }}>
                  {versionB.archetype}
                </p>
                <RadarChart data={versionB.radar_data} size={200} />
                <p className="text-xs text-foreground-muted">{versionB.headline_insight}</p>
              </div>
            ) : (
              <div className="flex items-center justify-center text-sm text-foreground-tertiary">
                {t("identity_history.select_second")}
              </div>
            )}
          </div>
        </div>
      )}

      {versions.length === 0 && (
        <div className="rounded-lg border border-border bg-surface-card p-8 text-center">
          <p className="text-sm text-foreground-muted">
            {t("identity_history.empty")}
          </p>
          <Link
            href="/hub"
            className="mt-4 inline-block rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-amber-700"
          >
            {t("identity_history.goto_hub")}
          </Link>
        </div>
      )}
    </div>
  );
}
