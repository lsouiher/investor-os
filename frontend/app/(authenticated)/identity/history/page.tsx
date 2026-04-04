"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api-client";
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
  sub_scores: { label: string; value: number }[];
  created_at: string;
}

function scoreColorClass(score: number): string {
  if (score < 40) return "text-red-600";
  if (score < 70) return "text-amber-600";
  return "text-emerald-600";
}

export default function IdentityHistoryPage() {
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
      setError("Failed to load identity history.");
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
          <h1 className="text-2xl font-bold text-gray-900">Identity History</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track how your investor identity evolves
          </p>
        </div>
        <Link
          href="/identity"
          className="text-sm font-medium text-amber-600 hover:text-amber-700"
        >
          Back to Identity
        </Link>
      </div>

      {/* Score trend */}
      {scoreHistory.length > 1 && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="mb-3 text-sm font-medium text-gray-700">Score Trend</h3>
          <ScoreSparkline scores={scoreHistory} width={400} height={60} />
        </div>
      )}

      {/* Version timeline */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700">Versions</h3>
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
                  ? "border-amber-400 bg-amber-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              {/* Timeline dot */}
              <div className="flex flex-col items-center">
                <div
                  className={`h-3 w-3 rounded-full ${
                    isSelected ? "bg-amber-600" : "bg-gray-300"
                  }`}
                />
                {idx < versions.length - 1 && (
                  <div className="mt-1 h-6 w-px bg-gray-200" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">
                    v{version.version}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(version.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{version.archetype}</p>
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
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="mb-4 text-sm font-medium text-gray-700">
            Comparison{versionB ? ` (v${versionA.version} vs v${versionB.version})` : ""}
          </h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Version A */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
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
              <p className="text-xs text-gray-500">{versionA.headline_insight}</p>
            </div>

            {/* Version B */}
            {versionB ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
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
                <p className="text-xs text-gray-500">{versionB.headline_insight}</p>
              </div>
            ) : (
              <div className="flex items-center justify-center text-sm text-gray-400">
                Select a second version to compare
              </div>
            )}
          </div>
        </div>
      )}

      {versions.length === 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <p className="text-sm text-gray-500">
            No identity versions yet. Complete your audits and synthesize your identity.
          </p>
          <Link
            href="/hub"
            className="mt-4 inline-block rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-amber-700"
          >
            Go to Identity Hub
          </Link>
        </div>
      )}
    </div>
  );
}
