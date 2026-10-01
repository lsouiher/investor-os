"use client";

import { useMemo } from "react";
import { useTranslation } from "@/lib/i18n";

export interface RadarData {
  capital?: number | null;
  time?: number | null;
  skills?: number | null;
  risk_tolerance?: number | null;
  network?: number | null;
  goal_clarity?: number | null;
}

interface RadarChartProps {
  data: RadarData;
  size?: number;
}

// In drawing order. The labels are the `identity.axis.*` texts.
const ALL_AXES: (keyof RadarData)[] = [
  "capital",
  "time",
  "skills",
  "risk_tolerance",
  "network",
  "goal_clarity",
];

function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angleRad: number
): { x: number; y: number } {
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

export default function RadarChart({ data, size = 300 }: RadarChartProps) {
  const { t } = useTranslation();
  const axes = useMemo(
    () => ALL_AXES.filter((axis) => data[axis] != null),
    [data]
  );

  const center = size / 2;
  const radius = size * 0.35;
  const labelOffset = size * 0.45;
  const rings = [0.25, 0.5, 0.75, 1];

  if (axes.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-sm text-foreground-tertiary"
        style={{ width: size, height: size }}
      >
        {t("identity.radar_empty")}
      </div>
    );
  }

  const angleStep = (2 * Math.PI) / axes.length;
  const startAngle = -Math.PI / 2; // Start from top

  const dataPoints = axes.map((axis, i) => {
    const value = Math.max(0, Math.min(100, (data[axis] as number) ?? 0));
    const angle = startAngle + i * angleStep;
    const r = (value / 100) * radius;
    return polarToCartesian(center, center, r, angle);
  });

  const dataPath =
    dataPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="select-none overflow-visible"
    >
      {/* Background rings */}
      {rings.map((scale) => {
        const ringPoints = axes.map((_, i) => {
          const angle = startAngle + i * angleStep;
          return polarToCartesian(center, center, radius * scale, angle);
        });
        const ringPath =
          ringPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") +
          " Z";
        return (
          <path
            key={scale}
            d={ringPath}
            fill="none"
            stroke="var(--border)"
            strokeWidth={1}
          />
        );
      })}

      {/* Axis lines */}
      {axes.map((_, i) => {
        const angle = startAngle + i * angleStep;
        const end = polarToCartesian(center, center, radius, angle);
        return (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={end.x}
            y2={end.y}
            stroke="var(--border)"
            strokeWidth={1}
          />
        );
      })}

      {/* Data fill */}
      <path d={dataPath} fill="var(--accent)" fillOpacity={0.3} stroke="var(--accent)" strokeWidth={2} />

      {/* Data dots */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={4} fill="var(--accent)" />
      ))}

      {/* Labels */}
      {axes.map((axis, i) => {
        const angle = startAngle + i * angleStep;
        const pos = polarToCartesian(center, center, labelOffset, angle);
        // Anchor side labels away from the chart so they never overlap the rings or clip
        const dx = pos.x - center;
        const anchor = Math.abs(dx) < 1 ? "middle" : dx > 0 ? "start" : "end";
        return (
          <text
            key={axis}
            x={pos.x}
            y={pos.y}
            textAnchor={anchor}
            dominantBaseline="central"
            className="fill-foreground-secondary text-xs font-medium"
          >
            {t(`identity.axis.${axis}`)}
          </text>
        );
      })}
    </svg>
  );
}
