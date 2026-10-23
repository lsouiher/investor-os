"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Wordmark } from "@/components/shared/wordmark";
import { RecsLink } from "@/components/shared/recs-link";
import { useTranslation } from "@/lib/i18n";

// Header band for the signed-out pages (landing, auth, terms): brand.md §5, surface-inverse
// in both modes. Extra links (e.g. the landing page's log-in) go before the theme toggle.
export function SiteHeader({ children }: { children?: ReactNode }) {
  const { t } = useTranslation();
  return (
    <header className="bg-surface-dark">
      <div className="mx-auto flex h-14 w-full max-w-[var(--max-content)] items-center justify-between px-4 sm:px-6">
        <Link href="/">
          <Wordmark inverse />
        </Link>
        <div className="flex items-center gap-4">
          <RecsLink className="text-sm font-medium text-ink-muted-on-inverse hover:text-ink-on-inverse">
            {t("nav.calculators")}
          </RecsLink>
          {children}
          <ThemeToggle inverse />
        </div>
      </div>
    </header>
  );
}
