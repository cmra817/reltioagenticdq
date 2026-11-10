import * as React from "react";
import { ChatVisualView, type ChatReply, type ChatVisual } from "./chat-visuals";
import { ArrowUp, PanelLeft, X } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { STATUS_LABEL, type HealthStatus } from "@/components/domain-context";
import { RUN_STATUS_LABEL, type RunStatus } from "@/lib/mock-ops";

export const HEALTH_COLOR: Record<HealthStatus, string> = {
  good: "var(--status-good)",
  warn: "var(--status-warn)",
  bad: "var(--status-bad)",
  unknown: "var(--ink-100)",
};

const RUN_COLOR: Record<RunStatus, string> = {
  passed: "var(--status-good)",
  failed: "var(--status-bad)",
  attention: "var(--status-warn)",
  running: "var(--brand-blue)",
};

/** A status as dot plus words, so color is never the only signal. */
export function RunPill({ status }: { status: RunStatus }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[12px] font-medium"
      style={{ background: "var(--surface-soft)", color: "var(--ink-700)" }}
    >
      <span
        className="h-2 w-2 rounded-full"
        style={{ background: RUN_COLOR[status] }}
        aria-hidden="true"
      />
      {RUN_STATUS_LABEL[status]}
    </span>
  );
}

export function HealthPill({ score, status }: { score: number | null; status: HealthStatus }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[12px] font-medium"
      style={{ background: "var(--surface-soft)", color: "var(--ink-700)" }}
    >
      <span
        className="h-2 w-2 rounded-full"
        style={{ background: HEALTH_COLOR[status] }}
        aria-hidden="true"
      />
      {score !== null && <span className="tabular-nums">{score}</span>}
      <span>{STATUS_LABEL[status]}</span>
    </span>
  );
}

export function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="rounded px-1.5 py-0.5 text-[11px] font-medium"
      style={{ background: "var(--surface-soft)", color: "var(--ink-500)" }}
    >
      {children}
    </span>
  );
}

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  label,
}: {
  tabs: { id: T; label: string; hint?: string }[];
  value: T;
  onChange: (id: T) => void;
  label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="flex items-center gap-1 overflow-x-auto">
      {tabs.map((t) => {
        const active = t.id === value;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.id)}
            className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors"
            style={{
              color: active ? "var(--ink-900)" : "var(--ink-500)",
              background: active ? "var(--surface-soft)" : "transparent",
              border: `1px solid ${active ? "var(--hairline)" : "transparent"}`,
            }}
          >
            {t.label}
            {t.hint && (
              <span className="text-[11px] font-normal" style={{ color: "var(--ink-300)" }}>
                {t.hint}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function StatTile({
  label,
  value,
  note,
  onClick,
  pressed,
}: {
  label: string;
  value: string;
  note?: string;
  onClick?: () => void;
  pressed?: boolean;
}) {
  const body = (
    <>
      <div className="text-[12px]" style={{ color: "var(--ink-500)" }}>
        {label}
      </div>
      <div
        className="mt-1 text-[24px] font-semibold leading-none tabular-nums"
        style={{ color: "var(--ink-900)" }}
      >
        {value}
      </div>
      {note && (
        <div className="mt-1.5 text-[11.5px]" style={{ color: "var(--ink-300)" }}>
          {note}
        </div>
      )}
    </>
  );
  const style: React.CSSProperties = {
    border: `1px solid ${pressed ? "var(--brand-blue)" : "var(--hairline)"}`,
    background: "#fff",
  };
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={pressed}
        className="rounded-xl p-3.5 text-left"
        style={style}
      >
        {body}
      </button>
    );
  }
  return (
    <div className="rounded-xl p-3.5" style={style}>
      {body}
    </div>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3
      className="mb-2 text-[11px] font-semibold uppercase tracking-wide"
      style={{ color: "var(--ink-300)" }}
    >
      {children}
    </h3>
  );
}

export function Sparkline({ values, label }: { values: number[]; label: string }) {
  const w = 280;
  const h = 56;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(1, max - min);
  const pts = values
    .map((v, i) => `${(i / (values.length - 1)) * w},${h - 4 - ((v - min) / span) * (h - 8)}`)
    .join(" ");
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="h-14 w-full"
      role="img"
      aria-label={`${label}: from ${values[0]} to ${values[values.length - 1]} over 14 days`}
      preserveAspectRatio="none"
    >
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
  );
}

/** Chat in the center, workspace on the right. Stacks on narrow screens. */
export function SplitWorkspace({
  center,
  panel,
  panelWidth = 400,
  panelLabel,
  collapsed = false,
  onToggle,
  floating,
}: {
  center: React.ReactNode;
  /** Leave out to show the chat alone; the panel appears when there is something to show. */
  panel?: React.ReactNode;
  panelWidth?: number | string;
  panelLabel: string;
  /** Chat hidden: the panel fills the row and `floating` renders over it. */
  collapsed?: boolean;
  onToggle?: () => void;
  floating?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
      {!collapsed && (
        <div className="relative flex min-h-[420px] min-w-0 flex-1 flex-col overflow-hidden">
          {onToggle && (
            <PanelToggle
              label="Hide chat"
              onClick={onToggle}
              className="absolute right-3 top-3 z-10"
            />
          )}
          {center}
        </div>
      )}
      {panel ? (
        <aside
          aria-label={panelLabel}
          className={`relative flex w-full flex-col border-t lg:min-h-0 lg:border-t-0 ${collapsed ? "flex-1" : "shrink-0 lg:w-[var(--panel-w)] lg:border-l"}`}
          style={
            {
              "--panel-w": typeof panelWidth === "number" ? `${panelWidth}px` : panelWidth,
              borderColor: "var(--hairline)",
              background: "rgba(255,255,255,0.72)",
            } as React.CSSProperties
          }
        >
          <div className="flex min-h-0 flex-1 flex-col lg:overflow-y-auto">
            {panel}
            {collapsed && floating && <div className="h-28 shrink-0" />}
          </div>
          {collapsed && floating}
        </aside>
      ) : null}
    </div>
  );
}

export function PanelToggle({
  label,
  onClick,
  className = "",
}: {
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={label}
            onClick={onClick}
            className={`flex h-7 w-7 items-center justify-center rounded-md hover:bg-[color:var(--surface-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-blue)] ${className}`}
            style={{ color: "var(--ink-700)" }}
          >
            <PanelLeft size={16} />
          </button>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/** One chat thread that a docked chat and a floating prompt can share. */
export function useChatThread(reply: (q: string) => ChatReply, initialTurns?: ChatTurn[]) {
  const [turns, setTurns] = React.useState<ChatTurn[]>(initialTurns ?? []);
  const replyRef = React.useRef(reply);
  replyRef.current = reply;
  const send = React.useCallback((q: string) => {
    const text = q.trim();
    if (!text) return;
    const answer = replyRef.current(text);
    const { text: body, visual } = typeof answer === "string" ? { text: answer } : answer;
    setTurns((prev) => [
      ...prev,
      { id: prev.length, role: "user", text },
      { id: prev.length + 1, role: "agent", text: body, ...(visual ? { visual } : {}) },
    ]);
  }, []);
  /** Adds an agent message that answers nothing the person asked, e.g. "Saved". */
  const say = React.useCallback((text: string, visual?: ChatVisual) => {
    setTurns((prev) => [
      ...prev,
      { id: prev.length, role: "agent", text, ...(visual ? { visual } : {}) },
    ]);
  }, []);
  return { turns, send, say };
}
export type ChatThread = ReturnType<typeof useChatThread>;

/** Single-line prompt floating over the workspace while the chat is hidden. */
export function FloatingPrompt({
  thread,
  placeholder,
  onOpen,
}: {
  thread: ChatThread;
  placeholder: string;
  onOpen: () => void;
}) {
  const [input, setInput] = React.useState("");
  const lastAgent = [...thread.turns].reverse().find((t) => t.role === "agent");
  const [seenUpTo, setSeenUpTo] = React.useState(lastAgent?.id ?? -1);
  const [thinkingQ, setThinkingQ] = React.useState<string | null>(null);
  const showReply = !thinkingQ && !!lastAgent && lastAgent.id > seenUpTo;
  const submit = () => {
    const q = input.trim();
    if (!q) return;
    setInput("");
    setThinkingQ(q);
    window.setTimeout(() => {
      thread.send(q);
      setThinkingQ(null);
    }, 700);
  };
  const glass = {
    borderColor: "rgba(255,255,255,0.7)",
    boxShadow: "0 10px 28px rgba(15,23,42,0.08)",
  };
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-5 z-30 flex justify-center px-6">
      <div className="pointer-events-auto w-full max-w-md">
        {thinkingQ && (
          <div
            className="mb-2 rounded-2xl border p-3 backdrop-blur-md"
            style={{ ...glass, background: "rgba(255,255,255,0.55)" }}
            aria-live="polite"
          >
            <p className="truncate text-[13px]" style={{ color: "var(--ink-700)" }}>
              {thinkingQ}
            </p>
            <p className="mt-1 text-[12px]" style={{ color: "var(--ink-500)" }}>
              Thinking…
            </p>
          </div>
        )}
        {showReply && (
          <div
            className="mb-2 flex items-start gap-2 rounded-2xl border p-3 backdrop-blur-md"
            style={{ ...glass, background: "rgba(255,255,255,0.8)" }}
            aria-live="polite"
          >
            <button
              type="button"
              onClick={onOpen}
              className="max-h-24 flex-1 overflow-hidden text-left text-[13px] leading-relaxed"
              style={{ color: "var(--ink-900)" }}
            >
              {lastAgent!.text}
            </button>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => setSeenUpTo(lastAgent!.id)}
              className="shrink-0 rounded p-0.5 hover:bg-[color:var(--surface-soft)]"
              style={{ color: "var(--ink-500)" }}
            >
              <X size={13} />
            </button>
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="flex items-center gap-2 rounded-2xl p-2 pl-3 backdrop-blur-md"
          style={{
            background: "rgba(227, 227, 242, 0.7)",
            border: "1px solid rgba(0, 0, 204, 0.14)",
            boxShadow:
              "0px -2px 20px -10px rgba(67, 67, 112, 0.15), 0px 24px 48px -16px rgba(67, 67, 112, 0.35)",
          }}
        >
          <input
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (lastAgent) setSeenUpTo(lastAgent.id);
            }}
            aria-label={placeholder}
            placeholder={placeholder}
            className="flex-1 bg-transparent py-1.5 text-[13px] outline-none"
            style={{ color: "var(--ink-900)" }}
          />
          <button
            type="submit"
            aria-label="Send"
            disabled={!input.trim()}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full disabled:opacity-40"
            style={{ background: "var(--brand-blue)", color: "#fff" }}
          >
            <ArrowUp size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}

export type ChatTurn = {
  id: number;
  role: "user" | "agent";
  text: string;
  /** A chart the agent put under its answer. */
  visual?: ChatVisual;
};

/**
 * A chat scoped to what is on screen (a run, a rule, a domain). Nothing shows
 * in the thread until the person types or taps a suggestion; `header` holds the
 * summary above it. `ask` lets a parent send a question on the person's behalf.
 */
export function ScopedChat({
  scopeLabel,
  placeholder,
  suggestions,
  reply,
  header,
  ask,
  thread,
  initialInput,
  composerTop,
}: {
  thread?: ChatThread;
  /** Controls above the text box, such as a scope or project picker. */
  composerTop?: React.ReactNode;
  /** Prefills the prompt box and focuses it with the cursor at the end. */
  initialInput?: string;
  scopeLabel: string;
  placeholder: string;
  suggestions: string[];
  reply: (question: string) => ChatReply;
  header?: React.ReactNode;
  ask?: { id: number; q: string } | null;
}) {
  const own = useChatThread(reply);
  const { turns, send } = thread ?? own;
  const [input, setInput] = React.useState(initialInput ?? "");
  const endRef = React.useRef<HTMLDivElement | null>(null);
  const inputRef = React.useRef<HTMLTextAreaElement | null>(null);
  React.useEffect(() => {
    const el = inputRef.current;
    if (!initialInput || !el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
    // Only on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const askId = ask?.id;
  const askText = ask?.q;
  React.useEffect(() => {
    if (askId !== undefined && askText) send(askText);
    // Only fire when a new question id arrives.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [askId]);

  React.useEffect(() => {
    if (turns.length > 0) endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [turns.length]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-3 pt-4">
        <div className="mx-auto w-full max-w-[760px]">
          {header}
          {turns.length > 0 && (
            <ul className="mt-5 space-y-3" aria-live="polite">
              {turns.map((t) => (
                <li
                  key={t.id}
                  className={t.role === "user" ? "flex justify-end" : "flex flex-col gap-2"}
                >
                  <div
                    className={
                      t.role === "user"
                        ? "max-w-[88%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed"
                        : "max-w-[88%] whitespace-pre-wrap text-[13.5px] leading-relaxed"
                    }
                    style={
                      t.role === "user"
                        ? { background: "var(--surface-soft)", color: "var(--ink-900)" }
                        : { color: "var(--ink-700)" }
                    }
                  >
                    {t.text}
                  </div>
                  {t.visual && (
                    <div className="w-full max-w-[88%]">
                      <ChatVisualView visual={t.visual} onAsk={send} />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
          <div ref={endRef} />
        </div>
      </div>

      <div className="mx-auto w-full max-w-[760px] shrink-0 px-6 pb-4 pt-1">
        <div className="mb-2 flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => send(s)}
              className="rounded-full px-3 py-1.5 text-[12px]"
              style={{
                border: "1px solid var(--hairline)",
                background: "#fff",
                color: "var(--ink-700)",
              }}
            >
              {s}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
            setInput("");
          }}
          className="flex flex-col gap-1 rounded-2xl border bg-white/95 px-3 py-2.5"
          style={{ borderColor: "var(--hairline)", boxShadow: "0 12px 32px rgba(15,23,42,0.08)" }}
        >
          {composerTop}
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
                setInput("");
              }
            }}
            rows={initialInput ? 3 : 2}
            aria-label={placeholder}
            placeholder={placeholder}
            className="min-h-[44px] resize-none bg-transparent text-[13.5px] outline-none"
            style={{ color: "var(--ink-900)" }}
          />
          <div className="flex items-center justify-end">
            <button
              type="submit"
              aria-label="Send"
              disabled={!input.trim()}
              className="flex h-8 w-8 items-center justify-center rounded-full text-white disabled:opacity-40"
              style={{ background: "var(--brand-blue)" }}
            >
              <ArrowUp size={15} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/** Plain button styles shared by the new screens. */
export function PrimaryButton({
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...rest}
      className={`rounded-lg px-3 py-1.5 text-[13px] font-medium text-white disabled:opacity-40 ${rest.className ?? ""}`}
      style={{ background: "var(--brand-blue)" }}
    >
      {children}
    </button>
  );
}

export function GhostButton({ children, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...rest}
      className={`rounded-lg px-3 py-1.5 text-[13px] font-medium disabled:opacity-40 ${rest.className ?? ""}`}
      style={{ border: "1px solid var(--hairline)", background: "#fff", color: "var(--ink-700)" }}
    >
      {children}
    </button>
  );
}
