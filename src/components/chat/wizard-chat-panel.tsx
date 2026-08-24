import { useMemo, useState } from "react";
import type { UIMessage } from "ai";
import agentflowLogo from "@/assets/agentflow-logo.png";
import { ChatWindow } from "./chat-window";
import { newChatId } from "./chat-context";

/** Right-hand assistant column inside the Add dataset wizard. */
export function WizardChatPanel({
  context,
  suggestions,
}: {
  context: "checks" | "schedule";
  suggestions?: string[];
}) {
  const chatId = useMemo(() => `wizard-${context}-${newChatId()}`, [context]);
  const [messages, setMessages] = useState<UIMessage[]>([]);

  const defaults =
    context === "checks"
      ? [
          "Which checks matter most for this table?",
          "Add a validity check on email columns",
          "Why is completeness recommended here?",
        ]
      : [
          "Run profiling nightly and checks every 6 hours",
          "What cadence do you recommend for this table?",
          "Weekly profiling, daily checks",
        ];

  return (
    <aside
      className="flex h-full w-[380px] shrink-0 flex-col border-l bg-white"
      style={{ borderColor: "var(--hairline)" }}
    >
      <div
        className="flex items-center gap-2.5 border-b px-4 py-3"
        style={{ borderColor: "var(--hairline)" }}
      >
        <img src={agentflowLogo} alt="" className="h-5 w-auto object-contain" />
        <div className="leading-tight">
          <div className="text-[13px] font-semibold" style={{ color: "var(--ink-900)" }}>
            AgentFlow assistant
          </div>
          <div className="text-[11px]" style={{ color: "var(--ink-500)" }}>
            {context === "checks" ? "Ask about quality checks" : "Describe your cadence"}
          </div>
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <ChatWindow
          compact
          chatId={chatId}
          initialMessages={messages}
          onMessagesChange={setMessages}
          suggestions={suggestions ?? defaults}
          emptyTitle={context === "checks" ? "Tune your checks" : "Describe your schedule"}
          emptySubtitle={
            context === "checks"
              ? "Ask what to add or remove for the tables you selected."
              : "Tell AgentFlow the cadence in plain language."
          }
        />
      </div>
    </aside>
  );
}
