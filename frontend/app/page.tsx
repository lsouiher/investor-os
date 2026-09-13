"use client";

import { useEffect } from "react";
import Link from "next/link";
import { rememberSignupSource } from "@/lib/signup-source";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { useTranslation } from "@/lib/i18n";

// Landing page for a stranger who just got an email or scanned a QR at a conference: what
// this is, who it's for, what happens in twenty minutes, and why it's safe to answer honestly.
// Copy lives in locales/{en,fr}.json under landing.*; Leo owns the words.

const PATH_KEYS = ["curious", "first_doors", "scaling"] as const;
const STEP_KEYS = ["audits", "identity", "strategy", "growth"] as const;
const FAQ_KEYS = ["free", "time", "data", "advice", "beta"] as const;

// Example card in the hero: illustrative numbers, labelled as an example on the page.
const EXAMPLE = {
  archetype: "Value-Add Operator",
  score: 68,
  axes: [
    { key: "capital", value: 72 },
    { key: "time", value: 55 },
    { key: "skills", value: 80 },
    { key: "risk", value: 64 },
    { key: "network", value: 41 },
  ],
};

export default function LandingPage() {
  const { t } = useTranslation();

  // Keep the source of the visit (?utm_source=...) so registration can record it
  useEffect(() => {
    rememberSignupSource(window.location.search);
  }, []);

  return (
    <div className="flex-1 bg-background">
      {/* Top bar */}
      <header className="mx-auto flex w-full max-w-[var(--max-content)] items-center justify-between px-4 py-5 sm:px-6">
        <p className="text-sm font-semibold tracking-widest uppercase text-accent">{t("nav.brand")}</p>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-foreground-muted hover:text-foreground">
            {t("landing.cta_login")}
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto w-full max-w-[var(--max-content)] px-4 sm:px-6">
        {/* Hero */}
        <section className="grid items-center gap-10 py-12 md:grid-cols-[1.2fr_1fr] md:py-20">
          <div className="flex flex-col gap-6">
            <p className="inline-flex w-fit items-center gap-2 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent" style={{ borderRadius: "var(--radius-default)" }}>
              {t("landing.eyebrow")}
            </p>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl">
              {t("landing.hero_title")}
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-foreground-muted">{t("landing.hero_subtitle")}</p>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/register"
                className="inline-flex h-12 items-center justify-center bg-accent px-8 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
                style={{ borderRadius: "var(--radius-button)" }}
              >
                {t("landing.cta_primary")}
              </Link>
              <a href="#how" className="text-sm font-medium text-foreground-secondary underline underline-offset-4 hover:text-foreground">
                {t("landing.cta_secondary")}
              </a>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium text-foreground-muted">
              <span>{t("landing.stats_time")}</span>
              <span className="hidden h-4 w-px bg-foreground-muted/30 sm:block" />
              <span>{t("landing.stats_audits")}</span>
              <span className="hidden h-4 w-px bg-foreground-muted/30 sm:block" />
              <span>{t("landing.stats_free")}</span>
            </div>
          </div>

          <ExampleCard t={t} />
        </section>

        {/* The one sentence */}
        <section className="border-y border-border py-10 text-center">
          <p className="mx-auto max-w-3xl text-2xl font-semibold leading-snug text-foreground sm:text-3xl" style={{ textWrap: "balance" }}>
            {t("landing.thesis")}
          </p>
        </section>

        {/* Three paths */}
        <section className="py-16">
          <h2 className="text-2xl font-bold text-foreground">{t("landing.paths_title")}</h2>
          <p className="mt-2 max-w-2xl text-foreground-muted">{t("landing.paths_subtitle")}</p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {PATH_KEYS.map((key) => (
              <div key={key} className="flex flex-col gap-3 border border-border bg-surface-card p-6" style={{ borderRadius: "var(--radius-card)" }}>
                <p className="text-xs font-semibold uppercase tracking-wider text-accent">{t(`landing.path.${key}.label`)}</p>
                <h3 className="text-lg font-semibold text-foreground">{t(`landing.path.${key}.title`)}</h3>
                <p className="text-sm leading-relaxed text-foreground-muted">{t(`landing.path.${key}.description`)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="scroll-mt-8 border-t border-border py-16">
          <h2 className="text-2xl font-bold text-foreground">{t("landing.how_title")}</h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-4">
            {STEP_KEYS.map((key, i) => (
              <li key={key} className="flex flex-col gap-2">
                <span className="flex h-8 w-8 items-center justify-center bg-accent text-sm font-bold text-white" style={{ borderRadius: "var(--radius-default)" }}>
                  {i + 1}
                </span>
                <h3 className="font-semibold text-foreground">{t(`landing.step.${key}.title`)}</h3>
                <p className="text-sm leading-relaxed text-foreground-muted">{t(`landing.step.${key}.description`)}</p>
              </li>
            ))}
          </ol>
          <div className="mt-10">
            <Link
              href="/register"
              className="inline-flex h-12 items-center justify-center bg-accent px-8 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
              style={{ borderRadius: "var(--radius-button)" }}
            >
              {t("landing.cta_primary")}
            </Link>
          </div>
        </section>

        {/* Built by */}
        <section className="border-t border-border py-16">
          <div className="grid gap-6 md:grid-cols-[auto_1fr] md:items-start">
            <div className="flex h-16 w-16 items-center justify-center bg-accent/10 text-xl font-bold text-accent" style={{ borderRadius: "var(--radius-card)" }}>
              L
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">{t("landing.built_title")}</h2>
              <p className="mt-3 max-w-2xl leading-relaxed text-foreground-muted">{t("landing.built_body")}</p>
              <p className="mt-3 text-sm font-medium text-foreground-secondary">{t("landing.built_signature")}</p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-border py-16">
          <h2 className="text-2xl font-bold text-foreground">{t("landing.faq_title")}</h2>
          <dl className="mt-8 grid gap-x-10 gap-y-8 md:grid-cols-2">
            {FAQ_KEYS.map((key) => (
              <div key={key}>
                <dt className="font-semibold text-foreground">{t(`landing.faq.${key}.q`)}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-foreground-muted">{t(`landing.faq.${key}.a`)}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-10 text-xs text-foreground-tertiary">{t("landing.disclaimer")}</p>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-[var(--max-content)] flex-wrap items-center justify-between gap-4 px-4 py-6 text-sm text-foreground-muted sm:px-6">
          <span>{t("landing.footer_copyright")}</span>
          <div className="flex items-center gap-5">
            <Link href="/terms" className="hover:text-foreground">{t("nav.terms")}</Link>
            <Link href="/login" className="hover:text-foreground">{t("landing.cta_login")}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ExampleCard({ t }: { t: (key: string, params?: Record<string, string | number>) => string }) {
  return (
    <div className="relative mx-auto w-full max-w-sm border border-border bg-surface-card p-6 shadow-sm" style={{ borderRadius: "var(--radius-card)" }}>
      <span className="absolute right-4 top-4 text-[10px] font-semibold uppercase tracking-wider text-foreground-tertiary">
        {t("landing.example_label")}
      </span>
      <p className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">{t("identity_card.label")}</p>
      <p className="mt-2 text-2xl font-bold text-foreground">{EXAMPLE.archetype}</p>
      <div className="mt-4 flex items-end gap-2">
        <span className="text-5xl font-bold leading-none text-accent">{EXAMPLE.score}</span>
        <span className="pb-1 text-sm text-foreground-muted">/ 100 {t("identity_card.readiness")}</span>
      </div>
      <ul className="mt-5 flex flex-col gap-2">
        {EXAMPLE.axes.map((axis) => (
          <li key={axis.key} className="flex items-center gap-3 text-xs">
            <span className="w-16 text-foreground-muted">{t(`landing.axis.${axis.key}`)}</span>
            <span className="h-1.5 flex-1 overflow-hidden bg-border" style={{ borderRadius: 2 }}>
              <span className="block h-full bg-accent" style={{ width: `${axis.value}%` }} />
            </span>
            <span className="w-8 text-right tabular-nums text-foreground-secondary">{axis.value}</span>
          </li>
        ))}
      </ul>
      <p className="mt-5 border-t border-border pt-4 text-sm leading-relaxed text-foreground-secondary">{t("landing.example_insight")}</p>
    </div>
  );
}
