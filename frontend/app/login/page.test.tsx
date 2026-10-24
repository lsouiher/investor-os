/**
 * Value card
 * protects: ?next= wiring on /login (003-recs-import): after sign-in the user returns to the
 *   allow-listed /import where the RECS deal is held, the register link carries next, and a
 *   non-allow-listed next falls back to /dashboard (open-redirect guard at the page boundary).
 * fails_when: the page ignores next (deal stranded on /dashboard), pushes the raw next value
 *   (open redirect), or drops next from the "create account" link.
 * why_new: next-path.test.ts covers safeNextPath alone; nothing rendered the page to prove it
 *   is wired to router.push and the register link. Live QA did this in a browser only.
 * seam: none (next/navigation and auth-context mocked at module boundaries, as page.test.tsx does)
 * no_claim: real Next.js Suspense/static-build behaviour of useSearchParams.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { I18nProvider } from "@/lib/i18n";

const mockPush = jest.fn();
let mockSearch = "";
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(mockSearch),
}));

const mockLogin = jest.fn();
jest.mock("@/lib/auth-context", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({ login: mockLogin }),
}));

import LoginPage from "./page";

beforeEach(() => {
  mockPush.mockReset();
  mockLogin.mockReset().mockResolvedValue(undefined);
  mockSearch = "";
});

async function signIn() {
  render(
    <I18nProvider>
      <LoginPage />
    </I18nProvider>,
  );
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "a@example.com" } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: "secret-pass" } });
  await act(async () => {
    fireEvent.submit(screen.getByLabelText("Email").closest("form")!);
  });
}

describe("/login ?next", () => {
  it("returns to /import after sign-in and carries next on the register link", async () => {
    mockSearch = "next=/import";
    await signIn();
    expect(mockLogin).toHaveBeenCalledWith("a@example.com", "secret-pass");
    expect(mockPush).toHaveBeenCalledWith("/import");
    const registerLinks = document.querySelectorAll('a[href^="/register"]');
    expect(Array.from(registerLinks).map((a) => a.getAttribute("href"))).toEqual(["/register?next=/import"]);
  });

  it.each(["next=//evil.example", "next=https://evil.example", "next=/hub", ""])(
    "ignores %p and goes to /dashboard with a plain register link",
    async (search) => {
      mockSearch = search;
      await signIn();
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
      expect(document.querySelector('a[href^="/register"]')?.getAttribute("href")).toBe("/register");
    },
  );
});
