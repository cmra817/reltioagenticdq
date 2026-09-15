import * as React from "react";
import { X, Flag, TriangleAlert, Table2, ListChecks, Activity, Rows3, Grid3x3 } from "lucide-react";
import { BandSparkline, LineChart } from "./charts";
import {
  ACTIVITY_ROWS,
  AUG19,
  CHECK_ROWS,
  COLUMNS_ROWS,
  DISTINCT_SERIES,
  DUPE_ROWS,
  EVIDENCE_ITEMS,
  METRIC_TILES,
  ROWS_SERIES,
  SAMPLE_COLUMNS,
  SAMPLE_ROWS,
  SIBLING_SERIES,
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

function MetricTileCard({
  tile,
  onOpen,
}: {
  tile: (typeof METRIC_TILES)[number];
  onOpen: (id: EvidenceId) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(tile.evidence)}
      className="flex flex-col gap-1.5 rounded-xl p-3 text-left transition-shadow hover:shadow-sm"
      style={{
        border: tile.breaching ? "1px solid rgba(255,54,33,0.35)" : "1px solid var(--hairline)",
        background: "#fff",
      }}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="truncate text-[11px]" style={{ color: "var(--ink-300)" }}>
          {tile.label}
        </span>
        {tile.breaching && (
          <span
            className="inline-flex items-center gap-1 rounded px-1 py-0.5 text-[9.5px] font-semibold uppercase"
            style={{ background: "rgba(255,54,33,0.10)", color: "var(--brand-red)" }}
          >
            <Flag size={9} /> band
          </span>
        )}
      </div>
      <span
        className="font-mono text-[20px] font-semibold leading-none"
        style={{ color: tile.breaching ? "var(--brand-red)" : "var(--ink-900)" }}
      >
        {tile.value}
      </span>
      <BandSparkline values={tile.values} band={tile.band} breaching={tile.breaching} height={28} />
      <span
        className="text-[11px] leading-tight"
        style={{ color: tile.breaching ? "var(--brand-red)" : "var(--ink-500)" }}
      >
        {tile.delta}
      </span>
    </button>
  );
}

function AnomalyCard({
  caption,
  meta,
  title,
  chart,
  onClick,
}: {
  caption: string;
  meta: string;
  title: string;
  chart: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl p-3 text-left transition-shadow hover:shadow-sm"
      style={{
        border: "1px solid var(--hairline)",
        borderLeft: "3px solid var(--brand-blue-bright)",
        background: "#fff",
      }}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[12px]" style={{ color: "var(--ink-900)" }}>
          {title}
        </span>
        <span className="text-[11px]" style={{ color: "var(--ink-300)" }}>
          {meta}
        </span>
      </div>
      <div className="mt-2">{chart}</div>
      <p className="mt-2 text-[11.5px] leading-snug" style={{ color: "var(--ink-500)" }}>
        {caption}
      </p>
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

function ColumnsView({ onScope }: { onScope: (id: string) => void }) {
  return (
    <EvidenceTableShell>
      <table className="w-full text-[12px]">
        <thead>
          <tr style={{ color: "var(--ink-300)" }}>
            {["Column", "Type", "Fill", "Unique", "Status"].map((h) => (
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

function TrendView() {
  return (
    <div
      className="rounded-xl p-3"
      style={{ border: "1px solid var(--hairline)", background: "#fff" }}
    >
      <LineChart
        height={180}
        markerIndex={AUG19}
        markerLabel="Aug 19"
        series={[
          { label: "rows +6%", values: ROWS_SERIES, color: "var(--brand-red)" },
          { label: "distinct flat", values: DISTINCT_SERIES, color: "var(--brand-blue)" },
        ]}
      />
      <p className="mt-2 text-[12px]" style={{ color: "var(--ink-500)" }}>
        The two lines tracked each other until Aug 19 and haven't since.
      </p>
    </div>
  );
}

function SchemaView() {
  return (
    <div
      className="rounded-xl p-3"
      style={{ border: "1px solid var(--hairline)", background: "#fff" }}
    >
      <p className="text-[13px]" style={{ color: "var(--ink-900)" }}>
        No schema changes in 90 days.
      </p>
      <p className="mt-1 text-[12px]" style={{ color: "var(--ink-300)" }}>
        Worth noting — this rules out a column change as the cause.
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
  onAsk,
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

      <div className="grid grid-cols-2 gap-2">
        {METRIC_TILES.map((t) => (
          <MetricTileCard key={t.id} tile={t} onOpen={onOpen} />
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <SectionTitle
          right={
            <span
              className="rounded-full px-1.5 py-0.5 text-[10.5px] font-semibold"
              style={{ background: "rgba(41,181,232,0.14)", color: "#0e7490" }}
            >
              2
            </span>
          }
        >
          Anomalies
        </SectionTitle>
        <AnomalyCard
          title="rows vs distinct"
          meta="21 days"
          onClick={() => onAsk("How bad is this on a join?")}
          caption="Row count climbing, distinct customers flat. Diverging since Aug 19."
          chart={
            <LineChart
              height={56}
              showLegend={false}
              markerIndex={AUG19}
              series={[
                { label: "rows", values: ROWS_SERIES, color: "var(--brand-blue-bright)" },
                { label: "distinct", values: DISTINCT_SERIES, color: "var(--ink-300)" },
              ]}
            />
          }
        />
        <AnomalyCard
          title="connector-wide"
          meta="Aug 19"
          onClick={() => onAsk("Check the sibling tables")}
          caption="Three SFDC-fed tables take the same turn on the same day. Only this one had a check."
          chart={
            <LineChart
              height={56}
              showLegend={false}
              markerIndex={AUG19}
              series={[
                { label: "customer_data", values: SIBLING_SERIES.customer_data, color: "var(--brand-blue-bright)" },
                { label: "contact_master", values: SIBLING_SERIES.contact_master, color: "var(--brand-blue-bright)", opacity: 0.6 },
                { label: "account_roll", values: SIBLING_SERIES.account_roll, color: "var(--brand-blue-bright)", opacity: 0.35 },
              ]}
            />
          }
        />
        <button
          type="button"
          onClick={() => onAsk("Why did the check only fire now?")}
          className="w-full rounded-lg py-1.5 text-[12px]"
          style={{ color: "var(--brand-blue)" }}
        >
          Ask about these
        </button>
      </div>

      {/* Evidence launcher or the open view */}
      {openView ? (
        <div className="flex flex-col gap-2">
          <SectionTitle>{EVIDENCE_ITEMS.find((e) => e.id === openView)?.label}</SectionTitle>
          {openView === "duplicates" && (
            <DuplicateRowsView filter={dupeFilter} onClearFilter={onClearDupeFilter} onScope={onScope} />
          )}
          {openView === "columns" && <ColumnsView onScope={onScope} />}
          {openView === "checks" && <ChecksView />}
          {openView === "trend" && <TrendView />}
          {openView === "schema" && <SchemaView />}
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
