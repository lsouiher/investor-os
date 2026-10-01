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
// is silent: the device has switched, and the next switch tries again.
function saveToAccount(locale: Locale) {
  let signedIn = false;
  try {
    signedIn = localStorage.getItem("token") !== null;
  } catch {}
  if (!signedIn) return;
  api.put("/auth/me", { locale }, { stayOnUnauthorized: true }).catch(() => {});
}

export function LanguageToggle({ className }: { className?: string }) {
  const { locale, setLocale } = useTranslation();

  const target: Locale = locale === "en" ? "fr" : "en";
  const option = OPTIONS[target];

  const toggle = () => {
    setLocale(target);
    saveToAccount(target);
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
