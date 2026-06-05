import React from "react";

const DEFAULT_SERIES = [
  { label: "Q1", value: 30 },
  { label: "Q2", value: 55 },
  { label: "Q3", value: 42 },
  { label: "Q4", value: 68 },
];

const DEFAULT_COLORS = ["#2563eb", "#14b8a6", "#f59e0b", "#8b5cf6", "#ef4444"];

const clampValue = (n) => {
  const v = Number(n);
  return Number.isFinite(v) ? Math.max(0, v) : 0;
};

const normalizeSeries = (series) => {
  if (!Array.isArray(series) || series.length === 0) return DEFAULT_SERIES;
  return series.map((item, i) => ({
    label: item?.label || `Item ${i + 1}`,
    value: clampValue(item?.value),
  }));
};

const BarChart = ({ series, colors, gridColor, textColor }) => {
  const max = Math.max(...series.map((s) => s.value), 1);
  const count = series.length;
  const innerWidth = 84;
  const innerHeight = 66;
  const x0 = 10;
  const y0 = 12;
  const barGap = 2;
  const barWidth = (innerWidth - barGap * (count - 1)) / count;

  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="none">
      <rect x="0" y="0" width="100" height="100" fill="transparent" />
      <line x1={x0} y1={y0 + innerHeight} x2={x0 + innerWidth} y2={y0 + innerHeight} stroke={gridColor} strokeWidth="0.8" />
      <line x1={x0} y1={y0} x2={x0} y2={y0 + innerHeight} stroke={gridColor} strokeWidth="0.8" />
      {series.map((s, i) => {
        const h = (s.value / max) * innerHeight;
        const x = x0 + i * (barWidth + barGap);
        const y = y0 + innerHeight - h;
        return (
          <g key={`${s.label}-${i}`}>
            <rect x={x} y={y} width={barWidth} height={h} fill={colors[i % colors.length]} rx="0.8" />
            <text x={x + barWidth / 2} y={y0 + innerHeight + 6} fontSize="3.2" textAnchor="middle" fill={textColor}>
              {s.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

const LineChart = ({ series, colors, gridColor, textColor }) => {
  const max = Math.max(...series.map((s) => s.value), 1);
  const innerWidth = 84;
  const innerHeight = 66;
  const x0 = 10;
  const y0 = 12;
  const stepX = series.length > 1 ? innerWidth / (series.length - 1) : innerWidth;
  const points = series.map((s, i) => {
    const x = x0 + i * stepX;
    const y = y0 + innerHeight - (s.value / max) * innerHeight;
    return { x, y, ...s };
  });
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="none">
      <rect x="0" y="0" width="100" height="100" fill="transparent" />
      <line x1={x0} y1={y0 + innerHeight} x2={x0 + innerWidth} y2={y0 + innerHeight} stroke={gridColor} strokeWidth="0.8" />
      <line x1={x0} y1={y0} x2={x0} y2={y0 + innerHeight} stroke={gridColor} strokeWidth="0.8" />
      <path d={d} fill="none" stroke={colors[0]} strokeWidth="1.4" />
      {points.map((p, i) => (
        <g key={`${p.label}-${i}`}>
          <circle cx={p.x} cy={p.y} r="1.3" fill={colors[i % colors.length]} />
          <text x={p.x} y={y0 + innerHeight + 6} fontSize="3.2" textAnchor="middle" fill={textColor}>
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  );
};

const buildArcPath = (cx, cy, r, startAngle, endAngle) => {
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
};

const PieChart = ({ series, colors, textColor }) => {
  const total = Math.max(series.reduce((sum, s) => sum + s.value, 0), 1);
  let current = -Math.PI / 2;
  const cx = 50;
  const cy = 44;
  const r = 28;

  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="none">
      {series.map((s, i) => {
        const angle = (s.value / total) * Math.PI * 2;
        const next = current + angle;
        const path = buildArcPath(cx, cy, r, current, next);
        current = next;
        return <path key={`${s.label}-${i}`} d={path} fill={colors[i % colors.length]} />;
      })}
      <rect x="6" y="76" width="88" height="18" fill="transparent" />
      {series.slice(0, 4).map((s, i) => (
        <g key={`legend-${s.label}-${i}`}>
          <rect x={8 + i * 22} y={79} width="3" height="3" fill={colors[i % colors.length]} />
          <text x={12 + i * 22} y={82} fontSize="2.9" fill={textColor}>
            {s.label}
          </text>
        </g>
      ))}
    </svg>
  );
};

const ChartLayerRenderer = ({ layer }) => {
  const chartType = layer?.chartType || "bar";
  const series = normalizeSeries(layer?.series);
  const colors = Array.isArray(layer?.colors) && layer.colors.length > 0 ? layer.colors : DEFAULT_COLORS;
  const gridColor = layer?.gridColor || "#cbd5e1";
  const textColor = layer?.textColor || "#334155";
  const bgColor = layer?.backgroundColor || "transparent";

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: bgColor,
        borderRadius: layer?.borderRadius || 8,
        overflow: "hidden",
      }}
    >
      {chartType === "line" && (
        <LineChart series={series} colors={colors} gridColor={gridColor} textColor={textColor} />
      )}
      {chartType === "pie" && (
        <PieChart series={series} colors={colors} textColor={textColor} />
      )}
      {chartType !== "line" && chartType !== "pie" && (
        <BarChart series={series} colors={colors} gridColor={gridColor} textColor={textColor} />
      )}
    </div>
  );
};

export default ChartLayerRenderer;
