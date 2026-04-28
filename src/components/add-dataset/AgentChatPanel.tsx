import { useEffect, useMemo, useRef, useState } from "react";
import { BarChart3 } from "lucide-react";
import { SendIcon } from "@/components/brand-icons";
import { WAREHOUSES, assetKey, formatRows, relativeTime } from "./mock-warehouses";

type Recommendation = {
  key: string;
  name: string;
  columns: number;
  rows: number;
  freshness: string;
  contains: string;
};

type Msg =
  | { id: string; role: "user"; content: React.ReactNode }
  | { id: string; role: "agent"; content: React.ReactNode }
  | {
      id: string;
      role: "agent-recommend";
      intro: string;
      recs: Recommendation[];
      question: string;
      answered: boolean;
    };

// Pick a small, realistic set of recommendations from the mock data.
function buildRecommendations(): Recommendation[] {
  const conn = WAREHOUSES[0]; // Databricks · Data Science
  const sch = conn.schemas.find((s) => s.name === "prod_analytics")!;
  const picks = [
    { name: "fct_orders_daily", contains: "order status, channel, totals" },
    { name: "dim_customers", contains: "segment, tenure, region" },
  ];
  return picks.map((p) => {
    const a = sch.assets.find((x) => x.name === p.name)!;
    return {
      key: assetKey(conn.id, sch.name, a.name),
      name: a.name,
      // Mock column counts that match the wireframe vibe.
      columns: a.name === "fct_orders_daily" ? 28 : 42,
      rows: a.rows,
      freshness: relativeTime(a.lastSyncedISO).replace("Updated ", "updated "),
      contains: p.contains,
    };
  });
}

const uid = () => Math.random().toString(36).slice(2, 9);

export function AgentChatPanel({
  step,
  selected,
  onAddMany,
}: {
  step: number;
  selected: Set<string>;
  onAddMany: (keys: string[]) => void;
}) {
  const recommendations = useMemo(() => buildRecommendations(), []);

  const [messages, setMessages] = useState<Msg[]>(() => [
    {
      id: uid(),
      role: "agent",
      content: (
        <>
          <p>
            I've found tables across your connections. Let me help you identify which ones to
            profile and analyze.
          </p>
          <p className="mt-3">You can ask me to:</p>
          <ul className="mt-1 list-inside list-disc space-y-0.5">
            <li>Show tables by usage patterns or freshness</li>
            <li>Find tables containing specific data types</li>
            <li>Recommend tables based on your business needs</li>
            <li>Filter tables by schema or naming patterns</li>
          </ul>
        </>
      ),
    },
  ]);
  // Track whether we've already shown the Step 2 intro so we don't repeat it.
  const [step2Introduced, setStep2Introduced] = useState(false);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const pushUser = (text: string) =>
    setMessages((m) => [...m, { id: uid(), role: "user", content: text }]);

  const pushAgent = (content: React.ReactNode) =>
    setMessages((m) => [...m, { id: uid(), role: "agent", content }]);

  const respondAfter = (delay: number, fn: () => void) => {
    setTyping(true);
    window.setTimeout(() => {
      setTyping(false);
      fn();
    }, delay);
  };

  const handleSend = (raw: string) => {
    const text = raw.trim();
    if (!text) return;
    setInput("");
    pushUser(text);

    const lower = text.toLowerCase();
    const isFreshness =
      lower.includes("freshness") ||
      lower.includes("frequency") ||
      lower.includes("most used") ||
      lower.includes("top tables") ||
      lower.includes("recommend");

    if (isFreshness) {
      respondAfter(700, () => {
        setMessages((m) => [
          ...m,
          {
            id: uid(),
            role: "agent-recommend",
            intro: "Based on frequency of use, here are your top 2 tables:",
            recs: recommendations,
            question: "Would you like me to add these tables to your analysis?",
            answered: false,
          },
        ]);
      });
    } else {
      respondAfter(600, () =>
        pushAgent(
          <>
            I can help with that. Try asking me to{" "}
            <em>"show tables by freshness"</em> or <em>"recommend tables for revenue analysis"</em>.
          </>,
        ),
      );
    }
  };

  const handleConfirm = (msgId: string, recs: Recommendation[]) => {
    pushUser("Yes");
    setMessages((m) =>
      m.map((x) => (x.id === msgId && x.role === "agent-recommend" ? { ...x, answered: true } : x)),
    );
    onAddMany(recs.map((r) => r.key));
    respondAfter(500, () => pushAgent("Done! I've selected these tables."));
  };

  const handleDecline = (msgId: string) => {
    pushUser("Not now");
    setMessages((m) =>
      m.map((x) => (x.id === msgId && x.role === "agent-recommend" ? { ...x, answered: true } : x)),
    );
    respondAfter(400, () =>
      pushAgent("No problem — let me know if you want a different cut of tables."),
    );
  };

  return (
    <aside
      className="flex h-full w-[380px] shrink-0 flex-col border-l bg-white"
      style={{ borderColor: "var(--hairline)" }}
      aria-label="AgentFlow chat"
    >
      {/* Header */}
      <div
        className="flex shrink-0 items-center gap-2 border-b px-5 py-4"
        style={{ borderColor: "var(--hairline)" }}
      >
        <div
          className="flex h-7 w-7 items-center justify-center rounded-full text-white"
          style={{
            background: "linear-gradient(135deg, var(--brand-blue-bright), var(--brand-blue))",
          }}
        >
          <span className="text-[13px] font-semibold">A</span>
        </div>
        <div className="text-[14px] font-semibold" style={{ color: "var(--ink-900)" }}>
          AgentFlow
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-5">
        <div className="flex flex-col gap-4">
          {messages.map((m) => {
            if (m.role === "user") {
              return (
                <Bubble key={m.id} role="user">
                  {m.content}
                </Bubble>
              );
            }
            if (m.role === "agent") {
              return (
                <Bubble key={m.id} role="agent">
                  {m.content}
                </Bubble>
              );
            }
            // agent-recommend
            const allSelected = m.recs.every((r) => selected.has(r.key));
            return (
              <Bubble key={m.id} role="agent">
                <p>{m.intro}</p>
                <div className="mt-3 flex flex-col gap-2.5">
                  {m.recs.map((r) => (
                    <div key={r.key} className="flex items-start gap-2">
                      <BarChart3
                        size={14}
                        className="mt-0.5 shrink-0"
                        style={{ color: "var(--brand-blue)" }}
                      />
                      <div className="min-w-0">
                        <div className="text-[13px]" style={{ color: "var(--ink-900)" }}>
                          <span className="font-mono font-medium">{r.name}</span>{" "}
                          <span style={{ color: "var(--ink-500)" }}>
                            ({r.columns} columns, {formatRows(r.rows)} rows, {r.freshness})
                          </span>
                        </div>
                        <div
                          className="mt-0.5 text-[12px]"
                          style={{ color: "var(--ink-500)" }}
                        >
                          Contains: {r.contains}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-3">{m.question}</p>
                {!m.answered && (
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleConfirm(m.id, m.recs)}
                      className="h-8 rounded-full px-4 text-[12px] font-medium text-white transition-[filter]"
                      style={{ background: "var(--brand-blue)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(0.95)")}
                      onMouseLeave={(e) => (e.currentTarget.style.filter = "none")}
                    >
                      Yes, add them
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDecline(m.id)}
                      className="h-8 rounded-full border px-4 text-[12px] font-medium transition-colors hover:bg-[color:var(--surface-soft)]"
                      style={{ borderColor: "var(--hairline)", color: "var(--ink-700)" }}
                    >
                      Not now
                    </button>
                  </div>
                )}
                {m.answered && allSelected && (
                  <div
                    className="mt-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium"
                    style={{
                      background: "rgba(67,134,250,0.10)",
                      color: "var(--brand-blue)",
                    }}
                  >
                    {m.recs.length} tables added to selection
                  </div>
                )}
              </Bubble>
            );
          })}
          {typing && (
            <Bubble role="agent">
              <span className="inline-flex items-center gap-1">
                <Dot delay="0ms" />
                <Dot delay="150ms" />
                <Dot delay="300ms" />
              </span>
            </Bubble>
          )}
        </div>
      </div>

      {/* Composer */}
      <div className="shrink-0 border-t p-3" style={{ borderColor: "var(--hairline)" }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="flex items-center gap-2 rounded-2xl border bg-white px-3 py-2"
          style={{
            borderColor: "var(--hairline)",
            boxShadow: "var(--shadow-input)",
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything"
            className="h-8 flex-1 bg-transparent text-[13px] outline-none placeholder:text-[color:var(--ink-300)]"
            style={{ color: "var(--ink-900)" }}
          />
          <button
            type="submit"
            aria-label="Send"
            disabled={!input.trim()}
            className="flex h-8 w-8 items-center justify-center rounded-full text-white transition-opacity"
            style={{
              background: "linear-gradient(135deg, var(--brand-blue-bright), var(--brand-blue))",
              opacity: input.trim() ? 1 : 0.4,
            }}
          >
            <SendIcon size={14} />
          </button>
        </form>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {["Show me tables by freshness", "Recommend tables for revenue"].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleSend(s)}
              className="rounded-full border px-2.5 py-1 text-[11px] transition-colors hover:bg-[color:var(--surface-soft)]"
              style={{ borderColor: "var(--hairline)", color: "var(--ink-700)" }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}

function Bubble({ role, children }: { role: "user" | "agent"; children: React.ReactNode }) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className="max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed"
        style={
          isUser
            ? {
                background: "var(--surface-soft)",
                color: "var(--ink-900)",
                borderTopRightRadius: 6,
              }
            : {
                background: "white",
                color: "var(--ink-900)",
                border: "1px solid var(--hairline)",
                borderTopLeftRadius: 6,
              }
        }
      >
        {children}
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="inline-block h-1.5 w-1.5 animate-bounce rounded-full"
      style={{ background: "var(--ink-300)", animationDelay: delay }}
    />
  );
}
