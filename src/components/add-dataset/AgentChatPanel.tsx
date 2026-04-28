import { useEffect, useRef, useState } from "react";
import { SendIcon } from "@/components/brand-icons";

type Msg = { role: "user" | "agent"; content: React.ReactNode };

const INITIAL_MESSAGES: Msg[] = [
  {
    role: "agent",
    content: (
      <>
        <p>
          I've found tables across your connections. Let me help you identify which ones to profile
          and analyze.
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
];

export function AgentChatPanel() {
  const [messages, setMessages] = useState<Msg[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((m) => [
      ...m,
      { role: "user", content: trimmed },
      {
        role: "agent",
        content:
          "Got it — I'll look into that across your connected warehouses and surface the most relevant tables.",
      },
    ]);
    setInput("");
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
          {messages.map((m, i) => (
            <MessageBubble key={i} role={m.role}>
              {m.content}
            </MessageBubble>
          ))}
        </div>
      </div>

      {/* Composer */}
      <div className="shrink-0 border-t p-3" style={{ borderColor: "var(--hairline)" }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
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
      </div>
    </aside>
  );
}

function MessageBubble({
  role,
  children,
}: {
  role: "user" | "agent";
  children: React.ReactNode;
}) {
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
