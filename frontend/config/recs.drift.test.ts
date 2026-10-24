/**
 * The calculator list lives in two files because Railway builds backend/ and frontend/ from
 * separate roots (research R1). This keeps them one list in practice, and keeps every slug and
 * every string of the RECS import labelled in both languages (spec SC-9).
 */
import fs from "fs";
import path from "path";
import frontendConfig from "./recs.json";
import en from "@/locales/en.json";
import fr from "@/locales/fr.json";

const slugs = frontendConfig.calculators.map((calculator) => calculator.slug);

describe("config/recs.json", () => {
  it("is identical to backend/config/recs.json", () => {
    const backendConfig = JSON.parse(
      fs.readFileSync(path.join(__dirname, "../../backend/config/recs.json"), "utf8"),
    );
    expect(frontendConfig).toEqual(backendConfig);
  });

  it.each([
    ["en", en],
    ["fr", fr],
  ])("has a %s label for every calculator", (_locale, dict) => {
    const missing = slugs.filter((slug) => !(dict as Record<string, string>)[`recs.calculator.${slug}`]);
    expect(missing).toEqual([]);
  });

  it("has every import.* and hub.recs_deals.* string in French", () => {
    const keys = Object.keys(en).filter((key) => key.startsWith("import.") || key.startsWith("hub.recs_deals."));
    expect(keys.length).toBeGreaterThan(0);
    expect(keys.filter((key) => !(fr as Record<string, string>)[key])).toEqual([]);
  });
});
