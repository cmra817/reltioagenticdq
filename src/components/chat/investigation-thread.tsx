import { Link } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { ChatPromptBox } from "@/components/chat/chat-prompt-box";
import { useChatThreads } from "@/components/chat/chat-context";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  ChatChartCard,
  ConsistencyFailuresByTableChart,
  DimCustomerFailureTrendChart,
} from "@/components/chat/chat-chart-card";

const ADVANCE_CHIP = "What's going on with dim_customer?";

const TURN_1_REPLY =
  "Consistency dropped from 51.2% to 48% over the last month — the sharpest decline of any dimension. dim_customer accounts for ~62% of consistency check failures over the last 30 days.";

const TURN_2_REPLY =
  "On dim_customer, one rule drives almost all of it. The drop lines up with a schema sync on Aug 14 — customer_region started allowing a new value (\"APAC-2\") that isn't in the reference list the Country Code ISO List rule checks against. That rule accounts for roughly 9 of every 10 consistency failures on this table since the 14th.";

/** Plain-text mirror of the scripted turns so the thread reopens from Recent chats. */
function scriptedTranscript(question: string, turn: number): UIMessage[] {
  const messages: UIMessage[] = [
    { id: "inv-u1", role: "user", parts: [{ type: "text", text: question }] },
    { id: "inv-a1", role: "assistant", parts: [{ type: "text", text: TURN_1_REPLY }] },
  ];
  if (turn >= 2) {
    messages.push(
      { id: "inv-u2", role: "user", parts: [{ type: "text", text: ADVANCE_CHIP }] },
      { id: "inv-a2", role: "assistant", parts: [{ type: "text", text: TURN_2_REPLY }] },
    );
  }
  return messages;
}

function UserBubble({ text }: { text: string }) {
  return (
    <Message from="user">
      <MessageContent style={{ background: "var(--brand-blue)", color: "#fff" }}>
        <span className="whitespace-pre-wrap text-[14px]">{text}</span>
      </MessageContent>
    </Message>
  );
}

function AgentBubble({ children }: { children: React.ReactNode }) {
  return (
    <Message from="assistant">
      <MessageContent className="bg-transparent p-0" style={{ color: "var(--ink-900)" }}>
        <div className="space-y-2 text-[14px] leading-relaxed">{children}</div>
      </MessageContent>
    </Message>
  );
}

function Chip({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-full border px-3 py-1.5 text-left text-[12px] transition-colors hover:bg-[color:var(--surface-soft)] disabled:cursor-default disabled:opacity-45 disabled:hover:bg-transparent"
      style={{ borderColor: "var(--hairline)", color: "var(--ink-700)" }}
    >
      {label}
    </button>
  );
}

/** Scripted "explore → investigate" thread for a consistency drop question. */
export function InvestigationThread({
  question,
  threadId,
}: {
  question: string;
  threadId?: string;
}) {
  const { saveMessages, getThread } = useChatThreads();
  // Hydrate once from the saved thread so reopening restores the script turn and follow-ups.
  const saved = useRef(threadId ? getThread(threadId) : undefined).current;
  const savedMessages = saved?.messages ?? [];
  const scriptedIds = new Set(["inv-u1", "inv-a1", "inv-u2", "inv-a2"]);

  const [turn, setTurn] = useState(() =>
    savedMessages.some((m) => m.id === "inv-a2") ? 2 : 1,
  );
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat" }), []);

  const { messages, sendMessage, status, stop } = useChat({
    id: threadId ?? "investigation-consistency",
    messages: savedMessages.filter((m) => !scriptedIds.has(m.id)),
    transport,
    onError: (error) => {
      toast.error(error.message || "The assistant could not respond. Please try again.");
    },
  });
  const busy = status === "submitted" || status === "streaming";


  useEffect(() => {
    if (turn > 1 || messages.length > 0)
      endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turn, messages.length]);

  // Keep the saved thread in sync so it reopens from Recent chats.
  const persistRef = useRef(saveMessages);
  persistRef.current = saveMessages;
  useEffect(() => {
    if (!threadId) return;
    persistRef.current(
      threadId,
      [...scriptedTranscript(question, turn), ...messages],
      "investigation",
    );
  }, [threadId, question, turn, messages]);

  function submit(text: string) {
    const value = text.trim();
    if (!value || busy) return;
    setInput("");
    void sendMessage({ text: value });
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header
        className="flex shrink-0 items-center gap-3 border-b px-6 py-3"
        style={{ borderColor: "var(--hairline)" }}
      >
        <Link
          to="/"
          className="flex items-center gap-1.5 text-[13px] transition-colors hover:text-[color:var(--ink-900)]"
          style={{ color: "var(--ink-500)" }}
        >
          <ArrowLeft size={15} />
          Back to dashboard
        </Link>
        <span className="h-4 w-px" style={{ background: "var(--hairline)" }} />
        <h1 className="text-[14px] font-semibold" style={{ color: "var(--ink-900)" }}>
          Investigating: Consistency
        </h1>
      </header>

      <Conversation className="min-h-0 flex-1">
        <ConversationContent className="mx-auto w-full max-w-3xl px-6 py-6">
          <UserBubble text={question} />

          <AgentBubble>
            <p>
              Consistency dropped from 51.2% to 48% over the last month — the sharpest decline of
              any dimension. I looked at which tables are driving it, since the dashboard only shows
              the aggregate score.
            </p>
            <ChatChartCard
              title="Consistency failures by table"
              subtitle="Share of consistency check failures, last 30 days"
            >
              <ConsistencyFailuresByTableChart />
            </ChatChartCard>
            <p>
              <span className="font-mono text-[13px]">dim_customer</span> is disproportionately
              responsible. Want me to dig into what's failing there specifically?
            </p>
          </AgentBubble>

          {turn === 1 && (
            <div className="flex flex-wrap gap-2 px-1 pb-1">
              <Chip label={ADVANCE_CHIP} onClick={() => setTurn(2)} />
              <Chip label="Show me the other tables instead" disabled />
            </div>
          )}

          {turn >= 2 && (
            <>
              <UserBubble text={ADVANCE_CHIP} />
              <AgentBubble>
                <p>
                  Looking at <span className="font-mono text-[13px]">dim_customer</span>'s
                  consistency checks specifically, one rule is responsible for almost all of it:
                </p>
                <ChatChartCard
                  title="Failure trend — dim_customer consistency checks"
                  subtitle="Daily pass rate, last 30 days"
                >
                  <DimCustomerFailureTrendChart />
                </ChatChartCard>
                <p>
                  The drop lines up with a schema sync on Aug 14 —{" "}
                  <span className="font-mono text-[13px]">customer_region</span> started allowing a
                  new value ("APAC-2") that isn't in the reference list your Country Code ISO List
                  rule checks against. That single rule accounts for roughly 9 out of every 10
                  consistency failures on this table since the 14th.
                </p>
                <p>
                  Want to see the actual failing rows, or should I take you to the full profiling
                  view for <span className="font-mono text-[13px]">dim_customer</span> so you can
                  dig into the column directly?
                </p>
              </AgentBubble>

              <div className="px-1 pt-1">
                <Link
                  to="/assets/$assetSlug"
                  params={{ assetSlug: "dim_customer" }}
                  className="inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
                  style={{ background: "var(--ink-900)" }}
                >
                  Open dim_customer in Table Profiling
                  <ArrowRight size={15} />
                </Link>
              </div>

              <div className="flex flex-wrap gap-2 px-1 pb-1">
                <Chip label="Show me the failing rows" disabled />
                <Chip label="Which rule is Country Code ISO List?" disabled />
              </div>
            </>
          )}
          {messages.map((message) => {
            const text = message.parts
              .map((p) => (p.type === "text" ? p.text : ""))
              .join("")
              .trim();
            if (!text) return null;
            return message.role === "user" ? (
              <UserBubble key={message.id} text={text} />
            ) : (
              <AgentBubble key={message.id}>
                <MessageResponse className="text-[14px]">{text}</MessageResponse>
              </AgentBubble>
            );
          })}

          {status === "submitted" && (
            <div className="px-1 py-2">
              <Shimmer className="text-[13px]">Thinking…</Shimmer>
            </div>
          )}

          <div ref={endRef} />
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="shrink-0">
        <ChatPromptBox
          input={input}
          setInput={setInput}
          submit={submit}
          status={status}
          busy={busy}
          stop={stop}
        />
      </div>
    </div>
  );
}
