// brand.md §5: text-only wordmark, Geist 600, -0.01em, after a 10px amber square (the mark
// shared with RECS). On surface-inverse the square is accent-on-inverse; on a light card it
// takes accent, since #F59E0B on white is under the 3:1 a graphic needs.
export function Wordmark({ inverse = false }: { inverse?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2 text-base font-semibold tracking-[-0.01em] ${
        inverse ? "text-ink-on-inverse" : "text-foreground-strong"
      }`}
    >
      <span
        aria-hidden="true"
        className={`h-2.5 w-2.5 ${inverse ? "bg-accent-on-inverse" : "bg-accent"}`}
      />
      Investor OS
    </span>
  );
}
