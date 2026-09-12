import { render, screen } from "@testing-library/react";
import IdentityCard from "./identity-card";

describe("IdentityCard", () => {
  it("renders archetype, readiness score, headline, and sub-scores", async () => {
    render(
      <IdentityCard
        archetype="Cash Flow Hunter"
        readinessScore={72}
        radarData={{ capital: 65, time: 75, skills: 60, risk_tolerance: 80, network: 42, goal_clarity: 78 }}
        headlineInsight="Strong capital, thin network."
        subScores={[
          { label: "Financial", value: 68 },
          { label: "Time", value: 75 },
        ]}
      />
    );
    expect(screen.getByText("Cash Flow Hunter")).toBeInTheDocument();
    // The score ring counts up after mount
    expect(await screen.findByText("72")).toBeInTheDocument();
    expect(screen.getByText("Strong capital, thin network.")).toBeInTheDocument();
    expect(screen.getByText("Financial")).toBeInTheDocument();
    expect(screen.getByText("68")).toBeInTheDocument();
  });
});
