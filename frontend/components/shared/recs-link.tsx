// "Calculators" link to RECS, the sibling product. NEXT_PUBLIC_RECS_URL is inlined at build
// time; when it is unset the link renders nothing.
export function RecsLink({ className, children }: { className?: string; children: React.ReactNode }) {
  const url = process.env.NEXT_PUBLIC_RECS_URL;
  if (!url) return null;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  );
}
