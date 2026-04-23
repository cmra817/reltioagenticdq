import { useState } from "react";
import { ChatComposer } from "./chat-composer";
import { ChevronDownIcon } from "./brand-icons";

/* ---------- small UI atoms ---------- */
function Select({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="flex items-center justify-between gap-2 rounded-lg border bg-white px-3 py-2 text-[13px] font-medium transition-colors hover:bg-[color:var(--surface-soft)]"
      style={{ borderColor: "var(--hairline)", color: "var(--ink-700)", minWidth: 140 }}
    >
      <span>{label}</span>
      <ChevronDownIcon size={14} />
    </button>
  );
}

function DropdownSelect({
  options,
  defaultLabel,
  minWidth = 160,
}: {
  options: string[];
  defaultLabel: string;
  minWidth?: number;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string>(defaultLabel);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between gap-2 rounded-lg border bg-white px-3 py-2 text-[13px] font-medium transition-colors hover:bg-[color:var(--surface-soft)]"
        style={{ borderColor: "var(--hairline)", color: "var(--ink-700)", minWidth }}
      >
        <span>{selected}</span>
        <ChevronDownIcon size={14} />
      </button>
      {open && (
        <div
          className="absolute left-0 top-full z-20 mt-2 w-[200px] rounded-xl border bg-white p-2"
          style={{ borderColor: "var(--hairline)", boxShadow: "var(--shadow-input)" }}
        >
          {[defaultLabel, ...options].map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                setSelected(opt);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] hover:bg-[color:var(--surface-soft)]"
              style={{ color: "var(--ink-900)" }}
            >
              <span
                className="flex h-4 w-4 items-center justify-center rounded border"
                style={{
                  borderColor: selected === opt ? "var(--brand-blue)" : "var(--hairline)",
                  background: selected === opt ? "var(--brand-blue)" : "white",
                  color: "white",
                  fontSize: 10,
                  lineHeight: 1,
                }}
                aria-hidden="true"
              >
                {selected === opt ? "✓" : ""}
              </span>
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DeltaPill({ value, direction = "up" }: { value: string; direction?: "up" | "down" }) {
  const positive = direction === "up";
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[12px] font-medium"
      style={{
        background: positive ? "rgba(34,197,94,0.10)" : "rgba(239,68,68,0.10)",
        color: positive ? "#16a34a" : "#dc2626",
      }}
    >
      <span aria-hidden="true">{positive ? "↑" : "↓"}</span>
      {value} from last
    </span>
  );
}

function CardShell({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border bg-white p-5 ${className}`}
      style={{ borderColor: "var(--hairline)", boxShadow: "var(--shadow-card)" }}
    >
      {children}
    </div>
  );
}

/* ---------- charts (inline SVG) ---------- */
function buildPath(values: number[], width: number, height: number, pad = 8) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = (width - pad * 2) / (values.length - 1);
  return values
    .map((v, i) => {
      const x = pad + i * stepX;
      const y = pad + (height - pad * 2) * (1 - (v - min) / range);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

function MainLineChart() {
  const width = 720;
  const height = 240;
  const data = [85, 87, 86, 84, 83, 82, 84, 86, 87];
  const labels = ["P1", "P2", "P3", "P4", "P5", "P6"];
  const path = buildPath(data, width, height, 16);
  return (
    <svg viewBox={`0 0 ${width} ${height + 28}`} width="100%" height="280" aria-label="Quality trend">
      {/* y-axis grid */}
      {[0, 1, 2, 3, 4].map((i) => {
        const y = 16 + ((height - 32) / 4) * i;
        return (
          <line
            key={i}
            x1={32}
            x2={width - 8}
            y1={y}
            y2={y}
            stroke="var(--hairline)"
            strokeDasharray="3 4"
          />
        );
      })}
      {/* y labels */}
      {[88, 86, 84, 82, 80].map((v, i) => (
        <text
          key={v}
          x={8}
          y={20 + ((height - 32) / 4) * i}
          fontSize="11"
          fill="var(--ink-300)"
        >
          {v}
        </text>
      ))}
      {/* area */}
      <path
        d={`${path} L${width - 16} ${height - 16} L16 ${height - 16} Z`}
        fill="rgba(20,166,166,0.08)"
      />
      {/* line */}
      <path d={path} fill="none" stroke="#14a6a6" strokeWidth="2.5" strokeLinejoin="round" />
      {/* x labels */}
      {labels.map((l, i) => {
        const x = 16 + ((width - 32) / (labels.length - 1)) * i;
        return (
          <text key={l} x={x} y={height + 18} fontSize="11" fill="var(--ink-500)" textAnchor="middle">
            {l}
          </text>
        );
      })}
    </svg>
  );
}

function MiniLine({ values, color }: { values: number[]; color: string }) {
  const width = 280;
  const height = 80;
  const path = buildPath(values, width, height);
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="80" aria-hidden="true">
      <path
        d={`${path} L${width - 8} ${height - 8} L8 ${height - 8} Z`}
        fill={`${color}1f`}
      />
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function DonutChart() {
  const segments = [
    { value: 87.5, color: "#14a6a6", label: "Passed" },
    { value: 10, color: "#ef4444", label: "Failed" },
    { value: 2.5, color: "#f5b400", label: "Aborted" },
  ];
  const radius = 70;
  const stroke = 22;
  const C = 2 * Math.PI * radius;
  let offset = 0;
  return (
    <svg viewBox="0 0 180 180" width="180" height="180">
      <g transform="translate(90 90) rotate(-90)">
        <circle r={radius} fill="none" stroke="var(--surface-soft)" strokeWidth={stroke} />
        {segments.map((s) => {
          const len = (s.value / 100) * C;
          const dasharray = `${len} ${C - len}`;
          const dashoffset = -offset;
          offset += len;
          return (
            <circle
              key={s.label}
              r={radius}
              fill="none"
              stroke={s.color}
              strokeWidth={stroke}
              strokeDasharray={dasharray}
              strokeDashoffset={dashoffset}
              strokeLinecap="butt"
            />
          );
        })}
      </g>
      <text x="90" y="86" textAnchor="middle" fontSize="28" fontWeight="700" fill="var(--ink-900)">
        280
      </text>
      <text x="90" y="106" textAnchor="middle" fontSize="12" fill="var(--ink-500)">
        Total Jobs
      </text>
    </svg>
  );
}

/* ---------- metric card ---------- */
type Metric = {
  label: string;
  value: string;
  delta: string;
  direction: "up" | "down";
  passed: string;
  ratio: number; // 0..1
  color: string;
  trend: number[];
};

const metrics: Metric[] = [
  { label: "COMPLETENESS", value: "89%", delta: "2.3%", direction: "up", passed: "178/200 Passed", ratio: 0.89, color: "#14a6a6", trend: [80, 84, 82, 86, 88, 85, 89] },
  { label: "UNIQUENESS", value: "82%", delta: "2.3%", direction: "up", passed: "164/200 Passed", ratio: 0.82, color: "#14a6a6", trend: [78, 80, 79, 84, 81, 83, 82] },
  { label: "VALIDITY", value: "72%", delta: "0.3%", direction: "up", passed: "144/200 Passed", ratio: 0.72, color: "#f5b400", trend: [70, 73, 71, 74, 72, 75, 72] },
  { label: "ACCURACY", value: "96%", delta: "3.7%", direction: "up", passed: "192/200 Passed", ratio: 0.96, color: "#14a6a6", trend: [90, 92, 94, 93, 95, 96, 96] },
  { label: "CONSISTENCY", value: "48%", delta: "3.2%", direction: "down", passed: "96/200 Passed", ratio: 0.48, color: "#ef4444", trend: [55, 52, 50, 48, 49, 47, 48] },
  { label: "TIMELINES", value: "64%", delta: "0.7%", direction: "up", passed: "128/200 Passed", ratio: 0.64, color: "#f59e0b", trend: [60, 62, 61, 63, 64, 65, 64] },
];

function MetricCard({ m }: { m: Metric }) {
  return (
    <div className="flex flex-col gap-3">
      <div
        className="text-[11px] font-semibold tracking-[0.08em]"
        style={{ color: "var(--ink-500)" }}
      >
        {m.label}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[28px] font-semibold leading-none" style={{ color: "var(--ink-900)" }}>
          {m.value}
        </span>
        <DeltaPill value={m.delta} direction={m.direction} />
      </div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full"
        style={{ background: "var(--surface-soft)" }}
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${m.ratio * 100}%`, background: m.color }}
        />
      </div>
      <div className="text-[12px]" style={{ color: "var(--ink-500)" }}>
        {m.passed}
      </div>
      <MiniLine values={m.trend} color={m.color} />
    </div>
  );
}

/* ---------- main dashboard ---------- */
export function DataHealthDashboard() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex flex-1 flex-col overflow-y-auto px-8 pb-8 pt-4">
        {/* filter bar */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <DropdownSelect
              defaultLabel="All domains"
              options={[
                "Finance",
                "Marketing",
                "Sales",
                "Human Resources",
                "Operations",
                "Customer Success",
                "Product",
                "Supply Chain",
              ]}
            />
            <Select label="All sources" />
            <Select label="Last month" />
          </div>
        </div>

        {/* top row: score + job summary */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">
          <CardShell>
            <div className="flex items-center gap-2">
              <span
                className="flex h-7 w-7 items-center justify-center rounded-md"
                style={{ background: "var(--surface-soft)", color: "var(--ink-700)" }}
                aria-hidden="true"
              >
                📊
              </span>
              <h2 className="text-[16px] font-semibold" style={{ color: "var(--ink-900)" }}>
                Overall Data Quality Score
              </h2>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <span className="text-[36px] font-semibold leading-none" style={{ color: "var(--ink-900)" }}>
                87.5%
              </span>
              <DeltaPill value="2.3%" direction="up" />
            </div>
            <div className="mt-4">
              <MainLineChart />
            </div>
          </CardShell>

          <CardShell>
            <div className="flex items-center gap-2">
              <span
                className="flex h-7 w-7 items-center justify-center rounded-md"
                style={{ background: "var(--surface-soft)", color: "var(--ink-700)" }}
                aria-hidden="true"
              >
                📋
              </span>
              <h2 className="text-[16px] font-semibold" style={{ color: "var(--ink-900)" }}>
                Job Summary
              </h2>
            </div>
            <div className="mt-2 flex items-center gap-4">
              <DonutChart />
              <ul className="space-y-2 text-[13px]">
                {[
                  { c: "#14a6a6", l: "Passed:", v: "245 (87.5%)" },
                  { c: "#ef4444", l: "Failed:", v: "28 (10.0%)" },
                  { c: "#f5b400", l: "Aborted:", v: "7 (2.5%)" },
                ].map((r) => (
                  <li key={r.l} className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-sm"
                      style={{ background: r.c }}
                      aria-hidden="true"
                    />
                    <span style={{ color: "var(--ink-700)" }}>{r.l}</span>
                    <span className="font-semibold" style={{ color: "var(--ink-900)" }}>
                      {r.v}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </CardShell>
        </div>

        {/* detailed breakdown */}
        <h3 className="mt-8 mb-4 text-[18px] font-semibold" style={{ color: "var(--ink-900)" }}>
          Detailed usage breakdown
        </h3>
        <CardShell className="!p-6">
          <div className="grid grid-cols-1 gap-x-8 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
            {metrics.map((m) => (
              <MetricCard key={m.label} m={m} />
            ))}
          </div>
        </CardShell>
      </div>

      {/* composer pinned */}
      <div className="px-8 pb-6">
        <div className="mx-auto w-full max-w-[820px]">
          <ChatComposer />
        </div>
      </div>
    </div>
  );
}
