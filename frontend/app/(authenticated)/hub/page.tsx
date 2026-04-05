"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { getDisclosureMessage } from "@/components/hub/disclosure-messages";

interface AuditSummary {
  id: string;
  audit_type: string;
  status: string;
  version: number;
  sub_score: number | null;
  last_saved_at: string;
  completed_at: string | null;
}

// Recommended order per spec
const AUDIT_ORDER = [
  {
    type: "time",
    name: "Time Audit",
    description: "How much time can you dedicate to real estate? This shapes which strategies fit your life.",
    estimatedMinutes: 3,
  },
  {
    type: "skills",
    name: "Skills & Experience",
    description: "Your professional background, RE experience, and transferable skills determine your readiness.",
    estimatedMinutes: 4,
  },
  {
    type: "horizon",
    name: "Horizon & Goals",
    description: "Define your investment timeline, financial targets, and lifestyle preferences.",
    estimatedMinutes: 3,
  },
  {
    type: "risk",
    name: "Risk Profile",
    description: "Understand your true risk tolerance through scenario-based questions.",
    estimatedMinutes: 4,
  },
  {
    type: "financial",
    name: "Financial Audit",
    description: "Income, assets, liabilities, credit, and tax situation. The most sensitive, so we save it for when you're comfortable.",
    estimatedMinutes: 4,
  },
] as const;

function ScoreBadge({ score }: { score: number }) {
  const colorClass =
    score < 40 ? "text-red-600" : score < 70 ? "text-amber-600" : "text-emerald-600";
  return <span className={`text-sm font-semibold ${colorClass}`}>{score}/100</span>;
}

function StepIcon({ status }: { status: "completed" | "current" | "not_started" }) {
  if (status === "completed") {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
        <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    );
  }
  if (status === "current") {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
        <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </div>
    );
  }
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-subtle">
      <div className="h-2.5 w-2.5 rounded-full bg-foreground-tertiary" />
    </div>
  );
}

export default function IdentityHubPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [audits, setAudits] = useState<AuditSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    api
      .get<AuditSummary[]>("/audits")
      .then((data) => {
        setAudits(data);
      })
      .catch(() => {
        setAudits([]);
      })
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  const auditMap = new Map(audits.map((a) => [a.audit_type, a]));

  const completedCount = AUDIT_ORDER.filter(
    (a) => auditMap.get(a.type)?.status === "completed"
  ).length;

  const progressPercent = (completedCount / 5) * 100;
  const disclosureMessage = getDisclosureMessage(completedCount);

  // Find the first non-completed audit in order -- that's the "recommended next"
  const recommendedIndex = AUDIT_ORDER.findIndex(
    (a) => auditMap.get(a.type)?.status !== "completed"
  );

  function getStepStatus(auditType: string): "completed" | "current" | "not_started" {
    const audit = auditMap.get(auditType);
    if (audit?.status === "completed") return "completed";
    const rec = recommendedIndex >= 0 ? AUDIT_ORDER[recommendedIndex] : null;
    if (rec && rec.type === auditType) return "current";
    if (audit?.status === "in_progress") return "current";
    return "not_started";
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-border-muted rounded w-1/3" />
          <div className="h-4 bg-border-muted rounded w-2/3" />
          <div className="h-2 bg-border-muted rounded w-full" />
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 bg-surface-subtle rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-5xl mx-auto py-12 text-center">
        <p className="text-sm text-foreground-muted">Unable to load user data. Please log in again.</p>
        <button
          onClick={() => router.push("/login")}
          className="mt-3 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground-strong">Identity Hub</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Complete your 5 audits to build your investor identity.
        </p>
      </div>

      {/* Progress bar */}
      <div className="bg-surface-card rounded-lg border border-border p-6 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground-secondary">
            {completedCount} of 5 complete
          </span>
          <span className="text-sm text-foreground-muted">{disclosureMessage}</span>
        </div>
        <div className="w-full bg-border-muted h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-amber-600 h-2.5 transition-all duration-500 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Vertical stepper */}
      <div className="space-y-0">
        {AUDIT_ORDER.map((auditDef, index) => {
          const status = getStepStatus(auditDef.type);
          const audit = auditMap.get(auditDef.type);
          const isRecommended = recommendedIndex === index;
          const isLast = index === AUDIT_ORDER.length - 1;

          return (
            <div key={auditDef.type} className="relative flex gap-4">
              {/* Vertical line connector */}
              <div className="flex flex-col items-center">
                <StepIcon status={status} />
                {!isLast && (
                  <div
                    className={`w-0.5 flex-1 min-h-[24px] ${
                      status === "completed" ? "bg-emerald-200 dark:bg-emerald-800" : "bg-border-muted"
                    }`}
                  />
                )}
              </div>

              {/* Step content */}
              <div className={`flex-1 pb-6 ${isLast ? "pb-0" : ""}`}>
                <div
                  className={`bg-surface-card rounded-lg border p-6 transition-all ${
                    isRecommended
                      ? "border-amber-300 shadow-sm"
                      : "border-border"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-foreground-strong">
                        {auditDef.name}
                      </h3>
                      {status === "completed" && audit?.sub_score != null && (
                        <ScoreBadge score={audit.sub_score} />
                      )}
                      {audit?.status === "in_progress" && (
                        <span className="text-xs bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 px-2 py-0.5 border border-amber-200 dark:border-amber-700">
                          In progress
                        </span>
                      )}
                    </div>

                    {status === "completed" && (
                      <button
                        onClick={() => router.push(`/audits/${auditDef.type}`)}
                        className="text-sm text-foreground-muted hover:text-foreground-secondary underline"
                      >
                        Update
                      </button>
                    )}
                  </div>

                  {/* Expanded content for recommended next audit */}
                  {isRecommended && status !== "completed" && (
                    <div className="mt-3">
                      <p className="text-sm text-foreground-secondary mb-4">
                        {auditDef.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-foreground-tertiary">
                          ~{auditDef.estimatedMinutes} min
                        </span>
                        <button
                          onClick={() => router.push(`/audits/${auditDef.type}`)}
                          className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-none font-medium text-sm"
                        >
                          {audit?.status === "in_progress" ? "Continue" : "Start"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Collapsed content for non-recommended, non-completed */}
                  {!isRecommended && status === "not_started" && (
                    <p className="mt-1 text-xs text-foreground-tertiary">
                      ~{auditDef.estimatedMinutes} min
                    </p>
                  )}

                  {/* In-progress but not the recommended one */}
                  {!isRecommended && audit?.status === "in_progress" && (
                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-sm text-foreground-muted">
                        You have saved progress.
                      </p>
                      <button
                        onClick={() => router.push(`/audits/${auditDef.type}`)}
                        className="text-sm text-amber-600 hover:text-amber-700 font-medium underline"
                      >
                        Continue
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      {completedCount < 5 && (
        <div className="mt-8 text-center">
          <p className="text-sm text-foreground-tertiary">
            Complete all 5 to unlock your Identity Card
          </p>
        </div>
      )}

      {completedCount === 5 && (
        <div className="mt-8 bg-surface-card rounded-lg border border-emerald-200 dark:border-emerald-700 p-6 text-center">
          <div className="inline-flex items-center gap-2 mb-2">
            <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-semibold text-emerald-700 dark:text-emerald-300">All audits complete</span>
          </div>
          <p className="text-sm text-foreground-secondary mb-4">
            Your full investor identity is ready for synthesis.
          </p>
          <button
            onClick={() => router.push("/identity")}
            className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-none font-medium text-sm"
          >
            View Your Identity Card
          </button>
        </div>
      )}
    </div>
  );
}
