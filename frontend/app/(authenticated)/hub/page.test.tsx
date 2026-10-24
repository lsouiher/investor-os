/**
 * Value card
 * protects: the hub mounts "Deals from your calculators" below the audits with a focusable page
 *   heading (the target when deleting the last deal hides that section), and shows its loading
 *   skeleton, not "log in again", while another tab's sign-in is being checked (token set, user
 *   not loaded yet).
 * fails_when: <RecsDeals /> is unmounted, the h1 loses tabIndex=-1, or the hub treats a pending
 *   cross-tab revalidation as signed out.
 * why_new: recs-deals.test.tsx renders the component alone; nothing rendered the hub page.
 * seam: none (api-client, auth-context and the RECS deals data module mocked at module boundaries)
 * no_claim: audit progress rendering and real network calls.
 */
import { act, render, screen } from "@testing-library/react";
import { I18nProvider } from "@/lib/i18n";

jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn() }) }));

let mockAuth: { user: { email: string } | null; token: string | null; loading: boolean };
jest.mock("@/lib/auth-context", () => ({ useAuth: () => mockAuth }));

const mockGet = jest.fn().mockResolvedValue([]);
jest.mock("@/lib/api-client", () => ({ api: { get: (...args: unknown[]) => mockGet(...args) } }));
jest.mock("@/lib/recs-deals-api", () => ({
  listRecsDeals: jest.fn().mockResolvedValue([
    { id: "d1", c: "brrrr", name: "Elm St duplex", d: "abc", created_at: "2026-10-23T10:00:00.000Z" },
  ]),
  deleteRecsDeal: jest.fn(),
}));

import IdentityHubPage from "./page";

async function renderHub() {
  await act(async () => {
    render(
      <I18nProvider>
        <IdentityHubPage />
      </I18nProvider>,
    );
  });
}

describe("Identity hub", () => {
  it("mounts the deals section and a focusable page heading", async () => {
    mockAuth = { user: { email: "a@example.com" }, token: "t", loading: false };
    await renderHub();
    expect(screen.getByRole("heading", { name: "Deals from your calculators" })).toBeInTheDocument();
    expect(screen.getByText("Elm St duplex")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Identity Hub" })).toHaveAttribute("tabindex", "-1");
  });

  it("waits, rather than asking to log in again, while another tab's sign-in is checked", async () => {
    mockGet.mockClear();
    mockAuth = { user: null, token: "t2", loading: false };
    const { container } = render(
      <I18nProvider>
        <IdentityHubPage />
      </I18nProvider>,
    );
    await act(async () => {});
    expect(screen.queryByText("Unable to load user data. Please log in again.")).not.toBeInTheDocument();
    expect(container.querySelector(".animate-pulse")).not.toBeNull();
    expect(mockGet).not.toHaveBeenCalledWith("/audits");
  });

  it("asks to log in again when there is no session at all", async () => {
    mockAuth = { user: null, token: null, loading: false };
    await renderHub();
    expect(screen.getByText("Unable to load user data. Please log in again.")).toBeInTheDocument();
  });
});
