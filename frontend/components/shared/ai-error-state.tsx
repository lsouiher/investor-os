"use client";

import { useTranslation } from "@/lib/i18n";

interface AiErrorStateProps {
  severity: "critical" | "medium" | "low";
  onRetry?: () => void;
  message?: string;
}

export default function AiErrorState({
  severity,
  onRetry,
  message,
}: AiErrorStateProps) {
  const { t } = useTranslation();
  if (severity === "critical") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
          <svg
            className="h-8 w-8 text-red-600 dark:text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h2 className="mb-2 text-xl font-semibold text-foreground-strong">
          {t("error.critical.title")}
        </h2>
        <p className="mb-6 max-w-md text-sm text-foreground-secondary">
          {message || t("error.critical.description")}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="rounded-lg bg-amber-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-700"
          >
            {t("error.critical.retry")}
          </button>
        )}
      </div>
    );
  }

  if (severity === "medium") {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-950 px-4 py-3">
        <svg
          className="h-5 w-5 flex-shrink-0 text-amber-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="flex-1 text-sm text-amber-800 dark:text-amber-200">
          {message || t("error.medium.message")}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex-shrink-0 rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-amber-700"
          >
            {t("common.retry")}
          </button>
        )}
      </div>
    );
  }

  // low severity
  return (
    <div className="flex items-center gap-2 text-sm text-foreground-muted">
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span>{message || t("error.low.message")}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="font-medium text-amber-600 underline hover:text-amber-700"
        >
          {t("common.retry")}
        </button>
      )}
    </div>
  );
}
