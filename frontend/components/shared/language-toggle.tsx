"use client";

import { api } from "@/lib/api-client";
import { useTranslation } from "@/lib/i18n";
import type { Locale } from "@/lib/locale";

// Each language is offered in its own words, whatever the interface language is
const OPTIONS: Record<Locale, { label: string; title: string }> = {
  en: { label: "EN", title: "Switch to English" },
  fr: { label: "FR", title: "Passer en français" },
};

// Signed in, the choice belongs to the account and follows it to other devices. A failure
// is silent: the device has switched, but the next full load of the signed-in app adopts the
// account's language again, so the choice only sticks once a save succeeds.
function saveToAccount(locale: Locale) {
  api.put("/auth/me", { locale }, { stayOnUnauthorized: true }).catch(() => {});
}

// `persist` is set by the signed-in app only. On public pages a token can be left over from
// someone else (a shared device): the switch there changes this device, never an account.
export function LanguageToggle({ className, persist = false }: { className?: string; persist?: boolean }) {
  const { locale, setLocale } = useTranslation();

  const target: Locale = locale === "en" ? "fr" : "en";
  const option = OPTIONS[target];

  const toggle = () => {
    setLocale(target);
    if (persist) saveToAccount(target);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      lang={target}
      className={`text-xs font-medium text-foreground-muted hover:text-foreground transition-colors ${className ?? ""}`}
      title={option.title}
      aria-label={option.title}
    >
      {option.label}
    </button>
  );
}
