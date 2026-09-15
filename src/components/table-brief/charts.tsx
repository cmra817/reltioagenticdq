import * as React from "react";

function pathFor(
  values: number[],
  w: number,
  h: number,
  pad = 2,
  scale?: { min: number; max: number },
) {
  const min = scale ? scale.min : Math.min(...values);
  const max = scale ? scale.max : Math.max(...values);
  const span = max - min || 1;
  const stepX = (w - pad * 2) / Math.max(values.length - 1, 1);
  return values
    .map((v, i) => {
      const x = pad + i * stepX;
      const y = pad + (h - pad * 2) * (1 - (v - min) / span);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}


/** Sparkline with an optional learned-band shaded behind the line. */
export function BandSparkline({
  values,
  band,
  breaching,
  width = 108,
  height = 34,
}: {
  values: number[];
  /** [lowFraction, highFraction] of the value range, 0 = min, 1 = max */
  band?: [number, number];
  breaching?: boolean;
  width?: number;
  height?: number;
}) {
  const pad = 2;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const yFor = (frac: number) => pad + (height - pad * 2) * (1 - frac);
  const stroke = breaching ? "var(--brand-red)" : "var(--ink-300)";
  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {band && (
        <rect
          x={0}
          y={yFor(band[1])}
          width={width}
          height={Math.max(yFor(band[0]) - yFor(band[1]), 2)}
          fill={breaching ? "rgba(255,54,33,0.08)" : "rgba(67,134,250,0.10)"}
        />
      )}
      <path
        d={pathFor(values, width, height, pad)}
        fill="none"
        stroke={stroke}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {(() => {
        const last = values[values.length - 1];
        const x = width - pad;
        const y = pad + (height - pad * 2) * (1 - (last - min) / span);
        return <circle cx={x} cy={y} r={2.2} fill={stroke} />;
      })()}
    </svg>
  );
}

export type Series = { label: string; values: number[]; color: string; opacity?: number };

/** Multi-line chart with an optional dashed divergence marker. */
export function LineChart({
  series,
  markerIndex,
  markerLabel,
  height = 120,
  showLegend = true,
  yLabels,
  threshold,
  thresholdLabel,
}: {
  series: Series[];
  markerIndex?: number;
  markerLabel?: string;
  height?: number;
  showLegend?: boolean;
  yLabels?: string[];
  /** Absolute value to draw a dashed horizontal reference line at. */
  threshold?: number;
  thresholdLabel?: string;
}) {

  const width = 320;
  const pad = 6;
  const all = series.flatMap((s) => s.values).concat(threshold != null ? [threshold] : []);
  const min = Math.min(...all);
  const max = Math.max(...all);
  const span = max - min || 1;

  const len = Math.max(...series.map((s) => s.values.length));
  const xFor = (i: number) => pad + (i * (width - pad * 2)) / Math.max(len - 1, 1);
  const yFor = (v: number) => pad + (height - pad * 2) * (1 - (v - min) / span);

  return (
    <div className="w-full">
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={series.map((s) => s.label).join(" vs ")}
      >
        {markerIndex != null && (
          <line
            x1={xFor(markerIndex)}
            x2={xFor(markerIndex)}
            y1={0}
            y2={height}
            stroke="var(--ink-300)"
            strokeWidth={1}
            strokeDasharray="3 3"
          />
        )}
        {threshold != null && (
          <line
            x1={0}
            x2={width}
            y1={yFor(threshold)}
            y2={yFor(threshold)}
            stroke="var(--ink-300)"
            strokeWidth={1}
            strokeDasharray="4 3"
          />
        )}

        {series.map((s) => (
          <path
            key={s.label}
            d={pathFor(s.values, width, height, pad, { min, max })}
            fill="none"
            stroke={s.color}
            strokeOpacity={s.opacity ?? 1}
            strokeWidth={1.9}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
        {series.map((s) => {
          const v = s.values[s.values.length - 1];
          return (
            <circle
              key={`${s.label}-dot`}
              cx={xFor(s.values.length - 1)}
              cy={yFor(v)}
              r={2.4}
              fill={s.color}
              fillOpacity={s.opacity ?? 1}
            />
          );
        })}
      </svg>
      {(markerLabel || thresholdLabel) && (
        <div
          className="mt-1 flex flex-wrap items-center gap-3 text-[11px]"
          style={{ color: "var(--ink-300)" }}
          aria-hidden="true"
        >
          {markerLabel && <span>↑ {markerLabel}</span>}
          {thresholdLabel && (
            <span className="inline-flex items-center gap-1.5">
              <span
                className="inline-block h-0 w-4"
                style={{ borderTop: "1px dashed var(--ink-300)" }}
              />
              {thresholdLabel}
            </span>
          )}
        </div>
      )}

      {showLegend && (
        <div className="mt-2 flex flex-wrap items-center gap-3">
          {series.map((s, i) => (
            <span
              key={s.label}
              className="inline-flex items-center gap-1.5 text-[11px]"
              style={{ color: "var(--ink-500)" }}
            >
              <span
                className="inline-block h-[2px] w-4 rounded-full"
                style={{ background: s.color, opacity: s.opacity ?? 1 }}
              />
              {yLabels?.[i] ?? s.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
