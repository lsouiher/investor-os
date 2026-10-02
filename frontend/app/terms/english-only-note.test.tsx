/**
 * Value: protects=a French reader is told, in French, that the terms are English-only, and an
 * English reader sees nothing extra; fails_when=the locale guard is inverted, lang is dropped
 * or the key is renamed; why_new=no test rendered EnglishOnlyNote; seam=none
 */
import { render, screen } from "@testing-library/react";
import { I18nProvider } from "@/lib/i18n";
import { translate } from "@/lib/translate";
import { EnglishOnlyNote } from "./english-only-note";

it("says nothing to an English reader", () => {
  const { container } = render(
    <I18nProvider initialLocale="en">
      <EnglishOnlyNote />
    </I18nProvider>
  );
  expect(container).toBeEmptyDOMElement();
});

it("tells a French reader, in French, that the terms are in English only", () => {
  render(
    <I18nProvider initialLocale="fr">
      <EnglishOnlyNote />
    </I18nProvider>
  );
  expect(screen.getByText(translate("fr", "terms.english_only"))).toHaveAttribute("lang", "fr");
});
