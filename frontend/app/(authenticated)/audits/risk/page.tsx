"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import AuditFormShell, {
  type AuditSection,
} from "@/components/audit/audit-form-shell";

const sections: AuditSection[] = [
  {
    id: "self_assessment",
    title: "Self-Assessment",
    fields: [
      {
        name: "risk_tolerance_self",
        label: "How would you describe your overall risk tolerance?",
        type: "select",
        required: true,
        options: [
          { value: "very-conservative", label: "Very conservative - preserve capital above all" },
          { value: "conservative", label: "Conservative - some risk for moderate returns" },
          { value: "moderate", label: "Moderate - balanced risk and reward" },
          { value: "aggressive", label: "Aggressive - higher risk for higher returns" },
          { value: "very-aggressive", label: "Very aggressive - maximum growth potential" },
        ],
      },
    ],
  },
  {
    id: "scenarios",
    title: "Scenario-Based Questions",
    fields: [
      {
        name: "vacancy_scenario",
        label: "Your rental is vacant for 3 months. How do you respond?",
        type: "select",
        required: true,
        options: [
          { value: "panic-sell", label: "Panic - consider selling" },
          { value: "stressed-lower-rent", label: "Stressed - significantly lower rent" },
          { value: "concerned-adjust", label: "Concerned - review pricing, make adjustments" },
          { value: "expected-reserves", label: "Expected - use reserves, stay the course" },
          { value: "opportunity", label: "Opportunity - use downtime for improvements" },
        ],
      },
      {
        name: "unexpected_repair",
        label: "You face a $15,000 unexpected repair. How do you handle it?",
        type: "select",
        required: true,
        options: [
          { value: "devastating", label: "Devastating - can't afford it" },
          { value: "major-stress", label: "Major stress - would have to borrow" },
          { value: "uncomfortable", label: "Uncomfortable - doable from savings" },
          { value: "manageable", label: "Manageable - that's what reserves are for" },
          { value: "no-issue", label: "No issue - well-prepared for this" },
        ],
      },
      {
        name: "market_drop",
        label: "Property values drop 20% in your market. What do you do?",
        type: "select",
        required: true,
        options: [
          { value: "sell-immediately", label: "Sell immediately to cut losses" },
          { value: "worried-hold", label: "Very worried but hold" },
          { value: "concerned-hold", label: "Concerned but hold - focus on cash flow" },
          { value: "unfazed", label: "Unfazed - long-term investor" },
          { value: "buy-more", label: "Excited - buy more at a discount" },
        ],
      },
      {
        name: "time_pressure",
        label: "A great deal needs a decision in 48 hours. How do you respond?",
        type: "select",
        required: true,
        options: [
          { value: "pass-always", label: "Always pass - need more time" },
          { value: "uncomfortable", label: "Very uncomfortable but might act" },
          { value: "cautious-analysis", label: "Do rapid analysis, decide if numbers work" },
          { value: "comfortable", label: "Comfortable - have a decision framework ready" },
          { value: "thrive", label: "Thrive under pressure - ready to act fast" },
        ],
      },
      {
        name: "out_of_scope",
        label: "Someone proposes a deal outside your experience. What do you do?",
        type: "select",
        required: true,
        options: [
          { value: "hard-pass", label: "Hard pass - stick to what I know" },
          { value: "unlikely", label: "Unlikely - would need a lot of convincing" },
          { value: "research-first", label: "Research it thoroughly first" },
          { value: "open-with-mentor", label: "Open to it with a mentor's guidance" },
          { value: "excited", label: "Excited to learn something new" },
        ],
      },
    ],
  },
  {
    id: "safety",
    title: "Financial Safety",
    fields: [
      {
        name: "emergency_fund",
        label: "Emergency fund (months of expenses covered)",
        type: "select",
        required: true,
        options: [
          { value: "none", label: "No emergency fund" },
          { value: "under-3", label: "Under 3 months" },
          { value: "3-6", label: "3-6 months" },
          { value: "6-12", label: "6-12 months" },
          { value: "over-12", label: "Over 12 months" },
        ],
      },
      {
        name: "backup_income",
        label: "Do you have backup income sources?",
        type: "select",
        required: true,
        options: [
          { value: "no", label: "No - single income source" },
          { value: "spouse-partner", label: "Yes - spouse/partner income" },
          { value: "side-income", label: "Yes - side income/business" },
          { value: "multiple", label: "Yes - multiple backup sources" },
        ],
      },
      {
        name: "dependents",
        label: "Number of financial dependents",
        type: "select",
        required: true,
        options: [
          { value: "0", label: "None" },
          { value: "1", label: "1" },
          { value: "2-3", label: "2-3" },
          { value: "4-plus", label: "4 or more" },
        ],
      },
      {
        name: "insurance_coverage",
        label: "Insurance coverage level",
        type: "select",
        options: [
          { value: "minimal", label: "Minimal / basic" },
          { value: "moderate", label: "Moderate coverage" },
          { value: "comprehensive", label: "Comprehensive coverage" },
          { value: "unsure", label: "Not sure" },
        ],
      },
    ],
  },
  {
    id: "behavioral",
    title: "Behavioral Indicators",
    fields: [
      {
        name: "stock_market_reaction",
        label: "When the stock market drops 10%, what do you typically do?",
        type: "select",
        required: true,
        options: [
          { value: "sell-everything", label: "Sell everything" },
          { value: "sell-some", label: "Sell some to reduce exposure" },
          { value: "do-nothing", label: "Do nothing - wait it out" },
          { value: "buy-more", label: "Buy more (dollar-cost average)" },
          { value: "no-investments", label: "N/A - no stock investments" },
        ],
      },
      {
        name: "check_frequency",
        label: "How often do you check your investments?",
        type: "select",
        options: [
          { value: "multiple-daily", label: "Multiple times a day" },
          { value: "daily", label: "Daily" },
          { value: "weekly", label: "Weekly" },
          { value: "monthly", label: "Monthly" },
          { value: "quarterly", label: "Quarterly or less" },
        ],
      },
      {
        name: "panic_decisions",
        label: "Have you ever made a financial decision you regretted due to panic?",
        type: "select",
        options: [
          { value: "yes-multiple", label: "Yes, multiple times" },
          { value: "yes-once", label: "Yes, once" },
          { value: "almost", label: "Almost, but caught myself" },
          { value: "no", label: "No, never" },
        ],
      },
    ],
  },
  {
    id: "comfort_zones",
    title: "Comfort Zones",
    fields: [
      {
        name: "leverage_comfort",
        label: "Comfort with using leverage (debt) for investments",
        type: "select",
        required: true,
        options: [
          { value: "no-debt", label: "No debt ever - cash only" },
          { value: "minimal", label: "Minimal leverage (under 50% LTV)" },
          { value: "moderate", label: "Moderate leverage (50-75% LTV)" },
          { value: "aggressive", label: "Aggressive leverage (75-90% LTV)" },
          { value: "maximum", label: "Maximum leverage available" },
        ],
      },
      {
        name: "single_deal_risk",
        label: "Maximum percentage of net worth in a single deal",
        type: "select",
        required: true,
        options: [
          { value: "under-10", label: "Under 10%" },
          { value: "10-25", label: "10-25%" },
          { value: "25-50", label: "25-50%" },
          { value: "50-75", label: "50-75%" },
          { value: "over-75", label: "Over 75% (all-in)" },
        ],
      },
      {
        name: "out_of_state",
        label: "Comfort investing out of state",
        type: "select",
        options: [
          { value: "no", label: "No - local only" },
          { value: "maybe", label: "Maybe - with the right team" },
          { value: "yes", label: "Yes - open to it" },
          { value: "prefer", label: "Prefer out-of-state markets" },
        ],
      },
      {
        name: "partners",
        label: "Comfort working with investment partners",
        type: "select",
        options: [
          { value: "solo-only", label: "Solo only" },
          { value: "family-only", label: "Family / close friends only" },
          { value: "open", label: "Open to partners with aligned goals" },
          { value: "prefer", label: "Prefer partnerships" },
        ],
      },
    ],
  },
];

interface AuditResponse {
  id: string;
  audit_type: string;
  status: string;
  version: number;
  responses: Record<string, Record<string, string>>;
  sub_score: number | null;
  last_saved_at: string;
}

export default function RiskAuditPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [initialData, setInitialData] = useState<Record<string, Record<string, string>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    api
      .get<AuditResponse>("/audits/risk")
      .then((data) => {
        setInitialData(data.responses || {});
      })
      .catch(() => {
        setInitialData({});
      })
      .finally(() => setLoading(false));
  }, [user]);

  const handleSave = useCallback(
    async (responses: Record<string, Record<string, string>>) => {
      setSaving(true);
      setError(null);
      try {
        await api.put("/audits/risk", { responses, complete: false });
      } catch {
        setError("Failed to save progress. Please try again.");
      } finally {
        setSaving(false);
      }
    },
    []
  );

  const handleComplete = useCallback(
    async (responses: Record<string, Record<string, string>>) => {
      setSaving(true);
      setError(null);
      try {
        await api.put("/audits/risk", { responses, complete: true });
        router.push("/hub");
      } catch {
        setError("Failed to complete audit. Make sure all required fields are filled.");
      } finally {
        setSaving(false);
      }
    },
    [router]
  );

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-border rounded w-1/3" />
          <div className="h-2 bg-border rounded w-full" />
          <div className="h-64 bg-surface-subtle rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      {error && (
        <div className="max-w-5xl mx-auto mb-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}
      <AuditFormShell
        auditType="risk"
        sections={sections}
        initialData={initialData}
        onSave={handleSave}
        onComplete={handleComplete}
        saving={saving}
      />
    </div>
  );
}
