"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/i18n";
import AuditFormShell, {
  type AuditSection,
} from "@/components/audit/audit-form-shell";

// Structure only: the questions and answer choices are the `audit.risk.*` texts in
// locales/en.json and locales/fr.json (key convention in AuditFormShell). Option values are
// the stored codes.
const sections: AuditSection[] = [
  {
    id: "self_assessment",
    fields: [
      {
        name: "risk_tolerance_self", type: "select", required: true,
        options: ["very-conservative", "conservative", "moderate", "aggressive", "very-aggressive"],
      },
    ],
  },
  {
    id: "scenarios",
    fields: [
      {
        name: "vacancy_scenario", type: "select", required: true,
        options: [
          "panic-sell", "stressed-lower-rent", "concerned-adjust", "expected-reserves",
          "opportunity",
        ],
      },
      {
        name: "unexpected_repair", type: "select", required: true,
        options: ["devastating", "major-stress", "uncomfortable", "manageable", "no-issue"],
      },
      {
        name: "market_drop", type: "select", required: true,
        options: ["sell-immediately", "worried-hold", "concerned-hold", "unfazed", "buy-more"],
      },
      {
        name: "time_pressure", type: "select", required: true,
        options: ["pass-always", "uncomfortable", "cautious-analysis", "comfortable", "thrive"],
      },
      {
        name: "out_of_scope", type: "select", required: true,
        options: ["hard-pass", "unlikely", "research-first", "open-with-mentor", "excited"],
      },
    ],
  },
  {
    id: "safety",
    fields: [
      {
        name: "emergency_fund", type: "select", required: true,
        options: ["none", "under-3", "3-6", "6-12", "over-12"],
      },
      {
        name: "backup_income", type: "select", required: true,
        options: ["no", "spouse-partner", "side-income", "multiple"],
      },
      {
        name: "dependents", type: "select", required: true,
        options: ["0", "1", "2-3", "4-plus"],
      },
      {
        name: "insurance_coverage", type: "select",
        options: ["minimal", "moderate", "comprehensive", "unsure"],
      },
    ],
  },
  {
    id: "behavioral",
    fields: [
      {
        name: "stock_market_reaction", type: "select", required: true,
        options: ["sell-everything", "sell-some", "do-nothing", "buy-more", "no-investments"],
      },
      {
        name: "check_frequency", type: "select",
        options: ["multiple-daily", "daily", "weekly", "monthly", "quarterly"],
      },
      {
        name: "panic_decisions", type: "select",
        options: ["yes-multiple", "yes-once", "almost", "no"],
      },
    ],
  },
  {
    id: "comfort_zones",
    fields: [
      {
        name: "leverage_comfort", type: "select", required: true,
        options: ["no-debt", "minimal", "moderate", "aggressive", "maximum"],
      },
      {
        name: "single_deal_risk", type: "select", required: true,
        options: ["under-10", "10-25", "25-50", "50-75", "over-75"],
      },
      {
        name: "out_of_state", type: "select",
        options: ["no", "maybe", "yes", "prefer"],
      },
      {
        name: "partners", type: "select",
        options: ["solo-only", "family-only", "open", "prefer"],
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
  const { t } = useTranslation();
  const [initialData, setInitialData] = useState<Record<string, Record<string, string>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // A dictionary key, so the banner follows a language switch
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
        await api.put("/audits/risk", { responses, complete: true });
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
