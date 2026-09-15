import * as React from "react";
import { X, Clock3, Info, TriangleAlert, Table2, ListChecks, Activity, Rows3, Grid3x3 } from "lucide-react";
import { BandSparkline } from "./charts";
import {
  ACTIVITY_ROWS,
  CHECK_ROWS,
  CHECKS_SERIES,
  COLUMNS_ROWS,
  DUPE_ROWS,
  EVIDENCE_ITEMS,
  ROWS_SERIES,
  SAMPLE_COLUMNS,
  SAMPLE_ROWS,
  type EvidenceId,
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

const OVERVIEW_ACTIVITY = [
  { label: "Last profiled", value: "6 hrs ago" },
  { label: "Checks run", value: "6 hrs ago" },
  { label: "Last synced", value: "14 hrs ago", stale: true },
  { label: "Loaded to Reltio", value: "3 days ago" },
] as const;

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

function SampleDataView() {
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
              {SAMPLE_ROWS.map((row, i) => (
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
      <p className="px-1 text-[11.5px]" style={{ color: "var(--ink-300)" }}>
        10 of 4,897 rows · sampled 6 hours ago.
      </p>
    </div>
  );
}

function ProfilingView({ onScope }: { onScope: (id: string) => void }) {
  return (
    <EvidenceTableShell>
      <table className="w-full text-[12px]">
        <thead>
          <tr style={{ color: "var(--ink-300)" }}>
            {["Column", "Type", "Completeness", "Unique", "Status"].map((h) => (
              <th key={h} className="px-3 py-2 text-left font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {COLUMNS_ROWS.map((c) => (
            <tr
              key={c.name}
              onClick={() => onScope(c.name)}
              className="cursor-pointer hover:bg-[var(--surface-soft)]"
              style={{ borderTop: "1px solid var(--hairline)" }}
            >
              <td className="px-3 py-2 font-mono" style={{ color: "var(--ink-900)" }}>
                {c.name}
              </td>
              <td className="px-3 py-2" style={{ color: "var(--ink-500)" }}>
                {c.type}
              </td>
              <td className="px-3 py-2 font-mono" style={{ color: "var(--ink-700)" }}>
                {c.fill}
              </td>
              <td className="px-3 py-2 font-mono" style={{ color: "var(--ink-700)" }}>
                {c.unique}
              </td>
              <td
                className="px-3 py-2"
                style={{ color: c.bad ? "var(--brand-red)" : "var(--ink-500)", fontWeight: c.bad ? 600 : 400 }}
              >
                {c.bad && <TriangleAlert size={11} className="mr-1 inline" />}
                {c.status}
              </td>
            </tr>
          ))}
          <tr style={{ borderTop: "1px solid var(--hairline)" }}>
            <td className="px-3 py-2 text-[11.5px]" colSpan={5} style={{ color: "var(--ink-100)" }}>
              39 more columns
            </td>
          </tr>
        </tbody>
      </table>
    </EvidenceTableShell>
  );
}

function ChecksView() {
  return (
    <div className="flex flex-col gap-2">
      <EvidenceTableShell>
        <table className="w-full text-[12px]">
          <thead>
            <tr style={{ color: "var(--ink-300)" }}>
              {["Check", "Column", "Result"].map((h) => (
                <th key={h} className="px-3 py-2 text-left font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CHECK_ROWS.map((c, i) => (
              <tr key={`${c.check}-${i}`} style={{ borderTop: "1px solid var(--hairline)" }}>
                <td className="px-3 py-2 font-mono" style={{ color: "var(--ink-900)" }}>
                  {c.check}
                </td>
                <td className="px-3 py-2 font-mono" style={{ color: "var(--ink-700)" }}>
                  {c.column}
                </td>
                <td
                  className="px-3 py-2"
                  style={{ color: c.bad ? "var(--brand-red)" : "var(--ink-500)", fontWeight: c.bad ? 600 : 400 }}
                >
                  {c.result}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </EvidenceTableShell>
      <p className="px-1 text-[11.5px]" style={{ color: "var(--ink-300)" }}>
        Threshold on the uniqueness check is 1,000 rows. It was crossed Tuesday.
      </p>
    </div>
  );
}

function ActivityView() {
  return (
    <EvidenceTableShell>
      {ACTIVITY_ROWS.map((a, i) => (
        <div
          key={a.text}
          className="flex items-center justify-between px-3 py-2.5 text-[12px]"
          style={{ borderTop: i === 0 ? "none" : "1px solid var(--hairline)" }}
        >
          <span style={{ color: toneColor(a.tone) }}>{a.text}</span>
          <span style={{ color: "var(--ink-300)" }}>{a.when}</span>
        </div>
      ))}
    </EvidenceTableShell>
  );
}

export function EvidencePanel({
  openView,
  onOpen,
  onClose,
  onScope,
  dupeFilter,
  onClearDupeFilter,
}: {
  openView: EvidenceId | null;
  onOpen: (id: EvidenceId) => void;
  onClose: () => void;
  onAsk: (q: string) => void;
  onScope: (id: string) => void;
  dupeFilter: string | null;
  onClearDupeFilter: () => void;
}) {
  return (
    <aside
      className="flex h-full shrink-0 flex-col gap-4 overflow-y-auto border-l px-4 py-4 transition-[width] duration-200"
      style={{
        width: openView ? 545 : 300,
        borderColor: "var(--hairline)",
        background: "rgba(255,255,255,0.7)",
      }}
    >
      {/* Overview — always visible */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-[13px] font-semibold" style={{ color: "var(--ink-900)" }}>
          customer_data
        </span>
        {openView && (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1 text-[12px]"
            style={{ color: "var(--ink-500)" }}
          >
            <X size={13} /> Close
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <SectionTitle>Overview</SectionTitle>
        <div
          className="grid grid-cols-4 divide-x rounded-xl px-1 py-2.5"
          style={{ border: "1px solid var(--hairline)", background: "#fff" }}
        >
          {OVERVIEW_ACTIVITY.map((item) => (
            <div key={item.label} className="min-w-0 px-1.5">
              <div className="flex items-center gap-1 whitespace-nowrap text-[8.5px]" style={{ color: "var(--ink-300)" }}>
                <span>{item.label}</span>
                <Info size={9} className="shrink-0" />
              </div>
              <div
                className="mt-1 flex items-center gap-1 whitespace-nowrap text-[10.5px] font-semibold"
                style={{ color: item.stale ? "#b45309" : "var(--ink-900)" }}
              >
                {item.stale && <Clock3 size={10} className="shrink-0" />}
                {item.value}
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {OVERVIEW_CARDS.map((card) => (
            <OverviewStatusCard key={card.id} card={card} onOpen={onOpen} />
          ))}
        </div>
      </div>

      {/* Evidence launcher or the open view */}
      {openView ? (
        <div className="flex flex-col gap-2">
          <SectionTitle>{EVIDENCE_ITEMS.find((e) => e.id === openView)?.label}</SectionTitle>
          {openView === "duplicates" && (
            <DuplicateRowsView filter={dupeFilter} onClearFilter={onClearDupeFilter} onScope={onScope} />
          )}
          {openView === "sample" && <SampleDataView />}
          {openView === "profiling" && <ProfilingView onScope={onScope} />}
          {openView === "checks" && <ChecksView />}
          {openView === "activity" && <ActivityView />}
        </div>
      ) : (
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
                  onClick={() => onOpen(e.id)}
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
      )}
    </aside>
  );
}
