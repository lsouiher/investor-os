import { subScoreLabel, toSubScoreList } from "./identity";
import { translate } from "./translate";

const en = (key: string) => translate("en", key);
const fr = (key: string) => translate("fr", key);

describe("toSubScoreList", () => {
  const subScores = { financial: 68, time: 75, skills: 60, risk: 80, horizon: 78 };

  it("maps the API's sub_scores record to labeled entries", () => {
    expect(toSubScoreList(subScores, en)).toEqual([
      { label: "Financial", value: 68 },
      { label: "Time", value: 75 },
      { label: "Skills", value: 60 },
      { label: "Risk", value: 80 },
      { label: "Horizon", value: 78 },
    ]);
  });

  it("labels the entries in French, with the same values", () => {
    expect(toSubScoreList(subScores, fr)).toEqual([
      { label: "Finances", value: 68 },
      { label: "Temps", value: 75 },
      { label: "Compétences", value: 60 },
      { label: "Risque", value: 80 },
      { label: "Horizon", value: 78 },
    ]);
  });

  it("falls back to the raw key for unknown dimensions and coerces bad values to 0", () => {
    expect(toSubScoreList({ network: "42" as unknown as number, weird: NaN }, fr)).toEqual([
      { label: "network", value: 42 },
      { label: "weird", value: 0 },
    ]);
  });

  it("returns an empty list when the record is missing", () => {
    expect(toSubScoreList(null, en)).toEqual([]);
    expect(toSubScoreList(undefined, en)).toEqual([]);
  });
});

describe("subScoreLabel", () => {
  it("translates the five known sub-scores and leaves anything else as it is", () => {
    expect(subScoreLabel("financial", fr)).toBe("Finances");
    expect(subScoreLabel("financial", en)).toBe("Financial");
    expect(subScoreLabel("constructor", fr)).toBe("constructor");
  });
});
