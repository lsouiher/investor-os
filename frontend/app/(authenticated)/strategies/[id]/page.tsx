"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api-client";
import RoadmapTimeline from "@/components/strategy/roadmap-timeline";
import BlueprintDownload from "@/components/strategy/blueprint-download";
import { SkeletonCard } from "@/components/shared/loading-states";
import AiErrorState from "@/components/shared/ai-error-state";
import { useTranslation } from "@/lib/i18n";

// Shapes match GET /api/v1/strategies/:id (snake_case per contracts/api-v1.md)
interface ActionItem {
  id: string;
  title: string;
  description: string | null;
  sort_order: number;
  is_completed: boolean;
}

interface Milestone {
  id: string;
  title: string;
  description: string | null;
  target_date: string | null;
  sort_order: number;
  is_completed: boolean;
}

interface MicroTask {
  id: string;
  title: string;
  description: string | null;
  estimated_minutes: number | null;
  sort_order: number;
  is_completed: boolean;
}

interface StrategyDetail {
  id: string;
  name: string;
  description: string;
  fit_score: number;
  is_active: boolean;
  needs_refresh: boolean;
  action_plan: { items: ActionItem[] } | null;
  roadmap: { milestones: Milestone[] } | null;
  micro_plan: { expires_at: string; tasks: MicroTask[] } | null;
}

type TabKey = "action-plan" | "roadmap" | "micro-plan";

function getCountdown(deadline: string, t: (key: string, params?: Record<string, string | number>) => string): string {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return t("strategy.countdown.past_due");
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 24) return t("strategy.countdown.hours", { hours });
  const days = Math.floor(hours / 24);
  return days === 1 ? t("strategy.countdown.one_day") : t("strategy.countdown.days", { days });
}

// CUID2 ids are 24-character alphanumeric strings by default
const VALID_ID_PATTERN = /^[a-z0-9]{20,32}$/;

// Plans are generated asynchronously after activation; poll until they land.
const PLAN_POLL_MS = 3000;
const PLAN_POLL_MAX = 30;

function CheckButton({ checked, onClick }: { checked: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={checked}
      className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border transition-colors ${
        checked
          ? "border-emerald-500 bg-emerald-500 text-white"
          : "border-border hover:border-amber-400"
      }`}
    >
      {checked && (
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )}
    </button>
  );
}

export default function StrategyDetailPage() {
  const params = useParams();
  const rawId = params.id as string;
  const isValidId =
    typeof rawId === "string" &&
    rawId.length > 0 &&
    rawId.length <= 64 &&
    VALID_ID_PATTERN.test(rawId);
  const id = isValidId ? rawId : "";

  const { t } = useTranslation();
  const [strategy, setStrategy] = useState<StrategyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("action-plan");
  const [activating, setActivating] = useState(false);

  const fetchStrategy = useCallback(async () => {
    if (!id) {
      setError(t("strategy.error.invalid_id"));
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<StrategyDetail>(`/strategies/${id}`);
      setStrategy(data);
    } catch {
      setError(t("strategy.error.load_failed"));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchStrategy();
  }, [fetchStrategy]);

  // While active with no plan yet, poll for the async generation result
  const planPending = !!strategy?.is_active && !strategy.action_plan;
  useEffect(() => {
    if (!planPending || !id) return;
    let attempts = 0;
    const timer = setInterval(async () => {
      attempts += 1;
      try {
        const data = await api.get<StrategyDetail>(`/strategies/${id}`);
        if (data.action_plan) {
          setStrategy(data);
          clearInterval(timer);
        }
      } catch {
        // keep polling
      }
      if (attempts >= PLAN_POLL_MAX) clearInterval(timer);
    }, PLAN_POLL_MS);
    return () => clearInterval(timer);
  }, [planPending, id]);

  const handleActivate = async () => {
    if (!strategy) return;
    try {
      setActivating(true);
      setError(null);
      await api.put(`/strategies/${strategy.id}/activate`);
      setStrategy({ ...strategy, is_active: true });
    } catch {
      setError(t("strategies.error.activate_failed"));
    } finally {
      setActivating(false);
    }
  };

  const toggleActionItem = async (itemId: string) => {
    if (!strategy?.action_plan) return;
    const item = strategy.action_plan.items.find((a) => a.id === itemId);
    if (!item) return;
    const next = !item.is_completed;
    try {
      await api.put(`/strategies/action-items/${itemId}`, { is_completed: next });
      setStrategy({
        ...strategy,
        action_plan: {
          items: strategy.action_plan.items.map((a) =>
            a.id === itemId ? { ...a, is_completed: next } : a
          ),
        },
      });
    } catch {
      setError(t("strategy.error.update_action"));
    }
  };

  const handleMilestoneComplete = async (milestoneId: string) => {
    if (!strategy?.roadmap) return;
    try {
      await api.put(`/strategies/milestones/${milestoneId}`, { is_completed: true });
      setStrategy({
        ...strategy,
        roadmap: {
          milestones: strategy.roadmap.milestones.map((m) =>
            m.id === milestoneId ? { ...m, is_completed: true } : m
          ),
        },
      });
    } catch {
      setError(t("strategy.error.update_milestone"));
    }
  };

  const toggleMicroTask = async (taskId: string) => {
    if (!strategy?.micro_plan) return;
    const task = strategy.micro_plan.tasks.find((t) => t.id === taskId);
    if (!task) return;
    const next = !task.is_completed;
    try {
      await api.put(`/strategies/micro-tasks/${taskId}`, { is_completed: next });
      setStrategy({
        ...strategy,
        micro_plan: {
          ...strategy.micro_plan,
          tasks: strategy.micro_plan.tasks.map((t) =>
            t.id === taskId ? { ...t, is_completed: next } : t
          ),
        },
      });
    } catch {
      setError(t("strategy.error.update_micro_task"));
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <SkeletonCard lines={2} />
        <SkeletonCard lines={5} />
      </div>
    );
  }

  if (error && !strategy) {
    return (
      <div className="mx-auto max-w-5xl">
        <AiErrorState severity="medium" message={error} onRetry={fetchStrategy} />
      </div>
    );
  }

  if (!strategy) return null;

  const actionItems = [...(strategy.action_plan?.items ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const milestones = [...(strategy.roadmap?.milestones ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const microTasks = [...(strategy.micro_plan?.tasks ?? [])].sort((a, b) => a.sort_order - b.sort_order);

  const completedActions = actionItems.filter((a) => a.is_completed).length;
  const totalActions = actionItems.length;
  const progressPercent = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;

  const tabs: { key: TabKey; label: string }[] = [
    { key: "action-plan", label: t("strategy.tabs.action_plan") },
    { key: "roadmap", label: t("strategy.tabs.roadmap") },
    { key: "micro-plan", label: t("strategy.tabs.micro_plan") },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/strategies"
            className="mb-2 inline-block text-sm text-amber-600 dark:text-amber-400 hover:text-amber-700"
          >
            &larr; {t("strategy.all_strategies")}
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground-strong">{strategy.name}</h1>
            {strategy.is_active && (
              <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                {t("strategies.active")}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-foreground-muted">{strategy.description}</p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-3">
          {!strategy.is_active && (
            <button
              onClick={handleActivate}
              disabled={activating}
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
            >
              {activating ? t("strategy.activating") : t("strategies.activate")}
            </button>
          )}
          {strategy.is_active && <BlueprintDownload strategyId={strategy.id} />}
        </div>
      </div>

      {error && <AiErrorState severity="low" message={error} />}

      {!strategy.is_active && (
        <div className="rounded-lg border border-border bg-surface-subtle p-4 text-sm text-foreground-secondary">
          {t("strategy.inactive_hint")}
        </div>
      )}

      {planPending && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-950 p-4 text-sm text-amber-800 dark:text-amber-200">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
          {t("strategy.plan_pending")}
        </div>
      )}

      {/* Progress bar */}
      {totalActions > 0 && (
        <div className="rounded-lg border border-border bg-surface-card p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-foreground-secondary">{t("strategy.progress")}</span>
            <span className="text-foreground-muted">
              {t("strategy.progress_count", { completed: String(completedActions), total: String(totalActions) })}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-subtle">
            <div
              className="h-full rounded-full bg-amber-600 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`border-b-2 pb-3 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "border-amber-600 text-amber-600 dark:text-amber-400"
                  : "border-transparent text-foreground-muted hover:text-foreground-secondary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === "action-plan" && (
        <div className="space-y-2">
          {actionItems.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-3 rounded-lg border border-border bg-surface-card p-4"
            >
              <CheckButton checked={item.is_completed} onClick={() => toggleActionItem(item.id)} />
              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm font-medium ${
                    item.is_completed ? "text-foreground-tertiary line-through" : "text-foreground-strong"
                  }`}
                >
                  {item.title}
                </p>
                {item.description && (
                  <p className="mt-0.5 text-xs text-foreground-muted">{item.description}</p>
                )}
              </div>
            </div>
          ))}
          {actionItems.length === 0 && !planPending && (
            <p className="py-8 text-center text-sm text-foreground-tertiary">
              {t("strategy.empty.actions")}
            </p>
          )}
        </div>
      )}

      {activeTab === "roadmap" && (
        <RoadmapTimeline milestones={milestones} onComplete={handleMilestoneComplete} />
      )}

      {activeTab === "micro-plan" && (
        <div>
          {strategy.micro_plan ? (
            <div className="rounded-lg border border-border bg-surface-card p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground-strong">{t("strategy.micro_plan.title")}</h3>
                <span className="rounded-full bg-amber-50 dark:bg-amber-950 px-3 py-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                  {getCountdown(strategy.micro_plan.expires_at, t)}
                </span>
              </div>
              <p className="mb-4 text-sm text-foreground-secondary">
                {t("strategy.micro_plan.subtitle")}
              </p>
              <div className="space-y-2">
                {microTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 rounded-md bg-surface-subtle px-4 py-3"
                  >
                    <CheckButton checked={task.is_completed} onClick={() => toggleMicroTask(task.id)} />
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm ${
                          task.is_completed ? "text-foreground-tertiary line-through" : "text-foreground-secondary"
                        }`}
                      >
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="mt-0.5 text-xs text-foreground-muted">{task.description}</p>
                      )}
                    </div>
                    {task.estimated_minutes != null && (
                      <span className="flex-shrink-0 text-xs text-foreground-tertiary">
                        ~{task.estimated_minutes} min
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-foreground-tertiary">
              {planPending ? t("strategy.micro_plan.pending") : t("strategy.empty.micro_plan")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
