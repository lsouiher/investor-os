"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth, AuthProvider } from "@/lib/auth-context";
import { api } from "@/lib/api-client";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { LanguageToggle } from "@/components/shared/language-toggle";
import { Wordmark } from "@/components/shared/wordmark";
import { RecsLink } from "@/components/shared/recs-link";
import { useTranslation } from "@/lib/i18n";

// Set NEXT_PUBLIC_FEEDBACK_EMAIL to show a "Send feedback" link in the sidebar footer
const FEEDBACK_EMAIL = process.env.NEXT_PUBLIC_FEEDBACK_EMAIL ?? "";

const NAV_ITEMS = [
  { label: "nav.dashboard", href: "/dashboard", icon: LayoutIcon },
  { label: "nav.hub", href: "/hub", icon: UserIcon },
  { label: "nav.strategy", href: "/strategies", icon: TargetIcon },
  { label: "nav.contacts", href: "/contacts", icon: UsersIcon },
  { label: "nav.tasks", href: "/tasks", icon: CheckIcon },
];

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AuthenticatedShell>{children}</AuthenticatedShell>
    </AuthProvider>
  );
}

function AuthenticatedShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { token, user, loading, logout } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const [score, setScore] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && !token) {
      router.push("/login");
    }
  }, [loading, token, router]);

  // Sidebar readiness score; re-fetched on navigation so a fresh synthesis shows up
  useEffect(() => {
    if (!token) return;
    api
      .get<{ readiness_score: number } | null>("/identity")
      .then((identity) => setScore(identity?.readiness_score ?? null))
      .catch(() => setScore(null));
  }, [token, pathname]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-foreground-muted">{t("common.loading")}</p>
      </div>
    );
  }

  if (!token) {
    return null;
  }

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      {/* Mobile header band: brand.md §5, surface-inverse in both modes; dark mode adds the 1px edge facing the page */}
      <header className="flex h-14 items-center justify-between bg-surface-dark px-4 md:hidden dark:border-b dark:border-border">
        <Wordmark inverse />
        <RecsLink className="text-sm font-medium text-ink-muted-on-inverse hover:text-ink-on-inverse">
          {t("nav.calculators")}
        </RecsLink>
      </header>

      {/* Desktop sidebar: the header bar of brand.md §5, turned on its side */}
      <aside
        className="hidden md:flex md:flex-col md:justify-between bg-surface-dark dark:border-r dark:border-border"
        style={{ width: "var(--sidebar-width)" }}
      >
        <div>
          <div className="flex h-14 items-center px-6">
            <Wordmark inverse />
          </div>

          <nav className="flex flex-col gap-1 px-3">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 border-l-2 px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "border-accent-on-inverse text-ink-on-inverse"
                      : "border-transparent text-ink-muted-on-inverse hover:bg-white/5 hover:text-ink-on-inverse"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {t(item.label)}
                </Link>
              );
            })}
            <RecsLink className="flex items-center gap-3 border-l-2 border-transparent px-3 py-2 text-sm font-medium text-ink-muted-on-inverse transition-colors hover:bg-white/5 hover:text-ink-on-inverse">
              <CalculatorIcon className="h-4 w-4" />
              {t("nav.calculators")}
            </RecsLink>
          </nav>
        </div>

        {/* Sidebar footer — identity badge placeholder */}
        <div className="border-t border-white/10 px-4 py-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-8 w-8 items-center justify-center bg-white/10 text-xs font-semibold text-accent-on-inverse"
              style={{ borderRadius: "var(--radius-default)" }}
            >
              {user?.email?.charAt(0).toUpperCase() ?? "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-xs font-medium text-ink-on-inverse">
                {user?.email ?? t("nav.default_user")}
              </p>
              <p className="text-xs text-ink-muted-on-inverse">{t("nav.score", { score: score ?? "--" })}</p>
            </div>
            <LanguageToggle inverse />
            <ThemeToggle inverse />
            <button
              onClick={logout}
              className="text-xs text-ink-muted-on-inverse hover:text-ink-on-inverse"
              title={t("nav.logout")}
            >
              <LogoutIcon className="h-4 w-4" />
            </button>
          </div>
          {/* Beta footer: a way to talk to the person behind it, and the terms everyone signed up under */}
          <div className="mt-3 flex items-center gap-3 text-[11px] text-ink-muted-on-inverse">
            {FEEDBACK_EMAIL && (
              <a
                href={`mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(t("nav.feedback_subject"))}`}
                className="hover:text-ink-on-inverse"
              >
                {t("nav.feedback")}
              </a>
            )}
            <Link href="/terms" className="hover:text-ink-on-inverse">
              {t("nav.terms")}
            </Link>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <div
          className="mx-auto w-full px-4 py-6 sm:px-6 lg:px-8"
          style={{ maxWidth: "var(--max-content)" }}
        >
          {children}
        </div>
      </main>

      {/* Mobile bottom tab bar: the dark-mode edge sits on the bar, so each item's border-t-2 stays the active line */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-stretch justify-around bg-surface-dark md:hidden dark:border-t dark:border-border">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center gap-1 border-t-2 px-2 pt-2 pb-3 text-xs ${
                active
                  ? "border-accent-on-inverse text-ink-on-inverse"
                  : "border-transparent text-ink-muted-on-inverse"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span>{t(item.label)}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

/* Minimal inline SVG icon components */

function LayoutIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18" />
      <path d="M9 21V9" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="5" />
      <path d="M20 21a8 8 0 0 0-16 0" />
    </svg>
  );
}

function TargetIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function CalculatorIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <line x1="8" y1="6" x2="16" y2="6" />
      <path d="M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h.01M12 19h.01M16 19h.01" />
    </svg>
  );
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
