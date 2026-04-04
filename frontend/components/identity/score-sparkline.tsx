"use client";

interface ScoreSparklineProps {
  scores: number[];
  width?: number;
  height?: number;
}

export default function ScoreSparkline({
  scores,
  width = 120,
  height = 40,
}: ScoreSparklineProps) {
  if (scores.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-xs text-gray-400"
        style={{ width, height }}
      >
        --
      </div>
    );
  }

  if (scores.length === 1) {
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <circle cx={width / 2} cy={height / 2} r={3} fill="#D97706" />
      </svg>
    );
  }

  const padding = 4;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const range = max - min || 1;

  const points = scores.map((score, i) => {
    const x = padding + (i / (scores.length - 1)) * chartWidth;
    const y = padding + chartHeight - ((score - min) / range) * chartHeight;
    return `${x},${y}`;
  });

  const polyline = points.join(" ");

  // Area fill path
  const firstX = padding;
  const lastX = padding + chartWidth;
  const areaPath = `M ${firstX},${padding + chartHeight} L ${polyline.replace(/,/g, " L ").replace(/ L /, ",")} L ${lastX},${padding + chartHeight} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Area fill */}
      <path d={areaPath} fill="#D97706" fillOpacity={0.15} />
      {/* Line */}
      <polyline
        points={polyline}
        fill="none"
        stroke="#D97706"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Latest point dot */}
      {scores.length > 0 && (
        <circle
          cx={padding + chartWidth}
          cy={
            padding +
            chartHeight -
            ((scores[scores.length - 1] - min) / range) * chartHeight
          }
          r={3}
          fill="#D97706"
        />
      )}
    </svg>
  );
}
