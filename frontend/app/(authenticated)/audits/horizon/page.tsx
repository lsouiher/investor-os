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
    id: "objectives",
    title: "Primary Objectives",
    fields: [
      {
        name: "primary_objective",
        label: "What is your #1 reason for investing in real estate?",
        type: "select",
        required: true,
        options: [
          { value: "cash-flow", label: "Monthly cash flow / passive income" },
          { value: "appreciation", label: "Long-term appreciation / wealth building" },
          { value: "tax-benefits", label: "Tax benefits and deductions" },
          { value: "retirement", label: "Retirement income replacement" },
          { value: "financial-freedom", label: "Financial freedom / quit day job" },
          { value: "legacy", label: "Build a legacy / generational wealth" },
          { value: "diversification", label: "Portfolio diversification" },
        ],
      },
      {
        name: "secondary_objective",
        label: "What is your secondary goal?",
        type: "select",
        options: [
          { value: "cash-flow", label: "Monthly cash flow / passive income" },
          { value: "appreciation", label: "Long-term appreciation / wealth building" },
          { value: "tax-benefits", label: "Tax benefits and deductions" },
          { value: "retirement", label: "Retirement income replacement" },
          { value: "financial-freedom", label: "Financial freedom / quit day job" },
          { value: "legacy", label: "Build a legacy / generational wealth" },
          { value: "diversification", label: "Portfolio diversification" },
        ],
      },
    ],
  },
  {
    id: "financial_targets",
    title: "Financial Targets",
    fields: [
      {
        name: "passive_income_goal",
        label: "Monthly passive income goal from RE",
        type: "select",
        required: true,
        options: [
          { value: "under-1000", label: "Under $1,000/month" },
          { value: "1000-3000", label: "$1,000 - $3,000/month" },
          { value: "3000-5000", label: "$3,000 - $5,000/month" },
          { value: "5000-10000", label: "$5,000 - $10,000/month" },
          { value: "10000-25000", label: "$10,000 - $25,000/month" },
          { value: "over-25000", label: "Over $25,000/month" },
        ],
      },
      {
        name: "net_worth_goal",
        label: "Net worth goal from RE (total equity)",
        type: "select",
        options: [
          { value: "under-250000", label: "Under $250,000" },
          { value: "250000-500000", label: "$250,000 - $500,000" },
          { value: "500000-1m", label: "$500,000 - $1M" },
          { value: "1m-5m", label: "$1M - $5M" },
          { value: "over-5m", label: "Over $5M" },
        ],
      },
      {
        name: "property_count_goal",
        label: "Target number of properties",
        type: "select",
        options: [
          { value: "1", label: "1 property" },
          { value: "2-5", label: "2-5 properties" },
          { value: "5-10", label: "5-10 properties" },
          { value: "10-25", label: "10-25 properties" },
          { value: "over-25", label: "Over 25 properties" },
          { value: "no-specific", label: "No specific target" },
        ],
      },
      {
        name: "return_expectations",
        label: "Expected annual return on investment",
        type: "select",
        required: true,
        options: [
          { value: "under-5", label: "Under 5% (conservative)" },
          { value: "5-8", label: "5-8% (moderate)" },
          { value: "8-12", label: "8-12% (above average)" },
          { value: "12-20", label: "12-20% (aggressive)" },
          { value: "over-20", label: "Over 20% (very aggressive)" },
        ],
      },
    ],
  },
  {
    id: "timeline",
    title: "Timeline",
    fields: [
      {
        name: "first_deal_timeline",
        label: "When do you want to close your first (or next) deal?",
        type: "select",
        required: true,
        options: [
          { value: "under-3-months", label: "Within 3 months" },
          { value: "3-6-months", label: "3-6 months" },
          { value: "6-12-months", label: "6-12 months" },
          { value: "1-2-years", label: "1-2 years" },
          { value: "over-2-years", label: "Over 2 years" },
        ],
      },
      {
        name: "financial_freedom_timeline",
        label: "Timeline to financial freedom through RE",
        type: "select",
        required: true,
        options: [
          { value: "under-3-years", label: "Under 3 years" },
          { value: "3-5-years", label: "3-5 years" },
          { value: "5-10-years", label: "5-10 years" },
          { value: "10-20-years", label: "10-20 years" },
          { value: "over-20-years", label: "Over 20 years" },
          { value: "not-a-goal", label: "Not a specific goal" },
        ],
      },
      {
        name: "retirement_timeline",
        label: "Planned retirement age",
        type: "select",
        options: [
          { value: "under-40", label: "Before 40" },
          { value: "40-50", label: "40-50" },
          { value: "50-60", label: "50-60" },
          { value: "60-65", label: "60-65" },
          { value: "over-65", label: "65+" },
          { value: "no-plan", label: "No specific plan" },
        ],
      },
      {
        name: "exit_strategy",
        label: "Long-term exit strategy preference",
        type: "select",
        required: true,
        options: [
          { value: "hold-forever", label: "Hold forever - pass to heirs" },
          { value: "sell-at-peak", label: "Sell at market peak" },
          { value: "1031-exchange", label: "1031 exchange into larger properties" },
          { value: "sell-at-retirement", label: "Sell at retirement for lump sum" },
          { value: "no-plan", label: "Haven't thought about it yet" },
        ],
      },
    ],
  },
  {
    id: "lifestyle",
    title: "Lifestyle Preferences",
    fields: [
      {
        name: "relocation_willingness",
        label: "Willing to relocate for a better RE market?",
        type: "select",
        options: [
          { value: "no", label: "No - staying where I am" },
          { value: "maybe", label: "Maybe - for the right opportunity" },
          { value: "yes", label: "Yes - open to relocating" },
          { value: "already-flexible", label: "Already location-flexible" },
        ],
      },
      {
        name: "house_hacking",
        label: "Open to house hacking (living in your investment)?",
        type: "select",
        options: [
          { value: "yes", label: "Yes - great way to start" },
          { value: "maybe", label: "Maybe - depends on the property" },
          { value: "no", label: "No - want separate investments" },
          { value: "already-doing", label: "Already doing this" },
        ],
      },
      {
        name: "full_time_re",
        label: "Goal to transition to full-time RE?",
        type: "select",
        required: true,
        options: [
          { value: "yes-soon", label: "Yes - as soon as possible" },
          { value: "yes-eventually", label: "Yes - eventually" },
          { value: "no", label: "No - keep it as a side investment" },
          { value: "undecided", label: "Undecided" },
        ],
      },
      {
        name: "family_alignment",
        label: "Is your family/partner aligned with your RE goals?",
        type: "select",
        required: true,
        options: [
          { value: "fully-aligned", label: "Fully aligned and supportive" },
          { value: "mostly-supportive", label: "Mostly supportive" },
          { value: "neutral", label: "Neutral / indifferent" },
          { value: "skeptical", label: "Skeptical but not opposed" },
          { value: "opposed", label: "Opposed" },
          { value: "not-applicable", label: "Not applicable (single)" },
        ],
      },
    ],
  },
  {
    id: "constraints",
    title: "Constraints",
    fields: [
      {
        name: "geographic_constraints",
        label: "Geographic preferences or constraints",
        type: "select",
        required: true,
        options: [
          { value: "local-only", label: "Local market only" },
          { value: "state-only", label: "Within my state" },
          { value: "regional", label: "Regional (neighboring states)" },
          { value: "national", label: "Open to any US market" },
        ],
      },
      {
        name: "property_type_preference",
        label: "Property type preference",
        type: "select",
        required: true,
        options: [
          { value: "single-family", label: "Single family homes" },
          { value: "small-multi", label: "Small multi-family (2-4 units)" },
          { value: "large-multi", label: "Large multi-family (5+ units)" },
          { value: "commercial", label: "Commercial properties" },
          { value: "mixed-use", label: "Mixed-use" },
          { value: "land", label: "Land / development" },
          { value: "open", label: "Open to anything" },
        ],
      },
      {
        name: "ethical_constraints",
        label: "Any ethical or personal constraints?",
        type: "textarea",
        placeholder: "e.g., no Section 8, no evictions, eco-friendly only, specific neighborhoods to avoid...",
      },
      {
        name: "deal_breakers",
        label: "Absolute deal-breakers",
        type: "textarea",
        placeholder: "e.g., no properties requiring structural work, no flood zones, no HOAs...",
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

export default function HorizonAuditPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [initialData, setInitialData] = useState<Record<string, Record<string, string>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    api
      .get<AuditResponse>("/audits/horizon")
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
        await api.put("/audits/horizon", { responses, complete: false });
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
        await api.put("/audits/horizon", { responses, complete: true });
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
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-2 bg-gray-200 rounded w-full" />
          <div className="h-64 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      {error && (
        <div className="max-w-5xl mx-auto mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}
      <AuditFormShell
        auditType="horizon"
        sections={sections}
        initialData={initialData}
        onSave={handleSave}
        onComplete={handleComplete}
        saving={saving}
      />
    </div>
  );
}
