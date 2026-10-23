"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n";

function usePathNames() {
  const { t } = useTranslation();
  return {
    portfolio: t("growth.path.portfolio"),
    income_capital: t("growth.path.income_capital"),
    skills_knowledge: t("growth.path.skills_knowledge"),
    time_operations: t("growth.path.time_operations"),
  } as Record<string, string>;
}

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
  const { t } = useTranslation();
  const PATH_NAMES = usePathNames();
  return (
    <Link
      href={`/growth-strategy/${pathType}`}
      className="block rounded-lg border-2 border-accent/30 bg-accent-tint px-5 py-4 transition-colors hover:border-accent"
    >
      <div className="text-xs font-medium uppercase text-accent-text">{t("growth.next_best_action")}</div>
      <div className="mt-1 font-medium text-foreground-strong">{title}</div>
      <div className="mt-1 text-sm text-foreground-secondary">{reason}</div>
      {crossPathImpact.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {crossPathImpact.map((impact) => (
            <span key={impact} className="rounded-full bg-accent-tint px-2 py-0.5 text-xs text-accent-text">
              {PATH_NAMES[impact] || impact}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
