import en from "@/locales/en.json";
import fr from "@/locales/fr.json";
import { translate, formatDate, formatTime, formatNumber, formatPercent } from "./translate";

const english: Record<string, string> = en;
const french: Record<string, string> = fr;

const placeholders = (text: string) => [...text.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]).sort();
// Intl separates groups and units with no-break spaces (U+00A0, U+202F); compare on plain ones
const plainSpaces = (text: string) => text.replace(/[  ]/g, " ");

describe("dictionaries", () => {
  const keys = Object.keys(english);

  it("have the same keys in both languages", () => {
    const missingInFrench = keys.filter((key) => !(key in french));
    const missingInEnglish = Object.keys(french).filter((key) => !(key in english));
    expect(missingInFrench).toEqual([]);
    expect(missingInEnglish).toEqual([]);
  });

  it("have no empty text", () => {
    const empty = [
      ...keys.filter((key) => english[key].trim() === "").map((key) => `en:${key}`),
      ...Object.keys(french).filter((key) => french[key].trim() === "").map((key) => `fr:${key}`),
    ];
    expect(empty).toEqual([]);
  });

  it("use the same {{placeholders}} for each key", () => {
    const different = keys.filter(
      (key) => key in french && placeholders(english[key]).join() !== placeholders(french[key]).join()
    );
    expect(different).toEqual([]);
  });

  // A key ending in ".one" marks a counted text. ".other" alone does not: "contacts.role.other"
  // is the "Other" role, not a plural.
  it("give every counted text both variants, and no uncounted twin", () => {
    const problems: string[] = [];
    for (const key of keys.filter((k) => k.endsWith(".one"))) {
      const base = key.slice(0, -".one".length);
      if (!(`${base}.other` in english)) problems.push(`${key} has no ${base}.other`);
      if (base in english) problems.push(`${base} exists next to ${key}`);
      for (const variant of [key, `${base}.other`]) {
        if (variant in english && !placeholders(english[variant]).includes("count")) {
          problems.push(`${variant} does not use {{count}}`);
        }
      }
    }
    expect(problems).toEqual([]);
  });
});

describe("translate", () => {
  it("returns the text in the requested language", () => {
    expect(translate("en", "nav.dashboard")).toBe("Dashboard");
    expect(translate("fr", "nav.dashboard")).toBe("Tableau de bord");
  });

  it("fills {{placeholders}} and leaves an unfilled one visible", () => {
    expect(translate("en", "growth.readiness", { score: 68 })).toBe("Readiness 68/100");
    expect(translate("en", "growth.readiness", {})).toBe("Readiness {{score}}/100");
  });

  it("uses the French singular for 0 and 1", () => {
    expect(translate("fr", "strategy.countdown.days", { count: 0 })).toBe("0 jour restant");
    expect(translate("fr", "strategy.countdown.days", { count: 1 })).toBe("1 jour restant");
    expect(translate("fr", "strategy.countdown.days", { count: 2 })).toBe("2 jours restants");
    expect(translate("fr", "contacts.subtitle", { count: 1 })).toBe("Votre réseau immobilier (1 contact)");
    // CLDR puts a million in a "many" category for French; it reads as a plain plural here
    expect(translate("fr", "strategy.countdown.days", { count: 1_000_000 })).toBe("1000000 jours restants");
  });

  it("uses the English singular for 1 only", () => {
    expect(translate("en", "strategy.countdown.days", { count: 0 })).toBe("0 days left");
    expect(translate("en", "strategy.countdown.days", { count: 1 })).toBe("1 day left");
    expect(translate("en", "strategy.countdown.days", { count: 5 })).toBe("5 days left");
    expect(translate("en", "contacts.subtitle", { count: 1 })).toBe("Your real estate network (1 contact)");
    expect(translate("en", "contacts.subtitle", { count: 12 })).toBe("Your real estate network (12 contacts)");
  });

  it("keeps a plain key that happens to take a count", () => {
    expect(translate("en", "hub.progress", { count: 3 })).toBe("3 of 5 complete");
  });

  describe("when a text is missing in French", () => {
    const plain = "test.only_in_english";
    const counted = "test.counted_only_in_english";

    beforeAll(() => {
      english[plain] = "English text for {{name}}";
      english[`${counted}.one`] = "{{count}} item";
      english[`${counted}.other`] = "{{count}} items";
    });
    afterAll(() => {
      delete english[plain];
      delete english[`${counted}.one`];
      delete english[`${counted}.other`];
    });

    it("shows the English text", () => {
      expect(translate("fr", plain, { name: "Leo" })).toBe("English text for Leo");
    });

    it("counts the English fallback the English way", () => {
      expect(translate("fr", counted, { count: 0 })).toBe("0 items");
      expect(translate("fr", counted, { count: 1 })).toBe("1 item");
    });
  });

  it("returns the key itself only when no language has the text", () => {
    expect(translate("fr", "test.nowhere")).toBe("test.nowhere");
  });
});

describe("formatting follows the interface language, not the device", () => {
  // Noon UTC: the same calendar day in every time zone the tests may run in
  const date = "2026-09-30T12:00:00Z";

  it("formats dates", () => {
    expect(formatDate("en", date)).toBe("9/30/2026");
    expect(formatDate("fr", date)).toBe("30/09/2026");
    expect(formatDate("fr", new Date(date))).toBe("30/09/2026");
    expect(formatDate("en", date, { dateStyle: "medium" })).toBe("Sep 30, 2026");
    expect(formatDate("fr", date, { dateStyle: "medium" })).toBe("30 sept. 2026");
  });

  it("keeps English dates and times as toLocaleDateString() and toLocaleTimeString() wrote them", () => {
    const moment = new Date(2026, 8, 30, 15, 45, 12);
    expect(formatDate("en", moment)).toBe(moment.toLocaleDateString("en-US"));
    expect(formatTime("en", moment)).toBe(moment.toLocaleTimeString("en-US"));
  });

  it("formats times on a 12-hour clock in English and a 24-hour clock in French", () => {
    const moment = new Date(2026, 8, 30, 15, 45, 12);
    expect(plainSpaces(formatTime("en", moment))).toBe("3:45:12 PM");
    expect(formatTime("fr", moment)).toBe("15:45:12");
    expect(formatTime("fr", moment, { timeStyle: "short" })).toBe("15:45");
  });

  it("formats numbers and percentages", () => {
    expect(formatNumber("en", 1000.5)).toBe("1,000.5");
    expect(plainSpaces(formatNumber("fr", 1000.5))).toBe("1 000,5");
    expect(formatPercent("en", 68)).toBe("68%");
    expect(plainSpaces(formatPercent("fr", 68))).toBe("68 %");
  });

  it("returns an empty string for an invalid date instead of throwing", () => {
    expect(formatDate("fr", "not a date")).toBe("");
    expect(formatTime("en", "not a date")).toBe("");
  });
});
