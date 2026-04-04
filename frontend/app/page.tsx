import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-background px-4">
      <main className="flex w-full max-w-[var(--max-content)] flex-col items-center gap-12 py-24 text-center">
        {/* Hero */}
        <div className="flex flex-col items-center gap-6">
          <p className="text-sm font-semibold tracking-widest uppercase text-accent">
            InvestorOS
          </p>
          <h1 className="max-w-2xl text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl">
            Build Your Investor Identity
          </h1>
          <p className="max-w-lg text-lg leading-relaxed text-foreground-muted">
            Complete 5 short audits to discover your archetype, readiness score,
            and personalized investment strategies.
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 text-sm font-medium text-foreground-muted">
          <span>~20 minutes</span>
          <span className="h-4 w-px bg-foreground-muted/30" />
          <span>5 audits</span>
          <span className="h-4 w-px bg-foreground-muted/30" />
          <span>1 identity</span>
        </div>

        {/* CTAs */}
        <div className="flex flex-col items-center gap-4">
          <Link
            href="/register"
            className="inline-flex h-12 items-center justify-center bg-accent px-8 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
            style={{ borderRadius: "var(--radius-button)" }}
          >
            Get Started
          </Link>
          <p className="text-sm text-foreground-muted">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-accent underline underline-offset-2 hover:text-accent-hover"
            >
              Log in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
