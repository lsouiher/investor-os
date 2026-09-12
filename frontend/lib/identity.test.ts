import { toSubScoreList } from "./identity";

describe("toSubScoreList", () => {
  it("maps the API's sub_scores record to labeled entries", () => {
    expect(toSubScoreList({ financial: 68, time: 75, skills: 60, risk: 80, horizon: 78 })).toEqual([
      { label: "Financial", value: 68 },
      { label: "Time", value: 75 },
      { label: "Skills", value: 60 },
      { label: "Risk", value: 80 },
      { label: "Horizon", value: 78 },
    ]);
  });

  it("falls back to the raw key for unknown dimensions and coerces bad values to 0", () => {
    expect(toSubScoreList({ network: "42" as unknown as number, weird: NaN })).toEqual([
      { label: "network", value: 42 },
      { label: "weird", value: 0 },
    ]);
  });

  it("returns an empty list when the record is missing", () => {
    expect(toSubScoreList(null)).toEqual([]);
    expect(toSubScoreList(undefined)).toEqual([]);
  });
});
