"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import IdentityCard from "@/components/identity/identity-card";
import { SkeletonCard, SpinnerOverlay } from "@/components/shared/loading-states";
import AiErrorState from "@/components/shared/ai-error-state";
import { toSubScoreList } from "@/lib/identity";

interface IdentityData {
  id: string;
  archetype: string;
  readiness_score: number;
  headline_insight: string;
  radar_data: {
    capital?: number | null;
    time?: number | null;
    skills?: number | null;
    risk_tolerance?: number | null;
    network?: number | null;
    goal_clarity?: number | null;
  };
  sub_scores: Record<string, number>;
}

interface AuditSummary {
  audit_type: string;
  status: string;
}

const REQUIRED_AUDITS = 5;

const REVEAL_KEY = "investoros_identity_revealed";

export default function IdentityPage() {
  const [identity, setIdentity] = useState<IdentityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [synthesizing, setSynthesizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showReveal, setShowReveal] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState<number | null>(null);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [auditsComplete, setAuditsComplete] = useState(false);

  const fetchIdentity = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<IdentityData | null>("/identity");
      setIdentity(data);

      if (data) {
        const wasRevealed = localStorage.getItem(REVEAL_KEY);
        if (!wasRevealed) {
          setShowReveal(true);
          localStorage.setItem(REVEAL_KEY, "true");
        }
      }
    } catch (err: unknown) {
      const apiErr = err as { code?: string };
      if (apiErr?.code === "NOT_FOUND") {
        // No identity yet. If all audits are done, synthesis is the missing step —
        // offer it here instead of sending the user back to the hub in a loop.
        setIdentity(null);
        try {
          const audits = await api.get<AuditSummary[]>("/audits");
          setAuditsComplete(audits.filter((a) => a.status === "completed").length >= REQUIRED_AUDITS);
        } catch {
          setAuditsComplete(false);
        }
      } else {
        setError("Failed to load identity data.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIdentity();
  }, [fetchIdentity]);

  const handleSynthesize = async () => {
    try {
      setSynthesizing(true);
      setError(null);
      const data = await api.post<IdentityData>("/identity/synthesize");
      setIdentity(data);
      setShowReveal(true);
      localStorage.setItem(REVEAL_KEY, "true");
      setFeedbackRating(null);
      setFeedbackSubmitted(false);
    } catch {
      setError("Synthesis failed. Please try again.");
    } finally {
      setSynthesizing(false);
    }
  };

  const handleFeedback = async (rating: number) => {
    if (!identity) return;
    setFeedbackRating(rating);
    try {
      await api.put(`/identity/${identity.id}/rate`, { rating });
      setFeedbackSubmitted(true);
    } catch {
      // Silent fail for feedback
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <SkeletonCard lines={4} />
        <SkeletonCard lines={2} />
      </div>
    );
  }

  if (error && !identity) {
    return (
      <div className="mx-auto max-w-5xl">
        <AiErrorState severity="medium" message={error} onRetry={fetchIdentity} />
      </div>
    );
  }

  if (!identity) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        {synthesizing && <SpinnerOverlay label="Synthesizing your identity..." />}
        {error && (
          <AiErrorState severity="medium" message={error} onRetry={handleSynthesize} />
        )}
        <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-surface-card px-6 py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950">
            <svg
              className="h-7 w-7 text-amber-600 dark:text-amber-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <circle cx="12" cy="8" r="5" />
              <path strokeLinecap="round" d="M20 21a8 8 0 0 0-16 0" />
            </svg>
          </div>
          <h2 className="mb-2 text-lg font-semibold text-foreground-strong">
            Your Identity Card Awaits
          </h2>
          {auditsComplete ? (
            <>
              <p className="mb-6 max-w-sm text-sm text-foreground-muted">
                All 5 audits are complete. Synthesize your Investor Identity to reveal your archetype and readiness score.
              </p>
              <button
                onClick={handleSynthesize}
                disabled={synthesizing}
                className="rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
              >
                Synthesize My Identity
              </button>
            </>
          ) : (
            <>
              <p className="mb-6 max-w-sm text-sm text-foreground-muted">
                Complete all 5 audits to see your Investor Identity Card.
              </p>
              <Link
                href="/hub"
                className="rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-700"
              >
                Go to Identity Hub
              </Link>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {synthesizing && <SpinnerOverlay label="Synthesizing your identity..." />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground-strong">Investor Identity</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Your AI-synthesized investor profile
          </p>
        </div>
        <button
          onClick={handleSynthesize}
          disabled={synthesizing}
          className="rounded-lg border border-amber-600 px-4 py-2 text-sm font-medium text-amber-600 dark:text-amber-400 transition-colors hover:bg-amber-50 dark:hover:bg-amber-950 disabled:opacity-50"
        >
          Re-Synthesize
        </button>
      </div>

      {error && (
        <AiErrorState severity="medium" message={error} onRetry={handleSynthesize} />
      )}

      {/* Card with optional reveal animation */}
      <div className={showReveal ? "animate-card-reveal" : ""}>
        <IdentityCard
          archetype={identity.archetype}
          readinessScore={identity.readiness_score}
          radarData={identity.radar_data}
          headlineInsight={identity.headline_insight}
          subScores={toSubScoreList(identity.sub_scores)}
        />
      </div>

      {/* Feedback prompt */}
      {identity && !feedbackSubmitted && (
        <div className="rounded-lg border border-border bg-surface-card p-6 text-center">
          <p className="mb-3 text-sm font-medium text-foreground-secondary">
            How well does this identity reflect you?
          </p>
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => handleFeedback(n)}
                className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-medium transition-colors ${
                  feedbackRating === n
                    ? "border-amber-600 bg-amber-600 text-white"
                    : "border-border text-foreground-secondary hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-foreground-tertiary">1 = Not at all, 5 = Perfectly</p>
        </div>
      )}

      {feedbackSubmitted && (
        <p className="text-center text-sm text-foreground-muted">
          Thanks for your feedback!
        </p>
      )}

      <div className="flex justify-center">
        <Link
          href="/identity/history"
          className="text-sm font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700"
        >
          View Identity History
        </Link>
      </div>

      {/* CSS keyframes for card flip reveal */}
      <style jsx global>{`
        @keyframes cardReveal {
          0% {
            transform: perspective(1000px) rotateY(90deg);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: perspective(1000px) rotateY(0deg);
            opacity: 1;
          }
        }
        .animate-card-reveal {
          animation: cardReveal 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
