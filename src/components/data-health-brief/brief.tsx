import * as React from "react";
import { HealthChart, StatStrip } from "./charts";
import { ActionButtons } from "./thread";
import type { PinPayload } from "./answers";
import {
  AUG21,
  DUPE_ACCOUNT,
  DUPE_BAND,
  DUPE_CONTACT,
  DUPE_CUSTOMER,
  LOAD_BAND,
  LOAD_TIME,
  PAYMENTS_ROWS,
} from "./data";

function Badge({ children, tone = "anomaly" }: { children: React.ReactNode; tone?: "anomaly" | "check" | "watch" }) {
  const styles =
    tone === "check"
      ? { background: "#fff1ef", color: "var(--brand-red)" }
      : tone === "watch"
        ? { background: "var(--surface-soft)", color: "var(--ink-700)" }
        : { background: "rgba(67,134,250,0.10)", color: "var(--brand-blue)" };
  return (
    <span
      className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]"
      style={styles}
    >
      {children}
    </span>
  );
}

function SectionHead({ title, scope }: { title: string; scope: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <h2 className="text-[14px] font-semibold" style={{ color: "var(--ink-900)" }}>
        {title}
      </h2>
      <span className="text-[12px]" style={{ color: "var(--ink-500)" }}>
        {scope}
      </span>
    </div>
  );
}

export function TodayBrief({
  onAsk,
  onPin,
}: {
  onAsk: (q: string) => void;
  onPin: (p: PinPayload) => void;
}) {
  return (
    <section>
      <SectionHead title="Today's brief" scope="6:00am today · 14 tables checked · 3 need you" />

      <p className="mt-3 text-[15px] leading-relaxed" style={{ color: "var(--ink-900)" }}>
        Three tables on the SFDC connector have been accumulating duplicates since Aug 21. Only one of them
        had a check, so only one told you — and the row growth all three have been showing isn't growth.
      </p>

      {/* Finding 1 — large */}
      <div
        className="mt-4 rounded-2xl p-4"
        style={{ border: "1px solid rgba(67,134,250,0.35)", background: "#fff" }}
      >
        <div className="flex items-center gap-2">
          <Badge>Anomaly · 3 tables</Badge>
          <span className="ml-auto text-[11.5px]" style={{ color: "var(--ink-500)" }}>
            Started Aug 21 · 21 days
          </span>
        </div>
        <h3 className="mt-2 text-[15px] font-semibold leading-snug" style={{ color: "var(--ink-900)" }}>
          Duplicates climbing across the SFDC connector — two tables silently
        </h3>
        <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: "var(--ink-700)" }}>
          All three turn on the same day the SFDC sync task changed. One upstream cause, not three table
          problems — and fixing the one that alerted wouldn't have fixed the other two.
        </p>
        <div className="mt-3">
          <HealthChart
            series={[
              { label: "customer_data", values: DUPE_CUSTOMER, breaching: true },
              { label: "contact_master", values: DUPE_CONTACT, dash: "5 3", breaching: true },
              { label: "account_roll", values: DUPE_ACCOUNT, dash: "2 3", breaching: true },
            ]}
            band={DUPE_BAND}
            unit="%"
            marker={AUG21}
            markerLabel="Aug 21 — SFDC sync task changed"
          />
        </div>
        <StatStrip
          stats={[
            { value: "24.6%", label: "customer_data", note: "alerted 7:41am", alert: true },
            { value: "18.9%", label: "contact_master", note: "no check · silent" },
            { value: "13.5%", label: "account_roll", note: "no check · silent" },
          ]}
        />
        <div className="mt-3">
          <ActionButtons
            actions={[
              { label: "What should I do first?", primary: true, ask: "What should I do first?" },
              { label: "Investigate", ask: "What's happening with the duplicates?" },
              { label: "Compare the three", ask: "Show me the three tables" },
              { label: "Pin ↑", pin: { title: "Duplicate rate", value: "24.6%", sub: "customer_data · 3 tables on one connector" } },
            ]}
            onAsk={onAsk}
            onPin={onPin}
          />
        </div>
      </div>

      {/* Finding 2 — medium */}
      <div className="mt-3 rounded-xl p-3.5" style={{ border: "1px solid var(--hairline)", background: "#fff" }}>
        <div className="flex items-center gap-2">
          <Badge>Anomaly</Badge>
          <span className="ml-auto text-[11.5px]" style={{ color: "var(--ink-500)" }}>
            3 of the last 9 days
          </span>
        </div>
        <h3 className="mt-2 text-[13.5px] font-semibold" style={{ color: "var(--ink-900)" }}>
          orders_fact loads late intermittently — nothing has failed
        </h3>
        <p className="mt-1 text-[12.5px] leading-relaxed" style={{ color: "var(--ink-700)" }}>
          Load time leaves its band and comes back on its own. No check fired, because a freshness check only
          knows late or not late, and this is neither consistently.
        </p>
        <div className="mt-2.5">
          <HealthChart
            series={[{ label: "orders_fact", values: LOAD_TIME, breaching: true }]}
            band={LOAD_BAND}
            unit="m"
            height={140}
            compact
          />
        </div>
        <div className="mt-3">
          <ActionButtons
            actions={[
              { label: "Should I worry?", ask: "Should I worry about orders_fact?" },
              { label: "Investigate", ask: "Why is orders_fact late?" },
              { label: "Pin ↑", pin: { title: "orders_fact load", value: "19m", sub: "out of band 3 of 9 days" } },
            ]}
            onAsk={onAsk}
            onPin={onPin}
          />
        </div>
      </div>

      {/* Finding 3 — single line */}
      <div className="mt-3 flex items-start gap-3 px-1">
        <div className="pt-0.5">
          <Badge tone="check">Check</Badge>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[13px]" style={{ color: "var(--ink-900)" }}>
            <span className="font-mono">cust_addresses.state</span> null rate doubled — 1.1% → 2.4%
          </div>
          <div className="mt-0.5 text-[12px]" style={{ color: "var(--ink-500)" }}>
            Threshold is 2%. Newly failing rather than badly failing.
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => onAsk("Look into the cust_addresses nulls")}
            className="rounded-lg px-2.5 py-1 text-[12px]"
            style={{ border: "1px solid var(--hairline)", background: "#fff", color: "var(--ink-700)" }}
          >
            Investigate
          </button>
          <button
            type="button"
            onClick={() => onAsk("Snooze cust_addresses")}
            className="rounded-lg px-2.5 py-1 text-[12px]"
            style={{ border: "1px solid var(--hairline)", background: "#fff", color: "var(--ink-700)" }}
          >
            Snooze
          </button>
        </div>
      </div>

      <p className="mt-4 text-[12.5px]" style={{ color: "var(--ink-500)" }}>
        11 other tables checked — nothing needed you.{" "}
        <button
          type="button"
          onClick={() => onAsk("What did you clear?")}
          className="underline"
          style={{ color: "var(--brand-blue)" }}
        >
          What did you clear?
        </button>
      </p>
    </section>
  );
}

export function HealthyBrief({
  onAsk,
  onPin,
}: {
  onAsk: (q: string) => void;
  onPin: (p: PinPayload) => void;
}) {
  return (
    <section>
      <SectionHead title="Today's brief" scope="6:00am today · 14 tables checked · 0 need you" />

      <p className="mt-3 text-[15px] leading-relaxed" style={{ color: "var(--ink-900)" }}>
        Nothing needs you today. All 14 tables are inside their learned bands, 124 of 124 checks passed, and
        the SFDC duplicate problem you fixed on Sep 8 hasn't returned.
      </p>

      <h3 className="mt-5 text-[13px] font-semibold" style={{ color: "var(--ink-900)" }}>
        Worth keeping an eye on · 1 of 14 tables
      </h3>

      <div className="mt-3 rounded-2xl p-4" style={{ border: "1px solid var(--hairline)", background: "#fff" }}>
        <div className="flex items-center gap-2">
          <Badge tone="watch">Watch</Badge>
          <span className="ml-auto text-[11.5px]" style={{ color: "var(--ink-500)" }}>
            ~7 weeks out
          </span>
        </div>
        <h3 className="mt-2 text-[15px] font-semibold leading-snug" style={{ color: "var(--ink-900)" }}>
          payments is growing 3% a week — steady, and it crosses its partition size around Nov 3
        </h3>
        <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: "var(--ink-700)" }}>
          Not a quality problem and nothing is failing. I'm raising it because the trend is steady enough to
          extrapolate honestly — if growth were erratic I'd say nothing.
        </p>
        <div className="mt-3">
          <HealthChart
            series={[{ label: "payments", values: PAYMENTS_ROWS }]}
            height={150}
            valueFormat={(v) => `${Math.round(v / 1000)}k`}
          />
        </div>
        <StatStrip
          stats={[
            { value: "112,890", label: "rows today", note: "+3%/week for 11 weeks" },
            { value: "Nov 3", label: "projected", note: "partition threshold" },
            { value: "7 wks", label: "headroom", note: "scheduled task vs incident" },
          ]}
        />
        <div className="mt-3">
          <ActionButtons
            actions={[
              { label: "Remind me in 3 weeks", primary: true },
              { label: "Pin ↑", pin: { title: "payments growth", value: "+3%/wk", sub: "partition limit ~Nov 3" } },
              { label: "Dismiss" },
            ]}
            onAsk={onAsk}
            onPin={onPin}
          />
        </div>
      </div>

      <p className="mt-4 text-[12.5px]" style={{ color: "var(--ink-500)" }}>
        13 other tables checked — all clear.{" "}
        <button
          type="button"
          onClick={() => onAsk("What did you clear?")}
          className="underline"
          style={{ color: "var(--brand-blue)" }}
        >
          What did you clear?
        </button>
      </p>
    </section>
  );
}
