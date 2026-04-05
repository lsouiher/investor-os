"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api-client";
import RadarChart, { type RadarData } from "@/components/identity/radar-chart";
import { SkeletonCard, SpinnerOverlay } from "@/components/shared/loading-states";
import AiErrorState from "@/components/shared/ai-error-state";
import { useTranslation } from "@/lib/i18n";

interface SimulationConfig {
  remaining_simulations: number;
  variables: {
    key: string;
    label: string;
    min: number;
    max: number;
    step: number;
    current: number;
  }[];
  current_identity: {
    archetype: string;
    readiness_score: number;
    radar_data: RadarData;
  };
}

// POST /api/v1/simulations response (snake_case per contracts/api-v1.md)
interface SimulationResponse {
  id: string;
  remaining: number;
  delta: {
    original: { archetype: string; readiness_score: number; sub_scores: Record<string, number>; radar_data: RadarData };
    simulated: {
      archetype: string;
      readiness_score: number;
      sub_scores: Record<string, number>;
      radar_data: RadarData;
      headline_insight: string;
      strategy_changes: string;
    };
    score_delta: number;
    archetype_changed: boolean;
  };
}

// View model derived from the response
interface SimulationResult {
  archetype: string;
  readiness_score: number;
  radar_data: RadarData;
  changes: { label: string; from: number; to: number; delta: number }[];
  insight: string;
}

const SUB_SCORE_LABELS: Record<string, string> = {
  financial: "Financial",
  time: "Time",
  skills: "Skills",
  risk: "Risk",
  horizon: "Horizon",
};

function toResult(res: SimulationResponse): SimulationResult {
  const { original, simulated } = res.delta;
  const changes = Object.keys(SUB_SCORE_LABELS)
    .filter((k) => original.sub_scores?.[k] !== undefined || simulated.sub_scores?.[k] !== undefined)
    .map((k) => {
      const from = Number(original.sub_scores?.[k] ?? 0);
      const to = Number(simulated.sub_scores?.[k] ?? from);
      return { label: SUB_SCORE_LABELS[k], from, to, delta: to - from };
    });
  changes.unshift({
    label: "Readiness",
    from: original.readiness_score,
    to: simulated.readiness_score,
    delta: res.delta.score_delta,
  });
  const insight = [
    simulated.headline_insight,
    simulated.strategy_changes ? `Strategies: ${simulated.strategy_changes}` : "",
  ]
    .filter(Boolean)
    .join(" ");
  return {
    archetype: simulated.archetype,
    readiness_score: simulated.readiness_score,
    radar_data: Object.keys(simulated.radar_data ?? {}).length ? simulated.radar_data : original.radar_data,
    changes,
    insight,
  };
}

function scoreColorClass(score: number): string {
  if (score < 40) return "text-red-600";
  if (score < 70) return "text-amber-600";
  return "text-emerald-600";
}

export default function SimulationPage() {
  const { t } = useTranslation();
  const [config, setConfig] = useState<SimulationConfig | null>(null);
  const [sliderValues, setSliderValues] = useState<Record<string, number>>({});
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<SimulationConfig>("/simulations/config");
      setConfig(data);
      const initial: Record<string, number> = {};
      data.variables.forEach((v) => {
        initial[v.key] = v.current;
      });
      setSliderValues(initial);
    } catch (err: unknown) {
      const apiErr = err as { code?: string };
      if (apiErr?.code === "NOT_FOUND" || apiErr?.code === "NON_JSON_RESPONSE") {
        setConfig(null);
      } else {
        setError(t("simulation.error.load_failed"));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleSliderChange = (key: string, value: number) => {
    setSliderValues((prev) => ({ ...prev, [key]: value }));
  };

  const runSimulation = async () => {
    if (!config || config.remaining_simulations <= 0) return;
    try {
      setSimulating(true);
      setError(null);
      // Only send sliders the user actually moved
      const modified: Record<string, number> = {};
      config.variables.forEach((v) => {
        const value = sliderValues[v.key];
        if (value !== undefined && value !== v.current) modified[v.key] = value;
      });
      if (Object.keys(modified).length === 0) {
        setError(t("simulation.error.no_change"));
        return;
      }
      const data = await api.post<SimulationResponse>("/simulations", {
        modified_parameters: modified,
      });
      setResult(toResult(data));
      setConfig((prev) =>
        prev ? { ...prev, remaining_simulations: data.remaining } : prev
      );
    } catch (err: unknown) {
      const apiErr = err as { code?: string; message?: string };
      setError(
        apiErr?.code === "RATE_LIMITED"
          ? t("simulation.error.rate_limited")
          : t("simulation.error.failed")
      );
    } finally {
      setSimulating(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <SkeletonCard lines={4} />
      </div>
    );
  }

  if (error && !config) {
    return (
      <div className="mx-auto max-w-5xl">
        <AiErrorState severity="medium" message={error} onRetry={fetchConfig} />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-surface-card px-6 py-16 text-center">
          <h2 className="mb-2 text-lg font-semibold text-foreground-strong">
            {t("simulation.empty.title")}
          </h2>
          <p className="mb-6 max-w-sm text-sm text-foreground-muted">
            {t("simulation.empty.description")}
          </p>
          <a
            href="/hub"
            className="rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-700"
          >
            {t("simulation.goto_hub")}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {simulating && <SpinnerOverlay label={t("simulation.running")} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground-strong">{t("simulation.title")}</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            {t("simulation.subtitle")}
          </p>
        </div>
        <div className="text-right">
          <span className="text-sm text-foreground-muted">{t("simulation.remaining")}</span>
          <p className="text-2xl font-bold text-amber-600">
            {config.remaining_simulations}
          </p>
        </div>
      </div>

      {error && <AiErrorState severity="low" message={error} />}

      {/* Split screen layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Current identity */}
        <div className="rounded-lg border border-border bg-surface-card p-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground-tertiary">
            {t("simulation.current")}
          </h3>
          <p className="mb-1 text-lg font-bold text-foreground-strong">
            {config.current_identity.archetype}
          </p>
          <p className={`mb-4 text-3xl font-bold ${scoreColorClass(config.current_identity.readiness_score)}`}>
            {config.current_identity.readiness_score}
          </p>
          <RadarChart data={config.current_identity.radar_data} size={200} />
        </div>

        {/* Center: Sliders */}
        <div className="rounded-lg border border-border bg-surface-card p-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground-tertiary">
            {t("simulation.adjust")}
          </h3>
          <div className="space-y-5">
            {config.variables.map((variable) => (
              <div key={variable.key}>
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground-secondary">
                    {variable.label}
                  </label>
                  <span className="text-sm font-bold text-amber-600">
                    {sliderValues[variable.key] ?? variable.current}
                  </span>
                </div>
                <input
                  type="range"
                  min={variable.min}
                  max={variable.max}
                  step={variable.step}
                  value={sliderValues[variable.key] ?? variable.current}
                  onChange={(e) =>
                    handleSliderChange(variable.key, Number(e.target.value))
                  }
                  className="w-full accent-amber-600"
                />
                <div className="flex justify-between text-xs text-foreground-tertiary">
                  <span>{variable.min}</span>
                  <span>{variable.max}</span>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={runSimulation}
            disabled={simulating || config.remaining_simulations <= 0}
            className="mt-6 w-full rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
          >
            {config.remaining_simulations <= 0
              ? t("simulation.no_remaining")
              : t("simulation.run")
            }
          </button>
        </div>

        {/* Right: Simulated result */}
        <div className="rounded-lg border border-border bg-surface-card p-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground-tertiary">
            {t("simulation.simulated")}
          </h3>
          {result ? (
            <>
              <p className="mb-1 text-lg font-bold text-foreground-strong">
                {result.archetype}
              </p>
              <p className={`mb-4 text-3xl font-bold ${scoreColorClass(result.readiness_score)}`}>
                {result.readiness_score}
              </p>
              <RadarChart data={result.radar_data} size={200} />
              <div className="mt-4 space-y-2">
                {result.changes.map((change) => (
                  <div
                    key={change.label}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-foreground-secondary">{change.label}</span>
                    <span
                      className={
                        change.delta > 0
                          ? "font-medium text-emerald-600"
                          : change.delta < 0
                            ? "font-medium text-red-600"
                            : "text-foreground-tertiary"
                      }
                    >
                      {change.delta > 0 ? "+" : ""}
                      {change.delta}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-4 rounded-md bg-amber-50 dark:bg-amber-950 p-3 text-xs text-amber-800 dark:text-amber-200">
                {result.insight}
              </p>
            </>
          ) : (
            <div className="flex h-48 items-center justify-center text-sm text-foreground-tertiary">
              {t("simulation.no_results")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
