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
  if (progress < 40) return "bg-red-100 text-red-700";
  if (progress < 70) return "bg-amber-100 text-amber-700";
  return "bg-emerald-100 text-emerald-700";
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
        className={`rounded-lg border border-gray-200 border-l-2 ${accentColor} bg-gray-50 px-6 py-4 opacity-70`}
        role="article"
        aria-label={`${name} - Coming Soon`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg">{icon}</span>
            <span className="font-medium text-gray-600">{name}</span>
          </div>
          <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
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
        className={`block rounded-lg border border-gray-200 border-l-2 ${accentColor} bg-white px-6 py-4 transition-shadow hover:shadow-sm`}
        role="article"
        aria-label={`${name} - ${progress}% complete`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg">{icon}</span>
            <span className="font-semibold text-gray-900">{name}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className={`rounded px-2 py-0.5 text-xs font-medium ${scoreTierClass(progress)}`}>
              {progress}%
            </span>
            <span className="text-sm text-gray-500">
              {completedActionItems}/{actionItemCount} actions
            </span>
            <span className="text-gray-400">→</span>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-3 h-1.5 w-full rounded-full bg-gray-100">
          <div
            className="h-1.5 rounded-full bg-amber-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        {summary && (
          <p className="mt-2 text-sm text-gray-600 line-clamp-2">{summary}</p>
        )}
      </Link>
    );
  }

  // Generating state
  if (status === "generating") {
    return (
      <div
        className={`rounded-lg border border-gray-200 border-l-2 ${accentColor} bg-white px-6 py-4`}
        role="article"
        aria-label={`${name} - Generating`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg">{icon}</span>
            <span className="font-semibold text-gray-900">{name}</span>
          </div>
          <span className="text-sm text-amber-600">Generating your plan...</span>
        </div>
        {/* Shimmer animation */}
        <div className="mt-3 h-8 w-full animate-pulse rounded bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100" />
      </div>
    );
  }

  // Unlocked (not yet generated)
  if (status === "unlocked") {
    return (
      <div
        className={`rounded-lg border border-gray-200 border-l-2 ${accentColor} bg-white px-6 py-4`}
        role="article"
        aria-label={`${name} - Ready to generate`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg">{icon}</span>
            <span className="font-semibold text-gray-900">{name}</span>
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
      className={`rounded-lg border border-gray-200 border-l-2 ${accentColor} bg-gray-50 px-6 py-4 opacity-70`}
      role="article"
      aria-label={`${name} - Locked`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg">🔒</span>
          <span className="font-medium text-gray-600">{name}</span>
        </div>
        {onGenerate && (
          <button
            onClick={onGenerate}
            className="rounded border border-gray-300 px-3 py-1 text-xs text-gray-500 hover:border-gray-400"
          >
            Generate Now
          </button>
        )}
      </div>
      {unlockCriteria && (
        <p className="mt-2 text-xs text-gray-500">{unlockCriteria}</p>
      )}
      {unlockProgress && (
        <p className="mt-1 text-xs text-gray-400">{unlockProgress}</p>
      )}
    </div>
  );
}
