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
  jest.restoreAllMocks(); // console.error spies below must not silence later tests
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

  it("restores only the failed row, not a row deleted successfully in the meantime", async () => {
    mockList.mockResolvedValue(DEALS);
    let rejectFirst!: (err: Error) => void;
    mockDelete
      .mockImplementationOnce(() => new Promise((_, reject) => { rejectFirst = reject; }))
      .mockResolvedValueOnce(undefined);
    jest.spyOn(console, "error").mockImplementation(() => {});
    await renderSection();
    for (const name of ["Elm St duplex", "Oak 12-plex"]) {
      const row = screen.getByText(name).closest("li")!;
      fireEvent.click(within(row).getByRole("button", { name: "Delete" }));
      await act(async () => {
        fireEvent.click(within(row).getByRole("button", { name: "Yes, delete" }));
      });
    }
    await act(async () => {
      rejectFirst(new Error("500"));
    });
    expect(screen.getByText("Elm St duplex")).toBeInTheDocument();
    expect(screen.queryByText("Oak 12-plex")).not.toBeInTheDocument();
  });

  // Review (design): the deleted row unmounts, so focus must not fall back to the page top
  it("moves keyboard focus to the section heading after a delete", async () => {
    mockList.mockResolvedValue(DEALS);
    mockDelete.mockResolvedValue(undefined);
    await renderSection();
    const first = screen.getAllByRole("listitem")[0];
    fireEvent.click(within(first).getByRole("button", { name: "Delete" }));
    await act(async () => {
      fireEvent.click(within(first).getByRole("button", { name: "Yes, delete" }));
    });
    expect(document.activeElement).toBe(screen.getByRole("heading", { name: "Deals from your calculators" }));
  });

  it("keeps focus on the page when deleting the last deal hides the section", async () => {
    delete process.env.NEXT_PUBLIC_RECS_URL;
    mockList.mockResolvedValue([DEALS[0]]);
    mockDelete.mockResolvedValue(undefined);
    await act(async () => {
      render(
        <I18nProvider>
          <h1 tabIndex={-1}>Identity hub</h1>
          <RecsDeals />
        </I18nProvider>,
      );
    });
    const row = screen.getAllByRole("listitem")[0];
    fireEvent.click(within(row).getByRole("button", { name: "Delete" }));
    await act(async () => {
      fireEvent.click(within(row).getByRole("button", { name: "Yes, delete" }));
    });
    expect(screen.queryByRole("heading", { name: "Deals from your calculators" })).not.toBeInTheDocument();
    expect(document.activeElement).toBe(screen.getByRole("heading", { name: "Identity hub" }));
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
