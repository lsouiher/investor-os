import {
  parseImportFragment,
  isKnownSlug,
  openInRecsUrl,
  stashImport,
  readImport,
  clearImport,
} from "./recs-import";

function fragment(c: string, name: string, d: string) {
  return `#c=${c}&n=${encodeURIComponent(name)}&d=${d}`;
}

describe("parseImportFragment", () => {
  it("parses a RECS fragment", () => {
    expect(parseImportFragment("#c=multifamily&n=Elm%20St&d=abc_-")).toEqual({
      c: "multifamily",
      name: "Elm St",
      d: "abc_-",
    });
  });

  it("accepts a fragment without the leading #", () => {
    expect(parseImportFragment("c=brrrr&n=x&d=a")).toEqual({ c: "brrrr", name: "x", d: "a" });
  });

  it.each([
    "Elm St & Co #12",
    "100% \"quoted\" 'deal'",
    "a=b&c=d",
    "🏠 Maison à vendre",
    "صفقة العقار",
    "👨‍👩‍👧 duplex",
  ])("round-trips the name %p exactly", (name) => {
    expect(parseImportFragment(fragment("multifamily", name, "abc"))?.name).toBe(name);
  });

  it("takes d raw: a percent sequence in d is rejected, not decoded", () => {
    expect(parseImportFragment("#c=multifamily&n=x&d=ab%41")).toBeNull();
  });

  it("rejects a malformed percent sequence in n", () => {
    expect(parseImportFragment("#c=multifamily&n=%E0%A4&d=abc")).toBeNull();
  });

  it.each(["#n=x&d=abc", "#c=multifamily&d=abc", "#c=multifamily&n=x", "", "#"])(
    "rejects a missing key in %p",
    (hash) => {
      expect(parseImportFragment(hash)).toBeNull();
    },
  );

  it("keeps the first value of a duplicate key and ignores unknown keys", () => {
    expect(parseImportFragment("#c=brrrr&c=nope&n=first&n=second&d=abc&z=1")).toEqual({
      c: "brrrr",
      name: "first",
      d: "abc",
    });
  });

  it("rejects an unknown slug, an oversize d and a 121-code-point name", () => {
    expect(parseImportFragment(fragment("nope", "x", "abc"))).toBeNull();
    expect(parseImportFragment(fragment("brrrr", "x", "a".repeat(8001)))).toBeNull();
    expect(parseImportFragment(fragment("brrrr", "x", "a".repeat(8000)))).not.toBeNull();
    expect(parseImportFragment(fragment("brrrr", "a".repeat(121), "abc"))).toBeNull();
    expect(parseImportFragment(fragment("brrrr", "🏠".repeat(120), "abc"))).not.toBeNull();
  });

  it.each(["a+b", "a/b", "ab=", "a%20b"])("rejects d %p", (d) => {
    expect(parseImportFragment(`#c=brrrr&n=x&d=${d}`)).toBeNull();
  });

  it("cleans control and bidi characters out of the name", () => {
    expect(parseImportFragment("#c=brrrr&n=Elm%09St%E2%80%AE&d=abc")?.name).toBe("Elm St");
    expect(parseImportFragment("#c=brrrr&n=%09%E2%80%AE%20&d=abc")).toBeNull();
  });

  // Review (adversarial): sessionStorage can hold what decodeURIComponent would refuse
  it("removes lone surrogates from a held name and keeps real emoji", () => {
    sessionStorage.setItem("investoros_recs_import", JSON.stringify({ c: "brrrr", name: "Elm\uD800 🏠", d: "abc" }));
    expect(readImport()?.name).toBe("Elm 🏠");
    sessionStorage.clear();
  });

  // Same rules as backend validation.ts
  it("removes zero-width, direction-mark and tag characters, and rejects a name of only those", () => {
    const n = encodeURIComponent("Elm \u200BSt\u200E\uFEFF\u2028\u{E0041}");
    expect(parseImportFragment(`#c=brrrr&n=${n}&d=abc`)?.name).toBe("Elm St");
    expect(parseImportFragment(`#c=brrrr&n=${encodeURIComponent("\u200B\u200D\u200C")}&d=abc`)).toBeNull();
    expect(parseImportFragment(`#c=brrrr&n=${encodeURIComponent("\u3164\u00AD\u115F\uFFA0")}&d=abc`)).toBeNull();
    expect(parseImportFragment(`#c=brrrr&n=${encodeURIComponent("Elm\u00AD\u034FSt\u206A\uFFF9")}&d=abc`)?.name).toBe("ElmSt");
    const family = "\u{1F468}\u200D\u{1F469}\u200D\u{1F467}";
    expect(parseImportFragment(`#c=brrrr&n=${encodeURIComponent(family)}&d=abc`)?.name).toBe(family);
  });
});

describe("isKnownSlug", () => {
  it("knows the eight RECS calculators and nothing else", () => {
    expect(isKnownSlug("short-term-rental")).toBe(true);
    expect(isKnownSlug("nope")).toBe(false);
    expect(isKnownSlug("constructor")).toBe(false);
  });
});

describe("openInRecsUrl", () => {
  it("builds the RECS calculator link with d unchanged", () => {
    expect(openInRecsUrl("https://recs.example/", "brrrr", "abc")).toBe(
      "https://recs.example/calculators/brrrr#d=abc",
    );
    expect(openInRecsUrl("https://recs.example", "brrrr", "a-_b")).toBe(
      "https://recs.example/calculators/brrrr#d=a-_b",
    );
  });

  it("returns null when the base is empty", () => {
    expect(openInRecsUrl("", "brrrr", "abc")).toBeNull();
    expect(openInRecsUrl(undefined, "brrrr", "abc")).toBeNull();
  });
});

describe("stash", () => {
  const deal = { c: "brrrr", name: "Elm St", d: "abc" };

  afterEach(() => {
    jest.restoreAllMocks();
    sessionStorage.clear();
  });

  it("round-trips through sessionStorage and clears", () => {
    stashImport(deal);
    expect(readImport()).toEqual(deal);
    expect(readImport()).toEqual(deal); // reading does not remove it
    clearImport();
    expect(readImport()).toBeNull();
  });

  it("ignores a stash that no longer passes validation", () => {
    sessionStorage.setItem("investoros_recs_import", JSON.stringify({ ...deal, d: "a+b" }));
    expect(readImport()).toBeNull();
    sessionStorage.setItem("investoros_recs_import", "{not json");
    expect(readImport()).toBeNull();
  });

  it("survives a throwing sessionStorage", () => {
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("denied");
    });
    jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("denied");
    });
    jest.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("denied");
    });
    expect(() => stashImport(deal)).not.toThrow();
    expect(readImport()).toBeNull();
    expect(() => clearImport()).not.toThrow();
  });
});
