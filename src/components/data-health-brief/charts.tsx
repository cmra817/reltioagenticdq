import * as React from "react";
import { DAY_LABELS, X_TICKS } from "./data";

export type ChartSeries = {
  label: string;
  values: number[];
  /** SVG dash pattern — series are distinguished by dash + end label, never colour alone. */
  dash?: string;
  breaching?: boolean;
};

const RED = "var(--brand-red)";
const INK = "var(--ink-700)";

/* ---------------- sparkline ---------------- */

export function Spark({
  values,
  band,
  breaching,
  width = 132,
  height = 36,
}: {
  values: number[];
  band?: [number, number];
  breaching?: boolean;
  width?: number;
  height?: number;
}) {
  const pad = 3;
  const all = band ? values.concat(band) : values;
  const min = Math.min(...all);
  const max = Math.max(...all);
  const span = max - min || 1;
  const x = (i: number) => pad + (i * (width - pad * 2)) / Math.max(values.length - 1, 1);
  const y = (v: number) => pad + (height - pad * 2) * (1 - (v - min) / span);
  const d = values.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const stroke = breaching ? RED : INK;
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
      {band && (
        <rect
          x={0}
          y={y(band[1])}
          width={width}
          height={Math.max(y(band[0]) - y(band[1]), 2)}
          fill={breaching ? "rgba(255,54,33,0.08)" : "rgba(67,134,250,0.10)"}
        />
      )}
      <path d={d} fill="none" stroke={stroke} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={x(values.length - 1)} cy={y(values[values.length - 1])} r={2.2} fill={stroke} />
    </svg>
  );
}

/* ---------------- full banded chart ---------------- */

export function HealthChart({
  series,
  band,
  unit = "",
  height = 190,
  marker,
  markerLabel,
  compact = false,
  valueFormat,
}: {
  series: ChartSeries[];
  band?: [number, number];
  unit?: string;
  height?: number;
  marker?: number;
  markerLabel?: string;
  compact?: boolean;
  valueFormat?: (v: number) => string;
}) {
  const W = 720;
  const H = height;
  const m = { top: 14, right: compact ? 96 : 118, bottom: 22, left: 44 };

  const all = series.flatMap((s) => s.values).concat(band ?? []);
  const rawMin = Math.min(...all);
  const rawMax = Math.max(...all);
  const padV = (rawMax - rawMin) * 0.12 || 1;
  const min = rawMin - padV;
  const max = rawMax + padV;

  const x = (i: number) => m.left + (i * (W - m.left - m.right)) / Math.max(DAY_LABELS.length - 1, 1);
  const y = (v: number) => m.top + (H - m.top - m.bottom) * (1 - (v - min) / (max - min || 1));

  const fmt = valueFormat ?? ((v: number) => `${Math.round(v * 10) / 10}${unit}`);
  const ticks = [max, min + (max - min) * 0.5, min].map((v) => ({ v, label: fmt(v) }));

  return (
    <div className="w-full">
      <svg
        width="100%"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={series.map((s) => s.label).join(", ")}
        style={{ display: "block" }}
      >
        {/* gridlines + y axis */}
        {ticks.map((t) => (
          <g key={t.label}>
            <line x1={m.left} x2={W - m.right} y1={y(t.v)} y2={y(t.v)} stroke="var(--hairline)" strokeWidth={1} />
            <text x={m.left - 8} y={y(t.v) + 3.5} textAnchor="end" fontSize={10} fill="var(--ink-300)">
              {t.label}
            </text>
          </g>
        ))}

        {/* learned band */}
        {band && (
          <>
            <rect
              x={m.left}
              y={y(band[1])}
              width={W - m.left - m.right}
              height={Math.max(y(band[0]) - y(band[1]), 2)}
              fill="rgba(67,134,250,0.10)"
            />
            <text x={m.left + 6} y={y(band[1]) - 4} fontSize={9.5} fill="var(--ink-300)">
              learned normal range
            </text>
          </>
        )}

        {/* cause marker */}
        {marker != null && (
          <>
            <line
              x1={x(marker)}
              x2={x(marker)}
              y1={m.top - 6}
              y2={H - m.bottom}
              stroke="var(--ink-300)"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
            {markerLabel && (
              <text x={x(marker) + 5} y={m.top - 1} fontSize={9.5} fill="var(--ink-500)">
                {markerLabel}
              </text>
            )}
          </>
        )}

        {/* series */}
        {series.map((s) => (
          <g key={s.label}>
            <path
              d={s.values.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ")}
              fill="none"
              stroke={s.breaching ? RED : INK}
              strokeWidth={1.8}
              strokeDasharray={s.dash}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <text
              x={x(s.values.length - 1) + 6}
              y={y(s.values[s.values.length - 1]) + 3.5}
              fontSize={10}
              fill={s.breaching ? RED : "var(--ink-500)"}
              className="font-mono"
            >
              {s.label}
            </text>
          </g>
        ))}

        {/* x axis */}
        <line x1={m.left} x2={W - m.right} y1={H - m.bottom} y2={H - m.bottom} stroke="var(--hairline)" />
        {X_TICKS.map((t) => (
          <text key={t.index} x={x(t.index)} y={H - m.bottom + 14} fontSize={10} fill="var(--ink-300)" textAnchor="middle">
            {t.label}
          </text>
        ))}
      </svg>
    </div>
  );
}

/* ---------------- stat strip ---------------- */

export function StatStrip({
  stats,
}: {
  stats: { value: string; label: string; note: string; alert?: boolean }[];
}) {
  return (
    <div className="mt-3 grid" style={{ gridTemplateColumns: `repeat(${stats.length}, minmax(0,1fr))` }}>
      {stats.map((s, i) => (
        <div
          key={s.label + i}
          className="px-3 py-2 first:pl-0"
          style={{ borderLeft: i === 0 ? "none" : "1px solid var(--hairline)" }}
        >
          <div className="text-[17px] font-semibold leading-none" style={{ color: "var(--ink-900)" }}>
            {s.value}
          </div>
          <div className="mt-1 text-[11.5px]" style={{ color: "var(--ink-500)" }}>
            {s.label}
          </div>
          <div className="mt-0.5 text-[11.5px]" style={{ color: s.alert ? "var(--brand-red)" : "var(--ink-500)" }}>
            {s.note}
          </div>
        </div>
      ))}
    </div>
  );
}
