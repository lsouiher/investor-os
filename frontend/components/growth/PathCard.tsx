"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n";

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

function usePathNames() {
  const { t } = useTranslation();
  return {
    portfolio: t("growth.path.portfolio"),
    income_capital: t("growth.path.income_capital"),
    skills_knowledge: t("growth.path.skills_knowledge"),
    time_operations: t("growth.path.time_operations"),
  } as Record<string, string>;
}

const PATH_COLORS: Record<string, string> = {
  // chart series in layout order (brand.md §2), then info; the name always sits beside it
  portfolio: "border-l-chart-1",
  income_capital: "border-l-chart-3",
  skills_knowledge: "border-l-chart-2",
  time_operations: "border-l-info",
};

const PATH_ICONS: Record<string, string> = {
  portfolio: "📊",
  income_capital: "💰",
  skills_knowledge: "📚",
  time_operations: "⏰",
};

function scoreTierClass(progress: number): string {
  if (progress < 40) return "bg-danger-tint text-danger";
  if (progress < 70) return "bg-accent-tint text-accent-text";
  return "bg-ok-tint text-ok";
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
  const { t } = useTranslation();
  const PATH_NAMES = usePathNames();
  const name = PATH_NAMES[pathType] || pathType;
  const accentColor = PATH_COLORS[pathType] || "border-l-border";
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
          <span className="rounded-full bg-accent-tint px-2 py-0.5 text-xs font-medium text-accent-text">
            {t("growth.path.coming_soon")}
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
        className={`block rounded-lg border border-border border-l-2 ${accentColor} bg-surface-card px-6 py-4 transition-colors hover:bg-surface-subtle`}
        role="article"
        aria-label={`${name} - ${progress}% complete`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg">{icon}</span>
            <span className="font-semibold text-foreground-strong">{name}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${scoreTierClass(progress)}`}>
              {progress}%
            </span>
            <span className="text-sm text-foreground-muted">
              {completedActionItems}/{actionItemCount} {t("growth_path.action_items")}
            </span>
            <span className="text-foreground-muted">→</span>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-3 h-1.5 w-full rounded-full bg-surface-subtle">
          <div
            className="h-1.5 rounded-full bg-accent transition-all"
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
          <span className="text-sm text-accent-text">{t("growth.path.generating")}</span>
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
            className="rounded-none bg-accent px-4 py-1.5 text-sm font-medium text-on-accent hover:bg-accent-hover"
          >
            {t("growth.path.generate")}
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
            className="rounded-none border border-border px-3 py-1 text-xs text-foreground-muted hover:border-ink-faint"
          >
            {t("growth.path.generate_now")}
          </button>
        )}
      </div>
      {unlockCriteria && (
        <p className="mt-2 text-xs text-foreground-muted">{unlockCriteria}</p>
      )}
      {unlockProgress && (
        <p className="mt-1 text-xs text-foreground-muted">{unlockProgress}</p>
      )}
    </div>
  );
}
