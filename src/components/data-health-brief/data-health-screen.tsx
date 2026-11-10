import { PromptBox } from "@/components/chat/prompt-box";
import * as React from "react";
import { ArrowUp } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { SetupFlow, type SetupConfig } from "./setup-flow";
import { Scorecard, type Pin } from "./scorecard";
import { HealthyBrief, TodayBrief } from "./brief";
import { Thread, type ThreadMessage } from "./thread";
import { answerFor, type Block, type PinPayload } from "./answers";
import { DEFAULT_DIMS, DEFAULT_INTENT, type DimensionId } from "./data";
import { newChatId } from "@/components/chat/chat-context";
import {
  EXTRA_CARDS,
  KNOWN_METRICS,
  parseCommand,
  type ExtraId,
} from "./dashboard-commands";

const STORAGE_KEY = "dq.datahealth.setup.v1";

type Level = "full" | "brief" | "min";

type StoredConfig = SetupConfig & { extras?: ExtraId[] };

/** What a returning-but-unconfigured account sees: the tables it already connects and monitors. */
const DEFAULT_CONFIG: StoredConfig = {
  intent: DEFAULT_INTENT,
  name: "Customer data health",
  tableCount: 14,
  dims: { ...DEFAULT_DIMS },
  extras: [],
};

function loadConfig(): StoredConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw) as StoredConfig;
    if (!parsed?.dims) return DEFAULT_CONFIG;
    return { ...parsed, dims: { ...DEFAULT_DIMS, ...parsed.dims }, extras: parsed.extras ?? [] };
  } catch {
    return DEFAULT_CONFIG;
  }
}

const CHIPS_TODAY = [
  "What should I do first?",
  "Add duplicate rate by table",
  "What's happening with the duplicates?",
];

export function DataHealthScreen({ embedded = false }: { embedded?: boolean } = {}) {
  const navigate = useNavigate();
  const [hydrated, setHydrated] = React.useState(false);
  const [config, setConfig] = React.useState<StoredConfig>(DEFAULT_CONFIG);
  const [setupMode, setSetupMode] = React.useState(false);
  const healthy = false;
  const [level, setLevel] = React.useState<Level>("full");
  const [pins, setPins] = React.useState<Pin[]>([]);
  const [messages, setMessages] = React.useState<ThreadMessage[]>([]);
  const [input, setInput] = React.useState("");

  React.useEffect(() => {
    setConfig(loadConfig());
    setHydrated(true);
  }, []);

  const persist = (c: StoredConfig) => {
    setConfig(c);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
    } catch {
      /* storage unavailable — dashboard still works for this session */
    }
  };

  const create = (c: SetupConfig) => {
    persist({ ...c, extras: [] });
    setSetupMode(false);
    setMessages([]);
    setPins([]);
    setLevel("full");
  };

  const say = React.useCallback((q: string, blocks: Block[]) => {
    setMessages((prev) => [
      ...prev,
      { id: `u${prev.length}`, role: "user", text: q },
      { id: `a${prev.length}`, role: "agent", blocks },
    ]);
  }, []);

  const ask = React.useCallback(
    (qRaw: string) => {
      const q = qRaw.trim();
      if (!q) return;
      const cmd = parseCommand(q);

      if (cmd.kind === "investigate") {
        const thread = newChatId();
        void navigate({
          to: "/investigate/$topic",
          params: { topic: cmd.topic },
          search: { q, thread },
        });
        return;
      }

      if (cmd.kind === "rebuild") {
        setSetupMode(true);
        return;
      }

      if (cmd.kind === "add" || cmd.kind === "remove") {
        const on = cmd.kind === "add";
        const { extra, dim, name } = cmd.target;
        setConfig((prev) => {
          const next: StoredConfig = {
            ...prev,
            dims: dim ? { ...prev.dims, [dim]: on } : prev.dims,
            extras: extra
              ? on
                ? prev.extras?.includes(extra)
                  ? prev.extras
                  : [...(prev.extras ?? []), extra]
                : (prev.extras ?? []).filter((e) => e !== extra)
              : prev.extras,
          };
          try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          } catch {
            /* ignore */
          }
          return next;
        });
        setLevel("full");
        say(q, [
          {
            kind: "p",
            lead: true,
            text: on
              ? `Added ${name} to your scorecard — it's the last card, above checks passing.`
              : `Removed ${name} from your scorecard.`,
          },
          {
            kind: "p",
            text: on
              ? "It uses the same learned band as everything else here, so the delta is against normal for this table, not against zero."
              : "Say the opposite and I'll put it back.",
          },
          {
            kind: "actions",
            actions: [
              {
                label: on ? "Undo" : "Put it back",
                ask: on ? `remove ${name}` : `add ${name}`,
              },
            ],
          },
        ]);
        return;
      }

      if (cmd.kind === "unknown-metric") {
        setLevel("min");
        say(q, [
          { kind: "p", lead: true, text: "I can't map that to a metric I actually collect." },
          { kind: "p", text: `What I can put on this dashboard: ${KNOWN_METRICS}.` },
        ]);
        return;
      }

      setLevel("min");
      say(q, answerFor(q).blocks);
    },
    [navigate, say],
  );

  const addPin = React.useCallback((p: PinPayload) => {
    setLevel("full");
    const id = `${p.title}-${p.value}`;
    setPins((prev) => (prev.some((x) => x.id === id) ? prev : [...prev, { ...p, id, fresh: true }]));
    setTimeout(() => setPins((prev) => prev.map((x) => (x.id === id ? { ...x, fresh: false } : x))), 1400);
  }, []);

  if (!hydrated) return <div className="flex-1" />;
  if (setupMode) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <SetupFlow onCreate={create} />
      </div>
    );
  }

  const dims = config.dims as Record<DimensionId, boolean>;
  const extras = (config.extras ?? []).map((e) => EXTRA_CARDS[e]);
  const chips = CHIPS_TODAY;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {!embedded && (
        <>
      {/* header */}
      <div className="mx-auto flex w-full max-w-[900px] shrink-0 items-center gap-3 px-6 pb-3 pt-4">
        <h1 className="text-[17px] font-semibold" style={{ color: "var(--ink-900)" }}>
          Data health
        </h1>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSetupMode(true)}
            className="text-[12px] underline"
            style={{ color: "var(--ink-300)" }}
          >
            Build a new dashboard
          </button>
        </div>
      </div>
        </>
      )}

      {/* one scroll: dashboard lives in the conversation, folds to a sticky bar */}
      <div className="mx-auto min-h-0 w-full max-w-[900px] flex-1 overflow-y-auto px-6 pt-1">
        {level === "min" ? (
          <div className="sticky top-0 z-10 pb-3 pt-1" style={{ background: "var(--canvas)" }}>
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
          <div className="pb-2">
            {level === "full" && !embedded && (
              <Scorecard
                dims={dims}
                extras={extras}
                healthy={healthy}
                pins={pins}
                onRemovePin={(id) => setPins((p) => p.filter((x) => x.id !== id))}
                onAsk={ask}
              />
            )}
            {level === "full" && !embedded && <div className="my-5 h-px" style={{ background: "var(--hairline)" }} />}
            {healthy ? <HealthyBrief onAsk={ask} onPin={addPin} /> : <TodayBrief onAsk={ask} onPin={addPin} />}

            {!embedded && (
            <div
              className="mt-3 flex items-center gap-2 py-2"
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
            )}
          </div>
        )}

        <div className={messages.length > 0 ? "mt-4" : ""}>
          <Thread messages={messages} onAsk={ask} onPin={addPin} />
        </div>
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
        <PromptBox
          value={input}
          onChange={setInput}
          onSubmit={(q) => {
            ask(q);
            setInput("");
          }}
          placeholder="Ask about your data, or change this dashboard…"
        />
      </div>
    </div>
  );
}
