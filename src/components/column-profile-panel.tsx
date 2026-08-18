import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  TriangleAlert,
  X,
} from "lucide-react";

/**
 * Column-level profiling detail panel.
 *
 * Two layout states, toggled by the user (never by breakpoint):
 *  - collapsed (default): ~420px wide slide-over, single column of cards
 *  - expanded: ~1100px wide, cards in a 2-column grid
 *
 * Anomaly styling is BAND-based, never direction-based: a delta is only red
 * (with a warning triangle next to the card title) when the current value falls
 * outside the learned normal range for that metric.
 */

const DANGER = "#b42318";
const NEUTRAL_LINE = "#5a5a86";
const BAND_FILL = "rgba(76,175,80,0.14)";
const DANGER_FILL = "rgba(180,35,24,0.10)";

export type ProfileColumn = {
  name: string;
  fillRate: string;
  uniqueness: string;
  nullCount?: number;
  distinct?: number;
};

/* ---------------- deterministic mock history + band math ---------------- */

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rand(seed: string, i: number): number {
  let h = hashSeed(`${seed}#${i}`);
  h = (h * 1664525 + 1013904223) >>> 0;
  return (h % 1000) / 1000;
}

/**
 * history (4 runs) + the current value. When `breakBand` is set the *history*
 * is offset so the current value lands outside the learned band — the current
 * value itself always stays truthful.
 */
function buildSeries(seed: string, current: number, spread: number, breakBand: boolean): number[] {
  const offset = breakBand ? (rand(seed, 9) > 0.5 ? -1 : 1) * spread * 6 : 0;
  const base = Math.max(0, Math.min(100, current + offset));
  const hist: number[] = [];
  for (let i = 0; i < 4; i++) {
    hist.push(Number((base + (rand(seed, i) - 0.5) * 2 * spread).toFixed(2)));
  }
  return [...hist, Number(current.toFixed(2))];
}

function band(values: number[]): { low: number; high: number } {
  const hist = values.slice(0, -1);
  const base = hist.length ? hist : values;
  const mean = base.reduce((a, b) => a + b, 0) / base.length;
  const variance = base.reduce((a, b) => a + (b - mean) ** 2, 0) / base.length;
  const half = Math.max(Math.sqrt(variance) * 3, Math.abs(mean) * 0.004);
  return { low: mean - half, high: mean + half };
}

function isOutsideBand(values: number[]): boolean {
  if (values.length < 2) return false;
  const b = band(values);
  const last = values[values.length - 1];
  return last < b.low || last > b.high;
}

function delta(values: number[]): number {
  if (values.length < 2) return 0;
  return values[values.length - 1] - values[values.length - 2];
}

function deltaText(values: number[]): string {
  const d = delta(values);
  if (Math.abs(d) < 0.05) return "No change from last run";
  return `${d > 0 ? "+" : "−"}${Math.abs(d).toFixed(1)} pts from last run`;
}

/* ---------------- small shared pieces ---------------- */

function WarnIcon({ className = "" }: { className?: string }) {
  return <TriangleAlert size={14} color={DANGER} className={className} aria-hidden="true" />;
}

function CardTitle({
  title,
  subtitle,
  anomalous,
  right,
}: {
  title: string;
  subtitle: string;
  anomalous?: boolean;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h4 className="flex items-center gap-1.5 text-[15px] font-semibold" style={{ color: "var(--ink-900)" }}>
          {anomalous && <WarnIcon />}
          {title}
        </h4>
        <p className="text-[12px]" style={{ color: "var(--brand-blue)" }}>
          {subtitle}
        </p>
      </div>
      {right}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-xl p-4" style={{ background: "var(--surface-soft)" }}>
      {children}
    </section>
  );
}

/** Slim (18px) split bar with the percentage labels rendered below the bar. */
function SplitBar({
  pct,
  leftLabel,
  rightLabel,
}: {
  pct: number;
  leftLabel: string;
  rightLabel: string;
}) {
  return (
    <div>
      <div
        className="flex w-full overflow-hidden rounded-full"
        style={{ height: 18, background: "white" }}
        role="img"
        aria-label={`${leftLabel}, ${rightLabel}`}
      >
        <div style={{ width: `${Math.min(Math.max(pct, 0), 100)}%`, background: "#3f9a4f" }} />
        <div className="flex-1" style={{ background: "var(--hairline)" }} />
      </div>
      <div className="mt-1.5 flex items-center justify-between text-[12px]" style={{ color: "var(--ink-700)" }}>
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  );
}

/** Trend line with a shaded baseline band; line color follows the band rule. */
function BandTrendChart({ values, anomalous }: { values: number[]; anomalous: boolean }) {
  const width = 320;
  const height = 92;
  const padX = 6;
  const padY = 10;
  const b = band(values);
  const min = Math.min(...values, b.low);
  const max = Math.max(...values, b.high);
  const range = max - min || 1;
  const yFor = (v: number) => padY + (height - padY * 2) * (1 - (v - min) / range);
  const stepX = (width - padX * 2) / Math.max(values.length - 1, 1);
  const pts = values.map((v, i) => ({ x: padX + i * stepX, y: yFor(v) }));
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const color = anomalous ? DANGER : "#2f6b3a";
  const bandTop = yFor(b.high);
  const bandBottom = yFor(b.low);
  const last = pts[pts.length - 1];
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      role="img"
      aria-label="Trend across the last 5 runs with normal range"
    >
      <rect
        x={0}
        y={bandTop}
        width={width}
        height={Math.max(bandBottom - bandTop, 3)}
        fill={BAND_FILL}
        rx="3"
      />
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last.x} cy={last.y} r="3.2" fill={color} />
    </svg>
  );
}

function MetricCard({
  title,
  subtitle,
  trendLabel,
  values,
  anomalous,
  hasHistory,
  explanation,
  children,
}: {
  title: string;
  subtitle: string;
  trendLabel: string;
  values: number[];
  anomalous: boolean;
  hasHistory: boolean;
  explanation?: string;
  children: React.ReactNode;
}) {
  const inRange = hasHistory ? (anomalous ? "outside range" : "within range") : "first run";
  const current = values[values.length - 1];
  return (
    <Card>
      <CardTitle
        title={title}
        subtitle={subtitle}
        anomalous={hasHistory && anomalous}
        right={
          <span
            className="whitespace-nowrap text-[12px] font-medium"
            style={{ color: hasHistory && anomalous ? DANGER : "var(--ink-500)" }}
          >
            {Math.round(current)}%, {inRange}
          </span>
        }
      />
      <div className="mt-3">{children}</div>
      <div className="mt-4">
        <div
          className="mb-1 text-[11px] font-semibold uppercase tracking-wide"
          style={{ color: "var(--ink-300)" }}
        >
          {trendLabel}
        </div>
        {hasHistory ? (
          <>
            <BandTrendChart values={values} anomalous={anomalous} />
            <div
              className="mt-1 text-[12px]"
              style={{ color: anomalous ? DANGER : "var(--ink-500)" }}
            >
              {deltaText(values)}
            </div>
            {anomalous && explanation && (
              <p className="mt-1 text-[12px]" style={{ color: DANGER }}>
                {explanation}
              </p>
            )}
          </>
        ) : (
          <p className="text-[12px]" style={{ color: "var(--ink-500)" }}>
            No history yet — trends appear after the next run.
          </p>
        )}
      </div>
    </Card>
  );
}

/* ---------------- distribution ---------------- */

function DistributionCard({
  seed,
  anomalous,
  outliers,
}: {
  seed: string;
  anomalous: boolean;
  outliers: number[];
}) {
  const width = 320;
  const height = 130;
  const curve: { x: number; y: number }[] = [];
  for (let i = 0; i <= 60; i++) {
    const t = (i - 30) / 11;
    curve.push({
      x: (i / 60) * width,
      y: height - 16 - (height - 40) * Math.exp(-(t * t) / 2),
    });
  }
  const path = curve.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const tail = width * 0.16;
  const dotXs = outliers.map((_, i) => (i % 2 === 0 ? tail * 0.35 : width - tail * 0.35));
  return (
    <Card>
      <CardTitle title="Distribution" subtitle="How the values are spread" anomalous={anomalous} />
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} className="mt-3" role="img" aria-label="Value distribution">
        <rect x={0} y={16} width={tail} height={height - 32} fill={DANGER_FILL} />
        <rect x={width - tail} y={16} width={tail} height={height - 32} fill={DANGER_FILL} />
        <path d={path} fill="none" stroke={anomalous ? DANGER : NEUTRAL_LINE} strokeWidth="2" />
        {anomalous &&
          dotXs.map((x, i) => {
            const nearest = curve.reduce((a, p) => (Math.abs(p.x - x) < Math.abs(a.x - x) ? p : a), curve[0]);
            return <circle key={i} cx={x} cy={nearest.y} r="3.4" fill={DANGER} />;
          })}
      </svg>
      {anomalous && outliers.length > 0 && (
        <p className="mt-1 text-[12px]" style={{ color: DANGER }}>
          {outliers.length} values fell outside the expected range: {outliers.join(", ")}
        </p>
      )}
      <div className="mt-4 grid grid-cols-4 gap-2 text-center">
        {[
          { label: "Min length", value: 2 + Math.round(rand(seed, 1)) },
          { label: "Max length", value: 3 + Math.round(rand(seed, 2) * 2) },
          { label: "Mean length", value: 3 },
          { label: "Median length", value: 3 },
        ].map((s) => (
          <div key={s.label}>
            <div className="text-[20px] font-semibold" style={{ color: "var(--brand-blue)" }}>
              {s.value}
            </div>
            <div className="text-[11px]" style={{ color: "var(--ink-500)" }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ---------------- pattern / frequent value tables ---------------- */

function NewBadge() {
  return (
    <span
      className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
      style={{ background: "rgba(180,35,24,0.10)", color: DANGER }}
    >
      New
    </span>
  );
}

function MiniSparkline({ values, anomalous }: { values: number[]; anomalous: boolean }) {
  const width = 56;
  const height = 20;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = width / Math.max(values.length - 1, 1);
  const path = values
    .map((v, i) => `${i === 0 ? "M" : "L"}${(i * stepX).toFixed(1)} ${(2 + (height - 4) * (1 - (v - min) / range)).toFixed(1)}`)
    .join(" ");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <path d={path} fill="none" stroke={anomalous ? DANGER : NEUTRAL_LINE} strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

type FreqRow = {
  label: string;
  count: number;
  pct: number;
  series?: number[];
  isNew?: boolean;
};

function FreqTable({ firstColLabel, rows }: { firstColLabel: string; rows: FreqRow[] }) {
  return (
    <div className="mt-3 overflow-hidden rounded-lg" style={{ background: "white" }}>
      <div
        className="grid grid-cols-[1.4fr_60px_60px_1fr] px-3 py-2 text-[10px] font-semibold uppercase tracking-wide"
        style={{ color: "var(--ink-300)" }}
      >
        <span>{firstColLabel}</span>
        <span>Count</span>
        <span>%</span>
        <span className="text-right">Last 5 runs</span>
      </div>
      {rows.map((r) => {
        const anomalous = !r.isNew && !!r.series && isOutsideBand(r.series);
        return (
          <div
            key={r.label}
            className="grid grid-cols-[1.4fr_60px_60px_1fr] items-center border-t px-3 py-2.5 text-[12px]"
            style={{ borderColor: "var(--hairline)", color: "var(--ink-700)" }}
          >
            <span className="flex items-center gap-1.5 truncate">
              {anomalous && <WarnIcon />}
              <span className="truncate" style={{ color: anomalous ? DANGER : "var(--ink-900)" }}>
                {r.label}
              </span>
            </span>
            <span>{r.count}</span>
            <span>{r.pct}%</span>
            <div className="flex items-center justify-end gap-2">
              {r.isNew ? (
                <NewBadge />
              ) : r.series ? (
                <>
                  <MiniSparkline values={r.series} anomalous={anomalous} />
                  <span
                    className="whitespace-nowrap text-[11px] font-medium"
                    style={{ color: anomalous ? DANGER : "var(--ink-500)" }}
                  >
                    {delta(r.series) > 0 ? "+" : "−"}
                    {Math.abs(delta(r.series)).toFixed(1)} pts
                  </span>
                </>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- panel ---------------- */

export function ColumnProfilePanel({
  column,
  hasHistory = true,
  index,
  total,
  domain = "Finance Sales Data",
  table = "Orders",
  onPrev,
  onNext,
  onClose,
}: {
  column: ProfileColumn | null;
  hasHistory?: boolean;
  index: number | null;
  total: number;
  domain?: string;
  table?: string;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const open = column !== null;
  const name = column?.name ?? "";

  const model = React.useMemo(() => {
    if (!column) return null;
    const fill = parseInt(column.fillRate) || 0;
    const uniq = parseInt(column.uniqueness) || 0;
    const seed = `${table}:${column.name}`;
    // Deterministic prototype anomalies so the states are demonstrable.
    const uniqBreaks = rand(seed, 21) > 0.45;
    const fillBreaks = rand(seed, 22) > 0.82;
    const distributionAnomalous = rand(seed, 23) > 0.5;

    const fillSeries = buildSeries(`${seed}:fill`, fill, 0.6, fillBreaks);
    const uniqSeries = buildSeries(`${seed}:uniq`, uniq, 0.6, uniqBreaks);
    const patternRows: FreqRow[] = [
      { label: "xxx-xxxx", count: 200, pct: 76, series: buildSeries(`${seed}:p1`, 76, 1.2, false) },
      { label: "xxxxxxx", count: 150, pct: 62, series: buildSeries(`${seed}:p2`, 62, 1.2, rand(seed, 31) > 0.7) },
      { label: "xxx.xxxx", count: 100, pct: 41, isNew: true },
    ];
    const valueRows: FreqRow[] = [
      { label: "Databricks", count: 1, pct: 76, series: buildSeries(`${seed}:v1`, 76, 1.5, rand(seed, 41) > 0.5) },
      { label: "Snowflake", count: 1, pct: 62, series: buildSeries(`${seed}:v2`, 62, 1.5, false) },
      { label: "BigQuery", count: 1, pct: 48, series: buildSeries(`${seed}:v3`, 48, 1.5, false) },
      { label: "Redshift", count: 1, pct: 34, isNew: true },
    ];

    const completenessAnomalous = hasHistory && isOutsideBand(fillSeries);
    const uniquenessAnomalous = hasHistory && isOutsideBand(uniqSeries);
    const distAnomalous = hasHistory && distributionAnomalous;
    const outliers = [-34, 52];

    const affected = [
      completenessAnomalous ? "Completeness" : null,
      uniquenessAnomalous ? "Uniqueness" : null,
      distAnomalous ? "Distribution" : null,
    ].filter(Boolean) as string[];

    return {
      fill,
      uniq,
      seed,
      fillSeries,
      uniqSeries,
      patternRows,
      valueRows,
      completenessAnomalous,
      uniquenessAnomalous,
      distAnomalous,
      outliers,
      affected,
    };
  }, [column, hasHistory, table]);

  return (
    <aside
      role="complementary"
      aria-label="Column profile details"
      className={`fixed right-0 top-0 z-40 flex h-full w-full flex-col border-l bg-white shadow-xl transition-all duration-300 ${
        expanded ? "max-w-[1100px]" : "max-w-[420px]"
      } ${open ? "translate-x-0" : "pointer-events-none translate-x-full"}`}
      style={{ borderColor: "var(--hairline)" }}
    >
      {column && model && (
        <>
          {/* Header */}
          <div
            className="flex items-start justify-between gap-3 border-b px-6 py-5"
            style={{ borderColor: "var(--hairline)" }}
          >
            <div>
              <div className="text-[12px]" style={{ color: "var(--ink-300)" }}>
                {domain} &gt; {table} &gt; {name}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <h3 className="text-[20px] font-semibold" style={{ color: "var(--ink-900)" }}>
                  {name}
                </h3>
                {model.affected.length > 0 && (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium"
                    style={{ background: "rgba(208,82,82,0.12)", color: DANGER }}
                  >
                    <TriangleAlert size={13} aria-hidden="true" />
                    {model.affected.length} active{" "}
                    {model.affected.length === 1 ? "anomaly" : "anomalies"}
                  </span>
                )}
              </div>
              {model.affected.length > 0 && (
                <div className="mt-1 text-[12px]" style={{ color: "var(--ink-500)" }}>
                  {model.affected.join(", ")}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                aria-label={expanded ? "Collapse panel" : "Expand panel"}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-[12px] font-medium transition-colors hover:bg-[color:var(--surface-soft)]"
                style={{ borderColor: "var(--hairline)", color: "var(--ink-700)" }}
              >
                {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                {expanded ? "Collapse" : "Expand"}
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-[color:var(--surface-soft)]"
                style={{ color: "var(--ink-700)" }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <div className={`grid gap-5 ${expanded ? "grid-cols-2 items-start" : "grid-cols-1"}`}>
              <MetricCard
                title="Completeness"
                subtitle="How full is this column"
                trendLabel="Fill rate trend"
                values={model.fillSeries}
                anomalous={model.completenessAnomalous}
                hasHistory={hasHistory}
                explanation="Fill rate moved outside the typical range for this column"
              >
                <SplitBar
                  pct={model.fill}
                  leftLabel={`${model.fill}% Filled`}
                  rightLabel={`${100 - model.fill}% Null`}
                />
              </MetricCard>

              <MetricCard
                title="Uniqueness"
                subtitle="How distinct are the values"
                trendLabel="Uniqueness trend"
                values={model.uniqSeries}
                anomalous={model.uniquenessAnomalous}
                hasHistory={hasHistory}
                explanation="Distinct count jumped outside the typical range for this column"
              >
                <SplitBar
                  pct={model.uniq}
                  leftLabel={`${model.uniq}% (${column.distinct ?? 20}) Unique`}
                  rightLabel={`${100 - model.uniq}% Duplicated`}
                />
              </MetricCard>

              <DistributionCard
                seed={model.seed}
                anomalous={model.distAnomalous}
                outliers={model.outliers}
              />

              <Card>
                <CardTitle title="Pattern" subtitle="What format do values follow" />
                <FreqTable firstColLabel="Type" rows={model.patternRows} />
              </Card>

              <Card>
                <CardTitle title="Most frequent value" subtitle="What appears most often" />
                <FreqTable firstColLabel="Value" rows={model.valueRows} />
              </Card>
            </div>
          </div>

          {/* Footer nav */}
          <div
            className="flex items-center justify-between border-t bg-white px-6 py-3"
            style={{ borderColor: "var(--hairline)" }}
          >
            <button
              type="button"
              onClick={onPrev}
              aria-label="Previous column"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-[color:var(--surface-soft)] disabled:opacity-40"
              style={{ color: "var(--ink-700)" }}
              disabled={total <= 1}
            >
              <ChevronLeft size={18} />
            </button>
            <div className="text-[12px] font-medium" style={{ color: "var(--ink-700)" }}>
              {(index ?? 0) + 1} of {total} columns
            </div>
            <button
              type="button"
              onClick={onNext}
              aria-label="Next column"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-[color:var(--surface-soft)] disabled:opacity-40"
              style={{ color: "var(--ink-700)" }}
              disabled={total <= 1}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </>
      )}
    </aside>
  );
}
