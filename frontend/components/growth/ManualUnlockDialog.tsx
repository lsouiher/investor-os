"use client";

import { useTranslation } from "@/lib/i18n";

const PATH_NAMES: Record<string, string> = {
  portfolio: "Portfolio Growth",
  income_capital: "Income & Capital",
  skills_knowledge: "Skills & Knowledge",
  time_operations: "Time & Operations",
};

interface ManualUnlockDialogProps {
  pathType: string;
  unlockCriteria: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ManualUnlockDialog({
  pathType,
  unlockCriteria,
  onConfirm,
  onCancel,
}: ManualUnlockDialogProps) {
  const { t } = useTranslation();
  const name = PATH_NAMES[pathType] || pathType;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" role="dialog" aria-modal="true">
      <div className="mx-4 w-full max-w-md rounded-lg bg-surface-card p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-foreground-strong">{t("growth.unlock.title", { name })}</h2>
        <p className="mt-2 text-sm text-foreground-secondary">
          {t("growth.unlock.criteria_prefix")} <strong>{unlockCriteria}</strong>
        </p>
        <p className="mt-2 text-sm text-foreground-muted">
          {t("growth.unlock.warning")}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded border border-border px-4 py-2 text-sm text-foreground-secondary hover:bg-surface-subtle"
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={onConfirm}
            className="rounded bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
          >
            {t("growth.unlock.confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
