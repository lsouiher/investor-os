"use client";

import { useTranslation } from "@/lib/i18n";

// The terms stay in English for the beta; a reader in another language is told so, in their
// language, so the language switch on this page visibly does something
export function EnglishOnlyNote() {
  const { locale, t } = useTranslation();
  if (locale === "en") return null;
  return (
    <p lang={locale} className="mt-3 text-sm text-foreground-muted">
      {t("terms.english_only")}
    </p>
  );
}
