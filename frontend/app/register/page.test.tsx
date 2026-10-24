/**
 * Value card
 * protects: ?next= wiring on /register (003-recs-import): after registration the user returns
 *   to the allow-listed /import where the RECS deal is held, the sign-in link carries next, and
 *   a non-allow-listed next falls back to /hub (open-redirect guard at the page boundary).
 * fails_when: the page ignores next (deal stranded on /hub), pushes the raw next value (open
 *   redirect), or drops next from the "log in" link.
 * why_new: next-path.test.ts covers safeNextPath alone; nothing rendered the page to prove it
 *   is wired to router.push and the sign-in link. Live QA did this in a browser only.
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

const mockRegister = jest.fn();
jest.mock("@/lib/auth-context", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({ register: mockRegister }),
}));

import RegisterPage from "./page";

beforeEach(() => {
  mockPush.mockReset();
  mockRegister.mockReset().mockResolvedValue(undefined);
  mockSearch = "";
});

async function registerAccount() {
  const { container } = render(
    <I18nProvider>
      <RegisterPage />
    </I18nProvider>,
  );
  fireEvent.change(container.querySelector('input[type="email"]')!, { target: { value: "a@example.com" } });
  for (const input of Array.from(container.querySelectorAll('input[type="password"]'))) {
    fireEvent.change(input, { target: { value: "long-enough-pass" } });
  }
  await act(async () => {
    fireEvent.submit(container.querySelector("form")!);
  });
}

describe("/register ?next", () => {
  it("returns to /import after registration and carries next on the sign-in link", async () => {
    mockSearch = "next=/import";
    await registerAccount();
    expect(mockRegister).toHaveBeenCalledWith("a@example.com", "long-enough-pass");
    expect(mockPush).toHaveBeenCalledWith("/import");
    const loginLinks = document.querySelectorAll('a[href^="/login"]');
    expect(Array.from(loginLinks).map((a) => a.getAttribute("href"))).toEqual(["/login?next=/import"]);
  });

  it.each(["next=//evil.example", "next=https://evil.example", "next=/dashboard", ""])(
    "ignores %p and goes to /hub with a plain sign-in link",
    async (search) => {
      mockSearch = search;
      await registerAccount();
      expect(mockPush).toHaveBeenCalledWith("/hub");
      expect(document.querySelector('a[href^="/login"]')?.getAttribute("href")).toBe("/login");
    },
  );
});
