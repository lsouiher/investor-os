import { safeNextPath } from "./next-path";

describe("safeNextPath", () => {
  it("allows /import", () => {
    expect(safeNextPath("/import")).toBe("/import");
  });

  it.each([
    null,
    "",
    "/dashboard",
    "//evil.com",
    "/\\evil.com",
    "https://evil.com",
    "/import?x=1",
    "%2Fimport",
    "/import/../admin",
    " /import",
  ])("rejects %p", (value) => {
    expect(safeNextPath(value)).toBeNull();
  });
});
