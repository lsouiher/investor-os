"use client";

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="animate-pulse rounded-lg border border-gray-200 bg-white p-6">
      <div className="mb-4 h-4 w-2/5 rounded bg-gray-200" />
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="mb-2 h-3 rounded bg-gray-100"
          style={{ width: `${80 - i * 15}%` }}
        />
      ))}
    </div>
  );
}

export function SpinnerOverlay({ label }: { label?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-amber-600" />
      {label && (
        <p className="mt-4 text-sm font-medium text-gray-600">{label}</p>
      )}
    </div>
  );
}
