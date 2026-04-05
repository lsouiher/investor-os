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
    id: "re_experience",
    title: "Real Estate Experience",
    fields: [
      {
        name: "deals_closed",
        label: "Number of RE deals closed",
        type: "select",
        required: true,
        options: [
          { value: "0", label: "None" },
          { value: "1-2", label: "1-2 deals" },
          { value: "3-5", label: "3-5 deals" },
          { value: "6-10", label: "6-10 deals" },
          { value: "over-10", label: "More than 10 deals" },
        ],
      },
      {
        name: "deal_types",
        label: "Types of deals (if any)",
        type: "select",
        options: [
          { value: "none", label: "No experience" },
          { value: "primary-residence", label: "Primary residence only" },
          { value: "single-family-rental", label: "Single family rental" },
          { value: "multi-family", label: "Multi-family" },
          { value: "commercial", label: "Commercial" },
          { value: "flip", label: "Fix and flip" },
          { value: "mixed", label: "Multiple types" },
        ],
      },
      {
        name: "current_holdings",
        label: "Current RE holdings",
        type: "select",
        options: [
          { value: "none", label: "None" },
          { value: "primary-only", label: "Primary residence only" },
          { value: "1-rental", label: "1 rental property" },
          { value: "2-4-rentals", label: "2-4 rental properties" },
          { value: "5-plus", label: "5+ properties" },
        ],
      },
      {
        name: "biggest_success",
        label: "Biggest RE success (if any)",
        type: "textarea",
        placeholder: "Briefly describe your most successful RE experience...",
      },
      {
        name: "biggest_failure",
        label: "Biggest RE lesson / failure (if any)",
        type: "textarea",
        placeholder: "Briefly describe a RE setback or lesson learned...",
      },
    ],
  },
  {
    id: "professional",
    title: "Professional Background",
    fields: [
      {
        name: "profession",
        label: "Current profession / industry",
        type: "text",
        required: true,
        placeholder: "e.g., Software Engineer, Nurse, Sales Manager",
      },
      {
        name: "years_experience",
        label: "Years of professional experience",
        type: "select",
        required: true,
        options: [
          { value: "under-2", label: "Under 2 years" },
          { value: "2-5", label: "2-5 years" },
          { value: "5-10", label: "5-10 years" },
          { value: "10-20", label: "10-20 years" },
          { value: "over-20", label: "Over 20 years" },
        ],
      },
      {
        name: "management_experience",
        label: "Management / leadership experience",
        type: "select",
        required: true,
        options: [
          { value: "none", label: "None" },
          { value: "small-team", label: "Small team (1-5 people)" },
          { value: "medium-team", label: "Medium team (6-20 people)" },
          { value: "large-team", label: "Large team (20+ people)" },
          { value: "executive", label: "Executive / C-level" },
        ],
      },
      {
        name: "negotiation_skill",
        label: "Negotiation skill level",
        type: "select",
        required: true,
        options: [
          { value: "beginner", label: "Beginner" },
          { value: "intermediate", label: "Intermediate" },
          { value: "advanced", label: "Advanced" },
          { value: "expert", label: "Expert (professional negotiator)" },
        ],
      },
      {
        name: "analytical_skill",
        label: "Analytical / financial analysis skill",
        type: "select",
        required: true,
        options: [
          { value: "beginner", label: "Beginner (basic math)" },
          { value: "intermediate", label: "Intermediate (spreadsheets)" },
          { value: "advanced", label: "Advanced (financial modeling)" },
          { value: "expert", label: "Expert (professional analyst)" },
        ],
      },
    ],
  },
  {
    id: "transferable",
    title: "Transferable Skills",
    fields: [
      {
        name: "construction_knowledge",
        label: "Construction / renovation knowledge",
        type: "select",
        options: [
          { value: "none", label: "None" },
          { value: "basic-diy", label: "Basic DIY" },
          { value: "moderate", label: "Moderate (can manage projects)" },
          { value: "professional", label: "Professional level" },
        ],
      },
      {
        name: "sales_marketing",
        label: "Sales / marketing experience",
        type: "select",
        options: [
          { value: "none", label: "None" },
          { value: "some", label: "Some experience" },
          { value: "professional", label: "Professional background" },
        ],
      },
      {
        name: "legal_knowledge",
        label: "Legal / contracts knowledge",
        type: "select",
        options: [
          { value: "none", label: "None" },
          { value: "basic", label: "Basic (can read a contract)" },
          { value: "moderate", label: "Moderate (comfortable negotiating terms)" },
          { value: "professional", label: "Legal professional" },
        ],
      },
      {
        name: "accounting_knowledge",
        label: "Accounting / bookkeeping knowledge",
        type: "select",
        options: [
          { value: "none", label: "None" },
          { value: "basic", label: "Basic (personal finances)" },
          { value: "moderate", label: "Moderate (business bookkeeping)" },
          { value: "professional", label: "Accounting professional" },
        ],
      },
      {
        name: "project_management",
        label: "Project management experience",
        type: "select",
        options: [
          { value: "none", label: "None" },
          { value: "informal", label: "Informal experience" },
          { value: "formal", label: "Formal PM training / certification" },
          { value: "professional", label: "Professional project manager" },
        ],
      },
      {
        name: "technology_comfort",
        label: "Technology comfort level",
        type: "select",
        options: [
          { value: "basic", label: "Basic (email, web browsing)" },
          { value: "moderate", label: "Moderate (spreadsheets, apps)" },
          { value: "advanced", label: "Advanced (automation, data tools)" },
          { value: "expert", label: "Tech professional" },
        ],
      },
    ],
  },
  {
    id: "education",
    title: "RE Education",
    fields: [
      {
        name: "courses_completed",
        label: "RE-related courses / training completed",
        type: "select",
        required: true,
        options: [
          { value: "none", label: "None" },
          { value: "online-courses", label: "Online courses / YouTube" },
          { value: "books-podcasts", label: "Books and podcasts" },
          { value: "formal-course", label: "Formal RE course / bootcamp" },
          { value: "multiple", label: "Multiple courses and programs" },
        ],
      },
      {
        name: "licenses",
        label: "RE-related licenses or certifications",
        type: "select",
        options: [
          { value: "none", label: "None" },
          { value: "re-license", label: "Real estate license" },
          { value: "contractor-license", label: "Contractor license" },
          { value: "other", label: "Other relevant license" },
          { value: "multiple", label: "Multiple licenses" },
        ],
      },
      {
        name: "current_learning",
        label: "Currently learning about",
        type: "text",
        placeholder: "e.g., BRRRR strategy, wholesaling, commercial analysis...",
      },
    ],
  },
  {
    id: "network",
    title: "Network",
    fields: [
      {
        name: "has_agent",
        label: "Do you have a real estate agent?",
        type: "select",
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
          { value: "looking", label: "Looking for one" },
        ],
      },
      {
        name: "has_lender",
        label: "Do you have a lender relationship?",
        type: "select",
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
          { value: "looking", label: "Looking for one" },
        ],
      },
      {
        name: "has_contractor",
        label: "Do you have a trusted contractor?",
        type: "select",
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
          { value: "looking", label: "Looking for one" },
        ],
      },
      {
        name: "has_attorney",
        label: "Do you have a real estate attorney?",
        type: "select",
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
          { value: "looking", label: "Looking for one" },
        ],
      },
      {
        name: "has_cpa",
        label: "Do you have a CPA familiar with RE?",
        type: "select",
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
          { value: "looking", label: "Looking for one" },
        ],
      },
      {
        name: "has_mentor",
        label: "Do you have an RE mentor or experienced investor contact?",
        type: "select",
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
          { value: "looking", label: "Looking for one" },
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

export default function SkillsAuditPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [initialData, setInitialData] = useState<Record<string, Record<string, string>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
        await api.put("/audits/skills", { responses, complete: true });
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
