import * as React from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { LineChart } from "./charts";
import { AUG19, DISTINCT_SERIES, ROWS_SERIES, SIBLING_SERIES } from "./data";
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

function Finding({
  label,
  summary,
  kind,
  open,
  onToggle,
  children,
}: {
  label: string;
  summary: string;
  kind: "check" | "anomaly";
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl"
      style={{ border: "1px solid var(--hairline)", background: "#fff" }}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
      >
        <span
          className="w-[76px] shrink-0 text-[9.5px] font-semibold uppercase leading-[1.25] tracking-wide"
          style={{ color: "var(--ink-300)" }}
        >
          {label}
        </span>
        <span className="flex-1 truncate text-[13px]" style={{ color: "var(--ink-900)" }}>
          {summary}
        </span>
        <Badge kind={kind} />
        {open ? (
          <ChevronUp size={15} color="var(--ink-300)" />
        ) : (
          <ChevronDown size={15} color="var(--ink-300)" />
        )}
      </button>
      {open && (
        <div
          className="flex flex-col gap-3 px-3 pb-3.5 pt-1"
          style={{ borderTop: "1px solid var(--hairline)" }}
        >
          {children}
        </div>
      )}
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
    <div
      className="flex max-h-[58vh] flex-col overflow-y-auto rounded-xl px-4 py-4"
      style={{ border: "1px solid var(--hairline)", background: "rgba(255,255,255,0.75)" }}
    >
      <p className="text-[12px]" style={{ color: "var(--ink-300)" }}>
        You already know customer_id has 1,204 duplicates — that's what the check told you at 7:41.
      </p>
      <p className="mt-2 text-[15px] leading-relaxed" style={{ color: "var(--ink-900)" }}>
        Here's what it couldn't. This started three weeks ago, not Tuesday — it was 40 duplicates on
        Aug 19 and your threshold sat at 1,000. It isn't one problem, it's three, and only 900 of
        them are new. And the 6% row growth you've been seeing since then is entirely these
        duplicates.
      </p>

      <div className="mt-4 flex items-center gap-2">
        <span className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: "var(--ink-500)" }}>
          What the check couldn't see
        </span>
        <span className="text-[12px]" style={{ color: "var(--ink-300)" }}>
          · 3 findings
        </span>
      </div>

      <div className="mt-2 flex flex-col gap-2">
        <Finding
          label="Rows behind it"
          kind="check"
          summary="One number, three separate problems with three different owners."
          open={!!open.f1}
          onToggle={() => toggle("f1")}
        >
          <p className="text-[12.5px]" style={{ color: "var(--ink-700)" }}>
            The check counted 1,204. Pulling those rows and reading their other columns splits them
            cleanly:
          </p>
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
            body="IDs prefixed TEST_, from LEGACY. Present long before the alert and unrelated to it. Filter at the loader when convenient."
          />
          <Group
            count="4"
            title="Genuine ID collisions"
            body="Two source systems assigned the same identifier to different people. I can't tell which is correct — that needs whoever owns ID assignment."
          />
          <ActionButtons
            onAsk={onAsk}
            onPin={onPin}
            actions={[
              { label: "Investigate the 900", primary: true, ask: "Investigate the SFDC re-inserts" },
              { label: "See the rows" },
              { label: "Propose a rule", ask: "Prevent this" },
            ]}
          />
        </Finding>

        <Finding
          label="Two metrics"
          kind="anomaly"
          summary="Rows are up 6%. Distinct customers are flat. The growth isn't real."
          open={!!open.f2}
          onToggle={() => toggle("f2")}
        >
          <p className="text-[12.5px]" style={{ color: "var(--ink-700)" }}>
            Neither metric is alarming on its own. Together they only have one explanation.
          </p>
          <LineChart
            height={140}
            markerIndex={AUG19}
            markerLabel="Aug 19"
            yLabels={["Total rows", "Distinct customer_id"]}
            series={[
              { label: "Total rows", values: ROWS_SERIES, color: "var(--brand-red)" },
              { label: "Distinct customer_id", values: DISTINCT_SERIES, color: "var(--brand-blue)" },
            ]}
          />
          <p className="text-[12.5px]" style={{ color: "var(--ink-700)" }}>
            You didn't gain customers. You gained rows. Anything counting this table has been
            counting up for three weeks.
          </p>
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
        </Finding>

        <Finding
          label="Sibling tables"
          kind="anomaly"
          summary="Two other tables on the same connector show the same shape, same day."
          open={!!open.f3}
          onToggle={() => toggle("f3")}
        >
          <LineChart
            height={140}
            markerIndex={AUG19}
            markerLabel="Aug 19"
            series={[
              { label: "customer_data", values: SIBLING_SERIES.customer_data, color: "var(--brand-blue-bright)" },
              { label: "contact_master", values: SIBLING_SERIES.contact_master, color: "var(--brand-blue-bright)", opacity: 0.6 },
              { label: "account_roll", values: SIBLING_SERIES.account_roll, color: "var(--brand-blue-bright)", opacity: 0.35 },
            ]}
          />
          <p className="text-[12.5px]" style={{ color: "var(--ink-700)" }}>
            contact_master and account_roll both start diverging Aug 19, both fed by the SFDC
            connector, and neither has a uniqueness check so neither alerted. That makes this one
            upstream cause, not three table problems — and fixing it here wouldn't have fixed the
            other two.
          </p>
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
        </Finding>
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
