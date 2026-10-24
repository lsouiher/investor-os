import { act, render, screen } from "@testing-library/react";

const mockGet = jest.fn();
jest.mock("./api-client", () => ({
  api: { get: (...args: unknown[]) => mockGet(...args), post: jest.fn() },
}));

import { AuthProvider, page, useAuth } from "./auth-context";

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

// Another tab signs in, switches account or signs out: this tab reloads, so no page keeps showing
// or acting for the previous account
describe("AuthProvider across tabs", () => {
  let reload: jest.SpyInstance;
  beforeEach(() => {
    mockGet.mockReset();
    reload = jest.spyOn(page, "reload").mockImplementation(() => {});
  });
  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    reload.mockRestore();
  });

  async function signedIn() {
    localStorage.setItem("token", "t1");
    mockGet.mockResolvedValueOnce({ id: "u1", email: "a@example.com", role: "investor" });
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    expect(await screen.findByText("a@example.com t1")).toBeInTheDocument();
  }

  it("reloads when another tab signs in", async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await screen.findByText("signed out");
    localStorage.setItem("token", "t2");
    storageEvent("token", "t2");
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("reloads when another tab switches account", async () => {
    await signedIn();
    localStorage.setItem("token", "t2");
    storageEvent("token", "t2");
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("reloads when another tab clears all of storage (key null)", async () => {
    await signedIn();
    localStorage.clear();
    storageEvent(null, null);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("ignores other keys, and a clear that leaves the token as it was", async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await screen.findByText("signed out");
    storageEvent("locale", "fr");
    storageEvent(null, null);
    expect(reload).not.toHaveBeenCalled();
    expect(mockGet).not.toHaveBeenCalled();
  });

  // Review (adversarial): sessionStorage survives the reload, so a sign-out elsewhere must forget
  // this tab's held RECS deal and signup source first
  it("forgets the held deal and signup source when another tab signs out", async () => {
    sessionStorage.setItem("investoros_recs_import", JSON.stringify({ c: "brrrr", name: "Elm", d: "abc" }));
    sessionStorage.setItem("investoros_signup_source", "recs");
    await signedIn();
    localStorage.removeItem("token");
    storageEvent("token", null);
    expect(sessionStorage.getItem("investoros_recs_import")).toBeNull();
    expect(sessionStorage.getItem("investoros_signup_source")).toBeNull();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("keeps a deal held by a visitor who was never signed in", async () => {
    sessionStorage.setItem("investoros_recs_import", JSON.stringify({ c: "brrrr", name: "Elm", d: "abc" }));
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await screen.findByText("signed out");
    localStorage.setItem("token", "t2");
    storageEvent("token", "t2");
    expect(sessionStorage.getItem("investoros_recs_import")).not.toBeNull();
  });

  // Review (ship): the provider's own /auth/me 401 must not delete a newer token another tab stored
  // before this tab handled its storage event
  it("keeps a newer token stored while the old token's check was failing", async () => {
    localStorage.setItem("token", "old");
    mockGet.mockImplementationOnce(async () => {
      localStorage.setItem("token", "new"); // another tab signs in; its storage event reloads
      throw Object.assign(new Error("Session expired"), { code: "UNAUTHORIZED" });
    });
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await act(async () => {});
    expect(localStorage.getItem("token")).toBe("new");
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

describe("AuthProvider edges", () => {
  afterEach(() => {
    localStorage.clear();
    jest.useRealTimers();
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

  it("stops retrying once this tab signs in with a new token", async () => {
    jest.useFakeTimers();
    localStorage.setItem("token", "t1");
    mockGet.mockReset().mockRejectedValueOnce(Object.assign(new Error("502"), { code: "NON_JSON_RESPONSE" }));
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await act(async () => {});
    localStorage.setItem("token", "fresh");
    await act(async () => {
      jest.advanceTimersByTime(10000);
    });
    expect(mockGet).toHaveBeenCalledTimes(1);
  });
});
