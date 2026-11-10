import * as React from "react";
import { Link } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
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

import { HealthChart, StatStrip } from "./charts";
import {
  AUG21,
  DUPE_ACCOUNT,
  DUPE_BAND,
  DUPE_CONTACT,
  DUPE_CUSTOMER,
  FILL_BAND,
  FILL_SERIES,
  LOAD_BAND,
  LOAD_TIME,
} from "./data";
import { TOPIC_TITLES, type InvestigationTopic } from "./dashboard-commands";

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
        <div className="space-y-3 text-[14px] leading-relaxed">{children}</div>
      </MessageContent>
    </Message>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl p-4" style={{ border: "1px solid var(--hairline)", background: "#fff" }}>
      <div className="text-[13px] font-semibold" style={{ color: "var(--ink-900)" }}>
        {title}
      </div>
      <div className="mt-0.5 text-[11.5px]" style={{ color: "var(--ink-500)" }}>
        {subtitle}
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

const MONO = "font-mono text-[13px]";

/* ---------------- per-topic scripts ---------------- */

const DEFAULT_QUESTION: Record<InvestigationTopic, string> = {
  duplicates: "What's happening with the duplicates?",
  freshness: "Why is orders_fact late?",
  nulls: "Look into the cust_addresses nulls",
};

/** Plain-text mirror of the script so the thread reopens from Recent chats. */
const TRANSCRIPT: Record<InvestigationTopic, string> = {
  duplicates:
    "Duplicate rate is outside its learned band on three tables on the SFDC connector, all from Aug 21: customer_data 24.6%, contact_master 18.9%, account_roll 13.5%. Row counts kept climbing while distinct keys stayed flat — the sync re-inserts instead of upserting.",
  freshness:
    "orders_fact left its learned load-time band on 3 of the last 9 days — Sep 3, Sep 7 and Sep 11 — peaking at 19m against a 8–18m band, and returned inside band within a day each time. Nothing failed and no check fired.",
  nulls:
    "cust_addresses.state null rate moved from 1.1% to 2.4% starting Sep 6, crossing the 2% threshold on the completeness check that now fails. It is newly failing rather than badly failing.",
};

function DuplicatesScript() {
  return (
    <AgentBubble>
      <p>
        Duplicate rate is outside its learned band on three tables — and all three turn on the same
        day, Aug 21, when the SFDC sync schedule changed.
      </p>
      <ChartCard title="Duplicate rate — three SFDC tables" subtitle="Daily duplicate rate, last 30 days">
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
        <StatStrip
          stats={[
            { value: "24.6%", label: "customer_data", note: "has a uniqueness check", alert: true },
            { value: "18.9%", label: "contact_master", note: "no check · silent" },
            { value: "13.5%", label: "account_roll", note: "no check · silent" },
          ]}
        />
      </ChartCard>
      <p>
        Rows against distinct keys is the part worth seeing: row counts kept climbing while distinct
        keys stayed flat. That is re-insertion, not growth.
      </p>
      <ChartCard title="Rows vs distinct keys — customer_data" subtitle="Indexed to Aug 12 = 100">
        <HealthChart
          series={[
            { label: "rows", values: DUPE_CUSTOMER.map((v) => 100 + v * 1.8), breaching: true },
            { label: "distinct keys", values: DUPE_CUSTOMER.map(() => 100.4), dash: "4 3" },
          ]}
          height={160}
          compact
        />
      </ChartCard>
      <p>
        Cause: since Aug 21 the connector runs twice as often and writes with insert semantics, so
        every run re-adds rows it has already loaded. Fixing the two tables without a check would not
        have stopped it — the connector is the single cause for all three.
      </p>
      <p>
        Worth opening <span className={MONO}>customer_data</span> profiling to see the duplicated
        keys directly.
      </p>
      <div>
        <Link
          to="/assets/$assetSlug"
          params={{ assetSlug: "customer_data" }}
          className="inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
          style={{ background: "var(--ink-900)" }}
        >
          Open customer_data in Table Profiling
          <ArrowRight size={15} />
        </Link>
      </div>
    </AgentBubble>
  );
}

function FreshnessScript() {
  return (
    <AgentBubble>
      <p>
        <span className={MONO}>orders_fact</span> has left its learned load-time band on 3 of the last
        9 days. Its band is 8–18 minutes, learned from 30 days of runs.
      </p>
      <ChartCard title="orders_fact load time" subtitle="Minutes per load, last 30 days">
        <HealthChart series={[{ label: "orders_fact", values: LOAD_TIME, breaching: true }]} band={LOAD_BAND} unit="m" />
        <StatStrip
          stats={[
            { value: "19m", label: "worst run", note: "Sep 11 · 1m over band" },
            { value: "3", label: "days out of band", note: "Sep 3, Sep 7, Sep 11" },
            { value: "0", label: "checks failed", note: "nothing was late enough" },
          ]}
        />
      </ChartCard>
      <p>
        Each spike recovered on the next run without anyone touching it, and the days in between sit
        mid-band. A freshness check only knows late or not late, so none of this fired.
      </p>
      <p>
        My read: not worth acting on this week. If a fourth spike lands, or one fails to recover on
        the next run, that is the point where it stops being noise.
      </p>
    </AgentBubble>
  );
}

function NullsScript() {
  return (
    <AgentBubble>
      <p>
        <span className={MONO}>cust_addresses.state</span> is failing its completeness check: null
        rate 2.4% against a 2% threshold.
      </p>
      <ChartCard title="cust_addresses.state fill rate" subtitle="Daily fill rate against the learned band">
        <HealthChart series={[{ label: "state", values: FILL_SERIES, breaching: true }]} band={FILL_BAND} unit="%" />
        <StatStrip
          stats={[
            { value: "2.4%", label: "null rate today", note: "threshold 2%", alert: true },
            { value: "Sep 6", label: "started", note: "1.1% before that" },
            { value: "1", label: "failing check", note: "state_not_null" },
          ]}
        />
      </ChartCard>
      <p>
        The check is <span className={MONO}>state_not_null</span>, and it is newly failing rather than
        badly failing — the rate doubled off a small base and has been flat since Sep 6, not climbing.
      </p>
      <p>
        Nothing here is urgent. Worth asking whoever owns the address intake whether a new source
        started writing rows without a state value on Sep 6.
      </p>
    </AgentBubble>
  );
}

export function InvestigationScreen({
  topic,
  question,
  threadId,
}: {
  topic: InvestigationTopic;
  question?: string;
  threadId?: string;
}) {
  const q = question?.trim() || DEFAULT_QUESTION[topic];
  const { saveMessages, getThread } = useChatThreads();
  const saved = React.useRef(threadId ? getThread(threadId) : undefined).current;
  const scriptedIds = new Set(["inv-u1", "inv-a1"]);
  const savedMessages = saved?.messages ?? [];

  const [input, setInput] = React.useState("");
  const endRef = React.useRef<HTMLDivElement | null>(null);
  const transport = React.useMemo(() => new DefaultChatTransport({ api: "/api/chat" }), []);

  const { messages, sendMessage, status, stop } = useChat({
    id: threadId ?? `investigation-${topic}`,
    messages: savedMessages.filter((m) => !scriptedIds.has(m.id)),
    transport,
    onError: (error) => {
      toast.error(error.message || "The assistant could not respond. Please try again.");
    },
  });
  const busy = status === "submitted" || status === "streaming";

  React.useEffect(() => {
    if (messages.length > 0) endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  const persistRef = React.useRef(saveMessages);
  persistRef.current = saveMessages;
  React.useEffect(() => {
    if (!threadId) return;
    const script: UIMessage[] = [
      { id: "inv-u1", role: "user", parts: [{ type: "text", text: q }] },
      { id: "inv-a1", role: "assistant", parts: [{ type: "text", text: TRANSCRIPT[topic] }] },
    ];
    persistRef.current(threadId, [...script, ...messages], "investigation");
  }, [threadId, q, topic, messages]);

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
          Investigating: {TOPIC_TITLES[topic]}
        </h1>
      </header>

      <Conversation className="min-h-0 flex-1">
        <ConversationContent className="mx-auto w-full max-w-3xl px-6 py-6">
          <UserBubble text={q} />
          {topic === "duplicates" && <DuplicatesScript />}
          {topic === "freshness" && <FreshnessScript />}
          {topic === "nulls" && <NullsScript />}

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
