"use client";

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
  const name = PATH_NAMES[pathType] || pathType;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" role="dialog" aria-modal="true">
      <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-gray-900">Generate {name} early?</h2>
        <p className="mt-2 text-sm text-gray-600">
          This path is designed to unlock after: <strong>{unlockCriteria}</strong>
        </p>
        <p className="mt-2 text-sm text-gray-500">
          Generating now means the AI will have less context about your progress, which may result in less personalized recommendations.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
          >
            Generate Anyway
          </button>
        </div>
      </div>
    </div>
  );
}
