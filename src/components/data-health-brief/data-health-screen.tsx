import * as React from "react";
import { ArrowUp } from "lucide-react";
import { SetupFlow, type SetupConfig } from "./setup-flow";
import { Scorecard, type Pin } from "./scorecard";
import { HealthyBrief, TodayBrief } from "./brief";
import { Thread, type ThreadMessage } from "./thread";
import { answerFor, type PinPayload } from "./answers";
import { DEFAULT_DIMS, type DimensionId } from "./data";

const STORAGE_KEY = "dq.datahealth.setup.v1";

type Level = "full" | "brief" | "min";

function loadConfig(): SetupConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SetupConfig;
    if (!parsed?.dims) return null;
    return { ...parsed, dims: { ...DEFAULT_DIMS, ...parsed.dims } };
  } catch {
    return null;
  }
}

const CHIPS_TODAY = ["What should I do first?", "Why is this ranked first?", "Add duplicate rate by table"];
const CHIPS_HEALTHY = ["What did you clear?", "Why these metrics?", "Add duplicate rate by table"];

export function DataHealthScreen() {
  const [hydrated, setHydrated] = React.useState(false);
  const [config, setConfig] = React.useState<SetupConfig | null>(null);
  const [healthy, setHealthy] = React.useState(false);
  const [level, setLevel] = React.useState<Level>("full");
  const [pins, setPins] = React.useState<Pin[]>([]);
  const [messages, setMessages] = React.useState<ThreadMessage[]>([]);
  const [input, setInput] = React.useState("");

  React.useEffect(() => {
    setConfig(loadConfig());
    setHydrated(true);
  }, []);

  const create = (c: SetupConfig) => {
    setConfig(c);
    setMessages([]);
    setPins([]);
    setLevel("full");
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
    } catch {
      /* storage unavailable — dashboard still works for this session */
    }
  };

  const restart = () => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setConfig(null);
    setMessages([]);
    setPins([]);
    setLevel("full");
  };

  const ask = React.useCallback((qRaw: string) => {
    const q = qRaw.trim();
    if (!q) return;
    const answer = answerFor(q);
    setLevel("min");
    setMessages((prev) => [
      ...prev,
      { id: `u${prev.length}`, role: "user", text: q },
      { id: `a${prev.length}`, role: "agent", blocks: answer.blocks },
    ]);
  }, []);


  const addPin = React.useCallback((p: PinPayload) => {
    setLevel("full");
    const id = `${p.title}-${p.value}`;
    setPins((prev) => (prev.some((x) => x.id === id) ? prev : [...prev, { ...p, id, fresh: true }]));
    setTimeout(() => setPins((prev) => prev.map((x) => (x.id === id ? { ...x, fresh: false } : x))), 1400);
  }, []);

  if (!hydrated) return <div className="flex-1" />;
  if (!config) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <SetupFlow onCreate={create} />
      </div>
    );
  }

  const dims = config.dims as Record<DimensionId, boolean>;
  const chips = healthy ? CHIPS_HEALTHY : CHIPS_TODAY;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* header */}
      <div className="mx-auto flex w-full max-w-[900px] shrink-0 items-center gap-3 px-6 pb-3 pt-4">
        <h1 className="text-[17px] font-semibold" style={{ color: "var(--ink-900)" }}>
          Data health
        </h1>
        <span className="text-[12.5px]" style={{ color: "var(--ink-500)" }}>
          {config.name} · {config.tableCount} tables
        </span>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={restart}
            className="text-[12px] underline"
            style={{ color: "var(--ink-300)" }}
          >
            Restart setup
          </button>
          <div
            className="flex items-center rounded-lg p-0.5"
            style={{ border: "1px solid var(--hairline)", background: "#fff" }}
          >
            {[
              { k: false, label: "Today" },
              { k: true, label: "Healthy day" },
            ].map((o) => (
              <button
                key={o.label}
                type="button"
                onClick={() => setHealthy(o.k)}
                className="rounded-md px-2.5 py-1 text-[12px] font-medium"
                style={
                  healthy === o.k
                    ? { background: "var(--brand-blue)", color: "#fff" }
                    : { color: "var(--ink-500)" }
                }
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* composed region — pinned, own scroll */}
      {level === "min" ? (
        <div className="mx-auto w-full max-w-[900px] shrink-0 px-6">
          <button
            type="button"
            onClick={() => setLevel("full")}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left"
            style={{ border: "1px solid var(--hairline)", background: "#fff" }}
          >
            <span className="text-[13px] font-medium" style={{ color: "var(--ink-900)" }}>
              {config.name}
            </span>
            <span
              className="rounded px-1.5 py-0.5 text-[11px] font-medium"
              style={{ background: "rgba(67,134,250,0.10)", color: "var(--brand-blue)" }}
            >
              {healthy ? "0 findings" : "3 findings"}
            </span>
            <span className="truncate text-[12.5px]" style={{ color: "var(--ink-500)" }}>
              {healthy ? "all inside band · payments trending" : "SFDC duplicates · orders_fact late · cust_addresses nulls"}
            </span>
            <span className="ml-auto text-[12px] underline" style={{ color: "var(--brand-blue)" }}>
              Expand
            </span>
          </button>
        </div>
      ) : (
        <div
          className="mx-auto flex w-full max-w-[900px] shrink-0 flex-col"
          style={{ maxHeight: "54vh" }}
        >
          <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-2">
            {level === "full" && (
              <Scorecard
                name={config.name}
                tableCount={config.tableCount}
                dims={dims}
                healthy={healthy}
                pins={pins}
                onRemovePin={(id) => setPins((p) => p.filter((x) => x.id !== id))}
                onAsk={ask}
              />
            )}
            {level === "full" && <div className="my-5 h-px" style={{ background: "var(--hairline)" }} />}
            {healthy ? <HealthyBrief onAsk={ask} onPin={addPin} /> : <TodayBrief onAsk={ask} onPin={addPin} />}
          </div>

          {/* level control */}
          <div
            className="mx-6 flex shrink-0 items-center gap-2 py-2"
            style={{ borderTop: "1px solid var(--hairline)" }}
          >
            {[
              { k: "full" as Level, label: "Full" },
              { k: "brief" as Level, label: "Hide scorecard" },
              { k: "min" as Level, label: "Minimise" },
            ].map((o) => (
              <button
                key={o.k}
                type="button"
                onClick={() => setLevel(o.k)}
                className="rounded-lg px-2.5 py-1 text-[12px] font-medium"
                style={
                  level === o.k
                    ? { background: "var(--surface-soft)", color: "var(--ink-900)", border: "1px solid var(--hairline)" }
                    : { color: "var(--ink-500)", border: "1px solid transparent" }
                }
              >
                {o.label}
              </button>
            ))}
            <span className="ml-auto text-[11.5px]" style={{ color: "var(--ink-300)" }}>
              Updated 6:00am · next run 6:00am tomorrow
            </span>
          </div>
        </div>
      )}

      {/* thread */}
      <div className="mx-auto min-h-0 w-full max-w-[900px] flex-1 overflow-y-auto px-6 pt-3">
        <Thread messages={messages} onAsk={ask} onPin={addPin} />
      </div>

      {/* input */}
      <div className="mx-auto w-full max-w-[900px] shrink-0 px-6 pb-4 pt-2">
        <div className="mb-2 flex flex-wrap gap-2">
          {chips.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => ask(c)}
              className="rounded-full px-3 py-1.5 text-[12px]"
              style={{ border: "1px solid var(--hairline)", background: "#fff", color: "var(--ink-700)" }}
            >
              {c}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
            setInput("");
          }}
          className="flex flex-col rounded-2xl px-3 py-3"
          style={{
            background: "#E3E3F2",
            border: "1px solid rgba(0,0,204,0.14)",
            boxShadow:
              "0px -2px 20px -10px rgba(67,67,112,0.15), 0px 24px 48px -16px rgba(67,67,112,0.5)",
          }}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                ask(input);
                setInput("");
              }
            }}
            rows={2}
            placeholder="Ask about your data, or change this dashboard…"
            className="min-h-[52px] flex-1 resize-none bg-transparent text-[13px] outline-none"
            style={{ color: "var(--ink-900)" }}
          />
          <div className="flex justify-end">
            <button
              type="submit"
              aria-label="Send"
              className="flex h-8 w-8 items-center justify-center rounded-full"
              style={{ background: "var(--brand-blue)", color: "#fff" }}
            >
              <ArrowUp size={15} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
