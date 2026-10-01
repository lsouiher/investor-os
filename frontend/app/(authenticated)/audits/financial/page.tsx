"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/i18n";
import AuditFormShell, {
  type AuditSection,
} from "@/components/audit/audit-form-shell";

// Structure only: the questions and answer choices are the `audit.financial.*` texts in
// locales/en.json and locales/fr.json (key convention in AuditFormShell). Option values are
// the stored codes.
const sections: AuditSection[] = [
  {
    id: "income",
    fields: [
      {
        name: "primary_income", type: "select", required: true,
        options: [
          "under-25000", "25000-50000", "50000-75000", "75000-100000", "100000-150000",
          "150000-250000", "250000-500000", "over-500000",
        ],
      },
      {
        name: "secondary_income", type: "select",
        options: ["none", "under-10000", "10000-25000", "25000-50000", "over-50000"],
      },
      {
        name: "income_stability", type: "select", required: true,
        options: [
          "w2", "self-employed-stable", "self-employed-variable", "contract-1099",
          "commission-based", "seasonal",
        ],
      },
      {
        name: "income_trend", type: "select", required: true,
        options: ["growing", "stable", "declining", "volatile"],
      },
    ],
  },
  {
    id: "assets",
    fields: [
      {
        name: "liquid_cash", type: "select", required: true,
        options: [
          "under-5000", "5000-15000", "15000-50000", "50000-100000", "100000-250000", "over-250000",
        ],
      },
      {
        name: "retirement_accounts", type: "select",
        options: [
          "none", "under-25000", "25000-100000", "100000-250000", "250000-500000", "over-500000",
        ],
      },
      {
        name: "existing_re_equity", type: "select",
        options: ["none", "under-50000", "50000-150000", "150000-500000", "over-500000"],
      },
      {
        name: "other_investments", type: "select",
        options: ["none", "under-25000", "25000-100000", "100000-250000", "over-250000"],
      },
      {
        name: "business_equity", type: "select",
        options: ["none", "under-50000", "50000-250000", "over-250000"],
      },
    ],
  },
  {
    id: "liabilities",
    fields: [
      {
        name: "total_monthly_debt", type: "select", required: true,
        options: ["under-500", "500-1000", "1000-2500", "2500-5000", "over-5000"],
      },
      {
        name: "mortgage_rent", type: "select", required: true,
        options: ["under-500", "500-1500", "1500-3000", "3000-5000", "over-5000"],
      },
      {
        name: "student_loans", type: "select",
        options: ["none", "under-25000", "25000-50000", "50000-100000", "over-100000"],
      },
      {
        name: "auto_loans", type: "select",
        options: ["none", "under-10000", "10000-25000", "25000-50000", "over-50000"],
      },
      {
        name: "credit_card_balances", type: "select",
        options: ["none", "under-5000", "5000-15000", "15000-30000", "over-30000"],
      },
    ],
  },
  {
    id: "credit",
    fields: [
      {
        name: "credit_score_range", type: "select", required: true,
        options: ["below-580", "580-669", "670-739", "740-799", "800-plus", "unknown"],
      },
      {
        name: "credit_history_length", type: "select", required: true,
        options: ["under-2", "2-5", "5-10", "over-10"],
      },
      {
        name: "recent_inquiries", type: "select",
        options: ["0", "1-2", "3-5", "over-5"],
      },
    ],
  },
  {
    id: "tax",
    fields: [
      {
        name: "filing_status", type: "select", required: true,
        options: ["single", "married-joint", "married-separate", "head-of-household"],
      },
      {
        name: "effective_tax_rate", type: "select", required: true,
        options: ["under-15", "15-22", "22-32", "32-37", "over-37", "unknown"],
      },
      {
        name: "has_accountant", type: "select", required: true,
        options: ["yes", "no", "planning-to"],
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

export default function FinancialAuditPage() {
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
      .get<AuditResponse>("/audits/financial")
      .then((data) => {
        setInitialData(data.responses || {});
      })
      .catch(() => {
        // No existing audit -- start fresh
        setInitialData({});
      })
      .finally(() => setLoading(false));
  }, [user]);

  const handleSave = useCallback(
    async (responses: Record<string, Record<string, string>>) => {
      setSaving(true);
      setError(null);
      try {
        await api.put("/audits/financial", { responses, complete: false });
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
        await api.put("/audits/financial", { responses, complete: true });
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
        auditType="financial"
        sections={sections}
        initialData={initialData}
        onSave={handleSave}
        onComplete={handleComplete}
        saving={saving}
      />
    </div>
  );
}
