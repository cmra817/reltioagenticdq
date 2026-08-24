import { useMemo, useState } from "react";
import type { UIMessage } from "ai";

import { ChatWindow } from "./chat-window";
import { newChatId } from "./chat-context";

/** Right-hand assistant column inside the Add dataset wizard. */
export function WizardChatPanel({
  context,
  suggestions,
}: {
  context: "select" | "checks" | "schedule";
  suggestions?: string[];
}) {
  const chatId = useMemo(() => `wizard-${context}-${newChatId()}`, [context]);
  const [messages, setMessages] = useState<UIMessage[]>([]);

  const defaults =
    context === "select"
      ? [
          "Which tables should I monitor first?",
          "Find customer tables in Snowflake",
          "What does this table contain?",
        ]
      : context === "checks"
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
      <div className="min-h-0 flex-1">
        <ChatWindow
          compact
          chatId={chatId}
          initialMessages={messages}
          onMessagesChange={setMessages}
          suggestions={suggestions ?? defaults}
          emptyTitle={
            context === "select"
              ? "Find your data"
              : context === "checks"
              ? "Tune your checks"
              : "Describe your schedule"
          }
          emptySubtitle={
            context === "select"
              ? "Ask AgentFlow which tables are worth monitoring."
              : context === "checks"
              ? "Ask what to add or remove for the tables you selected."
              : "Tell AgentFlow the cadence in plain language."
          }
        />
      </div>
    </aside>
  );
}
