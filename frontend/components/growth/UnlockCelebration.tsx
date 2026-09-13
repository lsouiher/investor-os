"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n";

const PATH_NAMES: Record<string, string> = {
  portfolio: "Portfolio Growth",
  income_capital: "Income & Capital",
  skills_knowledge: "Skills & Knowledge",
  time_operations: "Time & Operations",
};

const PATH_ICONS: Record<string, string> = {
  portfolio: "📊",
  income_capital: "💰",
  skills_knowledge: "📚",
  time_operations: "⏰",
};

interface UnlockCelebrationProps {
  pathType: string;
  onDismiss: () => void;
}

export default function UnlockCelebration({ pathType, onDismiss }: UnlockCelebrationProps) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(true);
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  if (!visible) return null;

  const name = PATH_NAMES[pathType] || pathType;
  const icon = PATH_ICONS[pathType] || "🎉";

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`fixed right-4 top-4 z-50 w-80 rounded-lg border-2 border-amber-300 dark:border-amber-600 bg-surface-card p-4 shadow-lg ${
        prefersReducedMotion ? "" : "animate-slide-in-right"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <div className="font-semibold text-foreground-strong">
            {t("growth.celebration.unlocked", { name })}
          </div>
          <div className="mt-0.5 text-sm text-foreground-secondary">
            {t("growth.celebration.description")}
          </div>
        </div>
      </div>
      <button
        onClick={() => { setVisible(false); onDismiss(); }}
        className="absolute right-2 top-2 text-foreground-tertiary hover:text-foreground-secondary"
        aria-label={t("common.dismiss")}
      >
        ×
      </button>
    </div>
  );
}
