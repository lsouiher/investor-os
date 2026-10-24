// A deal sent from a RECS calculator (RECS docs/spec.md §10.8, FR-10.8.2): read from the URL
// fragment, which browsers never send to a server, and held in sessionStorage across sign-in
// until the user saves or cancels (research R4). The payload d is opaque: checked for shape,
// never decoded. The rules match backend/src/modules/recs-deal/validation.ts; keep them identical.
import recsConfig from "@/config/recs.json";

export interface RecsImport {
  c: string;
  name: string;
  d: string;
}

const KEY = "investoros_recs_import";
const KNOWN_SLUGS = new Set(recsConfig.calculators.map((calculator) => calculator.slug));
const PAYLOAD_REGEX = /^[A-Za-z0-9_-]{1,8000}$/;
const MAX_NAME_CODE_POINTS = 120;
const CONTROL_CHARS = /[\u0000-\u001F\u007F-\u009F\u2028\u2029]/g;
// Invisible characters: bidi embeddings and isolates, direction marks, soft hyphen, grapheme
// joiner, zero-width space, word joiners, deprecated format characters, interlinear annotation
// marks, BOM, tag characters and the Hangul fillers that render blank. The joiners U+200C/U+200D
// stay (emoji sequences and several scripts need them), but a name made only of joiners is blank.
const INVISIBLE_FORMATTING =
  /[\u00AD\u034F\u061C\u115F\u1160\u180E\u200B\u200E\u200F\u202A-\u202E\u2060-\u2064\u2066-\u206F\u3164\uFEFF\uFFA0\uFFF9-\uFFFB\u{E0000}-\u{E007F}]/gu;
const JOINERS = /[\u200C\u200D]/g;

export function isKnownSlug(c: string): boolean {
  return KNOWN_SLUGS.has(c);
}

// Same checks as the server; returns the deal with its cleaned name, or null
function validate(c: unknown, name: unknown, d: unknown): RecsImport | null {
  if (typeof c !== "string" || !isKnownSlug(c)) return null;
  if (typeof name !== "string") return null;
  const cleaned = name.replace(CONTROL_CHARS, " ").replace(INVISIBLE_FORMATTING, "").trim();
  const length = [...cleaned].length;
  if (!cleaned.replace(JOINERS, "").trim() || length > MAX_NAME_CODE_POINTS) return null;
  if (typeof d !== "string" || !PAYLOAD_REGEX.test(d)) return null;
  return { c, name: cleaned, d };
}

// Hand parser, not URLSearchParams: that would turn "+" into a space and percent-decode d,
// hiding a tampered payload instead of rejecting it (research R2). First key wins.
export function parseImportFragment(hash: string): RecsImport | null {
  const fields: Record<string, string> = {};
  for (const pair of hash.replace(/^#/, "").split("&")) {
    const eq = pair.indexOf("=");
    if (eq < 0) continue;
    const key = pair.slice(0, eq);
    if ((key === "c" || key === "n" || key === "d") && !(key in fields)) fields[key] = pair.slice(eq + 1);
  }
  if (fields.c === undefined || fields.n === undefined || fields.d === undefined) return null;
  try {
    return validate(decodeURIComponent(fields.c), decodeURIComponent(fields.n), fields.d);
  } catch {
    return null; // malformed percent sequence
  }
}

export function stashImport(deal: RecsImport): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(deal));
  } catch {
    // sessionStorage unavailable: the deal survives only until the page is left
  }
}

// Reads the held deal without removing it (a reload still offers Save); re-validated because
// sessionStorage is writable by anything on this origin
export function readImport(): RecsImport | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw) as Partial<RecsImport>;
    return validate(stored?.c, stored?.name, stored?.d);
  } catch {
    return null;
  }
}

export function clearImport(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // nothing held
  }
}

// "Open in RECS": the calculator page with the payload in its fragment, unchanged (d is
// URL-safe by validation). null when the RECS address is not configured.
export function openInRecsUrl(base: string | undefined, c: string, d: string): string | null {
  if (!base) return null;
  return `${base.replace(/\/+$/, "")}/calculators/${c}#d=${d}`;
}
