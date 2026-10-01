"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/i18n";
import AuditFormShell, {
  type AuditSection,
} from "@/components/audit/audit-form-shell";

// Structure only: the questions and answer choices are the `audit.time.*` texts in
// locales/en.json and locales/fr.json (key convention in AuditFormShell). Option values are
// the stored codes.
const sections: AuditSection[] = [
  {
    id: "work",
    fields: [
      {
        name: "work_hours_per_week", type: "select", required: true,
        options: ["under-20", "20-30", "30-40", "40-50", "50-60", "over-60"],
      },
      {
        name: "commute_hours_per_week", type: "select", required: true,
        options: ["0", "under-3", "3-7", "7-10", "over-10"],
      },
      {
        name: "caregiving_hours", type: "select",
        options: ["none", "under-5", "5-15", "15-30", "over-30"],
      },
      {
        name: "side_projects_hours", type: "select",
        options: ["none", "under-5", "5-10", "10-20", "over-20"],
      },
    ],
  },
  {
    id: "availability",
    fields: [
      {
        name: "re_hours_per_week", type: "select", required: true,
        options: ["under-2", "2-5", "5-10", "10-20", "20-30", "over-30"],
      },
      {
        name: "best_times", type: "select",
        options: ["weekday-mornings", "weekday-evenings", "weekends", "flexible"],
      },
    ],
  },
  {
    id: "flexibility",
    fields: [
      {
        name: "calls_during_work", type: "select", required: true,
        options: ["yes", "sometimes", "rarely", "no"],
      },
      {
        name: "weekday_property_visits", type: "select", required: true,
        options: ["yes", "with-notice", "half-days-only", "no"],
      },
      {
        name: "travel_willingness", type: "select",
        options: ["local-only", "regional", "national", "no-travel"],
      },
      {
        name: "seasonal_changes", type: "select",
        options: ["no", "summer-more", "winter-more", "varies"],
      },
    ],
  },
  {
    id: "preferences",
    fields: [
      {
        name: "hands_on_preference", type: "select", required: true,
        options: ["very-hands-on", "moderate", "minimal", "purely-passive"],
      },
      {
        name: "willingness_to_learn", type: "select", required: true,
        options: ["very-willing", "somewhat", "minimal"],
      },
      {
        name: "management_style", type: "select",
        options: ["self-manage", "hybrid", "fully-managed"],
      },
    ],
  },
  {
    id: "runway",
    fields: [
      {
        name: "sustainability", type: "select", required: true,
        options: ["under-3-months", "3-6-months", "6-12-months", "1-3-years", "indefinitely"],
      },
      {
        name: "future_changes", type: "select",
        options: ["no-changes", "more-time", "less-time", "uncertain"],
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

export default function TimeAuditPage() {
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
      .get<AuditResponse>("/audits/time")
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
        await api.put("/audits/time", { responses, complete: false });
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
        await api.put("/audits/time", { responses, complete: true });
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
        auditType="time"
        sections={sections}
        initialData={initialData}
        onSave={handleSave}
        onComplete={handleComplete}
        saving={saving}
      />
    </div>
  );
}
