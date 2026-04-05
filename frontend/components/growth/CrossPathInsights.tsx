"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n";

interface CrossPathLink {
  id: string;
  type: "prerequisite" | "enabling" | "constraint" | "conflict";
  source_path_type: string;
  source_description: string;
  target_path_type: string;
  target_description: string;
  description: string;
  resolution: string | null;
}

const LINK_ICONS: Record<string, string> = {
  prerequisite: "→",
  enabling: "⚡",
  constraint: "🛡",
  conflict: "⚠",
};

const LINK_COLORS: Record<string, string> = {
  prerequisite: "text-blue-600 bg-blue-50",
  enabling: "text-emerald-600 bg-emerald-50",
  constraint: "text-foreground-secondary bg-surface-subtle",
  conflict: "text-amber-600 bg-amber-50",
};

function usePathNamesShort() {
  const { t } = useTranslation();
  return {
    portfolio: t("growth.path_short.portfolio"),
    income_capital: t("growth.path_short.income"),
    skills_knowledge: t("growth.path_short.skills"),
    time_operations: t("growth.path_short.time"),
  } as Record<string, string>;
}

interface CrossPathInsightsProps {
  links: CrossPathLink[];
}

export default function CrossPathInsights({ links }: CrossPathInsightsProps) {
  const { t } = useTranslation();
  const PATH_NAMES = usePathNamesShort();
  const [expanded, setExpanded] = useState(false);

  if (links.length === 0) return null;

  return (
    <div className="rounded-lg border border-border bg-surface-card">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-5 py-3 text-left"
        aria-expanded={expanded}
      >
        <span className="text-sm font-semibold text-foreground-secondary">
          {t("growth.cross_path_connections", { count: String(links.length) })}
        </span>
        <span className={`text-foreground-tertiary transition-transform ${expanded ? "rotate-90" : ""}`}>
          ›
        </span>
      </button>
      {expanded && (
        <div className="border-t border-border-muted px-5 py-3 space-y-3">
          {links.map((link) => (
            <div key={link.id} className="flex items-start gap-3">
              <span className={`mt-0.5 rounded px-1.5 py-0.5 text-xs font-medium ${LINK_COLORS[link.type] || "text-foreground-secondary bg-surface-subtle"}`}>
                {LINK_ICONS[link.type] || "•"} {link.type}
              </span>
              <div className="flex-1">
                <div className="text-sm text-foreground-secondary">
                  <span className="font-medium">{PATH_NAMES[link.source_path_type] || link.source_path_type}</span>
                  {" → "}
                  <span className="font-medium">{PATH_NAMES[link.target_path_type] || link.target_path_type}</span>
                </div>
                <div className="mt-0.5 text-xs text-foreground-muted">{link.description}</div>
                {link.type === "conflict" && link.resolution && (
                  <div className="mt-1 rounded bg-amber-50 dark:bg-amber-950 px-2 py-1 text-xs text-amber-700 dark:text-amber-300">
                    {t("growth.resolution")}: {link.resolution}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
