import { render, screen } from "@testing-library/react";
import { RecsLink } from "./recs-link";

describe("RecsLink", () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_RECS_URL;
  });

  it("renders nothing when NEXT_PUBLIC_RECS_URL is unset", () => {
    const { container } = render(<RecsLink>Calculators</RecsLink>);
    expect(container).toBeEmptyDOMElement();
  });

  it("links to RECS in a new tab when NEXT_PUBLIC_RECS_URL is set", () => {
    process.env.NEXT_PUBLIC_RECS_URL = "https://recs.example.com";
    render(<RecsLink>Calculators</RecsLink>);
    const link = screen.getByRole("link", { name: "Calculators" });
    expect(link).toHaveAttribute("href", "https://recs.example.com");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });
});
