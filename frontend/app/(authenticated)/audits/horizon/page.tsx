"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/i18n";
import AuditFormShell, {
  type AuditSection,
} from "@/components/audit/audit-form-shell";

// Structure only: the questions and answer choices are the `audit.horizon.*` texts in
// locales/en.json and locales/fr.json (key convention in AuditFormShell). Option values are
// the stored codes.
const sections: AuditSection[] = [
  {
    id: "objectives",
    fields: [
      {
        name: "primary_objective", type: "select", required: true,
        options: [
          "cash-flow", "appreciation", "tax-benefits", "retirement", "financial-freedom", "legacy",
          "diversification",
        ],
      },
      {
        name: "secondary_objective", type: "select",
        options: [
          "cash-flow", "appreciation", "tax-benefits", "retirement", "financial-freedom", "legacy",
          "diversification",
        ],
      },
    ],
  },
  {
    id: "financial_targets",
    fields: [
      {
        name: "passive_income_goal", type: "select", required: true,
        options: [
          "under-1000", "1000-3000", "3000-5000", "5000-10000", "10000-25000", "over-25000",
        ],
      },
      {
        name: "net_worth_goal", type: "select",
        options: ["under-250000", "250000-500000", "500000-1m", "1m-5m", "over-5m"],
      },
      {
        name: "property_count_goal", type: "select",
        options: ["1", "2-5", "5-10", "10-25", "over-25", "no-specific"],
      },
      {
        name: "return_expectations", type: "select", required: true,
        options: ["under-5", "5-8", "8-12", "12-20", "over-20"],
      },
    ],
  },
  {
    id: "timeline",
    fields: [
      {
        name: "first_deal_timeline", type: "select", required: true,
        options: ["under-3-months", "3-6-months", "6-12-months", "1-2-years", "over-2-years"],
      },
      {
        name: "financial_freedom_timeline", type: "select", required: true,
        options: [
          "under-3-years", "3-5-years", "5-10-years", "10-20-years", "over-20-years", "not-a-goal",
        ],
      },
      {
        name: "retirement_timeline", type: "select",
        options: ["under-40", "40-50", "50-60", "60-65", "over-65", "no-plan"],
      },
      {
        name: "exit_strategy", type: "select", required: true,
        options: ["hold-forever", "sell-at-peak", "1031-exchange", "sell-at-retirement", "no-plan"],
      },
    ],
  },
  {
    id: "lifestyle",
    fields: [
      {
        name: "relocation_willingness", type: "select",
        options: ["no", "maybe", "yes", "already-flexible"],
      },
      {
        name: "house_hacking", type: "select",
        options: ["yes", "maybe", "no", "already-doing"],
      },
      {
        name: "full_time_re", type: "select", required: true,
        options: ["yes-soon", "yes-eventually", "no", "undecided"],
      },
      {
        name: "family_alignment", type: "select", required: true,
        options: [
          "fully-aligned", "mostly-supportive", "neutral", "skeptical", "opposed", "not-applicable",
        ],
      },
    ],
  },
  {
    id: "constraints",
    fields: [
      {
        name: "geographic_constraints", type: "select", required: true,
        options: ["local-only", "state-only", "regional", "national"],
      },
      {
        name: "property_type_preference", type: "select", required: true,
        options: [
          "single-family", "small-multi", "large-multi", "commercial", "mixed-use", "land", "open",
        ],
      },
      { name: "ethical_constraints", type: "textarea" },
      { name: "deal_breakers", type: "textarea" },
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
  const { t } = useTranslation();
  const [initialData, setInitialData] = useState<Record<string, Record<string, string>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // A dictionary key, so the banner follows a language switch
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
        setError("audit.error.save_failed");
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
        setError("audit.error.complete_failed");
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
          {t(error)}
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
