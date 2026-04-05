"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { useTranslation } from "@/lib/i18n";

export default function LandingPage() {
  const { t } = useTranslation();

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center bg-background px-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <main className="flex w-full max-w-[var(--max-content)] flex-col items-center gap-12 py-24 text-center">
        {/* Hero */}
        <div className="flex flex-col items-center gap-6">
          <p className="text-sm font-semibold tracking-widest uppercase text-accent">
            {t("nav.brand")}
          </p>
          <h1 className="max-w-2xl text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl">
            {t("landing.hero_title")}
          </h1>
          <p className="max-w-lg text-lg leading-relaxed text-foreground-muted">
            {t("landing.hero_subtitle")}
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 text-sm font-medium text-foreground-muted">
          <span>{t("landing.stats_time")}</span>
          <span className="h-4 w-px bg-foreground-muted/30" />
          <span>{t("landing.stats_audits")}</span>
          <span className="h-4 w-px bg-foreground-muted/30" />
          <span>{t("landing.stats_identity")}</span>
        </div>

        {/* CTAs */}
        <div className="flex flex-col items-center gap-4">
          <Link
            href="/register"
            className="inline-flex h-12 items-center justify-center bg-accent px-8 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
            style={{ borderRadius: "var(--radius-button)" }}
          >
            {t("landing.cta_primary")}
          </Link>
          <p className="text-sm text-foreground-muted">
            {t("landing.has_account")}{" "}
            <Link
              href="/login"
              className="font-medium text-accent underline underline-offset-2 hover:text-accent-hover"
            >
              {t("landing.cta_login")}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
