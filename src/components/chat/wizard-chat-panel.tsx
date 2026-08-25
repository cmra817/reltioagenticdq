import { useMemo, useState } from "react";
import type { UIMessage } from "ai";

import { ChatWindow } from "./chat-window";
import { newChatId } from "./chat-context";
import { assetKey } from "@/components/add-dataset/mock-warehouses";

const FRESHNESS_PROMPT = "Show me tables by freshness";
const CONFIRM_PROMPT = "Yes";

const SCRIPT_KEYS = [
  assetKey("dbx-data-science", "prod_analytics", "dim_customers"),
  assetKey("dbx-data-science", "prod_analytics", "fct_orders_daily"),
];

const FRESHNESS_REPLY = `Based on frequency of use, here are your top 2 tables:

**dim_customers** — 42 columns, 1.2M rows, updated daily
Contains: email, phone, address fields

**fct_orders_daily** — 28 columns, 4.8M rows, updated hourly
Contains: transaction dates, amounts

Would you like me to add these tables to your analysis?`;

const CONFIRM_REPLY = "Done! I've selected these tables.";

/** Right-hand assistant column inside the Add dataset wizard. */
export function WizardChatPanel({
  context,
  suggestions,
  onSelectAssets,
}: {
  context: "select" | "checks" | "schedule";
  suggestions?: string[];
  /** Step 1 only: the scripted conversation checks these assets for the user. */
  onSelectAssets?: (keys: string[]) => void;
}) {
  const chatId = useMemo(() => `wizard-${context}-${newChatId()}`, [context]);
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [scriptStage, setScriptStage] = useState<"idle" | "offered" | "done">("idle");

  const defaults =
    context === "select"
      ? [
          FRESHNESS_PROMPT,
          "Find tables containing specific data types",
          "Recommend tables based on my business needs",
          "Filter tables by schema or naming pattern",
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

  const followUps =
    context === "select" && scriptStage === "offered" ? [CONFIRM_PROMPT] : [];

  function handleIntercept(text: string): string | null {
    if (context !== "select") return null;
    const value = text.trim().toLowerCase();

    if (scriptStage === "idle" && value === FRESHNESS_PROMPT.toLowerCase()) {
      setScriptStage("offered");
      return FRESHNESS_REPLY;
    }

    if (scriptStage === "offered" && value === CONFIRM_PROMPT.toLowerCase()) {
      setScriptStage("done");
      onSelectAssets?.(SCRIPT_KEYS);
      return CONFIRM_REPLY;
    }

    return null;
  }

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
          followUps={followUps}
          onIntercept={handleIntercept}
          emptyTitle={
            context === "select"
              ? "Find your data"
              : context === "checks"
              ? "Tune your checks"
              : "Describe your schedule"
          }
          emptySubtitle={
            context === "select"
              ? "Ask which tables are worth monitoring."
              : context === "checks"
              ? "Ask what to add or remove for the tables you selected."
              : "Tell the assistant the cadence in plain language."
          }
        />
      </div>
    </aside>
  );
}
