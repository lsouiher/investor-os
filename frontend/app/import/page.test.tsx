import { act, fireEvent, render, screen } from "@testing-library/react";
import { I18nProvider } from "@/lib/i18n";
import { takeSignupSource } from "@/lib/signup-source";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ push: mockPush }) }));

let mockAuth: { user: { email: string } | null; loading: boolean } = { user: null, loading: false };
jest.mock("@/lib/auth-context", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => mockAuth,
}));

const mockSave = jest.fn();
jest.mock("@/lib/recs-deals-api", () => ({
  saveRecsDeal: (...args: unknown[]) => mockSave(...args),
}));

import ImportPage from "./page";

const PAYLOAD = "N4IgLgpgdg5g_-";
const HASH = `#c=multifamily&n=${encodeURIComponent("Elm St & Co #12")}&d=${PAYLOAD}`;
const SIGNED_IN = { user: { email: "investor@example.com" }, loading: false };

function arrive(hash: string, search = "") {
  window.history.replaceState(null, "", `/import${search}${hash}`);
}

function renderPage() {
  return render(
    <I18nProvider>
      <ImportPage />
    </I18nProvider>,
  );
}

let replaceSpy: jest.SpyInstance;

beforeEach(() => {
  mockPush.mockReset();
  mockSave.mockReset();
  mockAuth = { user: null, loading: false };
  sessionStorage.clear();
  arrive("");
  replaceSpy = jest.spyOn(window.history, "replaceState");
});

afterEach(() => replaceSpy.mockRestore());

describe("/import, signed in", () => {
  beforeEach(() => {
    mockAuth = SIGNED_IN;
  });

  it("shows the name and calculator label, never the payload", () => {
    arrive(HASH);
    const { container } = renderPage();
    expect(screen.getByText("Elm St & Co #12")).toBeInTheDocument();
    expect(screen.getByText("From Multifamily")).toBeInTheDocument();
    expect(screen.getByText("Saving to investor@example.com")).toBeInTheDocument();
    expect(container.textContent).not.toContain(PAYLOAD);
  });

  it("removes the fragment and query from the address bar", () => {
    arrive(HASH, "?ref=recs");
    renderPage();
    expect(replaceSpy).toHaveBeenCalledWith(null, "", "/import");
    expect(window.location.hash).toBe("");
    expect(window.location.search).toBe("");
  });

  it("saves exactly what was sent, then shows the saved state and empties the stash", async () => {
    mockSave.mockResolvedValue({ id: "pub1" });
    arrive(HASH);
    renderPage();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Save deal" }));
    });
    expect(mockSave).toHaveBeenCalledTimes(1);
    expect(mockSave).toHaveBeenCalledWith({ c: "multifamily", name: "Elm St & Co #12", d: PAYLOAD });
    expect(screen.getByText("Saved. You'll find it in your hub.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to your hub" })).toHaveAttribute("href", "/hub");
    expect(sessionStorage.getItem("investoros_recs_import")).toBeNull();
  });

  it("cancel posts nothing, clears the stash and goes to the hub", () => {
    arrive(HASH);
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(mockSave).not.toHaveBeenCalled();
    expect(sessionStorage.getItem("investoros_recs_import")).toBeNull();
    expect(mockPush).toHaveBeenCalledWith("/hub");
  });

  it("still offers Save after a reload (empty hash, stash present)", () => {
    arrive(HASH);
    renderPage().unmount();
    arrive("");
    renderPage();
    expect(screen.getByText("Elm St & Co #12")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save deal" })).toBeInTheDocument();
  });

  it("keeps the stash and shows an error when the server refuses", async () => {
    mockSave.mockRejectedValue(new Error("400"));
    arrive(HASH);
    renderPage();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Save deal" }));
    });
    expect(screen.getByText("We couldn't save this deal. Please try again.")).toBeInTheDocument();
    expect(sessionStorage.getItem("investoros_recs_import")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Save deal" })).toBeEnabled();
  });
});

describe("/import, signed out", () => {
  it("shows the deal with sign-in and register links that carry next", () => {
    arrive(HASH);
    renderPage();
    expect(screen.getByText("Elm St & Co #12")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in to save" })).toHaveAttribute("href", "/login?next=/import");
    expect(screen.getByRole("link", { name: "Create an account" })).toHaveAttribute("href", "/register?next=/import");
    expect(screen.queryByRole("button", { name: "Save deal" })).not.toBeInTheDocument();
    expect(mockSave).not.toHaveBeenCalled();
  });

  it("keeps the deal across the trip through /login (unmount, remount without hash)", () => {
    arrive(HASH);
    renderPage().unmount();
    arrive("");
    mockAuth = SIGNED_IN;
    renderPage();
    expect(screen.getByText("Elm St & Co #12")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save deal" })).toBeInTheDocument();
  });

  it("records ?ref=recs as the signup source", () => {
    arrive(HASH, "?ref=recs");
    renderPage();
    expect(takeSignupSource()).toBe("recs");
  });

  it("switches to the signed-in view when auth changes without a remount", () => {
    arrive(HASH);
    const { rerender } = renderPage();
    expect(screen.queryByRole("button", { name: "Save deal" })).not.toBeInTheDocument();
    mockAuth = SIGNED_IN;
    rerender(
      <I18nProvider>
        <ImportPage />
      </I18nProvider>,
    );
    expect(screen.getByRole("button", { name: "Save deal" })).toBeInTheDocument();
  });

  it("renders nothing while auth is loading", () => {
    mockAuth = { user: null, loading: true };
    arrive(HASH);
    renderPage();
    expect(screen.queryByText("Elm St & Co #12")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Sign in to save" })).not.toBeInTheDocument();
  });
});

describe("/import, nothing to import", () => {
  it.each(["", "#c=nope&n=x&d=a", "#c=brrrr&n=x&d=a+b", `#c=brrrr&n=${"a".repeat(121)}&d=a`])(
    "shows nothing to import for %p and never posts",
    (hash) => {
      arrive(hash);
      renderPage();
      expect(screen.getByText("Nothing to import")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Go to the home page" })).toHaveAttribute("href", "/");
      expect(mockSave).not.toHaveBeenCalled();
    },
  );

  it("links to the hub when signed in", () => {
    mockAuth = SIGNED_IN;
    renderPage();
    expect(screen.getByRole("link", { name: "Go to your hub" })).toHaveAttribute("href", "/hub");
  });

  it("does not let an invalid fragment overwrite a valid stash", () => {
    arrive(HASH);
    renderPage().unmount();
    arrive("#c=nope&n=x&d=a");
    renderPage();
    expect(screen.getByText("Elm St & Co #12")).toBeInTheDocument();
  });
});
