import * as React from "react";

/**
 * Small charts the agent can put in a chat reply to explain what it says.
 * Plain data (no React nodes), so a saved thread brings them back as they were.
 * A row with `ask` can be selected to dig in: it sends that question for the person.
 */
export type ChatVisual =
  | {
      kind: "bars";
      title: string;
      caption?: string;
      rows: { label: string; value: number; display: string; ask?: string }[];
      /** Value that fills the whole bar. Defaults to the largest row. */
      max?: number;
    }
  | {
      kind: "trend";
      title: string;
      caption?: string;
      values: number[];
      startLabel: string;
      endLabel: string;
      target?: number;
    }
  | {
      /** The day's brief: lines to select, each sending its own question. */
      kind: "brief";
      title: string;
      stamp: string;
      lines: { text: string; ask: string }[];
    }
  | {
      kind: "stats";
      title?: string;
      items: { label: string; value: string; note?: string }[];
    };

/** What the agent answers: text, and optionally a chart that explains it. */
export type ChatReply = string | { text: string; visual?: ChatVisual };

const frame = { borderColor: "var(--hairline)" } as const;

function Title({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 text-[12.5px] font-semibold" style={{ color: "var(--ink-900)" }}>
      {children}
    </div>
  );
}

export function ChatVisualView({
  visual,
  onAsk,
}: {
  visual: ChatVisual;
  onAsk?: (question: string) => void;
}) {
  if (visual.kind === "brief") {
    return (
      <div className="rounded-xl border bg-white p-1.5" style={frame}>
        <div className="flex items-baseline justify-between gap-3 px-2.5 pb-1 pt-2">
          <span className="text-[12.5px] font-semibold" style={{ color: "var(--ink-900)" }}>
            {visual.title}
          </span>
          <span className="text-[11.5px]" style={{ color: "var(--ink-500)" }}>
            {visual.stamp}
          </span>
        </div>
        <ul className="space-y-0.5">
          {visual.lines.map((l) => (
            <li key={l.text}>
              <button
                type="button"
                onClick={() => onAsk?.(l.ask)}
                title="Discuss this"
                className="block w-full rounded-lg px-2.5 py-2 text-left text-[13.5px] leading-relaxed hover:bg-[color:var(--surface-soft)] focus-visible:outline-2 focus-visible:outline-[color:var(--brand-blue)]"
                style={{ color: "var(--ink-700)" }}
              >
                {l.text}
              </button>
            </li>
          ))}
        </ul>
        <p className="px-2.5 pb-1.5 pt-1 text-[12px]" style={{ color: "var(--ink-300)" }}>
          Select a line, or a card or chart on the right, to discuss it.
        </p>
      </div>
    );
  }

  if (visual.kind === "stats") {
    return (
      <div className="rounded-xl border bg-white p-3" style={frame}>
        {visual.title && <Title>{visual.title}</Title>}
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {visual.items.map((i) => (
            <div key={i.label}>
              <dt className="text-[11.5px]" style={{ color: "var(--ink-500)" }}>
                {i.label}
              </dt>
              <dd
                className="text-[20px] font-semibold leading-tight tabular-nums"
                style={{ color: "var(--ink-900)" }}
              >
                {i.value}
              </dd>
              {i.note && (
                <div className="text-[11.5px]" style={{ color: "var(--ink-300)" }}>
                  {i.note}
                </div>
              )}
            </div>
          ))}
        </dl>
      </div>
    );
  }

  if (visual.kind === "trend") {
    const w = 320;
    const h = 96;
    const all = visual.target === undefined ? visual.values : [...visual.values, visual.target];
    const lo = Math.min(...all) - 2;
    const hi = Math.max(...all) + 2;
    const y = (v: number) => h - 6 - ((v - lo) / (hi - lo)) * (h - 12);
    const pts = visual.values
      .map((v, i) => `${(i / (visual.values.length - 1)) * w},${y(v)}`)
      .join(" ");
    const first = visual.values[0];
    const last = visual.values[visual.values.length - 1];
    return (
      <div className="rounded-xl border bg-white p-3" style={frame}>
        <Title>{visual.title}</Title>
        <svg
          viewBox={`0 0 ${w} ${h}`}
          className="h-24 w-full"
          preserveAspectRatio="none"
          role="img"
          aria-label={`${visual.title}: from ${first} to ${last}${
            visual.target === undefined ? "" : `, target ${visual.target}`
          }`}
        >
          {visual.target !== undefined && (
            <line
              x1="0"
              x2={w}
              y1={y(visual.target)}
              y2={y(visual.target)}
              stroke="var(--ink-300)"
              strokeDasharray="4 4"
              vectorEffect="non-scaling-stroke"
            />
          )}
          <polyline
            points={pts}
            fill="none"
            stroke="var(--brand-blue)"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <div
          className="mt-1 flex justify-between text-[11.5px]"
          style={{ color: "var(--ink-500)" }}
        >
          <span>
            {visual.startLabel} · {first}%
          </span>
          {visual.target !== undefined && <span>Dashed line: {visual.target}% target</span>}
          <span>
            {visual.endLabel} · {last}%
          </span>
        </div>
        {visual.caption && (
          <p className="mt-1.5 text-[12px]" style={{ color: "var(--ink-500)" }}>
            {visual.caption}
          </p>
        )}
      </div>
    );
  }

  const max = visual.max ?? Math.max(...visual.rows.map((r) => r.value), 1);
  const interactive = visual.rows.some((r) => r.ask) && !!onAsk;
  return (
    <div className="rounded-xl border bg-white p-3" style={frame}>
      <Title>{visual.title}</Title>
      <ul className="space-y-1">
        {visual.rows.map((r) => {
          const body = (
            <>
              <span className="flex items-baseline justify-between gap-3 text-[12.5px]">
                <span style={{ color: "var(--ink-900)" }}>{r.label}</span>
                <span className="tabular-nums" style={{ color: "var(--ink-500)" }}>
                  {r.display}
                </span>
              </span>
              <span
                className="mt-1 block h-2 overflow-hidden rounded-full"
                style={{ background: "var(--surface-soft)" }}
              >
                <span
                  className="block h-2 rounded-full"
                  style={{
                    width: `${Math.max(3, Math.min(100, (r.value / max) * 100))}%`,
                    background: "var(--brand-blue)",
                  }}
                />
              </span>
            </>
          );
          return (
            <li key={r.label}>
              {r.ask && onAsk ? (
                <button
                  type="button"
                  onClick={() => onAsk(r.ask!)}
                  className="block w-full rounded-lg px-2 py-1.5 text-left hover:bg-[color:var(--surface-soft)] focus-visible:outline-2 focus-visible:outline-[color:var(--brand-blue)]"
                  title="Dig into this"
                >
                  {body}
                </button>
              ) : (
                <div className="px-2 py-1.5">{body}</div>
              )}
            </li>
          );
        })}
      </ul>
      {(visual.caption || interactive) && (
        <p className="mt-1.5 px-2 text-[12px]" style={{ color: "var(--ink-500)" }}>
          {visual.caption ?? "Select a bar to dig into it."}
        </p>
      )}
    </div>
  );
}
