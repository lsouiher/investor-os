"use client";

import { useMemo } from "react";

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

const ALL_AXES: { key: keyof RadarData; label: string }[] = [
  { key: "capital", label: "Capital" },
  { key: "time", label: "Time" },
  { key: "skills", label: "Skills" },
  { key: "risk_tolerance", label: "Risk" },
  { key: "network", label: "Network" },
  { key: "goal_clarity", label: "Goals" },
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
  const axes = useMemo(
    () => ALL_AXES.filter((a) => data[a.key] != null),
    [data]
  );

  const center = size / 2;
  const radius = size * 0.35;
  const labelOffset = size * 0.45;
  const rings = [0.25, 0.5, 0.75, 1];

  if (axes.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-sm text-gray-400"
        style={{ width: size, height: size }}
      >
        No data available
      </div>
    );
  }

  const angleStep = (2 * Math.PI) / axes.length;
  const startAngle = -Math.PI / 2; // Start from top

  const dataPoints = axes.map((axis, i) => {
    const value = Math.max(0, Math.min(100, (data[axis.key] as number) ?? 0));
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
      className="select-none"
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
            stroke="#e5e7eb"
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
            stroke="#e5e7eb"
            strokeWidth={1}
          />
        );
      })}

      {/* Data fill */}
      <path d={dataPath} fill="#D97706" fillOpacity={0.3} stroke="#D97706" strokeWidth={2} />

      {/* Data dots */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={4} fill="#D97706" />
      ))}

      {/* Labels */}
      {axes.map((axis, i) => {
        const angle = startAngle + i * angleStep;
        const pos = polarToCartesian(center, center, labelOffset, angle);
        return (
          <text
            key={axis.key}
            x={pos.x}
            y={pos.y}
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-gray-600 text-xs font-medium"
          >
            {axis.label}
          </text>
        );
      })}
    </svg>
  );
}
