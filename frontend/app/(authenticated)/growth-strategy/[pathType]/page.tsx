"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api-client";
import { SkeletonCard } from "@/components/shared/loading-states";
import AiErrorState from "@/components/shared/ai-error-state";

interface ActionItem {
  id: string;
  title: string;
  description: string;
  timeframe: string;
  category: string;
  identity_impact: string;
  priority_score: number;
  is_completed: boolean;
  completed_at: string | null;
}

interface V1StrategyRef {
  id: string;
  name: string;
  fit_score: number;
  action_plan: { item_count: number; completed_count: number };
  roadmap: { milestone_count: number; completed_count: number };
  micro_plan: { task_count: number; completed_count: number; expires_at: string | null };
}

interface ScalingPlan {
  year_1_vision: string;
  year_3_vision: string;
  year_5_vision: string;
  year_10_vision: string;
}

interface PathDetail {
  id: string;
  path_type: string;
  status: string;
  version: number;
  progress: number;
  summary: string | null;
  content: Record<string, unknown>;
  action_items: ActionItem[];
  strategy?: V1StrategyRef;
  unlock_type: string | null;
  unlocked_at: string | null;
  generated_at: string | null;
  generation_cooldown_until: string | null;
}

const PATH_NAMES: Record<string, string> = {
  portfolio: "Portfolio Growth",
  income_capital: "Income & Capital",
  skills_knowledge: "Skills & Knowledge",
  time_operations: "Time & Operations",
};

function scoreTierClass(score: number): string {
  if (score < 40) return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300";
  if (score < 70) return "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300";
  return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300";
}

export default function PathDetailPage() {
  const params = useParams();
  const pathType = params?.pathType as string;
  const [path, setPath] = useState<PathDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPath = useCallback(async () => {
    if (!pathType) return;
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<PathDetail>(`/growth-strategy/paths/${pathType}`);
      setPath(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to load path details.");
      }
    } finally {
      setLoading(false);
    }
  }, [pathType]);

  useEffect(() => {
    fetchPath();
  }, [fetchPath]);

  const handleToggleAction = async (itemId: string, isCompleted: boolean) => {
    try {
      const result = await api.put<{ path_progress: number }>(
        `/growth-strategy/paths/${pathType}/action-items/${itemId}`,
        { is_completed: isCompleted },
      );
      setPath((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          progress: result.path_progress ?? prev.progress,
          action_items: prev.action_items.map((item) =>
            item.id === itemId
              ? { ...item, is_completed: isCompleted, completed_at: isCompleted ? new Date().toISOString() : null }
              : item,
          ),
        };
      });
    } catch {
      setError("Failed to update action item.");
      fetchPath();
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 py-8">
        <SkeletonCard lines={5} />
        <SkeletonCard lines={3} />
      </div>
    );
  }

  if (error && !path) {
    return (
      <div className="mx-auto max-w-3xl py-8">
        <AiErrorState severity="medium" message={error} onRetry={fetchPath} />
      </div>
    );
  }

  if (!path) return null;

  const name = PATH_NAMES[path.path_type] || path.path_type;
  const content = path.content as Record<string, unknown>;
  const scalingPlan = content.scaling_plan as ScalingPlan | undefined;
  const sortedActions = [...path.action_items].sort((a, b) => b.priority_score - a.priority_score);

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-8">
      {/* Header */}
      <div>
        <Link href="/growth-strategy" className="text-sm text-foreground-muted hover:text-foreground-secondary">
          ← Growth Strategy
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground-strong">{name}</h1>
          <span className={`rounded px-3 py-1 text-sm font-medium ${scoreTierClass(path.progress)}`}>
            {path.progress}% complete
          </span>
        </div>
        {path.summary && (
          <p className="mt-2 text-foreground-secondary">{path.summary}</p>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full rounded-full bg-surface-subtle">
        <div
          className="h-2 rounded-full bg-amber-500 transition-all"
          style={{ width: `${path.progress}%` }}
        />
      </div>

      {/* V1 Strategy Reference (Portfolio only) */}
      {path.strategy && (
        <div className="rounded-lg border border-border bg-surface-card p-5">
          <h2 className="text-sm font-semibold uppercase text-foreground-muted">Active Strategy</h2>
          <div className="mt-2 flex items-center justify-between">
            <span className="font-medium text-foreground-strong">{path.strategy.name}</span>
            <span className={`rounded px-2 py-0.5 text-xs font-medium ${scoreTierClass(path.strategy.fit_score)}`}>
              {path.strategy.fit_score}% fit
            </span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-4 text-center text-sm">
            <div>
              <div className="font-medium">{path.strategy.action_plan.completed_count}/{path.strategy.action_plan.item_count}</div>
              <div className="text-foreground-muted">Action Items</div>
            </div>
            <div>
              <div className="font-medium">{path.strategy.roadmap.completed_count}/{path.strategy.roadmap.milestone_count}</div>
              <div className="text-foreground-muted">Milestones</div>
            </div>
            <div>
              <div className="font-medium">{path.strategy.micro_plan.completed_count}/{path.strategy.micro_plan.task_count}</div>
              <div className="text-foreground-muted">Micro Tasks</div>
            </div>
          </div>
        </div>
      )}

      {/* Scaling Plan (Portfolio path) */}
      {scalingPlan && (
        <div className="rounded-lg border border-border bg-surface-card p-5">
          <h2 className="text-sm font-semibold uppercase text-foreground-muted">Scaling Vision</h2>
          <div className="mt-3 space-y-3">
            {[
              { label: "Year 1", value: scalingPlan.year_1_vision },
              { label: "Year 3", value: scalingPlan.year_3_vision },
              { label: "Year 5", value: scalingPlan.year_5_vision },
              { label: "Year 10", value: scalingPlan.year_10_vision },
            ].map(({ label, value }) => (
              <div key={label}>
                <span className="text-xs font-medium text-amber-600">{label}</span>
                <p className="mt-0.5 text-sm text-foreground-secondary">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content sections (generic rendering for non-Portfolio paths) */}
      {!scalingPlan && Object.keys(content).length > 0 && (
        <div className="rounded-lg border border-border bg-surface-card p-5">
          <h2 className="text-sm font-semibold uppercase text-foreground-muted">Path Content</h2>
          <div className="mt-3 space-y-4">
            {Object.entries(content).map(([key, value]) => {
              if (typeof value === "string") {
                return (
                  <div key={key}>
                    <h3 className="text-xs font-medium uppercase text-foreground-tertiary">
                      {key.replace(/_/g, " ")}
                    </h3>
                    <p className="mt-1 text-sm text-foreground-secondary">{value}</p>
                  </div>
                );
              }
              if (Array.isArray(value)) {
                return (
                  <div key={key}>
                    <h3 className="text-xs font-medium uppercase text-foreground-tertiary">
                      {key.replace(/_/g, " ")}
                    </h3>
                    <ul className="mt-1 space-y-1">
                      {value.map((item: Record<string, unknown>, i: number) => (
                        <li key={i} className="text-sm text-foreground-secondary">
                          {typeof item === "string" ? item : JSON.stringify(item)}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              }
              return null;
            })}
          </div>
        </div>
      )}

      {/* Action Items */}
      {sortedActions.length > 0 && (
        <div className="rounded-lg border border-border bg-surface-card p-5">
          <h2 className="text-sm font-semibold uppercase text-foreground-muted">
            Action Items ({path.action_items.filter((a) => a.is_completed).length}/{path.action_items.length})
          </h2>
          <div className="mt-3 space-y-2">
            {sortedActions.map((item) => (
              <label
                key={item.id}
                className={`flex cursor-pointer items-start gap-3 rounded-md px-3 py-2.5 transition-colors ${
                  item.is_completed ? "bg-surface-subtle" : "hover:bg-surface-subtle"
                }`}
              >
                <input
                  type="checkbox"
                  checked={item.is_completed}
                  onChange={() => handleToggleAction(item.id, !item.is_completed)}
                  className="mt-0.5 h-5 w-5 rounded border-border text-amber-600 focus:ring-amber-500"
                />
                <div className="flex-1">
                  <div className={`text-sm font-medium ${item.is_completed ? "text-foreground-tertiary line-through" : "text-foreground-strong"}`}>
                    {item.title}
                  </div>
                  {item.description && (
                    <div className="mt-0.5 text-xs text-foreground-muted">{item.description}</div>
                  )}
                  <div className="mt-1 flex gap-2">
                    <span className="text-xs text-foreground-tertiary">{item.timeframe}</span>
                    <span className={`rounded px-1.5 py-0.5 text-xs ${scoreTierClass(item.priority_score)}`}>
                      Priority {item.priority_score}
                    </span>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Metadata */}
      {path.generated_at && (
        <div className="text-xs text-foreground-tertiary">
          Generated {new Date(path.generated_at).toLocaleDateString()} · Version {path.version}
          {path.generation_cooldown_until && new Date(path.generation_cooldown_until) > new Date() && (
            <span> · Regeneration available after {new Date(path.generation_cooldown_until).toLocaleTimeString()}</span>
          )}
        </div>
      )}
    </div>
  );
}
