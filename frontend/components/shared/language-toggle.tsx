"use client";

import { useTranslation } from "@/lib/i18n";

export function LanguageToggle({ className }: { className?: string }) {
  const { locale, setLocale } = useTranslation();

  const toggle = () => setLocale(locale === "en" ? "fr" : "en");

  return (
    <button
      onClick={toggle}
      className={`text-xs font-medium text-foreground-muted hover:text-foreground transition-colors ${className ?? ""}`}
      title={locale === "en" ? "Passer en fran\u00e7ais" : "Switch to English"}
      aria-label={locale === "en" ? "Passer en fran\u00e7ais" : "Switch to English"}
    >
      {locale === "en" ? "FR" : "EN"}
    </button>
  );
}
