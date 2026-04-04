"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api-client";
import { TasksEmpty } from "@/components/shared/empty-states";
import { SkeletonCard } from "@/components/shared/loading-states";
import AiErrorState from "@/components/shared/ai-error-state";

interface Task {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  impact: "high" | "medium" | "low";
  source: "strategy" | "manual";
  created_at: string;
}

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
      await api.put(`/tasks/${taskId}`, { completed: !task.completed });
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, completed: !t.completed } : t
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
        description: newDescription.trim() || null,
        impact: newImpact,
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

  if (tasks.length === 0 && !error) {
    return (
      <div className="mx-auto max-w-5xl">
        <TasksEmpty />
      </div>
    );
  }

  // Sort: incomplete first, then by impact priority
  const impactOrder = { high: 0, medium: 1, low: 2 };
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return impactOrder[a.impact] - impactOrder[b.impact];
  });

  const completedCount = tasks.filter((t) => t.completed).length;

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
      <div className="space-y-2">
        {sortedTasks.map((task) => (
          <div
            key={task.id}
            className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-4"
          >
            <button
              onClick={() => toggleTask(task.id)}
              className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border transition-colors ${
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
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p
                  className={`text-sm font-medium ${
                    task.completed ? "text-gray-400 line-through" : "text-gray-900"
                  }`}
                >
                  {task.title}
                </p>
                <span
                  className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                    IMPACT_STYLES[task.impact]
                  }`}
                >
                  {task.impact}
                </span>
                {task.source === "strategy" && (
                  <span className="rounded bg-blue-50 px-1.5 py-0.5 text-xs text-blue-600">
                    Strategy
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
