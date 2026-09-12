"use client";

import Link from "next/link";

type PathStatus = "locked" | "unlocked" | "generating" | "generated";

interface PathCardProps {
  id: string;
  pathType: string;
  status: PathStatus;
  progress: number;
  summary: string | null;
  actionItemCount: number;
  completedActionItems: number;
  unlockCriteria?: string;
  unlockProgress?: string;
  onGenerate?: () => void;
  isStub?: boolean;
}

const PATH_NAMES: Record<string, string> = {
  portfolio: "Portfolio Growth",
  income_capital: "Income & Capital",
  skills_knowledge: "Skills & Knowledge",
  time_operations: "Time & Operations",
};

const PATH_COLORS: Record<string, string> = {
  portfolio: "border-l-amber-500",
  income_capital: "border-l-emerald-500",
  skills_knowledge: "border-l-blue-500",
  time_operations: "border-l-purple-500",
};

const PATH_ICONS: Record<string, string> = {
  portfolio: "📊",
  income_capital: "💰",
  skills_knowledge: "📚",
  time_operations: "⏰",
};

function scoreTierClass(progress: number): string {
  if (progress < 40) return "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300";
  if (progress < 70) return "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300";
  return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300";
}

export default function PathCard({
  pathType,
  status,
  progress,
  summary,
  actionItemCount,
  completedActionItems,
  unlockCriteria,
  unlockProgress,
  onGenerate,
  isStub,
}: PathCardProps) {
  const name = PATH_NAMES[pathType] || pathType;
  const accentColor = PATH_COLORS[pathType] || "border-l-gray-400";
  const icon = PATH_ICONS[pathType] || "📌";

  // Coming Soon stub
  if (isStub) {
    return (
      <div
        className={`rounded-lg border border-border border-l-2 ${accentColor} bg-surface-subtle px-6 py-4 opacity-70`}
        role="article"
        aria-label={`${name} - Coming Soon`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg">{icon}</span>
            <span className="font-medium text-foreground-secondary">{name}</span>
          </div>
          <span className="rounded bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
            Coming Soon
          </span>
        </div>
      </div>
    );
  }

  // Generated state
  if (status === "generated") {
    return (
      <Link
        href={`/growth-strategy/${pathType}`}
        className={`block rounded-lg border border-border border-l-2 ${accentColor} bg-surface-card px-6 py-4 transition-shadow hover:shadow-sm`}
        role="article"
        aria-label={`${name} - ${progress}% complete`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg">{icon}</span>
            <span className="font-semibold text-foreground-strong">{name}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className={`rounded px-2 py-0.5 text-xs font-medium ${scoreTierClass(progress)}`}>
              {progress}%
            </span>
            <span className="text-sm text-foreground-muted">
              {completedActionItems}/{actionItemCount} actions
            </span>
            <span className="text-foreground-tertiary">→</span>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-3 h-1.5 w-full rounded-full bg-surface-subtle">
          <div
            className="h-1.5 rounded-full bg-amber-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        {summary && (
          <p className="mt-2 text-sm text-foreground-secondary line-clamp-2">{summary}</p>
        )}
      </Link>
    );
  }

  // Generating state
  if (status === "generating") {
    return (
      <div
        className={`rounded-lg border border-border border-l-2 ${accentColor} bg-surface-card px-6 py-4`}
        role="article"
        aria-label={`${name} - Generating`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg">{icon}</span>
            <span className="font-semibold text-foreground-strong">{name}</span>
          </div>
          <span className="text-sm text-amber-600">Generating your plan...</span>
        </div>
        {/* Shimmer animation */}
        <div className="mt-3 h-8 w-full animate-pulse rounded bg-gradient-to-r from-surface-subtle via-border-muted to-surface-subtle" />
      </div>
    );
  }

  // Unlocked (not yet generated)
  if (status === "unlocked") {
    return (
      <div
        className={`rounded-lg border border-border border-l-2 ${accentColor} bg-surface-card px-6 py-4`}
        role="article"
        aria-label={`${name} - Ready to generate`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg">{icon}</span>
            <span className="font-semibold text-foreground-strong">{name}</span>
          </div>
          <button
            onClick={onGenerate}
            className="rounded bg-amber-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-amber-700"
          >
            Generate
          </button>
        </div>
      </div>
    );
  }

  // Locked state
  return (
    <div
      className={`rounded-lg border border-border border-l-2 ${accentColor} bg-surface-subtle px-6 py-4 opacity-70`}
      role="article"
      aria-label={`${name} - Locked`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg">🔒</span>
          <span className="font-medium text-foreground-secondary">{name}</span>
        </div>
        {onGenerate && (
          <button
            onClick={onGenerate}
            className="rounded border border-border px-3 py-1 text-xs text-foreground-muted hover:border-foreground-tertiary"
          >
            Generate Now
          </button>
        )}
      </div>
      {unlockCriteria && (
        <p className="mt-2 text-xs text-foreground-muted">{unlockCriteria}</p>
      )}
      {unlockProgress && (
        <p className="mt-1 text-xs text-foreground-tertiary">{unlockProgress}</p>
      )}
    </div>
  );
}
