"use client";

import { useEffect, useState, useCallback } from "react";
import { api, ApiError } from "@/lib/api-client";
import PathCard from "@/components/growth/PathCard";
import { SkeletonCard } from "@/components/shared/loading-states";
import AiErrorState from "@/components/shared/ai-error-state";
import Link from "next/link";

interface PathSummary {
  id: string;
  path_type: string;
  status: "locked" | "unlocked" | "generating" | "generated";
  version: number;
  progress: number;
  summary: string | null;
  action_item_count: number;
  completed_action_items: number;
  unlock_criteria?: string;
  unlock_progress?: string;
}

interface NextBestAction {
  action_item_id: string;
  path_type: string;
  title: string;
  reason: string;
  cross_path_impact: string[];
}

interface GrowthStrategy {
  id: string;
  status: string;
  overall_progress: number;
  growth_score: number;
  identity_version: {
    id: string;
    version: number;
    archetype: string;
    readiness_score: number;
  };
  paths: PathSummary[];
  next_best_action: NextBestAction | null;
  created_at: string;
}

const STUB_PATHS = new Set(["skills_knowledge", "time_operations"]);

const PATH_NAMES: Record<string, string> = {
  portfolio: "Portfolio Growth",
  income_capital: "Income & Capital",
  skills_knowledge: "Skills & Knowledge",
  time_operations: "Time & Operations",
};

function scoreTierLabel(score: number): string {
  if (score < 40) return "Needs work";
  if (score < 70) return "Developing";
  return "Strong";
}

function scoreTierColor(score: number): string {
  if (score < 40) return "text-red-600";
  if (score < 70) return "text-amber-600";
  return "text-emerald-600";
}

export default function GrowthStrategyPage() {
  const [strategy, setStrategy] = useState<GrowthStrategy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFirstVisitHero, setShowFirstVisitHero] = useState(true);

  const fetchStrategy = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<GrowthStrategy>("/growth-strategy");
      setStrategy(data);
    } catch (err) {
      if (err instanceof ApiError && err.code === "NOT_FOUND") {
        setStrategy(null);
      } else {
        setError("Failed to load growth strategy.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStrategy();
  }, [fetchStrategy]);

  // Poll for generating paths every 3s
  useEffect(() => {
    if (!strategy) return;
    const hasGenerating = strategy.paths.some((p) => p.status === "generating");
    if (!hasGenerating) return;

    const interval = setInterval(fetchStrategy, 3000);
    return () => clearInterval(interval);
  }, [strategy, fetchStrategy]);

  const handleGenerate = async (pathType: string, confirmEarlyUnlock = false) => {
    try {
      await api.post(`/growth-strategy/paths/${pathType}/generate`, {
        confirm_early_unlock: confirmEarlyUnlock,
      });
      await fetchStrategy();
    } catch (err) {
      if (err instanceof ApiError && err.code === "VALIDATION_ERROR") {
        // Locked path without confirmation — ask for early unlock
        if (confirm(`${(err as ApiError).message}\n\nGenerate anyway?`)) {
          await handleGenerate(pathType, true);
        }
      } else {
        setError(`Failed to generate ${PATH_NAMES[pathType] || pathType}.`);
      }
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 py-8">
        <SkeletonCard lines={3} />
        <SkeletonCard lines={2} />
        <SkeletonCard lines={2} />
        <SkeletonCard lines={2} />
      </div>
    );
  }

  if (error && !strategy) {
    return (
      <div className="mx-auto max-w-3xl py-8">
        <AiErrorState severity="medium" message={error} onRetry={fetchStrategy} />
      </div>
    );
  }

  // Empty state — no identity yet
  if (!strategy) {
    return (
      <div className="mx-auto max-w-3xl py-16 text-center">
        <div className="rounded-lg border border-gray-200 bg-white p-12">
          <h2 className="text-xl font-semibold text-gray-900">Your Growth Strategy unlocks after completing your investor identity.</h2>
          <p className="mt-2 text-gray-600">Complete all 5 audits and your identity synthesis to get started.</p>
          <Link
            href="/hub"
            className="mt-6 inline-block rounded bg-amber-600 px-6 py-2.5 font-medium text-white hover:bg-amber-700"
          >
            Go to Identity Hub
          </Link>
        </div>
      </div>
    );
  }

  const activePaths = strategy.paths.filter((p) => !STUB_PATHS.has(p.path_type));
  const stubPaths = strategy.paths.filter((p) => STUB_PATHS.has(p.path_type));
  const hasCompletedAnyAction = strategy.paths.some((p) => p.completed_action_items > 0);

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-8">
      {/* Header: Growth Score + Archetype */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Growth Strategy</h1>
          <p className="mt-1 text-sm text-gray-500">
            {strategy.identity_version.archetype} · Readiness {strategy.identity_version.readiness_score}/100
          </p>
        </div>
        <div className="text-right">
          <div
            className={`text-3xl font-bold ${scoreTierColor(strategy.growth_score)}`}
            role="meter"
            aria-valuenow={strategy.growth_score}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Growth Score: ${strategy.growth_score} out of 100, ${scoreTierLabel(strategy.growth_score)}`}
          >
            {strategy.growth_score}
          </div>
          <div className={`text-xs ${scoreTierColor(strategy.growth_score)}`}>
            {scoreTierLabel(strategy.growth_score)}
          </div>
        </div>
      </div>

      {/* Next Best Action */}
      {strategy.next_best_action && (
        <div className="rounded-lg border-2 border-amber-200 bg-amber-50 px-5 py-4">
          <div className="text-xs font-medium uppercase text-amber-700">Next Best Action</div>
          <div className="mt-1 font-medium text-gray-900">{strategy.next_best_action.title}</div>
          <div className="mt-1 text-sm text-gray-600">{strategy.next_best_action.reason}</div>
          {strategy.next_best_action.cross_path_impact.length > 0 && (
            <div className="mt-2 flex gap-2">
              {strategy.next_best_action.cross_path_impact.map((impact) => (
                <span key={impact} className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                  {PATH_NAMES[impact] || impact}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* First-visit hero */}
      {showFirstVisitHero && !hasCompletedAnyAction && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-5 py-4">
          <p className="text-sm text-gray-700">
            Your Growth Strategy starts here. Complete tasks to unlock new growth dimensions.
          </p>
          <button
            onClick={() => setShowFirstVisitHero(false)}
            className="mt-1 text-xs text-gray-400 hover:text-gray-600"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Active paths (vertical stack) */}
      <div className="space-y-3">
        {activePaths.map((path) => (
          <PathCard
            key={path.id}
            id={path.id}
            pathType={path.path_type}
            status={path.status}
            progress={path.progress}
            summary={path.summary}
            actionItemCount={path.action_item_count}
            completedActionItems={path.completed_action_items}
            unlockCriteria={path.unlock_criteria}
            unlockProgress={path.unlock_progress}
            onGenerate={() => handleGenerate(path.path_type)}
          />
        ))}
      </div>

      {/* Stub paths (collapsed section) */}
      {stubPaths.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-sm font-medium text-gray-500 hover:text-gray-700">
            Future Growth Paths
            <span className="ml-1 transition-transform group-open:rotate-90">›</span>
          </summary>
          <div className="mt-3 space-y-3">
            {stubPaths.map((path) => (
              <PathCard
                key={path.id}
                id={path.id}
                pathType={path.path_type}
                status={path.status}
                progress={0}
                summary={null}
                actionItemCount={0}
                completedActionItems={0}
                isStub
              />
            ))}
          </div>
        </details>
      )}

      {/* Overall progress */}
      <div className="rounded-lg border border-gray-200 bg-white px-5 py-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Overall Progress</span>
          <span className="font-medium">{strategy.overall_progress}%</span>
        </div>
        <div className="mt-2 h-2 w-full rounded-full bg-gray-100">
          <div
            className="h-2 rounded-full bg-amber-500 transition-all"
            style={{ width: `${strategy.overall_progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
