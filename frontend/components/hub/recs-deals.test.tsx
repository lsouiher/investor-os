import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { I18nProvider } from "@/lib/i18n";

const mockList = jest.fn();
const mockDelete = jest.fn();
jest.mock("@/lib/recs-deals-api", () => ({
  listRecsDeals: (...args: unknown[]) => mockList(...args),
  deleteRecsDeal: (...args: unknown[]) => mockDelete(...args),
}));

import { RecsDeals } from "./recs-deals";

const DEALS = [
  { id: "new", c: "brrrr", name: "Elm St duplex", d: "N4Ig-_x", created_at: "2026-12-05T10:00:00.000Z" },
  { id: "old", c: "multifamily", name: "Oak 12-plex", d: "abc", created_at: "2026-12-01T10:00:00.000Z" },
];

async function renderSection() {
  await act(async () => {
    render(
      <I18nProvider>
        <RecsDeals />
      </I18nProvider>,
    );
  });
}

beforeEach(() => {
  mockList.mockReset();
  mockDelete.mockReset();
  process.env.NEXT_PUBLIC_RECS_URL = "https://recs.example/";
});

afterEach(() => {
  delete process.env.NEXT_PUBLIC_RECS_URL;
});

describe("RecsDeals", () => {
  it("lists the deals newest first with name, calculator and date", async () => {
    mockList.mockResolvedValue(DEALS);
    await renderSection();
    expect(screen.getByRole("heading", { name: "Deals from your calculators" })).toBeInTheDocument();
    const rows = screen.getAllByRole("listitem");
    expect(rows).toHaveLength(2);
    expect(within(rows[0]).getByText("Elm St duplex")).toBeInTheDocument();
    expect(within(rows[0]).getByText("BRRRR")).toBeInTheDocument();
    expect(within(rows[0]).getByText(`Saved ${new Date(DEALS[0].created_at).toLocaleDateString("en")}`)).toBeInTheDocument();
    expect(within(rows[1]).getByText("Oak 12-plex")).toBeInTheDocument();
    expect(within(rows[1]).getByText("Multifamily")).toBeInTheDocument();
  });

  it("links Open in RECS to the calculator with d byte for byte, in a new tab", async () => {
    mockList.mockResolvedValue(DEALS);
    await renderSection();
    const link = within(screen.getAllByRole("listitem")[0]).getByRole("link", { name: "Open in RECS" });
    expect(link.getAttribute("href")).toBe("https://recs.example/calculators/brrrr#d=N4Ig-_x");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("lists the deals without Open in RECS when the RECS address is unset", async () => {
    delete process.env.NEXT_PUBLIC_RECS_URL;
    mockList.mockResolvedValue(DEALS);
    await renderSection();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.queryByRole("link", { name: "Open in RECS" })).not.toBeInTheDocument();
  });

  it("asks to confirm, then deletes and removes the row", async () => {
    mockList.mockResolvedValue(DEALS);
    mockDelete.mockResolvedValue(undefined);
    await renderSection();
    const first = screen.getAllByRole("listitem")[0];
    fireEvent.click(within(first).getByRole("button", { name: "Delete" }));
    expect(mockDelete).not.toHaveBeenCalled();
    expect(within(first).getByText("Delete this deal?")).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(within(first).getByRole("button", { name: "Yes, delete" }));
    });
    expect(mockDelete).toHaveBeenCalledWith("new");
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(screen.queryByText("Elm St duplex")).not.toBeInTheDocument();
  });

  it("keeps the row when the confirmation is declined", async () => {
    mockList.mockResolvedValue(DEALS);
    await renderSection();
    const first = screen.getAllByRole("listitem")[0];
    fireEvent.click(within(first).getByRole("button", { name: "Delete" }));
    fireEvent.click(within(first).getByRole("button", { name: "Keep" }));
    expect(mockDelete).not.toHaveBeenCalled();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("restores the row when the delete fails", async () => {
    mockList.mockResolvedValue(DEALS);
    mockDelete.mockRejectedValue(new Error("500"));
    jest.spyOn(console, "error").mockImplementation(() => {});
    await renderSection();
    const first = screen.getAllByRole("listitem")[0];
    fireEvent.click(within(first).getByRole("button", { name: "Delete" }));
    await act(async () => {
      fireEvent.click(within(first).getByRole("button", { name: "Yes, delete" }));
    });
    const rows = screen.getAllByRole("listitem");
    expect(rows).toHaveLength(2);
    expect(within(rows[0]).getByText("Elm St duplex")).toBeInTheDocument();
  });

  it("shows an empty state pointing to the calculators when the RECS address is set", async () => {
    mockList.mockResolvedValue([]);
    await renderSection();
    expect(screen.getByText("Send a deal from a calculator and it will appear here.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open the calculators" })).toHaveAttribute("href", "https://recs.example/");
  });

  it("renders nothing for an empty list when the RECS address is unset", async () => {
    delete process.env.NEXT_PUBLIC_RECS_URL;
    mockList.mockResolvedValue([]);
    await renderSection();
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });

  it("renders nothing when the list cannot be fetched", async () => {
    mockList.mockRejectedValue(new Error("network"));
    jest.spyOn(console, "error").mockImplementation(() => {});
    await renderSection();
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });
});
