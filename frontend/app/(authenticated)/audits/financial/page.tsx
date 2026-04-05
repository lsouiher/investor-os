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
    id: "income",
    title: "Income",
    fields: [
      {
        name: "primary_income",
        label: "Primary Annual Income",
        type: "select",
        required: true,
        options: [
          { value: "under-25000", label: "Under $25,000" },
          { value: "25000-50000", label: "$25,000 - $50,000" },
          { value: "50000-75000", label: "$50,000 - $75,000" },
          { value: "75000-100000", label: "$75,000 - $100,000" },
          { value: "100000-150000", label: "$100,000 - $150,000" },
          { value: "150000-250000", label: "$150,000 - $250,000" },
          { value: "250000-500000", label: "$250,000 - $500,000" },
          { value: "over-500000", label: "Over $500,000" },
        ],
      },
      {
        name: "secondary_income",
        label: "Secondary / Side Income (Annual)",
        type: "select",
        options: [
          { value: "none", label: "None" },
          { value: "under-10000", label: "Under $10,000" },
          { value: "10000-25000", label: "$10,000 - $25,000" },
          { value: "25000-50000", label: "$25,000 - $50,000" },
          { value: "over-50000", label: "Over $50,000" },
        ],
      },
      {
        name: "income_stability",
        label: "Income Stability",
        type: "select",
        required: true,
        options: [
          { value: "w2", label: "W-2 Employee (stable)" },
          { value: "self-employed-stable", label: "Self-employed (stable)" },
          { value: "self-employed-variable", label: "Self-employed (variable)" },
          { value: "contract-1099", label: "Contract / 1099" },
          { value: "commission-based", label: "Commission-based" },
          { value: "seasonal", label: "Seasonal" },
        ],
      },
      {
        name: "income_trend",
        label: "Income Trend (last 2 years)",
        type: "select",
        required: true,
        options: [
          { value: "growing", label: "Growing significantly" },
          { value: "stable", label: "Stable" },
          { value: "declining", label: "Declining" },
          { value: "volatile", label: "Volatile / unpredictable" },
        ],
      },
    ],
  },
  {
    id: "assets",
    title: "Assets",
    fields: [
      {
        name: "liquid_cash",
        label: "Liquid Cash (savings, checking)",
        type: "select",
        required: true,
        options: [
          { value: "under-5000", label: "Under $5,000" },
          { value: "5000-15000", label: "$5,000 - $15,000" },
          { value: "15000-50000", label: "$15,000 - $50,000" },
          { value: "50000-100000", label: "$50,000 - $100,000" },
          { value: "100000-250000", label: "$100,000 - $250,000" },
          { value: "over-250000", label: "Over $250,000" },
        ],
      },
      {
        name: "retirement_accounts",
        label: "Retirement Accounts (401k, IRA, etc.)",
        type: "select",
        options: [
          { value: "none", label: "None" },
          { value: "under-25000", label: "Under $25,000" },
          { value: "25000-100000", label: "$25,000 - $100,000" },
          { value: "100000-250000", label: "$100,000 - $250,000" },
          { value: "250000-500000", label: "$250,000 - $500,000" },
          { value: "over-500000", label: "Over $500,000" },
        ],
      },
      {
        name: "existing_re_equity",
        label: "Existing Real Estate Equity",
        type: "select",
        options: [
          { value: "none", label: "None" },
          { value: "under-50000", label: "Under $50,000" },
          { value: "50000-150000", label: "$50,000 - $150,000" },
          { value: "150000-500000", label: "$150,000 - $500,000" },
          { value: "over-500000", label: "Over $500,000" },
        ],
      },
      {
        name: "other_investments",
        label: "Other Investments (stocks, bonds, crypto)",
        type: "select",
        options: [
          { value: "none", label: "None" },
          { value: "under-25000", label: "Under $25,000" },
          { value: "25000-100000", label: "$25,000 - $100,000" },
          { value: "100000-250000", label: "$100,000 - $250,000" },
          { value: "over-250000", label: "Over $250,000" },
        ],
      },
      {
        name: "business_equity",
        label: "Business Equity",
        type: "select",
        options: [
          { value: "none", label: "None / Not applicable" },
          { value: "under-50000", label: "Under $50,000" },
          { value: "50000-250000", label: "$50,000 - $250,000" },
          { value: "over-250000", label: "Over $250,000" },
        ],
      },
    ],
  },
  {
    id: "liabilities",
    title: "Liabilities",
    fields: [
      {
        name: "total_monthly_debt",
        label: "Total Monthly Debt Payments",
        type: "select",
        required: true,
        options: [
          { value: "under-500", label: "Under $500" },
          { value: "500-1000", label: "$500 - $1,000" },
          { value: "1000-2500", label: "$1,000 - $2,500" },
          { value: "2500-5000", label: "$2,500 - $5,000" },
          { value: "over-5000", label: "Over $5,000" },
        ],
      },
      {
        name: "mortgage_rent",
        label: "Monthly Mortgage / Rent",
        type: "select",
        required: true,
        options: [
          { value: "under-500", label: "Under $500" },
          { value: "500-1500", label: "$500 - $1,500" },
          { value: "1500-3000", label: "$1,500 - $3,000" },
          { value: "3000-5000", label: "$3,000 - $5,000" },
          { value: "over-5000", label: "Over $5,000" },
        ],
      },
      {
        name: "student_loans",
        label: "Student Loan Balance",
        type: "select",
        options: [
          { value: "none", label: "None" },
          { value: "under-25000", label: "Under $25,000" },
          { value: "25000-50000", label: "$25,000 - $50,000" },
          { value: "50000-100000", label: "$50,000 - $100,000" },
          { value: "over-100000", label: "Over $100,000" },
        ],
      },
      {
        name: "auto_loans",
        label: "Auto Loan Balance",
        type: "select",
        options: [
          { value: "none", label: "None" },
          { value: "under-10000", label: "Under $10,000" },
          { value: "10000-25000", label: "$10,000 - $25,000" },
          { value: "25000-50000", label: "$25,000 - $50,000" },
          { value: "over-50000", label: "Over $50,000" },
        ],
      },
      {
        name: "credit_card_balances",
        label: "Credit Card Balances",
        type: "select",
        options: [
          { value: "none", label: "None / paid in full monthly" },
          { value: "under-5000", label: "Under $5,000" },
          { value: "5000-15000", label: "$5,000 - $15,000" },
          { value: "15000-30000", label: "$15,000 - $30,000" },
          { value: "over-30000", label: "Over $30,000" },
        ],
      },
    ],
  },
  {
    id: "credit",
    title: "Credit",
    fields: [
      {
        name: "credit_score_range",
        label: "Credit Score Range",
        type: "select",
        required: true,
        options: [
          { value: "below-580", label: "Below 580 (Poor)" },
          { value: "580-669", label: "580-669 (Fair)" },
          { value: "670-739", label: "670-739 (Good)" },
          { value: "740-799", label: "740-799 (Very Good)" },
          { value: "800-plus", label: "800+ (Excellent)" },
          { value: "unknown", label: "I don't know" },
        ],
      },
      {
        name: "credit_history_length",
        label: "Credit History Length",
        type: "select",
        required: true,
        options: [
          { value: "under-2", label: "Under 2 years" },
          { value: "2-5", label: "2-5 years" },
          { value: "5-10", label: "5-10 years" },
          { value: "over-10", label: "Over 10 years" },
        ],
      },
      {
        name: "recent_inquiries",
        label: "Recent Hard Inquiries (last 12 months)",
        type: "select",
        options: [
          { value: "0", label: "None" },
          { value: "1-2", label: "1-2" },
          { value: "3-5", label: "3-5" },
          { value: "over-5", label: "More than 5" },
        ],
      },
    ],
  },
  {
    id: "tax",
    title: "Tax",
    fields: [
      {
        name: "filing_status",
        label: "Filing Status",
        type: "select",
        required: true,
        options: [
          { value: "single", label: "Single" },
          { value: "married-joint", label: "Married Filing Jointly" },
          { value: "married-separate", label: "Married Filing Separately" },
          { value: "head-of-household", label: "Head of Household" },
        ],
      },
      {
        name: "effective_tax_rate",
        label: "Estimated Effective Tax Rate",
        type: "select",
        required: true,
        options: [
          { value: "under-15", label: "Under 15%" },
          { value: "15-22", label: "15% - 22%" },
          { value: "22-32", label: "22% - 32%" },
          { value: "32-37", label: "32% - 37%" },
          { value: "over-37", label: "Over 37%" },
          { value: "unknown", label: "Not sure" },
        ],
      },
      {
        name: "has_accountant",
        label: "Do you work with a CPA or tax professional?",
        type: "select",
        required: true,
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
          { value: "planning-to", label: "Planning to" },
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

export default function FinancialAuditPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [initialData, setInitialData] = useState<Record<string, Record<string, string>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
        await api.put("/audits/financial", { responses, complete: true });
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
