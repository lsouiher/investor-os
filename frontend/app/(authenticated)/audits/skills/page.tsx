"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/i18n";
import AuditFormShell, {
  type AuditSection,
} from "@/components/audit/audit-form-shell";

// Structure only: the questions and answer choices are the `audit.skills.*` texts in
// locales/en.json and locales/fr.json (key convention in AuditFormShell). Option values are
// the stored codes.
const sections: AuditSection[] = [
  {
    id: "re_experience",
    fields: [
      {
        name: "deals_closed", type: "select", required: true,
        options: ["0", "1-2", "3-5", "6-10", "over-10"],
      },
      {
        name: "deal_types", type: "select",
        options: [
          "none", "primary-residence", "single-family-rental", "multi-family", "commercial", "flip",
          "mixed",
        ],
      },
      {
        name: "current_holdings", type: "select",
        options: ["none", "primary-only", "1-rental", "2-4-rentals", "5-plus"],
      },
      { name: "biggest_success", type: "textarea" },
      { name: "biggest_failure", type: "textarea" },
    ],
  },
  {
    id: "professional",
    fields: [
      { name: "profession", type: "text", required: true },
      {
        name: "years_experience", type: "select", required: true,
        options: ["under-2", "2-5", "5-10", "10-20", "over-20"],
      },
      {
        name: "management_experience", type: "select", required: true,
        options: ["none", "small-team", "medium-team", "large-team", "executive"],
      },
      {
        name: "negotiation_skill", type: "select", required: true,
        options: ["beginner", "intermediate", "advanced", "expert"],
      },
      {
        name: "analytical_skill", type: "select", required: true,
        options: ["beginner", "intermediate", "advanced", "expert"],
      },
    ],
  },
  {
    id: "transferable",
    fields: [
      {
        name: "construction_knowledge", type: "select",
        options: ["none", "basic-diy", "moderate", "professional"],
      },
      {
        name: "sales_marketing", type: "select",
        options: ["none", "some", "professional"],
      },
      {
        name: "legal_knowledge", type: "select",
        options: ["none", "basic", "moderate", "professional"],
      },
      {
        name: "accounting_knowledge", type: "select",
        options: ["none", "basic", "moderate", "professional"],
      },
      {
        name: "project_management", type: "select",
        options: ["none", "informal", "formal", "professional"],
      },
      {
        name: "technology_comfort", type: "select",
        options: ["basic", "moderate", "advanced", "expert"],
      },
    ],
  },
  {
    id: "education",
    fields: [
      {
        name: "courses_completed", type: "select", required: true,
        options: ["none", "online-courses", "books-podcasts", "formal-course", "multiple"],
      },
      {
        name: "licenses", type: "select",
        options: ["none", "re-license", "contractor-license", "other", "multiple"],
      },
      { name: "current_learning", type: "text" },
    ],
  },
  {
    id: "network",
    fields: [
      {
        name: "has_agent", type: "select",
        options: ["yes", "no", "looking"],
      },
      {
        name: "has_lender", type: "select",
        options: ["yes", "no", "looking"],
      },
      {
        name: "has_contractor", type: "select",
        options: ["yes", "no", "looking"],
      },
      {
        name: "has_attorney", type: "select",
        options: ["yes", "no", "looking"],
      },
      {
        name: "has_cpa", type: "select",
        options: ["yes", "no", "looking"],
      },
      {
        name: "has_mentor", type: "select",
        options: ["yes", "no", "looking"],
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

export default function SkillsAuditPage() {
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
      .get<AuditResponse>("/audits/skills")
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
        await api.put("/audits/skills", { responses, complete: false });
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
        await api.put("/audits/skills", { responses, complete: true });
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
        auditType="skills"
        sections={sections}
        initialData={initialData}
        onSave={handleSave}
        onComplete={handleComplete}
        saving={saving}
      />
    </div>
  );
}
