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

  it("ignores an invalid ref", () => {
    rememberSignupSource("?ref=<script>");
    expect(takeSignupSource()).toBeNull();
  });
});
