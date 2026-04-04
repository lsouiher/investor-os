"use client";

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
  if (severity === "critical") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <svg
            className="h-8 w-8 text-red-600"
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
        <h2 className="mb-2 text-xl font-semibold text-gray-900">
          Something went wrong
        </h2>
        <p className="mb-6 max-w-md text-sm text-gray-600">
          {message ||
            "Our AI service is temporarily unavailable. Your data is safe and we are working to restore service. Please try again shortly."}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="rounded-lg bg-amber-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-700"
          >
            Try Again
          </button>
        )}
      </div>
    );
  }

  if (severity === "medium") {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
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
        <p className="flex-1 text-sm text-amber-800">
          {message || "AI analysis could not be completed. Please try again."}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex-shrink-0 rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-amber-700"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  // low severity
  return (
    <div className="flex items-center gap-2 text-sm text-gray-500">
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
      <span>{message || "Some AI features are temporarily limited."}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="font-medium text-amber-600 underline hover:text-amber-700"
        >
          Retry
        </button>
      )}
    </div>
  );
}
