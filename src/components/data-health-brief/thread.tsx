import * as React from "react";
import type { Block, ChartId, PinPayload } from "./answers";
import { HealthChart } from "./charts";
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

export type ThreadMessage = { id: string; role: "user" | "agent"; text?: string; blocks?: Block[] };

export function ActionButtons({
  actions,
  onAsk,
  onPin,
}: {
  actions: { label: string; primary?: boolean; ask?: string; pin?: PinPayload }[];
  onAsk: (q: string) => void;
  onPin: (p: PinPayload) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {actions.map((a) => (
        <button
          key={a.label}
          type="button"
          onClick={() => {
            if (a.pin) onPin(a.pin);
            if (a.ask) onAsk(a.ask);
          }}
          className="rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors"
          style={
            a.primary
              ? { background: "var(--brand-blue)", color: "#fff" }
              : { background: "var(--surface-soft)", color: "var(--ink-700)", border: "1px solid var(--hairline)" }
          }
        >
          {a.label}
        </button>
      ))}
    </div>
  );
}

export function ThreadChart({ chart }: { chart: ChartId }) {
  if (chart === "dupe-three") {
    return (
      <HealthChart
        series={[
          { label: "customer_data", values: DUPE_CUSTOMER, breaching: true },
          { label: "contact_master", values: DUPE_CONTACT, dash: "5 3", breaching: true },
          { label: "account_roll", values: DUPE_ACCOUNT, dash: "2 3", breaching: true },
        ]}
        band={DUPE_BAND}
        unit="%"
        marker={AUG21}
        markerLabel="Aug 21 — SFDC sync schedule changed"
      />
    );
  }
  if (chart === "orders-freshness") {
    return (
      <HealthChart
        series={[{ label: "orders_fact", values: LOAD_TIME, breaching: true }]}
        band={LOAD_BAND}
        unit="m"
        height={180}
      />
    );
  }
  return (
    <HealthChart
      series={[{ label: "payments", values: PAYMENTS_ROWS }]}
      height={170}
      valueFormat={(v) => `${Math.round(v / 1000)}k`}
    />
  );
}

export function BlockList({
  blocks,
  onAsk,
  onPin,
}: {
  blocks: Block[];
  onAsk: (q: string) => void;
  onPin: (p: PinPayload) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {blocks.map((b, i) => {
        switch (b.kind) {
          case "note":
            return (
              <div key={i} className="text-[12px]" style={{ color: "var(--ink-300)" }}>
                {b.text}
              </div>
            );
          case "p":
            return (
              <p
                key={i}
                className={b.lead ? "text-[15px] font-medium leading-relaxed" : "text-[13px] leading-relaxed"}
                style={{ color: b.lead ? "var(--ink-900)" : "var(--ink-700)" }}
              >
                {b.text}
              </p>
            );
          case "kv":
            return (
              <div key={i} className="overflow-hidden rounded-xl" style={{ border: "1px solid var(--hairline)", background: "#fff" }}>
                {b.rows.map((r, j) => (
                  <div
                    key={r.k}
                    className="flex gap-3 px-3 py-2 text-[12.5px]"
                    style={{ borderTop: j === 0 ? "none" : "1px solid var(--hairline)" }}
                  >
                    <span className="w-[140px] shrink-0 font-mono" style={{ color: "var(--ink-900)" }}>
                      {r.k}
                    </span>
                    <span style={{ color: "var(--ink-700)" }}>{r.v}</span>
                  </div>
                ))}
              </div>
            );
          case "table":
            return (
              <div key={i} className="overflow-hidden rounded-xl" style={{ border: "1px solid var(--hairline)", background: "#fff" }}>
                <table className="w-full text-left text-[12.5px]">
                  <thead>
                    <tr>
                      {b.headers.map((h) => (
                        <th
                          key={h}
                          className="px-3 py-2 text-[10.5px] font-semibold uppercase tracking-[0.06em]"
                          style={{ color: "var(--ink-300)", borderBottom: "1px solid var(--hairline)" }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {b.rows.map((r, ri) => (
                      <tr key={ri} style={{ borderTop: ri === 0 ? "none" : "1px solid var(--hairline)" }}>
                        {r.map((c, ci) => (
                          <td
                            key={ci}
                            className={`px-3 py-2 ${ci === 0 ? "font-mono" : ""}`}
                            style={{
                              color:
                                c === "failing"
                                  ? "var(--brand-red)"
                                  : ci === 0
                                    ? "var(--ink-900)"
                                    : "var(--ink-700)",
                            }}
                          >
                            {c}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {b.foot && (
                  <div
                    className="px-3 py-2 text-[12px]"
                    style={{ color: "var(--ink-300)", borderTop: "1px solid var(--hairline)" }}
                  >
                    {b.foot}
                  </div>
                )}
              </div>
            );
          case "chart":
            return (
              <div key={i} className="rounded-xl p-3" style={{ border: "1px solid var(--hairline)", background: "#fff" }}>
                <ThreadChart chart={b.chart} />
              </div>
            );
          case "actions":
            return <ActionButtons key={i} actions={b.actions} onAsk={onAsk} onPin={onPin} />;
          default:
            return null;
        }
      })}
    </div>
  );
}

export function Thread({
  messages,
  onAsk,
  onPin,
}: {
  messages: ThreadMessage[];
  onAsk: (q: string) => void;
  onPin: (p: PinPayload) => void;
}) {
  const endRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <p className="px-1 py-6 text-[13px]" style={{ color: "var(--ink-100)" }}>
        Ask a question, or use a finding's actions above. Anything worth keeping can be pinned into your
        scorecard.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5 pb-4">
      {messages.map((m) =>
        m.role === "user" ? (
          <div key={m.id} className="flex justify-end">
            <div
              className="max-w-[80%] rounded-2xl px-3.5 py-2 text-[13px]"
              style={{ background: "var(--hairline)", color: "var(--ink-900)" }}
            >
              {m.text}
            </div>
          </div>
        ) : (
          <div key={m.id} className="w-full">
            <BlockList blocks={m.blocks ?? []} onAsk={onAsk} onPin={onPin} />
          </div>
        ),
      )}
      <div ref={endRef} />
    </div>
  );
}
