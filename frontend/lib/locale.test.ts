import { DEFAULT_LOCALE, LOCALES, LOCALE_COOKIE, isLocale, negotiateLocale, writeLocaleCookie } from "./locale";

describe("isLocale", () => {
  it("accepts the supported languages only", () => {
    expect(isLocale("en")).toBe(true);
    expect(isLocale("fr")).toBe(true);
    expect(isLocale("fr-CA")).toBe(false);
    expect(isLocale("es")).toBe(false);
    expect(isLocale("")).toBe(false);
    expect(isLocale(null)).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });

  it("defaults to English", () => {
    expect(DEFAULT_LOCALE).toBe("en");
    expect(LOCALES).toEqual(["en", "fr"]);
  });
});

// Same cases as parseAcceptLanguage in backend/src/shared/i18n.test.ts: both sides must agree
describe("negotiateLocale", () => {
  it("resolves regional French to French", () => {
    expect(negotiateLocale("fr-CA")).toBe("fr");
    expect(negotiateLocale("fr-FR,fr;q=0.9")).toBe("fr");
    expect(negotiateLocale("FR-be")).toBe("fr");
  });

  it("takes the first supported preference", () => {
    expect(negotiateLocale("en-US,fr;q=0.8")).toBe("en");
    expect(negotiateLocale("fr;q=0.9,en;q=0.8")).toBe("fr");
    expect(negotiateLocale("es,fr;q=0.5,en;q=0.4")).toBe("fr");
  });

  it("honors q-values over header order", () => {
    expect(negotiateLocale("en;q=0.5,fr;q=0.9")).toBe("fr");
    expect(negotiateLocale("fr;q=0.2, en;q=0.7")).toBe("en");
  });

  it("skips a language refused with q=0", () => {
    expect(negotiateLocale("fr;q=0,en;q=0.1")).toBe("en");
    expect(negotiateLocale("fr;q=0")).toBe("en");
  });

  it("falls back to English for unsupported or missing headers", () => {
    expect(negotiateLocale("es")).toBe("en");
    expect(negotiateLocale("*")).toBe("en");
    expect(negotiateLocale("")).toBe("en");
    expect(negotiateLocale(undefined)).toBe("en");
    expect(negotiateLocale(null)).toBe("en");
  });

  it("survives a malformed header", () => {
    expect(negotiateLocale(",,;q=,fr;q=abc")).toBe("en");
    expect(negotiateLocale("fr;q=abc,fr-CA;q=0.3")).toBe("fr");
  });
});

describe("writeLocaleCookie", () => {
  it("stores the choice where the proxy reads it", () => {
    writeLocaleCookie("fr");
    expect(document.cookie).toContain(`${LOCALE_COOKIE}=fr`);
    writeLocaleCookie("en");
    expect(document.cookie).toContain(`${LOCALE_COOKIE}=en`);
    expect(document.cookie).not.toContain(`${LOCALE_COOKIE}=fr`);
  });
});
