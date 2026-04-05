"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { SkeletonCard } from "@/components/shared/loading-states";
import { StrategyEmpty } from "@/components/shared/empty-states";
import AiErrorState from "@/components/shared/ai-error-state";

interface Strategy {
  id: string;
  name: string;
  description: string;
  fit_score: number;
  pros: string[];
  cons: string[];
  status: "recommended" | "active" | "completed";
}

function scoreColorClass(score: number): string {
  if (score < 40) return "text-red-600 bg-red-50";
  if (score < 70) return "text-amber-600 bg-amber-50";
  return "text-emerald-600 bg-emerald-50";
}

export default function StrategiesPage() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStrategies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<Strategy[]>("/strategies");
      setStrategies(data);
    } catch {
      setError("Failed to load strategies.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStrategies();
  }, [fetchStrategies]);

  const handleActivate = async (id: string) => {
    try {
      await api.post(`/strategies/${id}/activate`);
      setStrategies((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: "active" } : s))
      );
    } catch {
      setError("Failed to activate strategy.");
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
        <h1 className="text-2xl font-bold text-gray-900">Your Strategies</h1>
        <p className="mt-1 text-sm text-gray-500">
          Personalized investment strategies ranked by fit
        </p>
      </div>

      {error && (
        <AiErrorState severity="low" message={error} onRetry={fetchStrategies} />
      )}

      {/* Primary strategy -- expanded */}
      <div className="rounded-lg border border-amber-200 bg-white p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-600">
                Top Match
              </span>
              {primary.status === "active" && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  Active
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-gray-900">{primary.name}</h2>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-sm font-bold ${scoreColorClass(primary.fit_score)}`}
          >
            {primary.fit_score}% Fit
          </span>
        </div>

        <p className="mb-4 text-sm text-gray-600">{primary.description}</p>

        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-600">
              Pros
            </h4>
            <ul className="space-y-1">
              {primary.pros.map((pro, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
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
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-red-500">
              Cons
            </h4>
            <ul className="space-y-1">
              {primary.cons.map((con, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
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
          {primary.status !== "active" && (
            <button
              onClick={() => handleActivate(primary.id)}
              className="rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-700"
            >
              Activate This Strategy
            </button>
          )}
          <Link
            href={`/strategies/${primary.id}`}
            className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            View Details
          </Link>
        </div>
      </div>

      {/* Secondary strategies -- compact */}
      {rest.map((strategy, idx) => (
        <div
          key={strategy.id}
          className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4"
        >
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-500">
            #{idx + 2}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">{strategy.name}</h3>
              {strategy.status === "active" && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  Active
                </span>
              )}
            </div>
            <p className="mt-0.5 text-sm text-gray-500 line-clamp-1">
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
            className="flex-shrink-0 text-sm font-medium text-amber-600 hover:text-amber-700"
          >
            View
          </Link>
        </div>
      ))}
    </div>
  );
}
