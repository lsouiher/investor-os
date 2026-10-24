import { act, render, screen, waitFor } from "@testing-library/react";

const mockGet = jest.fn();
jest.mock("./api-client", () => ({
  api: { get: (...args: unknown[]) => mockGet(...args), post: jest.fn() },
}));

import { AuthProvider, useAuth } from "./auth-context";

function Probe() {
  const { user, token, loading } = useAuth();
  if (loading) return <p>loading</p>;
  return <p>{user ? `${user.email} ${token}` : "signed out"}</p>;
}

function storageEvent(key: string | null, newValue: string | null) {
  act(() => {
    window.dispatchEvent(new StorageEvent("storage", { key, newValue }));
  });
}

describe("AuthProvider across tabs", () => {
  beforeEach(() => mockGet.mockReset());
  afterEach(() => localStorage.clear());

  it("revalidates when another tab signs in", async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    expect(await screen.findByText("signed out")).toBeInTheDocument();
    expect(mockGet).not.toHaveBeenCalled();

    mockGet.mockResolvedValue({ id: "u1", email: "a@example.com", role: "investor" });
    localStorage.setItem("token", "t2");
    storageEvent("token", "t2");

    expect(await screen.findByText("a@example.com t2")).toBeInTheDocument();
    expect(mockGet).toHaveBeenCalledWith("/auth/me");
  });

  it("revalidates when another tab switches account", async () => {
    localStorage.setItem("token", "t1");
    mockGet.mockResolvedValueOnce({ id: "u1", email: "a@example.com", role: "investor" });
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    expect(await screen.findByText("a@example.com t1")).toBeInTheDocument();

    mockGet.mockResolvedValueOnce({ id: "u2", email: "b@example.com", role: "investor" });
    localStorage.setItem("token", "t2");
    storageEvent("token", "t2");
    expect(await screen.findByText("b@example.com t2")).toBeInTheDocument();
  });

  // Review (adversarial): while the new token is checked, the page must not show the old account
  // (Save would post with the new token), and a slow reply must not overwrite a newer one
  it("shows no account while revalidating, and keeps the latest of two quick switches", async () => {
    localStorage.setItem("token", "t1");
    mockGet.mockResolvedValueOnce({ id: "u1", email: "a@example.com", role: "investor" });
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    expect(await screen.findByText("a@example.com t1")).toBeInTheDocument();

    let resolveB!: (u: unknown) => void;
    mockGet.mockImplementationOnce(() => new Promise((resolve) => { resolveB = resolve; }));
    localStorage.setItem("token", "t2");
    storageEvent("token", "t2");
    expect(screen.queryByText(/a@example.com/)).not.toBeInTheDocument();
    // A different account: loading, so the authenticated layout remounts every page and no page
    // keeps account A's data (forms, dashboard) under account B's token
    expect(screen.getByText("loading")).toBeInTheDocument();

    mockGet.mockResolvedValueOnce({ id: "u3", email: "c@example.com", role: "investor" });
    localStorage.setItem("token", "t3");
    storageEvent("token", "t3");
    expect(await screen.findByText("c@example.com t3")).toBeInTheDocument();

    await act(async () => {
      resolveB({ id: "u2", email: "b@example.com", role: "investor" });
    });
    expect(screen.getByText("c@example.com t3")).toBeInTheDocument();
  });

  it("clears the user when another tab signs out", async () => {
    localStorage.setItem("token", "t1");
    mockGet.mockResolvedValue({ id: "u1", email: "a@example.com", role: "investor" });
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    expect(await screen.findByText("a@example.com t1")).toBeInTheDocument();

    localStorage.removeItem("token");
    storageEvent("token", null);
    await waitFor(() => expect(screen.getByText("signed out")).toBeInTheDocument());
  });

  it("signs out when another tab clears all of storage (key null)", async () => {
    localStorage.setItem("token", "t1");
    mockGet.mockResolvedValue({ id: "u1", email: "a@example.com", role: "investor" });
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    expect(await screen.findByText("a@example.com t1")).toBeInTheDocument();
    localStorage.clear();
    storageEvent(null, null);
    await waitFor(() => expect(screen.getByText("signed out")).toBeInTheDocument());
  });

  it("ignores other keys", async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await screen.findByText("signed out");
    storageEvent("locale", "fr");
    expect(mockGet).not.toHaveBeenCalled();
  });
});

// Review (red team): on a shared device, the next person to sign in in this tab must not be
// offered the previous user's held RECS deal, nor inherit their signup source
describe("AuthProvider logout", () => {
  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    jest.restoreAllMocks();
  });

  it("forgets the held RECS deal and the signup source", async () => {
    sessionStorage.setItem("investoros_recs_import", JSON.stringify({ c: "brrrr", name: "Elm", d: "abc" }));
    sessionStorage.setItem("investoros_signup_source", "recs");
    jest.spyOn(console, "error").mockImplementation(() => {}); // jsdom: navigation not implemented
    function LogoutButton() {
      const { logout } = useAuth();
      return <button onClick={logout}>out</button>;
    }
    render(
      <AuthProvider>
        <LogoutButton />
      </AuthProvider>,
    );
    act(() => screen.getByRole("button", { name: "out" }).click());
    expect(sessionStorage.getItem("investoros_recs_import")).toBeNull();
    expect(sessionStorage.getItem("investoros_signup_source")).toBeNull();
  });
});

// Review (ship): a validation still running when the user signs in in this tab must not undo it
describe("AuthProvider sign-in during a pending validation", () => {
  afterEach(() => {
    localStorage.clear();
    jest.restoreAllMocks();
  });

  it("keeps the new session when the old token's check fails afterwards", async () => {
    localStorage.setItem("token", "expired");
    let rejectOld!: (err: Error) => void;
    mockGet.mockReset().mockImplementationOnce(() => new Promise((_, reject) => { rejectOld = reject; }));
    const { api } = jest.requireMock("./api-client") as { api: { post: jest.Mock } };
    api.post.mockResolvedValueOnce({ token: "fresh", user: { id: "u1", email: "a@example.com", role: "investor" } });
    function SignIn() {
      const { login, user, loading } = useAuth();
      return (
        <button onClick={() => login("a@example.com", "pw")}>
          {user ? user.email : "in"} {loading ? "loading" : "ready"}
        </button>
      );
    }
    render(
      <AuthProvider>
        <SignIn />
      </AuthProvider>,
    );
    await act(async () => {
      screen.getByRole("button").click();
    });
    await act(async () => {
      rejectOld(new Error("401"));
    });
    expect(localStorage.getItem("token")).toBe("fresh");
    expect(screen.getByRole("button")).toHaveTextContent("a@example.com ready");
  });
});

// A JWT-shaped token whose payload carries sub (the user's public id); the signature is not checked
function tokenFor(sub: string, n: number) {
  const payload = btoa(JSON.stringify({ sub, n })).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
  return `h.${payload}.s`;
}

// Review (ship): a new token for the same account (signed in again in another tab) must not
// reset the pages, which would lose unsaved forms
describe("AuthProvider, same account signs in again in another tab", () => {
  afterEach(() => localStorage.clear());

  it("keeps the user and the page, and takes the new token", async () => {
    const first = tokenFor("u1", 1);
    const second = tokenFor("u1", 2);
    localStorage.setItem("token", first);
    mockGet.mockReset().mockResolvedValue({ id: "u1", email: "a@example.com", role: "investor" });
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    expect(await screen.findByText(`a@example.com ${first}`)).toBeInTheDocument();
    localStorage.setItem("token", second);
    storageEvent("token", second);
    expect(screen.getByText(`a@example.com ${second}`)).toBeInTheDocument();
    expect(screen.queryByText("loading")).not.toBeInTheDocument();
  });
});

// Review (ship): a failed sign-in must not strand the check of the stored session
describe("AuthProvider, failed sign-in during the stored-session check", () => {
  afterEach(() => {
    localStorage.clear();
    jest.restoreAllMocks();
  });

  it("still finishes the stored-session check", async () => {
    localStorage.setItem("token", "stored");
    let resolveCheck!: (u: unknown) => void;
    mockGet.mockReset().mockImplementationOnce(() => new Promise((resolve) => { resolveCheck = resolve; }));
    const { api } = jest.requireMock("./api-client") as { api: { post: jest.Mock } };
    api.post.mockRejectedValueOnce(new Error("Invalid email or password."));
    function SignIn() {
      const { login, user, loading } = useAuth();
      return (
        <button onClick={() => login("a@example.com", "wrong").catch(() => {})}>
          {user ? user.email : "none"} {loading ? "loading" : "ready"}
        </button>
      );
    }
    render(
      <AuthProvider>
        <SignIn />
      </AuthProvider>,
    );
    await act(async () => {
      screen.getByRole("button").click();
    });
    await act(async () => {
      resolveCheck({ id: "u1", email: "a@example.com", role: "investor" });
    });
    expect(screen.getByRole("button")).toHaveTextContent("a@example.com ready");
  });
});

// Review (adversarial): a server or network failure on /auth/me is not a signed-out user. Clearing
// the token would also sign out every other tab (storage event), undoing the 500-not-401 fix.
describe("AuthProvider, /auth/me fails for a reason other than 401", () => {
  afterEach(() => {
    localStorage.clear();
    jest.useRealTimers();
  });

  it("keeps the token, stays loading, and checks again", async () => {
    jest.useFakeTimers();
    localStorage.setItem("token", "t1");
    mockGet.mockReset()
      .mockRejectedValueOnce(Object.assign(new Error("Server returned an unexpected response (502)"), { code: "NON_JSON_RESPONSE" }))
      .mockResolvedValueOnce({ id: "u1", email: "a@example.com", role: "investor" });
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await act(async () => {});
    expect(localStorage.getItem("token")).toBe("t1");
    expect(screen.getByText("loading")).toBeInTheDocument();
    await act(async () => {
      jest.advanceTimersByTime(5000);
    });
    expect(screen.getByText("a@example.com t1")).toBeInTheDocument();
  });

  it("signs out on a 401 (the API client has already cleared storage)", async () => {
    localStorage.setItem("token", "t1");
    mockGet.mockReset().mockRejectedValueOnce(Object.assign(new Error("Session expired"), { code: "UNAUTHORIZED" }));
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    expect(await screen.findByText("signed out")).toBeInTheDocument();
  });
});

// Review (ship): an unmounted provider must stop checking, and two quick switches in another tab
// (to another account and straight back) must leave the shown account intact
describe("AuthProvider edges", () => {
  afterEach(() => {
    localStorage.clear();
    jest.useRealTimers();
  });

  it("cancels a pending retry when a newer sign-in arrives from another tab", async () => {
    jest.useFakeTimers();
    localStorage.setItem("token", "t1");
    mockGet.mockReset()
      .mockRejectedValueOnce(Object.assign(new Error("502"), { code: "NON_JSON_RESPONSE" }))
      .mockResolvedValueOnce({ id: "u2", email: "b@example.com", role: "investor" });
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await act(async () => {});
    localStorage.setItem("token", "t2");
    storageEvent("token", "t2");
    await act(async () => {});
    expect(screen.getByText("b@example.com t2")).toBeInTheDocument();
    await act(async () => {
      jest.advanceTimersByTime(10000);
    });
    expect(mockGet).toHaveBeenCalledTimes(2);
  });

  it("stops retrying after unmount", async () => {
    jest.useFakeTimers();
    localStorage.setItem("token", "t1");
    let rejectCheck!: (err: Error) => void;
    mockGet.mockReset().mockImplementationOnce(() => new Promise((_, reject) => { rejectCheck = reject; }));
    const { unmount } = render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    unmount();
    await act(async () => {
      rejectCheck(Object.assign(new Error("Server returned an unexpected response (502)"), { code: "NON_JSON_RESPONSE" }));
    });
    await act(async () => {
      jest.advanceTimersByTime(20000);
    });
    expect(mockGet).toHaveBeenCalledTimes(1);
  });

  // Both events land before React renders (one frame): the shortcut must restore the account
  it("keeps the shown account when another tab switches away and straight back within one frame", async () => {
    const mine = tokenFor("u1", 1);
    localStorage.setItem("token", mine);
    mockGet.mockReset().mockResolvedValueOnce({ id: "u1", email: "a@example.com", role: "investor" });
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    expect(await screen.findByText(`a@example.com ${mine}`)).toBeInTheDocument();
    mockGet.mockImplementationOnce(() => new Promise(() => {}));
    const again = tokenFor("u1", 3);
    act(() => {
      localStorage.setItem("token", tokenFor("u2", 2));
      window.dispatchEvent(new StorageEvent("storage", { key: "token", newValue: "x" }));
      localStorage.setItem("token", again);
      window.dispatchEvent(new StorageEvent("storage", { key: "token", newValue: again }));
    });
    expect(screen.getByText(`a@example.com ${again}`)).toBeInTheDocument();
  });
});
