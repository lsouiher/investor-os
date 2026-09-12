"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api-client";
import RoadmapTimeline from "@/components/strategy/roadmap-timeline";
import BlueprintDownload from "@/components/strategy/blueprint-download";
import { SkeletonCard } from "@/components/shared/loading-states";
import AiErrorState from "@/components/shared/ai-error-state";

interface ActionItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  order: number;
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  target_date: string;
  completed: boolean;
  order: number;
}

interface MicroPlan {
  title: string;
  description: string;
  deadline: string;
  steps: string[];
}

interface StrategyDetail {
  id: string;
  name: string;
  description: string;
  fit_score: number;
  status: string;
  action_plan: ActionItem[];
  roadmap: Milestone[];
  micro_plan: MicroPlan | null;
}

type TabKey = "action-plan" | "roadmap" | "micro-plan";

function getCountdown(deadline: string): string {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return "Past due";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Due today";
  if (days === 1) return "1 day left";
  return `${days} days left`;
}

// CUID2 ids are 24-character alphanumeric strings by default
const VALID_ID_PATTERN = /^[a-z0-9]{20,32}$/;

export default function StrategyDetailPage() {
  const params = useParams();
  const rawId = params.id as string;
  const isValidId =
    typeof rawId === "string" &&
    rawId.length > 0 &&
    rawId.length <= 64 &&
    VALID_ID_PATTERN.test(rawId);
  const id = isValidId ? rawId : "";

  const [strategy, setStrategy] = useState<StrategyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("action-plan");

  const fetchStrategy = useCallback(async () => {
    if (!id) {
      setError("Invalid strategy ID.");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<StrategyDetail>(`/strategies/${id}`);
      setStrategy(data);
    } catch {
      setError("Failed to load strategy details.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchStrategy();
  }, [fetchStrategy]);

  const toggleActionItem = async (itemId: string) => {
    if (!strategy) return;
    const item = strategy.action_plan.find((a) => a.id === itemId);
    if (!item) return;

    try {
      await api.put(`/strategies/${id}/actions/${itemId}`, {
        completed: !item.completed,
      });
      setStrategy({
        ...strategy,
        action_plan: strategy.action_plan.map((a) =>
          a.id === itemId ? { ...a, completed: !a.completed } : a
        ),
      });
    } catch {
      setError("Failed to update action item.");
    }
  };

  const handleMilestoneComplete = async (milestoneId: string) => {
    if (!strategy) return;
    try {
      await api.put(`/strategies/${id}/milestones/${milestoneId}`, {
        completed: true,
      });
      setStrategy({
        ...strategy,
        roadmap: strategy.roadmap.map((m) =>
          m.id === milestoneId ? { ...m, completed: true } : m
        ),
      });
    } catch {
      setError("Failed to update milestone.");
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

  const completedActions = strategy.action_plan.filter((a) => a.completed).length;
  const totalActions = strategy.action_plan.length;
  const progressPercent = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;

  const tabs: { key: TabKey; label: string }[] = [
    { key: "action-plan", label: "Action Plan" },
    { key: "roadmap", label: "Roadmap" },
    { key: "micro-plan", label: "Micro-Plan" },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/strategies"
            className="mb-2 inline-block text-sm text-amber-600 hover:text-amber-700"
          >
            &larr; All Strategies
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{strategy.name}</h1>
          <p className="mt-1 text-sm text-gray-500">{strategy.description}</p>
        </div>
        <BlueprintDownload strategyId={strategy.id} />
      </div>

      {error && <AiErrorState severity="low" message={error} />}

      {/* Progress bar */}
      {totalActions > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700">Action Plan Progress</span>
            <span className="text-gray-500">
              {completedActions}/{totalActions} completed
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-amber-600 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`border-b-2 pb-3 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "border-amber-600 text-amber-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
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
          {strategy.action_plan
            .sort((a, b) => a.order - b.order)
            .map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-4"
              >
                <button
                  onClick={() => toggleActionItem(item.id)}
                  className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border transition-colors ${
                    item.completed
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-gray-300 hover:border-amber-400"
                  }`}
                >
                  {item.completed && (
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm font-medium ${
                      item.completed ? "text-gray-400 line-through" : "text-gray-900"
                    }`}
                  >
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">{item.description}</p>
                </div>
              </div>
            ))}
          {strategy.action_plan.length === 0 && (
            <p className="py-8 text-center text-sm text-gray-400">
              No action items yet.
            </p>
          )}
        </div>
      )}

      {activeTab === "roadmap" && (
        <RoadmapTimeline
          milestones={strategy.roadmap}
          onComplete={handleMilestoneComplete}
        />
      )}

      {activeTab === "micro-plan" && (
        <div>
          {strategy.micro_plan ? (
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {strategy.micro_plan.title}
                </h3>
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-600">
                  {getCountdown(strategy.micro_plan.deadline)}
                </span>
              </div>
              <p className="mb-4 text-sm text-gray-600">
                {strategy.micro_plan.description}
              </p>
              <div className="space-y-2">
                {strategy.micro_plan.steps.map((step, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-md bg-gray-50 px-4 py-3"
                  >
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">
                      {i + 1}
                    </span>
                    <p className="text-sm text-gray-700">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-gray-400">
              No micro-plan available for this strategy.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
