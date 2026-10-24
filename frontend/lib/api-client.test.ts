import { api, ApiError, loginUrl } from "./api-client";

function respond(status: number, body: unknown) {
  global.fetch = jest.fn().mockResolvedValue({
    status,
    statusText: "",
    headers: { get: () => "application/json" },
    json: () => Promise.resolve(body),
  }) as unknown as typeof fetch;
}

describe("api-client 401 handling", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("token", "old-token");
  });

  it("shows a wrong password as the server's error, not as an expired session", async () => {
    respond(401, { error: { code: "UNAUTHORIZED", message: "Invalid email or password.", details: [] } });
    const call = api.post("/auth/login", { email: "a@b.co", password: "nope" });
    await expect(call).rejects.toThrow(new ApiError("UNAUTHORIZED", "Invalid email or password."));
    expect(localStorage.getItem("token")).toBe("old-token");
  });

  it("clears the session on any other 401", async () => {
    respond(401, { error: { code: "UNAUTHORIZED", message: "Invalid or expired token.", details: [] } });
    await expect(api.get("/auth/me")).rejects.toThrow("Session expired");
    expect(localStorage.getItem("token")).toBeNull();
  });
});

// Review (ship): the envelope path (GET /strategies) follows the same 401 and content rules
describe("api-client getEnvelope", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("token", "old-token");
  });

  it("clears the session on a 401", async () => {
    respond(401, { error: { code: "UNAUTHORIZED", message: "Invalid or expired token.", details: [] } });
    await expect(api.getEnvelope("/strategies")).rejects.toThrow("Session expired");
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("refuses a non-JSON reply as an ApiError instead of a parse error", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 502,
      statusText: "Bad Gateway",
      headers: { get: () => "text/html" },
      json: () => Promise.reject(new SyntaxError("Unexpected token <")),
    }) as unknown as typeof fetch;
    await expect(api.getEnvelope("/strategies")).rejects.toMatchObject({ code: "NON_JSON_RESPONSE" });
  });
});

describe("loginUrl", () => {
  it("brings the user back to an allow-listed page, where a RECS deal is held", () => {
    expect(loginUrl("/import")).toBe("/login?next=/import");
  });

  it("sends every other page to plain sign-in", () => {
    expect(loginUrl("/hub")).toBe("/login");
    expect(loginUrl("/login")).toBe("/login");
  });
});
