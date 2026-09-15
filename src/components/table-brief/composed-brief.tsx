import * as React from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { LineChart, StackedBar } from "./charts";
import {
  AUG19,
  DISTINCT_SERIES,
  DUPE_ALERT_THRESHOLD,
  DUPE_BREAKDOWN,
  DUPE_COUNT_SERIES,
  ROWS_SERIES,
  SIBLING_CARDS,
  SIBLING_DISTINCT,
  SIBLING_SERIES,
} from "./data";
import type { PinPayload } from "./answers";
import { ActionButtons } from "./thread";
import type { EvidenceId } from "./data";


export type Pin = PinPayload & { id: string; fresh?: boolean };

function Badge({ kind }: { kind: "check" | "anomaly" }) {
  const check = kind === "check";
  return (
    <span
      className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
      style={
        check
          ? { background: "rgba(255,54,33,0.10)", color: "var(--brand-red)" }
          : { background: "rgba(41,181,232,0.14)", color: "#0e7490" }
      }
    >
      {check ? "check failing" : "anomaly"}
    </span>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div
      className="flex-1 rounded-lg px-2.5 py-2"
      style={{ border: "1px solid var(--hairline)", background: "var(--surface-soft)" }}
    >
      <div className="font-mono text-[17px] font-semibold" style={{ color: "var(--ink-900)" }}>
        {value}
      </div>
      <div className="text-[11px]" style={{ color: "var(--ink-500)" }}>
        {label}
      </div>
    </div>
  );
}

function FindingCard({
  label,
  title,
  kind,
  chart,
  detail,
  actions,
  open,
  onToggle,
}: {
  label: string;
  title: string;
  kind: "check" | "anomaly";
  chart: React.ReactNode;
  detail: React.ReactNode;
  actions: React.ReactNode;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className="rounded-xl px-3 py-3"
      style={{ border: "1px solid var(--hairline)", background: "#fff" }}
    >
      <div className="flex items-start gap-3">
        <span
          className="w-[76px] shrink-0 pt-0.5 text-[9.5px] font-semibold uppercase leading-[1.25] tracking-wide"
          style={{ color: "var(--ink-300)" }}
        >
          {label}
        </span>
        <span className="flex-1 text-[13px] leading-snug" style={{ color: "var(--ink-900)" }}>
          {title}
        </span>
        <Badge kind={kind} />
      </div>

      <div className="mt-3">{chart}</div>

      <button
        type="button"
        onClick={onToggle}
        className="mt-3 inline-flex items-center gap-1 text-[12px]"
        style={{ color: "var(--brand-blue)" }}
      >
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        {open ? "Hide details" : "Details"}
      </button>

      {open && <div className="mt-2 flex flex-col gap-3">{detail}</div>}

      <div className="mt-3">{actions}</div>
    </div>
  );
}


function Group({
  count,
  title,
  tag,
  body,
}: {
  count: string;
  title: string;
  tag?: string;
  body: string;
}) {
  return (
    <div className="flex gap-3">
      <span
        className="w-[56px] shrink-0 font-mono text-[20px] font-semibold leading-tight"
        style={{ color: "var(--ink-900)" }}
      >
        {count}
      </span>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium" style={{ color: "var(--ink-900)" }}>
            {title}
          </span>
          {tag && (
            <span
              className="rounded px-1.5 py-0.5 text-[10px]"
              style={{ background: "var(--surface-soft)", color: "var(--ink-500)" }}
            >
              {tag}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-[12.5px] leading-relaxed" style={{ color: "var(--ink-700)" }}>
          {body}
        </p>
      </div>
    </div>
  );
}

export function ComposedBrief({
  collapsed,
  onToggleCollapsed,
  pins,
  onRemovePin,
  onPin,
  onAsk,
  onOpenEvidence,
}: {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  pins: Pin[];
  onRemovePin: (id: string) => void;
  onPin: (p: PinPayload) => void;
  onAsk: (q: string) => void;
  onOpenEvidence: (id: EvidenceId) => void;
}) {
  const [open, setOpen] = React.useState<Record<string, boolean>>({});
  const toggle = (k: string) => setOpen((o) => ({ ...o, [k]: !o[k] }));

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={onToggleCollapsed}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left"
        style={{ border: "1px solid var(--hairline)", background: "#fff" }}
      >
        <span className="font-mono text-[13px]" style={{ color: "var(--ink-900)" }}>
          customer_data
        </span>
        <span
          className="rounded px-1.5 py-0.5 text-[10.5px] font-semibold"
          style={{ background: "var(--surface-soft)", color: "var(--ink-700)" }}
        >
          3 findings
        </span>
        <span className="flex-1 truncate text-[12.5px]" style={{ color: "var(--ink-300)" }}>
          1,204 duplicates · growth is fake · 2 siblings affected
        </span>
        <span className="text-[12px]" style={{ color: "var(--brand-blue)" }}>
          Expand
        </span>
      </button>
    );
  }

  return (
    <div className="flex flex-col px-1 py-2">
      <p className="text-[15px] leading-relaxed" style={{ color: "var(--ink-900)" }}>
        This table is stable in shape — schema unchanged, 44 of 47 columns profiling normally, 20 of
        21 checks passing. What it isn't is stable in content. Since Aug 19 the row count has climbed
        6% while the number of distinct customers hasn't moved, and customer_id now carries 1,204
        repeated values. Those two facts are the same event: the table is accumulating copies, not
        customers. The duplicates split into three unrelated causes, and two sibling tables on the
        same connector show the identical break on the same day — so the origin is upstream of this
        table, not in it.
      </p>

      <div className="mt-4 flex items-center gap-2">
        <span className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: "var(--ink-500)" }}>
          What's driving it
        </span>
        <span className="text-[12px]" style={{ color: "var(--ink-300)" }}>
          · 3 findings
        </span>
      </div>


      <div className="mt-2 flex flex-col gap-3">
        <FindingCard
          label="Two metrics"
          kind="anomaly"
          title="Rows are climbing. Distinct customers are not."
          open={!!open.f1}
          onToggle={() => toggle("f1")}
          chart={
            <>
              <LineChart
                height={150}
                markerIndex={AUG19}
                markerLabel="Aug 19"
                yLabels={["Total rows", "Distinct customer_id"]}
                series={[
                  { label: "Total rows", values: ROWS_SERIES, color: "var(--brand-blue-bright)" },
                  { label: "Distinct customer_id", values: DISTINCT_SERIES, color: "var(--brand-blue)" },
                ]}
              />
              <div className="mt-3 flex gap-3">
                <Stat value="+287" label="rows since Aug 19" />
                <Stat value="+5" label="distinct customers since Aug 19" />
              </div>
            </>
          }
          detail={
            <p className="text-[12.5px]" style={{ color: "var(--ink-700)" }}>
              Neither line is alarming on its own — together they only have one explanation. The
              table gained rows, not customers, and anything counting this table has been counting
              up for three weeks.
            </p>
          }
          actions={
            <ActionButtons
              onAsk={onAsk}
              onPin={onPin}
              actions={[
                {
                  label: "Pin ↑",
                  primary: true,
                  pin: { title: "Growth is fake", value: "+6%", sub: "rows up · distinct flat" },
                },
                { label: "How bad is this on a join?", ask: "How bad is this on a join?" },
              ]}
            />
          }
        />

        <FindingCard
          label="Duplicate rows"
          kind="check"
          title="1,204 rows now carry a repeated customer_id — up from 40 on Aug 19."
          open={!!open.f2}
          onToggle={() => toggle("f2")}
          chart={
            <>
              <LineChart
                height={150}
                markerIndex={AUG19}
                markerLabel="Aug 19"
                showLegend={false}
                threshold={DUPE_ALERT_THRESHOLD}
                thresholdLabel="alert threshold · 1,000"
                series={[
                  { label: "Rows with duplicate customer_id", values: DUPE_COUNT_SERIES, color: "var(--brand-red)" },
                ]}
              />
              <p className="mt-2 text-[12px]" style={{ color: "var(--ink-300)" }}>
                The curve crossed the threshold this week — the drift started three weeks earlier.
              </p>
              <div className="mt-3">
                <StackedBar segments={DUPE_BREAKDOWN} total={1204} />
              </div>
            </>
          }
          detail={
            <>
              <Group
                count="900"
                title="Re-inserts from SFDC"
                tag="new"
                body="All source_system = SFDC, created in the last 21 days, updated_at never changed — so these are fresh inserts, not edits. This is the connector."
              />
              <Group
                count="300"
                title="Test records"
                tag="months old"
                body="IDs prefixed TEST_, from LEGACY. Present long before this and unrelated to it. Filter at the loader when convenient."
              />
              <Group
                count="4"
                title="Genuine ID collisions"
                body="Two source systems assigned the same identifier to different people. I can't tell which is correct — that needs whoever owns ID assignment."
              />
            </>
          }
          actions={
            <ActionButtons
              onAsk={onAsk}
              onPin={onPin}
              actions={[
                { label: "Investigate the 900", primary: true, ask: "Investigate the SFDC re-inserts" },
                { label: "See the rows" },
                { label: "Propose a rule", ask: "Prevent this" },
              ]}
            />
          }
        />

        <FindingCard
          label="Sibling tables"
          kind="anomaly"
          title="contact_master and account_roll break the same way, the same day."
          open={!!open.f3}
          onToggle={() => toggle("f3")}
          chart={
            <div className="grid grid-cols-3 gap-3">
              {SIBLING_CARDS.map((s) => (
                <div
                  key={s.name}
                  className="rounded-lg p-2"
                  style={{ border: "1px solid var(--hairline)", background: "#fff" }}
                >
                  <div className="font-mono text-[11.5px]" style={{ color: "var(--ink-900)" }}>
                    {s.name}
                  </div>
                  <LineChart
                    height={78}
                    markerIndex={AUG19}
                    showLegend={false}
                    series={[
                      { label: `${s.name} rows`, values: SIBLING_SERIES[s.name], color: "var(--brand-blue-bright)" },
                      { label: `${s.name} distinct`, values: SIBLING_DISTINCT[s.name], color: "var(--brand-blue)" },
                    ]}
                  />
                  <div className="mt-1 text-[11px]" style={{ color: "var(--ink-500)" }}>
                    {s.read}
                  </div>
                  {s.tag && (
                    <div className="mt-1 text-[10.5px]" style={{ color: "var(--ink-300)" }}>
                      {s.tag}
                    </div>
                  )}
                </div>
              ))}
            </div>
          }
          detail={
            <p className="text-[12.5px]" style={{ color: "var(--ink-700)" }}>
              All three are fed by the SFDC connector and all three start diverging on Aug 19.
              Neither sibling has a uniqueness check, so neither surfaced anything. That makes this
              one upstream cause, not three table problems — and fixing it here wouldn't have fixed
              the other two.
            </p>
          }
          actions={
            <ActionButtons
              onAsk={onAsk}
              onPin={onPin}
              actions={[
                { label: "Compare all three", primary: true, ask: "Check the sibling tables" },
                {
                  label: "Pin ↑",
                  pin: { title: "Siblings affected", value: "2", sub: "contact_master · account_roll" },
                },
              ]}
            />
          }
        />
      </div>


      <p className="mt-3 text-[12.5px]" style={{ color: "var(--ink-300)" }}>
        44 other columns — nothing needed you.{" "}
        <button
          type="button"
          onClick={() => onOpenEvidence("profiling")}
          style={{ color: "var(--brand-blue)" }}
        >
          Show all
        </button>
      </p>

      {pins.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {pins.map((p) => (
            <div
              key={p.id}
              className="relative min-w-[150px] rounded-xl px-3 py-2 transition-colors"
              style={{
                border: p.fresh ? "1px solid var(--brand-blue)" : "1px solid var(--hairline)",
                background: p.fresh ? "rgba(67,134,250,0.06)" : "#fff",
              }}
            >
              <div className="text-[10.5px] uppercase tracking-wide" style={{ color: "var(--ink-300)" }}>
                {p.title}
              </div>
              <div className="font-mono text-[18px] font-semibold" style={{ color: "var(--ink-900)" }}>
                {p.value}
              </div>
              <div className="text-[11px]" style={{ color: "var(--ink-500)" }}>
                {p.sub}
              </div>
              <button
                type="button"
                onClick={() => onRemovePin(p.id)}
                aria-label={`Remove ${p.title}`}
                className="absolute right-1.5 top-1.5"
              >
                <X size={12} color="var(--ink-300)" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex justify-center">
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="inline-flex items-center gap-1 text-[12px]"
          style={{ color: "var(--ink-500)" }}
        >
          <ChevronUp size={13} /> Collapse
        </button>
      </div>
    </div>
  );
}
