"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { SkeletonCard } from "@/components/shared/loading-states";
import { StrategyEmpty } from "@/components/shared/empty-states";
import AiErrorState from "@/components/shared/ai-error-state";
import { useTranslation } from "@/lib/i18n";

// Shape of GET /api/v1/strategies items (snake_case per contracts/api-v1.md)
interface Strategy {
  id: string;
  name: string;
  description: string;
  fit_score: number;
  pros: string[];
  cons: string[];
  rank: number;
  is_active: boolean;
}

function scoreColorClass(score: number): string {
  if (score < 40) return "text-red-600 bg-red-50";
  if (score < 70) return "text-amber-600 bg-amber-50";
  return "text-emerald-600 bg-emerald-50";
}

export default function StrategiesPage() {
  const { t } = useTranslation();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStrategies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<Strategy[]>("/strategies");
      setStrategies([...data].sort((a, b) => a.rank - b.rank));
    } catch {
      setError(t("strategies.error.load_failed"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStrategies();
  }, [fetchStrategies]);

  const handleActivate = async (id: string) => {
    try {
      await api.put(`/strategies/${id}/activate`);
      // Only one strategy is active at a time
      setStrategies((prev) =>
        prev.map((s) => ({ ...s, is_active: s.id === id }))
      );
    } catch {
      setError(t("strategies.error.activate_failed"));
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <SkeletonCard lines={4} />
        <SkeletonCard lines={2} />
        <SkeletonCard lines={2} />
      </div>
    );
  }

  if (error && strategies.length === 0) {
    return (
      <div className="mx-auto max-w-5xl">
        <AiErrorState severity="medium" message={error} onRetry={fetchStrategies} />
      </div>
    );
  }

  if (strategies.length === 0) {
    return (
      <div className="mx-auto max-w-5xl">
        <StrategyEmpty />
      </div>
    );
  }

  const [primary, ...rest] = strategies;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground-strong">{t("strategies.title")}</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          {t("strategies.subtitle")}
        </p>
      </div>

      {error && (
        <AiErrorState severity="low" message={error} onRetry={fetchStrategies} />
      )}

      {/* Primary strategy -- expanded */}
      <div className="rounded-lg border border-amber-200 dark:border-amber-700 bg-surface-card p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                {t("strategies.top_match")}
              </span>
              {primary.is_active && (
                <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                  {t("strategies.active")}
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-foreground-strong">{primary.name}</h2>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-sm font-bold ${scoreColorClass(primary.fit_score)}`}
          >
            {t("strategies.fit_score", { score: String(primary.fit_score) })}
          </span>
        </div>

        <p className="mb-4 text-sm text-foreground-secondary">{primary.description}</p>

        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              {t("strategies.pros")}
            </h4>
            <ul className="space-y-1">
              {primary.pros.map((pro, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground-secondary">
                  <svg
                    className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {pro}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-red-500 dark:text-red-400">
              {t("strategies.cons")}
            </h4>
            <ul className="space-y-1">
              {primary.cons.map((con, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground-secondary">
                  <svg
                    className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  {con}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex gap-3">
          {!primary.is_active && (
            <button
              onClick={() => handleActivate(primary.id)}
              className="rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-700"
            >
              {t("strategies.activate")}
            </button>
          )}
          <Link
            href={`/strategies/${primary.id}`}
            className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground-secondary transition-colors hover:bg-surface-subtle"
          >
            {t("strategies.view_details")}
          </Link>
        </div>
      </div>

      {/* Secondary strategies -- compact */}
      {rest.map((strategy, idx) => (
        <div
          key={strategy.id}
          className="flex items-center gap-4 rounded-lg border border-border bg-surface-card p-4"
        >
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-surface-subtle text-sm font-bold text-foreground-muted">
            #{idx + 2}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground-strong">{strategy.name}</h3>
              {strategy.is_active && (
                <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                  {t("strategies.active")}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-sm text-foreground-muted line-clamp-1">
              {strategy.description}
            </p>
          </div>
          <span
            className={`flex-shrink-0 rounded-full px-3 py-1 text-sm font-bold ${scoreColorClass(strategy.fit_score)}`}
          >
            {strategy.fit_score}%
          </span>
          <Link
            href={`/strategies/${strategy.id}`}
            className="flex-shrink-0 text-sm font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700"
          >
            {t("common.view")}
          </Link>
        </div>
      ))}
    </div>
  );
}
