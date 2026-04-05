"use client";

import Link from "next/link";

const PATH_NAMES: Record<string, string> = {
  portfolio: "Portfolio Growth",
  income_capital: "Income & Capital",
  skills_knowledge: "Skills & Knowledge",
  time_operations: "Time & Operations",
};

interface NextBestActionProps {
  actionItemId: string;
  pathType: string;
  title: string;
  reason: string;
  crossPathImpact: string[];
}

export default function NextBestAction({
  pathType,
  title,
  reason,
  crossPathImpact,
}: NextBestActionProps) {
  return (
    <Link
      href={`/growth-strategy/${pathType}`}
      className="block rounded-lg border-2 border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-950 px-5 py-4 transition-shadow hover:shadow-sm"
    >
      <div className="text-xs font-medium uppercase text-amber-700 dark:text-amber-300">Next Best Action</div>
      <div className="mt-1 font-medium text-foreground-strong">{title}</div>
      <div className="mt-1 text-sm text-foreground-secondary">{reason}</div>
      {crossPathImpact.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {crossPathImpact.map((impact) => (
            <span key={impact} className="rounded bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 text-xs text-amber-700 dark:text-amber-300">
              {PATH_NAMES[impact] || impact}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
