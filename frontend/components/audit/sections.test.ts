/**
 * The persona fixtures (backend/fixtures/personas/*.json) must post exactly what the audit pages
 * post: every section and field exists on the page, every select value is a listed option, every
 * required field is filled, and every page field is present (the fixtures are complete payloads).
 * The backend side (modules/dev-seed/personas.test.ts) runs the completion validation.
 */
import { readdirSync, readFileSync } from "fs";
import path from "path";
import type { AuditSection } from "./audit-form-shell";
import { sections as financial } from "./sections/financial";
import { sections as time } from "./sections/time";
import { sections as skills } from "./sections/skills";
import { sections as risk } from "./sections/risk";
import { sections as horizon } from "./sections/horizon";

const PAGES: Record<string, AuditSection[]> = { financial, time, skills, risk, horizon };
const FIXTURES_DIR = path.resolve(__dirname, "../../../backend/fixtures/personas");

interface Fixture {
  letter: string;
  audits: Record<string, Record<string, Record<string, string>>>;
}

const fixtures: Fixture[] = readdirSync(FIXTURES_DIR)
  .filter((f) => /^[A-J]\.json$/.test(f))
  .sort()
  .map((f) => JSON.parse(readFileSync(path.join(FIXTURES_DIR, f), "utf8")));

describe("persona fixtures match the audit pages", () => {
  it("finds the ten fixtures", () => {
    expect(fixtures.map((f) => f.letter)).toEqual(["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"]);
  });

  describe.each(fixtures.map((f) => [f.letter, f] as const))("persona %s", (_letter, fixture) => {
    it.each(Object.keys(PAGES))("%s audit uses only page fields and listed option values", (auditType) => {
      const payload = fixture.audits[auditType];
      expect(payload).toBeDefined();
      const page = PAGES[auditType];
      const problems: string[] = [];

      for (const [sectionId, fields] of Object.entries(payload)) {
        const section = page.find((s) => s.id === sectionId);
        if (!section) {
          problems.push(`unknown section ${sectionId}`);
          continue;
        }
        for (const [name, value] of Object.entries(fields)) {
          const field = section.fields.find((f) => f.name === name);
          if (!field) {
            problems.push(`unknown field ${sectionId}.${name}`);
            continue;
          }
          if (field.type === "select" && value !== "" && !field.options?.some((o) => o.value === value)) {
            problems.push(`${sectionId}.${name}: "${value}" is not an option`);
          }
          if (field.required && value.trim() === "") problems.push(`${sectionId}.${name} is required`);
        }
      }
      for (const section of page) {
        for (const field of section.fields) {
          if (payload[section.id]?.[field.name] === undefined) problems.push(`missing ${section.id}.${field.name}`);
        }
      }
      expect(problems).toEqual([]);
    });
  });
});
