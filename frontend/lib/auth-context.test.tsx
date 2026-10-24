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
