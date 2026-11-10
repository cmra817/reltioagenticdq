import * as React from "react";
import {
  X, Clock3, TriangleAlert, Table2, ListChecks, Activity, Rows3, Grid3x3,
  ArrowUp, MessagesSquare, Plus, Maximize2, Minimize2, PanelRightClose, Columns3, Check,
  ChevronDown, ChevronRight,
} from "lucide-react";
import { BandSparkline } from "./charts";
import { Thread, type ThreadMessage } from "./thread";
import type { PinPayload } from "./answers";
import {
  ACTIVITY_ROWS,
  ACTIVITY_HEATMAP,
  CHECK_GROUPS,
  CHECKS_SERIES,
  COLUMNS_ROWS,
  DUPE_ROWS,
  EVIDENCE_ITEMS,
  ROWS_SERIES,
  SAMPLE_COLUMNS,
  SAMPLE_ROWS,
  SAMPLE_TOTAL_ROWS,
  type EvidenceId,
  type CheckRunStatus,
} from "./data";

const toneColor = (tone: "red" | "amber" | "neutral") =>
  tone === "red" ? "var(--brand-red)" : tone === "amber" ? "#b45309" : "var(--ink-500)";

const EVIDENCE_ICON: Record<EvidenceId, React.ComponentType<{ size?: number; color?: string }>> = {
  duplicates: Rows3,
  sample: Grid3x3,
  profiling: Table2,
  checks: ListChecks,
  activity: Activity,
};

function SectionTitle({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-1">
      <span
        className="text-[11px] font-semibold uppercase tracking-wide"
        style={{ color: "var(--ink-300)" }}
      >
        {children}
      </span>
      {right}
    </div>
  );
}

type OverviewActivityItem = {
  label: string;
  value: string;
  stale?: boolean;
};

const OVERVIEW_ACTIVITY: OverviewActivityItem[] = [
  { label: "Last profiled", value: "6 hrs ago" },
  { label: "Checks run", value: "6 hrs ago" },
  { label: "Last synced", value: "14 hrs ago", stale: true },
];

type OverviewCard = {
  id: string;
  label: string;
  value: string;
  detail: string;
  warning?: boolean;
  values?: number[];
  band?: [number, number];
  evidence: EvidenceId;
};

const OVERVIEW_CARDS: OverviewCard[] = [
  {
    id: "columns",
    label: "Columns",
    value: "47",
    detail: "+2 columns since last run",
    warning: true,
    evidence: "profiling",
  },
  {
    id: "rows",
    label: "Rows",
    value: "4,897",
    detail: "+6% · outside normal range",
    warning: true,
    values: ROWS_SERIES,
    band: [0.05, 0.45],
    evidence: "profiling",
  },
  {
    id: "fill",
    label: "Fill rate",
    value: "85%",
    detail: "+1.2 pts · within range",
    values: [82.8, 83.2, 83.6, 83.9, 84.1, 84.4, 85],
    band: [0.05, 0.9],
    evidence: "profiling",
  },
  {
    id: "checks",
    label: "Checks passing",
    value: "20/21",
    detail: "Decreased 1 from last run",
    values: CHECKS_SERIES,
    evidence: "checks",
  },
];

function OverviewStatusCard({
  card,
  onOpen,
}: {
  card: OverviewCard;
  onOpen: (id: EvidenceId) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(card.evidence)}
      className="flex min-h-[132px] flex-col rounded-xl p-3 text-left transition-shadow hover:shadow-sm"
      style={{
        border: "1px solid var(--hairline)",
        background: "#fff",
      }}
    >
      <div className="flex items-center gap-1.5">
        {card.warning && <TriangleAlert size={12} color="var(--brand-red)" />}
        <span className="text-[11.5px]" style={{ color: "var(--ink-500)" }}>
          {card.label}
        </span>
      </div>
      <span
        className="mt-2 font-mono text-[23px] font-semibold leading-none"
        style={{ color: "var(--brand-blue)" }}
      >
        {card.value}
      </span>
      {card.values && (
        <div className="mt-2 h-7">
          <BandSparkline
            values={card.values}
            band={card.band}
            breaching={card.warning}
            height={28}
          />
        </div>
      )}
      <span
        className="mt-auto pt-2 text-[10.5px] leading-snug"
        style={{ color: card.warning ? "var(--brand-red)" : "var(--ink-500)" }}
      >
        {card.detail}
      </span>
    </button>
  );
}

function EvidenceTableShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="overflow-hidden rounded-xl"
      style={{ border: "1px solid var(--hairline)", background: "#fff" }}
    >
      {children}
    </div>
  );
}

function DuplicateRowsView({
  filter,
  onClearFilter,
  onScope,
}: {
  filter: string | null;
  onClearFilter: () => void;
  onScope: (id: string) => void;
}) {
  const rows = filter ? DUPE_ROWS.filter((r) => r.group === "sfdc") : DUPE_ROWS;
  return (
    <div className="flex flex-col gap-2">
      {filter && (
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-[11.5px]"
            style={{ background: "var(--surface-soft)", color: "var(--ink-700)" }}
          >
            {filter}
            <button type="button" onClick={onClearFilter} aria-label="Clear filter">
              <X size={12} />
            </button>
          </span>
        </div>
      )}
      <EvidenceTableShell>
        <table className="w-full text-[12px]">
          <thead>
            <tr style={{ color: "var(--ink-300)" }}>
              {["customer_id", "×", "source", "created", "updated"].map((h) => (
                <th key={h} className="px-3 py-2 text-left font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                onClick={() => onScope(r.id)}
                className="cursor-pointer hover:bg-[var(--surface-soft)]"
                style={{ borderTop: "1px solid var(--hairline)" }}
              >
                <td className="px-3 py-2 font-mono" style={{ color: "var(--ink-900)" }}>
                  {r.id}
                </td>
                <td className="px-3 py-2 font-mono" style={{ color: "var(--ink-700)" }}>
                  {r.times}
                </td>
                <td className="px-3 py-2" style={{ color: "var(--ink-700)" }}>
                  {r.source}
                </td>
                <td className="px-3 py-2 font-mono" style={{ color: "var(--ink-500)" }}>
                  {r.created}
                </td>
                <td
                  className="px-3 py-2 font-mono"
                  style={
                    r.created === r.updated
                      ? {
                          color: "var(--brand-red)",
                          background: "rgba(255,54,33,0.07)",
                          fontWeight: 600,
                        }
                      : { color: "var(--ink-500)" }
                  }
                >
                  {r.updated}
                </td>
              </tr>
            ))}
            <tr style={{ borderTop: "1px solid var(--hairline)" }}>
              <td className="px-3 py-2 text-[11.5px]" colSpan={5} style={{ color: "var(--ink-100)" }}>
                1,196 more
              </td>
            </tr>
          </tbody>
        </table>
      </EvidenceTableShell>
    </div>
  );
}

const SAMPLE_PAGE = 50;

export function SampleDataView() {
  const [count, setCount] = React.useState(SAMPLE_PAGE);
  const [visible, setVisible] = React.useState<string[]>(SAMPLE_COLUMNS);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement | null>(null);
  const sentinel = React.useRef<HTMLDivElement | null>(null);
  const hasMore = count < SAMPLE_ROWS.length;

  React.useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  React.useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setCount((c) => Math.min(c + SAMPLE_PAGE, SAMPLE_ROWS.length));
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, count]);

  const rows = SAMPLE_ROWS.slice(0, count);

  return (
    <div className="flex flex-col gap-2">
      <EvidenceTableShell>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr style={{ color: "var(--ink-300)" }}>
                {SAMPLE_COLUMNS.map((h) => (
                  <th key={h} className="whitespace-nowrap px-3 py-2 text-left font-mono font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} style={{ borderTop: "1px solid var(--hairline)" }}>
                  {row.map((cell, j) => (
                    <td
                      key={j}
                      className="whitespace-nowrap px-3 py-2 font-mono"
                      style={{ color: j === 0 ? "var(--ink-900)" : "var(--ink-700)" }}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </EvidenceTableShell>
      {hasMore ? (
        <div ref={sentinel} className="px-1 py-2 text-[11.5px]" style={{ color: "var(--ink-300)" }}>
          Loading more rows…
        </div>
      ) : null}
      <p className="px-1 text-[11.5px]" style={{ color: "var(--ink-300)" }}>
        {rows.length.toLocaleString()} of {SAMPLE_TOTAL_ROWS.toLocaleString()} rows · sampled 6 hours ago.
      </p>
    </div>
  );
}

const PROFILING_PAGE = 15;

const PROFILING_FIELDS: { id: string; label: string; get: (c: (typeof COLUMNS_ROWS)[number]) => string; mono?: boolean }[] = [
  { id: "type", label: "Data type", get: (c) => c.type },
  { id: "length", label: "Length", get: (c) => c.length, mono: true },
  { id: "min", label: "Min value", get: (c) => c.min, mono: true },
  { id: "max", label: "Max value", get: (c) => c.max, mono: true },
  { id: "mean", label: "Mean value", get: (c) => c.mean, mono: true },
  { id: "nulls", label: "Null count", get: (c) => c.nulls, mono: true },
  { id: "distinct", label: "Distinct count", get: (c) => c.distinct, mono: true },
  { id: "unique", label: "Uniqueness", get: (c) => c.unique, mono: true },
  { id: "fill", label: "Completeness", get: (c) => c.fill, mono: true },
];

export function ProfilingView({ onScope }: { onScope: (id: string) => void }) {
  const [count, setCount] = React.useState(PROFILING_PAGE);
  const [visible, setVisible] = React.useState<string[]>(PROFILING_FIELDS.map((f) => f.id));
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement | null>(null);
  const sentinel = React.useRef<HTMLDivElement | null>(null);
  const hasMore = count < COLUMNS_ROWS.length;

  React.useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  React.useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setCount((c) => Math.min(c + PROFILING_PAGE, COLUMNS_ROWS.length));
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, count]);

  const rows = COLUMNS_ROWS.slice(0, count);
  const cols = PROFILING_FIELDS.filter((f) => visible.includes(f.id));
  const toggle = (id: string) =>
    setVisible((v) => (v.includes(id) ? v.filter((x) => x !== id) : [...v, id]));

  return (
    <div className="flex flex-col gap-2">
      <div className="relative flex justify-end" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Show columns"
          className="flex h-7 w-7 items-center justify-center rounded-lg"
          style={{ border: "1px solid var(--hairline)", background: "#fff", color: "var(--ink-700)" }}
        >
          <Columns3 size={14} />
        </button>
        {menuOpen ? (
          <div
            className="absolute right-0 top-full z-20 mt-1 w-56 rounded-xl p-2"
            style={{ background: "#fff", border: "1px solid var(--hairline)", boxShadow: "0 18px 40px -18px rgba(67,67,112,0.5)" }}
          >
            <p className="px-2 py-1 text-[10.5px] font-semibold uppercase tracking-wide" style={{ color: "var(--ink-300)" }}>
              Show columns
            </p>
            {PROFILING_FIELDS.map((f) => {
              const on = visible.includes(f.id);
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => toggle(f.id)}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[12.5px] hover:bg-[var(--surface-soft)]"
                  style={{ color: "var(--ink-900)" }}
                >
                  <span
                    className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                    style={{
                      background: on ? "var(--ink-900)" : "transparent",
                      border: on ? "none" : "1px solid var(--hairline)",
                      color: "#fff",
                    }}
                  >
                    {on ? <Check size={10} strokeWidth={3} /> : null}
                  </span>
                  {f.label}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
      <EvidenceTableShell>
        <table className="w-full text-[12px]">
          <thead>
            <tr style={{ color: "var(--ink-300)" }}>
              <th className="px-3 py-2 text-left font-medium">Column</th>
              {cols.map((f) => (
                <th key={f.id} className="px-3 py-2 text-left font-medium whitespace-nowrap">
                  {f.label}
                </th>
              ))}
              <th className="px-3 py-2 text-left font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr
                key={c.name}
                onClick={() => onScope(c.name)}
                className="cursor-pointer hover:bg-[var(--surface-soft)]"
                style={{ borderTop: "1px solid var(--hairline)" }}
              >
                <td className="px-3 py-2 font-mono whitespace-nowrap" style={{ color: "var(--ink-900)" }}>
                  {c.name}
                </td>
                {cols.map((f) => (
                  <td
                    key={f.id}
                    className={`px-3 py-2 whitespace-nowrap ${f.mono ? "font-mono" : ""}`}
                    style={{ color: "var(--ink-700)" }}
                  >
                    {f.get(c)}
                  </td>
                ))}
                <td
                  className="px-3 py-2 whitespace-nowrap"
                  style={{ color: c.bad ? "var(--brand-red)" : "var(--ink-500)", fontWeight: c.bad ? 600 : 400 }}
                >
                  {c.bad && <TriangleAlert size={11} className="mr-1 inline" />}
                  {c.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </EvidenceTableShell>
      {hasMore ? (
        <div ref={sentinel} className="px-1 py-2 text-[11.5px]" style={{ color: "var(--ink-300)" }}>
          Loading more columns…
        </div>
      ) : null}
      <p className="px-1 text-[11.5px]" style={{ color: "var(--ink-300)" }}>
        {rows.length} of {COLUMNS_ROWS.length} columns · profiled 6 hours ago.
      </p>
    </div>
  );
}


const DIMENSION_STYLES = {
  Validity: { color: "#2563eb", background: "#eff6ff" },
  Completeness: { color: "#0f766e", background: "#ecfdf5" },
  Uniqueness: { color: "#be185d", background: "#fdf2f8" },
  Accuracy: { color: "#b45309", background: "#fff7ed" },
  Consistency: { color: "#7c3aed", background: "#f5f3ff" },
} as const;

const STATUS_STYLES: Record<CheckRunStatus, { color: string; background: string; border: string }> = {
  Passed: { color: "#047857", background: "#ecfdf5", border: "#a7f3d0" },
  Failed: { color: "var(--brand-red)", background: "#fff1ef", border: "#ffc7bf" },
  Warning: { color: "#b45309", background: "#fffbeb", border: "#fde68a" },
};

function StatusBadge({ status }: { status: CheckRunStatus }) {
  const style = STATUS_STYLES[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold"
      style={{ color: style.color, background: style.background, border: `1px solid ${style.border}` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: style.color }} />
      {status}
    </span>
  );
}

export function ChecksView() {
  const [expanded, setExpanded] = React.useState<Set<string>>(
    () => new Set(CHECK_GROUPS.filter((group) => group.expanded).map((group) => group.id)),
  );
  const toggle = (id: string) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <EvidenceTableShell>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] table-fixed text-[12px]">
            <colgroup>
              <col className="w-[34%]" />
              <col className="w-[17%]" />
              <col className="w-[11%]" />
              <col className="w-[13%]" />
              <col className="w-[12%]" />
              <col className="w-[13%]" />
            </colgroup>
            <thead>
              <tr className="uppercase" style={{ color: "var(--ink-300)", background: "var(--canvas)" }}>
                {["Name", "Dimension", "Coverage", "Last run", "Status", "Pass rate"].map((h) => (
                  <th key={h} className="whitespace-nowrap px-3 py-2.5 text-left text-[10.5px] font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CHECK_GROUPS.map((group) => {
                const isOpen = expanded.has(group.id);
                const dimensionStyle = DIMENSION_STYLES[group.dimension];
                return (
                  <React.Fragment key={group.id}>
                    <tr style={{ borderTop: "1px solid var(--hairline)" }}>
                      <td className="px-3 py-2.5">
                        <button
                          type="button"
                          onClick={() => toggle(group.id)}
                          aria-expanded={isOpen}
                          className="flex min-w-0 items-center gap-1.5 text-left font-semibold"
                          style={{ color: "var(--brand-blue)" }}
                        >
                          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          <span className="truncate">{group.name}</span>
                        </button>
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className="inline-flex whitespace-nowrap rounded-full px-2 py-1 text-[10.5px] font-semibold"
                          style={dimensionStyle}
                        >
                          {group.dimension}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-mono" style={{ color: "var(--ink-700)" }}>
                        <span className="inline-flex items-center gap-1.5"><Grid3x3 size={12} />{group.columns.length}</span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5" style={{ color: "var(--ink-500)" }}>{group.lastRun}</td>
                      <td className="px-3 py-2.5"><StatusBadge status={group.status} /></td>
                      <td className="whitespace-nowrap px-3 py-2.5 font-mono" style={{ color: "var(--ink-700)" }}>{group.passRate}</td>
                    </tr>
                    {isOpen && group.columns.map((column) => (
                      <tr key={`${group.id}-${column.column}`} style={{ borderTop: "1px solid var(--hairline)" }}>
                        <td className="px-3 py-2.5 pl-12 font-mono" style={{ color: "var(--ink-700)" }}>
                          <span className="inline-flex items-center gap-2 whitespace-nowrap">
                            <Check size={13} color={STATUS_STYLES[column.status].color} />
                            {column.column}
                          </span>
                        </td>
                        <td />
                        <td />
                        <td className="whitespace-nowrap px-3 py-2.5" style={{ color: "var(--ink-500)" }}>{column.lastRun}</td>
                        <td className="px-3 py-2.5"><StatusBadge status={column.status} /></td>
                        <td className="whitespace-nowrap px-3 py-2.5 font-mono" style={{ color: "var(--ink-700)" }}>{column.passRate}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </EvidenceTableShell>
      <p className="px-1 text-[11.5px]" style={{ color: "var(--ink-300)" }}>
        {CHECK_GROUPS.length} checks across {CHECK_GROUPS.reduce((total, group) => total + group.columns.length, 0)} columns · last run 2 hours ago.
      </p>
    </div>
  );
}

export function ActivityView() {
  const PAGE_SIZE = 18;
  const [count, setCount] = React.useState(PAGE_SIZE);
  const sentinel = React.useRef<HTMLDivElement | null>(null);
  const hasMore = count < ACTIVITY_ROWS.length;
  const rows = ACTIVITY_ROWS.slice(0, count);

  React.useEffect(() => {
    const element = sentinel.current;
    if (!element || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setCount((current) => Math.min(current + PAGE_SIZE, ACTIVITY_ROWS.length));
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [hasMore, count]);

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const heatColors = ["#e8edf4", "#d0f0dc", "#83d49d", "#168442"];

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl p-4" style={{ border: "1px solid var(--hairline)", background: "#fff" }}>
        <div className="mb-2 grid grid-cols-12 pl-7 text-[10.5px]" style={{ color: "var(--ink-500)" }}>
          {months.map((month) => <span key={month}>{month}</span>)}
        </div>
        <div className="flex gap-2">
          <div className="flex h-[78px] w-5 shrink-0 flex-col justify-between text-[10px]" style={{ color: "var(--ink-500)" }}>
            <span>Mon</span><span>Wed</span><span>Fri</span>
          </div>
          <div className="grid min-w-0 flex-1 grid-flow-col grid-rows-7 gap-1">
            {ACTIVITY_HEATMAP.map((value, index) => (
              <span
                key={index}
                className="aspect-square min-w-0 rounded-[2px]"
                style={{ background: heatColors[value] }}
                aria-label={`Week ${Math.floor(index / 7) + 1}, ${value === 0 ? "failed" : value === 3 ? "passed" : "mixed"}`}
              />
            ))}
          </div>
        </div>
        <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px]" style={{ color: "var(--ink-500)" }}>
          <span>Failed</span>
          {heatColors.map((color) => <span key={color} className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />)}
          <span>Passed</span>
        </div>
      </div>

      <EvidenceTableShell>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] table-fixed text-[12px]">
            <colgroup>
              <col className="w-[39%]" /><col className="w-[17%]" /><col className="w-[22%]" />
              <col className="w-[11%]" /><col className="w-[11%]" />
            </colgroup>
            <thead>
              <tr className="uppercase" style={{ color: "var(--ink-300)", background: "var(--canvas)" }}>
                {["Check", "Dimension", "Column", "Ran on", "Status"].map((heading) => (
                  <th key={heading} className="whitespace-nowrap px-3 py-2.5 text-left text-[10.5px] font-semibold">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((run, index) => {
                const showDay = index === 0 || rows[index - 1]?.day !== run.day;
                const dimensionStyle = DIMENSION_STYLES[run.dimension];
                return (
                  <React.Fragment key={run.id}>
                    {showDay ? (
                      <tr style={{ background: "var(--canvas)", borderTop: "1px solid var(--hairline)" }}>
                        <td colSpan={5} className="px-3 py-1.5 text-[10px] font-semibold uppercase" style={{ color: "var(--ink-500)" }}>{run.day}</td>
                      </tr>
                    ) : null}
                    <tr style={{ borderTop: "1px solid var(--hairline)" }}>
                      <td className="truncate px-3 py-2.5 font-mono" title={run.check} style={{ color: "var(--ink-900)" }}>{run.check}</td>
                      <td className="px-3 py-2.5">
                        <span className="inline-flex whitespace-nowrap rounded-full px-2 py-1 text-[10.5px] font-semibold" style={dimensionStyle}>{run.dimension}</span>
                      </td>
                      <td className="truncate px-3 py-2.5 font-mono" title={run.column} style={{ color: "var(--ink-700)" }}>{run.column}</td>
                      <td className="whitespace-nowrap px-3 py-2.5" style={{ color: "var(--ink-500)" }}>{run.ranOn}</td>
                      <td className="px-3 py-2.5"><StatusBadge status={run.status} /></td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </EvidenceTableShell>
      {hasMore ? <div ref={sentinel} className="px-1 py-2 text-[11.5px]" style={{ color: "var(--ink-300)" }}>Loading more runs…</div> : null}
      <p className="px-1 text-[11.5px]" style={{ color: "var(--ink-300)" }}>{rows.length} of {ACTIVITY_ROWS.length} check runs.</p>
    </div>
  );
}

// ---------- Tabbed panel (Cursor-style) ----------

export type WidthMode = "compact" | "docked" | "expanded";
export type PanelTab = "chat" | EvidenceId;

const EVIDENCE_LABEL: Record<EvidenceId, string> = {
  duplicates: "Duplicate rows",
  sample: "Sample data",
  profiling: "Column profiling",
  checks: "Checks",
  activity: "Activity",
};

const ADDABLE: EvidenceId[] = ["sample", "profiling", "checks", "activity", "duplicates"];

export function OverviewSection({ onOpen }: { onOpen: (id: EvidenceId) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <SectionTitle>Overview</SectionTitle>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-1">
        {OVERVIEW_ACTIVITY.map((item) => (
          <div key={item.label} className="flex items-baseline gap-1.5">
            <span className="text-[8.5px]" style={{ color: "var(--ink-300)" }}>
              {item.label}
            </span>
            <span
              className="flex items-center gap-1 whitespace-nowrap text-[10.5px] font-semibold"
              style={{ color: item.stale ? "#b45309" : "var(--ink-900)" }}
            >
              {item.stale && <Clock3 size={10} className="shrink-0" />}
              {item.value}
            </span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {OVERVIEW_CARDS.map((card) => (
          <OverviewStatusCard key={card.id} card={card} onOpen={onOpen} />
        ))}
      </div>
    </div>
  );
}

function EvidenceView({
  id,
  dupeFilter,
  onClearDupeFilter,
  onScope,
}: {
  id: EvidenceId;
  dupeFilter: string | null;
  onClearDupeFilter: () => void;
  onScope: (id: string) => void;
}) {
  switch (id) {
    case "duplicates":
      return (
        <DuplicateRowsView filter={dupeFilter} onClearFilter={onClearDupeFilter} onScope={onScope} />
      );
    case "sample":
      return <SampleDataView />;
    case "profiling":
      return <ProfilingView onScope={onScope} />;
    case "checks":
      return <ChecksView />;
    case "activity":
      return <ActivityView />;
  }
}

function PanelComposer({
  scopeLabel,
  onSubmit,
}: {
  scopeLabel: string | null;
  onSubmit: (q: string) => void;
}) {
  const [value, setValue] = React.useState("");
  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = value.trim();
    if (!q) return;
    onSubmit(q);
    setValue("");
  };
  return (
    <form
      onSubmit={submit}
      className="flex items-center gap-2 rounded-xl px-3 py-1.5"
      style={{
        background: "#E3E3F2",
        boxSizing: "border-box",
        minHeight: "40px",
        border: "1px solid rgba(0, 0, 204, 0.14)",
      }}
    >
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        rows={1}
        placeholder={scopeLabel ? `Ask about ${scopeLabel}…` : "Ask about this table…"}
        className="min-h-[24px] w-full flex-1 resize-none bg-transparent px-1 py-0.5 text-[13px] outline-none"
        style={{ color: "var(--ink-900)" }}
      />
      <div className="flex items-center">
        <button
          type="submit"
          aria-label="Send"
          className="flex h-7 w-7 items-center justify-center rounded-full"
          style={{ background: "var(--brand-blue)", color: "#fff" }}
        >
          <ArrowUp size={14} />
        </button>
      </div>
    </form>
  );
}

function EvidenceTabBar({
  tabs,
  activeTab,
  widthMode,
  onActivate,
  onCloseTab,
  onAddTab,
  onToggleExpand,
  onCollapse,
}: {
  tabs: EvidenceId[];
  activeTab: PanelTab;
  widthMode: WidthMode;
  onActivate: (t: PanelTab) => void;
  onCloseTab: (id: EvidenceId) => void;
  onAddTab: (id: EvidenceId) => void;
  onToggleExpand: () => void;
  onCollapse: () => void;
}) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const tabBase =
    "inline-flex shrink-0 items-center gap-1.5 rounded-t-lg px-3 py-2 text-[12px] font-medium";

  return (
    <div
      className="flex items-center gap-0.5 border-b"
      style={{ borderColor: "var(--hairline)", background: "rgba(255,255,255,0.85)" }}
    >
      <div className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto">
        {widthMode === "expanded" && (
          <button
            type="button"
            onClick={() => onActivate("chat")}
            className={tabBase}
            style={{
              color: activeTab === "chat" ? "var(--ink-900)" : "var(--ink-500)",
              background: activeTab === "chat" ? "#fff" : "transparent",
              boxShadow: activeTab === "chat" ? "inset 0 2px 0 0 var(--brand-blue)" : "none",
            }}
          >
            <MessagesSquare size={13} />
            Chat
          </button>
        )}
        {tabs.map((id) => {
          const Icon = EVIDENCE_ICON[id];
          const active = activeTab === id;
          return (
            <span
              key={id}
              className={`${tabBase} cursor-pointer`}
              style={{
                color: active ? "var(--ink-900)" : "var(--ink-500)",
                background: active ? "#fff" : "transparent",
                boxShadow: active ? "inset 0 2px 0 0 var(--brand-blue)" : "none",
              }}
            >
              <button
                type="button"
                onClick={() => onActivate(id)}
                className="inline-flex items-center gap-1.5"
              >
                <Icon size={13} />
                {EVIDENCE_LABEL[id]}
              </button>
              <button
                type="button"
                onClick={() => onCloseTab(id)}
                aria-label={`Close ${EVIDENCE_LABEL[id]}`}
                className="ml-0.5 rounded p-0.5 hover:bg-[var(--surface-soft)]"
              >
                <X size={11} />
              </button>
            </span>
          );
        })}
      </div>

      <div className="flex shrink-0 items-center gap-0.5 px-1">
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Open another view"
            className="inline-flex items-center justify-center rounded-lg p-1.5 hover:bg-[var(--surface-soft)]"
            style={{ color: "var(--ink-500)" }}
          >
            <Plus size={14} />
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 top-full z-20 mt-1 w-48 overflow-hidden rounded-xl py-1"
              style={{
                border: "1px solid var(--hairline)",
                background: "#fff",
                boxShadow: "0 8px 24px -8px rgba(14,14,37,0.18)",
              }}
            >
              {ADDABLE.map((id) => {
                const Icon = EVIDENCE_ICON[id];
                const open = tabs.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      onAddTab(id);
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12.5px] hover:bg-[var(--surface-soft)]"
                    style={{ color: open ? "var(--ink-300)" : "var(--ink-700)" }}
                  >
                    <Icon size={13} color={open ? "var(--ink-200)" : "var(--ink-300)"} />
                    <span className="flex-1">{EVIDENCE_LABEL[id]}</span>
                    {open && <span className="text-[10px]">Open</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onToggleExpand}
          aria-label={widthMode === "expanded" ? "Restore panel" : "Expand panel"}
          className="rounded-lg p-1.5 hover:bg-[var(--surface-soft)]"
          style={{ color: "var(--ink-500)" }}
        >
          {widthMode === "expanded" ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>
        <button
          type="button"
          onClick={onCollapse}
          aria-label="Collapse panel"
          className="rounded-lg p-1.5 hover:bg-[var(--surface-soft)]"
          style={{ color: "var(--ink-500)" }}
        >
          <PanelRightClose size={14} />
        </button>
      </div>
    </div>
  );
}

export function EvidencePanel({
  tabs,
  activeTab,
  widthMode,
  onOpenTab,
  onActivateTab,
  onCloseTab,
  onToggleExpand,
  onCollapse,
  messages,
  onAsk,
  onPin,
  onScope,
  dupeFilter,
  onClearDupeFilter,
}: {
  tabs: EvidenceId[];
  activeTab: PanelTab;
  widthMode: WidthMode;
  onOpenTab: (id: EvidenceId) => void;
  onActivateTab: (t: PanelTab) => void;
  onCloseTab: (id: EvidenceId) => void;
  onToggleExpand: () => void;
  onCollapse: () => void;
  messages: ThreadMessage[];
  onAsk: (q: string) => void;
  onPin: (p: PinPayload) => void;
  onScope: (id: string) => void;
  dupeFilter: string | null;
  onClearDupeFilter: () => void;
}) {
  const tabbed = widthMode !== "compact";

  if (!tabbed) {
    return (
      <aside
        className="flex h-full shrink-0 flex-col gap-4 overflow-y-auto border-l px-4 pb-4 pt-2 transition-[width] duration-200"
        style={{ width: 300, borderColor: "var(--hairline)", background: "rgba(255,255,255,0.7)" }}
      >
        <OverviewSection onOpen={onOpenTab} />
        <div className="flex flex-col gap-2">
          <SectionTitle>Evidence</SectionTitle>
          <div
            className="overflow-hidden rounded-xl"
            style={{ border: "1px solid var(--hairline)", background: "#fff" }}
          >
            {EVIDENCE_ITEMS.map((e, i) => {
              const Icon = EVIDENCE_ICON[e.id];
              return (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => onOpenTab(e.id)}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[12.5px] hover:bg-[var(--surface-soft)]"
                  style={{ borderTop: i === 0 ? "none" : "1px solid var(--hairline)" }}
                >
                  <Icon size={14} color="var(--ink-300)" />
                  <span className="flex-1" style={{ color: "var(--ink-700)" }}>
                    {e.label}
                  </span>
                  <span className="font-mono" style={{ color: toneColor(e.tone) }}>
                    {e.count}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="px-1 text-[11px] leading-snug" style={{ color: "var(--ink-100)" }}>
            Observed facts only. What the agent makes of them is in the middle.
          </p>
        </div>
      </aside>
    );
  }

  return (
    <aside
      className="flex h-full min-w-0 shrink-0 flex-col border-l transition-[width] duration-200"
      style={{
        width: widthMode === "expanded" ? undefined : "50vw",
        flex: widthMode === "expanded" ? "1 1 0%" : undefined,
        borderColor: "var(--hairline)",
        background: "rgba(255,255,255,0.7)",
      }}
    >
      <EvidenceTabBar
        tabs={tabs}
        activeTab={activeTab}
        widthMode={widthMode}
        onActivate={onActivateTab}
        onCloseTab={onCloseTab}
        onAddTab={onOpenTab}
        onToggleExpand={onToggleExpand}
        onCollapse={onCollapse}
      />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-3 pt-3">
        <div>
          {activeTab === "chat" ? (
            <Thread messages={messages} onAsk={onAsk} onPin={onPin} />
          ) : (
            <EvidenceView
              id={activeTab}
              dupeFilter={dupeFilter}
              onClearDupeFilter={onClearDupeFilter}
              onScope={onScope}
            />
          )}
        </div>
      </div>
      {widthMode === "expanded" && (
        <div className="mx-auto w-full max-w-2xl shrink-0 px-4 pb-3 pt-2">
          <PanelComposer
            scopeLabel={activeTab === "chat" ? null : EVIDENCE_LABEL[activeTab]}
            onSubmit={(q) => {
              onAsk(q);
              onActivateTab("chat");
            }}
          />
        </div>
      )}
    </aside>
  );
}
