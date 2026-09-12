"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api-client";
import { TasksEmpty } from "@/components/shared/empty-states";
import { SkeletonCard } from "@/components/shared/loading-states";
import AiErrorState from "@/components/shared/ai-error-state";

// Shape of GET /api/v1/tasks items (snake_case per contracts/api-v1.md)
interface Task {
  id: string;
  title: string;
  description: string | null;
  is_completed: boolean;
  identity_impact_score: number | null;
  source: "ai_generated" | "identity_gap" | "manual" | "strategy";
  created_at: string;
  strategy_id?: string | null;
}

// Strategy action items are surfaced as tasks; their completion lives on the strategy.
function completionEndpoint(task: Task): string {
  return task.source === "strategy" ? `/strategies/action-items/${task.id}` : `/tasks/${task.id}`;
}

type Impact = "high" | "medium" | "low";

// identity_impact_score is 0-100; the UI shows it as three bands
function impactOf(task: Task): Impact {
  const score = task.identity_impact_score ?? 0;
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

const IMPACT_TO_SCORE: Record<Impact, number> = { high: 80, medium: 50, low: 20 };

const IMPACT_STYLES: Record<string, string> = {
  high: "bg-red-50 text-red-700",
  medium: "bg-amber-50 text-amber-700",
  low: "bg-gray-100 text-gray-600",
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newImpact, setNewImpact] = useState<"high" | "medium" | "low">("medium");

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<Task[]>("/tasks");
      setTasks(data);
    } catch {
      setError("Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const toggleTask = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    try {
      const next = !task.is_completed;
      await api.put(completionEndpoint(task), { is_completed: next });
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, is_completed: next } : t
        )
      );
    } catch {
      setError("Failed to update task.");
    }
  };

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      const created = await api.post<Task>("/tasks", {
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
        identity_impact_score: IMPACT_TO_SCORE[newImpact],
      });
      setTasks((prev) => [created, ...prev]);
      setNewTitle("");
      setNewDescription("");
      setNewImpact("medium");
      setShowAddForm(false);
    } catch {
      setError("Failed to add task.");
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <SkeletonCard lines={2} />
        <SkeletonCard lines={2} />
        <SkeletonCard lines={2} />
      </div>
    );
  }

  // Sort: incomplete first, then by impact priority
  const impactOrder = { high: 0, medium: 1, low: 2 };
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.is_completed !== b.is_completed) return a.is_completed ? 1 : -1;
    return impactOrder[impactOf(a)] - impactOrder[impactOf(b)];
  });

  const completedCount = tasks.filter((t) => t.is_completed).length;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="mt-1 text-sm text-gray-500">
            {completedCount}/{tasks.length} completed, ordered by identity impact
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700"
        >
          {showAddForm ? "Cancel" : "Add Task"}
        </button>
      </div>

      {error && <AiErrorState severity="low" message={error} />}

      {/* Add task form */}
      {showAddForm && (
        <form
          onSubmit={addTask}
          className="rounded-lg border border-amber-200 bg-amber-50 p-4"
        >
          <div className="space-y-3">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Task title"
              required
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <input
              type="text"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Description (optional)"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">Impact:</label>
              {(["high", "medium", "low"] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setNewImpact(level)}
                  className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
                    newImpact === level
                      ? "bg-amber-600 text-white"
                      : "bg-white text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
            <button
              type="submit"
              disabled={!newTitle.trim()}
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
            >
              Add Task
            </button>
          </div>
        </form>
      )}

      {/* Task list */}
      {tasks.length === 0 && !showAddForm && <TasksEmpty />}
      <div className="space-y-2">
        {sortedTasks.map((task) => (
          <div
            key={task.id}
            className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-4"
          >
            <button
              onClick={() => toggleTask(task.id)}
              className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border transition-colors ${
                task.is_completed
                  ? "border-emerald-500 bg-emerald-500 text-white"
                  : "border-gray-300 hover:border-amber-400"
              }`}
            >
              {task.is_completed && (
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p
                  className={`text-sm font-medium ${
                    task.is_completed ? "text-gray-400 line-through" : "text-gray-900"
                  }`}
                >
                  {task.title}
                </p>
                <span
                  className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                    IMPACT_STYLES[impactOf(task)]
                  }`}
                >
                  {impactOf(task)}
                </span>
                {task.source !== "manual" && (
                  <span className="rounded bg-blue-50 px-1.5 py-0.5 text-xs text-blue-600">
                    {task.source === "strategy" ? "Strategy" : task.source === "identity_gap" ? "Identity gap" : "AI"}
                  </span>
                )}
              </div>
              {task.description && (
                <p className="mt-0.5 text-xs text-gray-500">{task.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
