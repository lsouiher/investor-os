import { readFileSync } from "fs";
import { join } from "path";

// globals.css against docs/brand.md §2: every token holds brand.md's value in both modes, and
// every text/background pair brand.md names reaches 4.5:1 (charts 3:1 on surface).

const css = readFileSync(join(__dirname, "globals.css"), "utf8");
const brand = readFileSync(join(__dirname, "..", "..", "docs", "brand.md"), "utf8");

// brand.md token -> Investor OS variable (the table at the top of globals.css)
const VARS: Record<string, string> = {
  background: "background",
  surface: "surface-card",
  "surface-subtle": "surface-subtle",
  "surface-inverse": "surface-dark",
  border: "border",
  "border-muted": "border-muted",
  ink: "foreground",
  "ink-strong": "foreground-strong",
  "ink-muted": "foreground-muted",
  "ink-on-inverse": "ink-on-inverse",
  "ink-muted-on-inverse": "ink-muted-on-inverse",
  accent: "accent",
  "accent-on-inverse": "accent-on-inverse",
  "accent-hover": "accent-hover",
  "accent-text": "accent-text",
  "on-accent": "on-accent",
  ok: "ok",
  warn: "warn",
  danger: "danger",
  info: "info",
  "chart-1": "chart-1",
  "chart-2": "chart-2",
  "chart-3": "chart-3",
};

type Mode = "light" | "dark";
const MODES: Mode[] = ["light", "dark"];

function block(selector: string): Record<string, string> {
  const start = css.search(new RegExp(`^${selector.replace(".", "\\.")}\\s*\\{`, "m"));
  if (start < 0) throw new Error(`no ${selector} block in globals.css`);
  const body = css.slice(css.indexOf("{", start) + 1, css.indexOf("}", start));
  const vars: Record<string, string> = {};
  for (const m of body.matchAll(/--([\w-]+):\s*([^;]+);/g)) vars[m[1]] = m[2].trim();
  return vars;
}

// .dark sits on <html> with :root, so it inherits every variable it does not redefine
const root = block(":root");
const declared: Record<Mode, Record<string, string>> = {
  light: root,
  dark: { ...root, ...block(".dark") },
};

function resolve(mode: Mode, name: string, seen: string[] = []): string {
  const value = declared[mode][name];
  if (value === undefined) throw new Error(`--${name} is not defined (${mode})`);
  const ref = value.match(/^var\(--([\w-]+)\)$/);
  if (!ref) return value.toUpperCase();
  if (seen.includes(name)) throw new Error(`var cycle at --${name}`);
  return resolve(mode, ref[1], [...seen, name]);
}

const cssValue = (mode: Mode, token: string) => resolve(mode, VARS[token]);

// brand.md §2: the colour table, then the chart sentence under it
function brandValues(): Record<string, Record<Mode, string>> {
  const out: Record<string, Record<Mode, string>> = {};
  for (const m of brand.matchAll(/^\| `([\w-]+)` \| `(#[0-9A-Fa-f]{6})` \| `(#[0-9A-Fa-f]{6})` \|/gm)) {
    out[m[1]] = { light: m[2].toUpperCase(), dark: m[3].toUpperCase() };
  }
  for (const m of brand.matchAll(/`(chart-\d)` = `([a-z-]+)`/g)) out[m[1]] = { ...out[m[2]] };
  const slate = brand.match(/`chart-2` = `(#[0-9A-Fa-f]{6})` light \/ `(#[0-9A-Fa-f]{6})` dark/);
  if (slate) out["chart-2"] = { light: slate[1].toUpperCase(), dark: slate[2].toUpperCase() };
  return out;
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// [foreground, background, minimum] as brand.md §2 names them
const TEXT = 4.5;
const PAIRS: [string, string, number][] = [
  ...["ink", "ink-strong", "ink-muted"].flatMap((fg) =>
    ["background", "surface", "surface-subtle"].map((bg) => [fg, bg, TEXT] as [string, string, number])
  ),
  ["accent-text", "background", TEXT],
  ["accent-text", "surface", TEXT],
  ["ink-on-inverse", "surface-inverse", TEXT],
  ["ink-muted-on-inverse", "surface-inverse", TEXT],
  ["accent-on-inverse", "surface-inverse", TEXT],
  ["on-accent", "accent", TEXT],
  ["on-accent", "accent-hover", TEXT],
  ...["ok", "warn", "danger", "info"].map((fg) => [fg, "surface", TEXT] as [string, string, number]),
  ["chart-1", "surface", 3],
  ["chart-2", "surface", 3],
  ["chart-3", "surface", 3],
];

describe("globals.css matches brand.md §2", () => {
  const expected = brandValues();

  it("reads every brand.md token", () => {
    expect(Object.keys(expected).sort()).toEqual(Object.keys(VARS).sort());
  });

  for (const token of Object.keys(VARS)) {
    for (const mode of MODES) {
      it(`${token} (${mode})`, () => {
        expect(cssValue(mode, token)).toBe(expected[token][mode]);
      });
    }
  }
});

describe("brand.md §2 contrast pairs", () => {
  for (const [fg, bg, min] of PAIRS) {
    for (const mode of MODES) {
      it(`${fg} on ${bg} (${mode}) >= ${min}:1`, () => {
        expect(contrast(cssValue(mode, fg), cssValue(mode, bg))).toBeGreaterThanOrEqual(min);
      });
    }
  }
});

describe("Investor OS additions", () => {
  for (const mode of MODES) {
    it(`accent-text on accent-tint (${mode}) >= 4.5:1`, () => {
      expect(contrast(cssValue(mode, "accent-text"), resolve(mode, "accent-tint"))).toBeGreaterThanOrEqual(TEXT);
    });
    it(`foreground-secondary on surface (${mode}) >= 4.5:1`, () => {
      expect(contrast(resolve(mode, "foreground-secondary"), cssValue(mode, "surface"))).toBeGreaterThanOrEqual(TEXT);
    });
  }
});
