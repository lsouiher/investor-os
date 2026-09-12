"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api-client";
import RadarChart, { type RadarData } from "@/components/identity/radar-chart";
import ScoreSparkline from "@/components/identity/score-sparkline";
import { DashboardEmpty } from "@/components/shared/empty-states";
import { SkeletonCard } from "@/components/shared/loading-states";

// Shape of GET /api/v1/dashboard (snake_case per contracts/api-v1.md)
interface DashboardData {
  identity: {
    id: string;
    archetype: string;
    readiness_score: number;
    radar_data: RadarData;
    headline_insight: string;
    score_history: number[];
  } | null;
  active_strategy: {
    id: string;
    name: string;
    description: string;
    fit_score: number;
    needs_refresh: boolean;
    progress: { total: number; completed: number; percentage: number } | null;
  } | null;
  top_tasks: {
    id: string;
    source: "strategy" | "manual";
    title: string;
    description: string | null;
    identity_impact_score: number;
    due_date: string | null;
    completed?: boolean; // local UI state after toggling
  }[];
  intelligence_feed: {
    type: string;
    title: string;
    message: string;
    severity: "info" | "warning" | "success";
    action_url?: string;
  }[];
  growth_strategy: {
    id: string;
    overall_progress: number;
    growth_score: number | null;
    paths: { path_type: string; status: string; progress: number; summary: string | null }[];
    next_best_action: { title: string; path_type: string; reason: string } | null;
    export_is_stale: boolean;
    refresh_suggestions: string[];
  } | null;
}

const PATH_LABELS: Record<string, string> = {
  portfolio: "Portfolio",
  income_capital: "Income & Capital",
  skills_knowledge: "Skills & Knowledge",
  time_operations: "Time & Operations",
};

const SEVERITY_STYLES: Record<string, string> = {
  info: "bg-blue-100 text-blue-700",
  warning: "bg-amber-100 text-amber-700",
  success: "bg-emerald-100 text-emerald-700",
};

function scoreColorClass(score: number): string {
  if (score < 40) return "text-red-600";
  if (score < 70) return "text-amber-600";
  return "text-emerald-600";
}

function ScoreGauge({ score, size = 80 }: { score: number; size?: number }) {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius; // half circle
  const progress = (score / 100) * circumference;

  const color =
    score < 40 ? "#dc2626" : score < 70 ? "#d97706" : "#059669";

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size / 2 + 12 }}>
      <svg width={size} height={size / 2 + 4} className="overflow-visible">
        <path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        <path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <span className="absolute bottom-0 text-lg font-bold" style={{ color }}>
        {score}
      </span>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await api.get<DashboardData>("/dashboard");
      setData(result);
    } catch {
      setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const toggleTask = async (taskId: string) => {
    if (!data) return;
    const task = data.top_tasks.find((t) => t.id === taskId);
    if (!task) return;
    const next = !task.completed;
    try {
      await api.put(`/tasks/${taskId}`, { is_completed: next });
      setData({
        ...data,
        top_tasks: data.top_tasks.map((t) =>
          t.id === taskId ? { ...t, completed: next } : t
        ),
      });
    } catch {
      // silent
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <SkeletonCard lines={2} />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <SkeletonCard lines={3} />
          <SkeletonCard lines={3} />
        </div>
      </div>
    );
  }

  // Error state with retry
  if (error) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome{user?.email ? `, ${user.email}` : ""}
          </p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={fetchDashboard}
            className="mt-3 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // No identity = new user empty state
  if (!data || !data.identity) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome{user?.email ? `, ${user.email}` : ""}
          </p>
        </div>
        <DashboardEmpty />
      </div>
    );
  }

  const { identity, active_strategy, top_tasks, intelligence_feed, growth_strategy } = data;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back{user?.email ? `, ${user.email}` : ""}
        </p>
      </div>

      {/* Identity snapshot */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
            Investor Identity
          </h2>
          <Link
            href="/identity"
            className="text-xs font-medium text-amber-600 hover:text-amber-700"
          >
            View Full Card
          </Link>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-6">
          {/* Archetype badge */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
              <svg
                className="h-5 w-5 text-amber-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <circle cx="12" cy="8" r="5" />
                <path strokeLinecap="round" d="M20 21a8 8 0 0 0-16 0" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">
                {identity.archetype}
              </p>
              <p className="text-xs text-gray-500">Archetype</p>
            </div>
          </div>

          {/* Score gauge */}
          <ScoreGauge score={identity.readiness_score} />

          {/* Mini radar */}
          <div className="hidden sm:block">
            <RadarChart data={identity.radar_data} size={120} />
          </div>

          {/* Sparkline */}
          {identity.score_history.length > 1 && (
            <div>
              <ScoreSparkline scores={identity.score_history} width={100} height={36} />
              <p className="mt-1 text-xs text-gray-400">Score trend</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Active strategy progress */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              Active Strategy
            </h2>
            {active_strategy && (
              <Link
                href={`/strategies/${active_strategy.id}`}
                className="text-xs font-medium text-amber-600 hover:text-amber-700"
              >
                View
              </Link>
            )}
          </div>
          {active_strategy ? (
            <div className="mt-4">
              <p className="text-sm font-bold text-gray-900">
                {active_strategy.name}
              </p>
              <div className="mt-3">
                <div className="mb-1 flex justify-between text-xs text-gray-500">
                  <span>Progress</span>
                  <span>
                    {active_strategy.progress
                      ? `${active_strategy.progress.completed}/${active_strategy.progress.total}`
                      : "Plan generating…"}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-amber-600 transition-all duration-500"
                    style={{ width: `${active_strategy.progress?.percentage ?? 0}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <p className="text-sm text-gray-500">No active strategy</p>
              <Link
                href="/strategies"
                className="mt-2 inline-block text-sm font-medium text-amber-600 hover:text-amber-700"
              >
                Browse strategies
              </Link>
            </div>
          )}
        </div>

        {/* Priority tasks */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              Priority Tasks
            </h2>
            <Link
              href="/tasks"
              className="text-xs font-medium text-amber-600 hover:text-amber-700"
            >
              All Tasks
            </Link>
          </div>
          <div className="mt-4 space-y-2">
            {top_tasks.length > 0 ? (
              top_tasks.slice(0, 3).map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3"
                >
                  <button
                    onClick={() => toggleTask(task.id)}
                    className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border transition-colors ${
                      task.completed
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : "border-gray-300 hover:border-amber-400"
                    }`}
                  >
                    {task.completed && (
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  <span
                    className={`text-sm ${
                      task.completed
                        ? "text-gray-400 line-through"
                        : "text-gray-700"
                    }`}
                  >
                    {task.title}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No priority tasks</p>
            )}
          </div>
        </div>
      </div>

      {/* Growth strategy (feature-flagged; null when off or not yet created) */}
      {growth_strategy && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              Growth Strategy
            </h2>
            <Link
              href="/growth-strategy"
              className="text-xs font-medium text-amber-600 hover:text-amber-700"
            >
              View Paths
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {growth_strategy.paths.map((p) => (
              <div key={p.path_type} className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2">
                <p className="truncate text-xs font-medium text-gray-700">{PATH_LABELS[p.path_type] ?? p.path_type}</p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {p.status === "locked" ? "Locked" : p.status === "generating" ? "Generating…" : `${p.progress}%`}
                </p>
              </div>
            ))}
          </div>
          {growth_strategy.next_best_action && (
            <div className="mt-4 rounded-md border border-amber-100 bg-amber-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Next best action</p>
              <p className="mt-1 text-sm font-medium text-gray-900">{growth_strategy.next_best_action.title}</p>
              <p className="mt-0.5 text-xs text-gray-600">{growth_strategy.next_best_action.reason}</p>
            </div>
          )}
          {growth_strategy.export_is_stale && (
            <p className="mt-3 text-xs text-gray-500">Your last export is out of date.</p>
          )}
        </div>
      )}

      {/* Intelligence feed */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
          Intelligence Feed
        </h2>
        {intelligence_feed.length > 0 ? (
          <div className="mt-4 max-h-64 space-y-3 overflow-y-auto">
            {intelligence_feed.map((insight, i) => (
              <div
                key={`${insight.type}-${i}`}
                className="rounded-md border border-gray-100 bg-gray-50 px-4 py-3"
              >
                <div className="flex items-center gap-2">
                  <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${SEVERITY_STYLES[insight.severity] ?? SEVERITY_STYLES.info}`}>
                    {insight.type.replace("_", " ")}
                  </span>
                  <span className="text-sm font-medium text-gray-800">{insight.title}</span>
                </div>
                <p className="mt-1 text-sm text-gray-600">{insight.message}</p>
                {insight.action_url && (
                  <Link href={insight.action_url} className="mt-1 inline-block text-xs font-medium text-amber-600 hover:text-amber-700">
                    Take action →
                  </Link>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-gray-500">
            Insights will appear here as you use the platform.
          </p>
        )}
      </div>
    </div>
  );
}
