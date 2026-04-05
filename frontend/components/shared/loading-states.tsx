"use client";

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="animate-pulse rounded-lg border border-border bg-surface-card p-6">
      <div className="mb-4 h-4 w-2/5 rounded bg-border" />
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="mb-2 h-3 rounded bg-surface-subtle"
          style={{ width: `${80 - i * 15}%` }}
        />
      ))}
    </div>
  );
}

export function SpinnerOverlay({ label }: { label?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-surface-card/80 backdrop-blur-sm">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-border border-t-amber-600" />
      {label && (
        <p className="mt-4 text-sm font-medium text-foreground-secondary">{label}</p>
      )}
    </div>
  );
}
