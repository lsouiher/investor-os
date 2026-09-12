"use client";

import { useEffect, useState } from "react";
import RadarChart, { type RadarData } from "./radar-chart";

interface SubScore {
  label: string;
  value: number;
}

interface IdentityCardProps {
  archetype: string;
  readinessScore: number;
  radarData: RadarData;
  headlineInsight: string;
  subScores: SubScore[];
}

function scoreColor(score: number): string {
  if (score < 40) return "#dc2626"; // red-600
  if (score < 70) return "#d97706"; // amber-600
  return "#059669"; // emerald-600
}

function scoreColorClass(score: number): string {
  if (score < 40) return "text-red-600";
  if (score < 70) return "text-amber-600";
  return "text-emerald-600";
}

function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (animatedScore / 100) * circumference;
  const color = scoreColor(score);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 100);
    return () => clearTimeout(timer);
  }, [score]);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-white">{animatedScore}</span>
        <span className="text-xs text-gray-400">Readiness</span>
      </div>
    </div>
  );
}

export default function IdentityCard({
  archetype,
  readinessScore,
  radarData,
  headlineInsight,
  subScores,
}: IdentityCardProps) {
  return (
    <div
      className="relative w-full overflow-hidden rounded-xl"
      style={{
        backgroundColor: "#1A1A2E",
        aspectRatio: "16 / 9",
      }}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-600/10 via-transparent to-purple-900/10" />

      <div className="relative flex h-full flex-col justify-between p-6 sm:p-8">
        {/* Top: archetype title */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            Investor Identity
          </p>
          <h2 className="mt-1 text-2xl font-bold sm:text-3xl" style={{ color: "#D97706" }}>
            {archetype}
          </h2>
        </div>

        {/* Middle: score ring + radar + insight */}
        <div className="flex flex-1 items-center gap-6 py-4">
          <div className="flex-shrink-0">
            <ScoreRing score={readinessScore} />
          </div>

          <div className="hidden flex-shrink-0 sm:block">
            <RadarChart data={radarData} size={160} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm leading-relaxed text-gray-300">{headlineInsight}</p>
          </div>
        </div>

        {/* Bottom: sub-scores row */}
        <div className="flex flex-wrap gap-4 border-t border-white/10 pt-4">
          {subScores.map((sub) => (
            <div key={sub.label} className="flex flex-col items-center">
              <span className={`text-lg font-bold ${scoreColorClass(sub.value)}`}>
                {sub.value}
              </span>
              <span className="text-xs text-gray-400">{sub.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
