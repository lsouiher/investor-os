/**
 * Value card
 * protects: the data-access layer the import page and hub call (contracts/recs-deals-api.md):
 *   save posts exactly { c, name, d } to /recs-deals; delete sends DELETE with the id
 *   URL-encoded and resolves on the server's 204 with no body (api-client's 204 branch).
 * fails_when: the 204 short-circuit is removed (an empty DELETE reply is then refused as "not
 *   JSON", and the hub restores every row the user deleted), the id is not encoded (a crafted id
 *   could reach another path), or extra fields are posted.
 * why_new: page.test.tsx and recs-deals.test.tsx mock this module away; api-client.test.ts
 *   covers 401 only. Nothing exercised the real module against fetch.
 * seam: none (global fetch stubbed, the same way api-client.test.ts does)
 * no_claim: server behaviour; the real network.
 */
import { deleteRecsDeal, saveRecsDeal } from "./recs-deals-api";

function respond(status: number, contentType: string, body?: unknown) {
  const fetchMock = jest.fn().mockResolvedValue({
    status,
    statusText: "",
    headers: { get: () => contentType },
    json: () => (body === undefined ? Promise.reject(new SyntaxError("no body")) : Promise.resolve(body)),
  });
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("token", "t");
});

describe("recs-deals-api", () => {
  it("deletes by encoded id and resolves on a 204 with no body", async () => {
    const fetchMock = respond(204, "");
    await expect(deleteRecsDeal("a/b?c")).resolves.toBeUndefined();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/recs-deals\/a%2Fb%3Fc$/);
    expect(init.method).toBe("DELETE");
    expect(localStorage.getItem("token")).toBe("t");
  });

  it("posts only c, name and d to /recs-deals and returns the saved deal", async () => {
    const saved = { id: "pub1", c: "brrrr", name: "Elm", created_at: "2026-12-05T10:00:00.000Z" };
    const fetchMock = respond(201, "application/json", { data: saved });
    const deal = { c: "brrrr", name: "Elm", d: "N4Ig_-", extra: "x" } as unknown as Parameters<typeof saveRecsDeal>[0];
    await expect(saveRecsDeal(deal)).resolves.toEqual(saved);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/recs-deals$/);
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ c: "brrrr", name: "Elm", d: "N4Ig_-" });
  });
});
