import { rememberSignupSource, takeSignupSource } from "./signup-source";

describe("rememberSignupSource", () => {
  afterEach(() => sessionStorage.clear());

  it("records ?utm_source", () => {
    rememberSignupSource("?utm_source=BPCON");
    expect(takeSignupSource()).toBe("bpcon");
  });

  it("records ?ref=recs", () => {
    rememberSignupSource("?ref=recs");
    expect(takeSignupSource()).toBe("recs");
  });

  it("prefers utm_source over ref", () => {
    rememberSignupSource("?ref=recs&utm_source=qr");
    expect(takeSignupSource()).toBe("qr");
  });

  // Review (red team): other sites append ?ref=<site>; only RECS arrivals are a source
  it("ignores any ref other than recs", () => {
    rememberSignupSource("?ref=producthunt");
    expect(takeSignupSource()).toBeNull();
  });

  it("ignores an invalid ref", () => {
    rememberSignupSource("?ref=<script>");
    expect(takeSignupSource()).toBeNull();
  });
});
