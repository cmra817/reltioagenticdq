import * as React from "react";
import type { Block, PinPayload } from "./answers";

export type ThreadMessage = {
  id: string;
  role: "user" | "agent";
  text?: string;
  blocks?: Block[];
};

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
              : {
                  background: "var(--surface-soft)",
                  color: "var(--ink-700)",
                  border: "1px solid var(--hairline)",
                }
          }
        >
          {a.label}
        </button>
      ))}
    </div>
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
              <p key={i} className="text-[13px] leading-relaxed" style={{ color: "var(--ink-700)" }}>
                {b.text}
              </p>
            );
          case "kv":
            return (
              <div
                key={i}
                className="overflow-hidden rounded-xl"
                style={{ border: "1px solid var(--hairline)", background: "#fff" }}
              >
                {b.rows.map((r, j) => (
                  <div
                    key={r.k}
                    className="flex gap-3 px-3 py-2 text-[12.5px]"
                    style={{
                      borderTop: j === 0 ? "none" : "1px solid var(--hairline)",
                    }}
                  >
                    <span
                      className="w-[132px] shrink-0 font-mono"
                      style={{ color: "var(--ink-900)" }}
                    >
                      {r.k}
                    </span>
                    <span style={{ color: "var(--ink-700)" }}>{r.v}</span>
                  </div>
                ))}
              </div>
            );
          case "causes":
            return (
              <div
                key={i}
                className="flex flex-col gap-2 rounded-xl p-3"
                style={{ border: "1px solid var(--hairline)", background: "#fff" }}
              >
                {b.items.map((it) => (
                  <div
                    key={it.text}
                    className="text-[12.5px] leading-snug"
                    style={
                      it.ruled
                        ? { color: "var(--ink-100)", textDecoration: "line-through" }
                        : { color: "var(--brand-red)", fontWeight: 600 }
                    }
                  >
                    {it.text}
                  </div>
                ))}
              </div>
            );
          case "rules":
            return (
              <div key={i} className="flex flex-col gap-3">
                {b.cards.map((c) => (
                  <div
                    key={c.heading}
                    className="rounded-xl p-3"
                    style={{ border: "1px solid var(--hairline)", background: "#fff" }}
                  >
                    <div
                      className="font-mono text-[12.5px] font-semibold"
                      style={{ color: "var(--ink-900)" }}
                    >
                      {c.heading}
                    </div>
                    <div className="mt-1 font-mono text-[11.5px]" style={{ color: "var(--ink-500)" }}>
                      {c.config}
                    </div>
                    <p className="mt-2 text-[12.5px] leading-relaxed" style={{ color: "var(--ink-700)" }}>
                      {c.backtest}
                    </p>
                  </div>
                ))}
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
        Ask a question, or open something on the right. Anything worth keeping can be pinned up
        into the brief.
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
