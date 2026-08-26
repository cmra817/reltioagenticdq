import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { Message, MessageContent } from "@/components/ai-elements/message";
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
export function InvestigationThread({ question }: { question: string }) {
  const [turn, setTurn] = useState(1);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (turn > 1) endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turn]);

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
          <div ref={endRef} />
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
    </div>
  );
}
