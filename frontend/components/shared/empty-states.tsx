"use client";

import { useTranslation } from "@/lib/i18n";
import Link from "next/link";

function EmptyWrapper({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-surface-card px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-semibold text-foreground-strong">{title}</h3>
      <p className="mb-6 max-w-sm text-sm text-foreground-muted">{description}</p>
      <Link
        href={actionHref}
        className="rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-700"
      >
        {actionLabel}
      </Link>
    </div>
  );
}

const IdentityIcon = (
  <svg
    className="h-7 w-7 text-amber-600"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <circle cx="12" cy="8" r="5" />
    <path strokeLinecap="round" d="M20 21a8 8 0 0 0-16 0" />
  </svg>
);

const StrategyIcon = (
  <svg
    className="h-7 w-7 text-amber-600"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const ContactsIcon = (
  <svg
    className="h-7 w-7 text-amber-600"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"
    />
    <circle cx="9" cy="7" r="4" />
    <path strokeLinecap="round" d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
  </svg>
);

const TasksIcon = (
  <svg
    className="h-7 w-7 text-amber-600"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path strokeLinecap="round" strokeLinejoin="round" d="m9 12 2 2 4-4" />
  </svg>
);

export function DashboardEmpty() {
  const { t } = useTranslation();
  return (
    <EmptyWrapper
      icon={IdentityIcon}
      title={t("empty.dashboard.title")}
      description={t("empty.dashboard.description")}
      actionLabel={t("empty.dashboard.action")}
      actionHref="/hub"
    />
  );
}

export function StrategyEmpty() {
  const { t } = useTranslation();
  return (
    <EmptyWrapper
      icon={StrategyIcon}
      title={t("empty.strategies.title")}
      description={t("empty.strategies.description")}
      actionLabel={t("empty.strategies.action")}
      actionHref="/hub"
    />
  );
}

export function ContactsEmpty() {
  const { t } = useTranslation();
  return (
    <EmptyWrapper
      icon={ContactsIcon}
      title={t("empty.contacts.title")}
      description={t("empty.contacts.description")}
      actionLabel={t("empty.contacts.action")}
      actionHref="/contacts?add=true"
    />
  );
}

export function TasksEmpty() {
  const { t } = useTranslation();
  return (
    <EmptyWrapper
      icon={TasksIcon}
      title={t("empty.tasks.title")}
      description={t("empty.tasks.description")}
      actionLabel={t("empty.tasks.action")}
      actionHref="/strategies"
    />
  );
}
