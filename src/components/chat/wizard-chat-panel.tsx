import { useMemo, useRef, useState } from "react";
import type { UIMessage } from "ai";

import { ChatWindow } from "./chat-window";
import { newChatId } from "./chat-context";
import { assetKey } from "@/components/add-dataset/mock-warehouses";
import type { Check } from "@/components/add-dataset/mock-checks";

const FRESHNESS_PROMPT = "Show me tables by freshness";
const CONFIRM_PROMPT = "Yes";
const PHONE_PROMPT = "Create me a check to make sure phone_number column is not null";

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

export type WizardAssetSummary = { key: string; name: string; count: number };

function openingChecksMessage(assets: WizardAssetSummary[]): string {
  const total = assets.reduce((sum, a) => sum + a.count, 0);
  const lines = assets.map((a) => `📊 **${a.name}**: ${a.count} checks`).join("\n\n");
  return `Based on the ${assets.length} ${
    assets.length === 1 ? "table" : "tables"
  } you selected, I've analyzed the column names and data types.

I recommend starting with ${total} data quality ${
    total === 1 ? "check" : "checks"
  } across your tables. I've automatically selected these for you based on common validation patterns.

Here's what I've set up:

${lines}

These are basic validations like email format, uniqueness for IDs, and null checks for required fields.

Would you like to add more checks? Tell me what checks you want to add on what column, and I can create it for you.`;
}

function phoneReply(tableName: string, newCount: number): string {
  return `Done — here's what I set up:

**phone_number is not null**

- **Dimension:** Completeness
- **Column:** phone_number
- **Expectation:** \`expect_column_values_to_not_be_null\`
- **Fail rule if** more than 0% of values don't match (default — every row must have a phone number)

**What this rule does:** Flags rows where phone_number is missing, and fails the check if any value is null.

This has been added to your **${tableName}** checks — you're now at ${newCount} checks on that table. Want to adjust the failure threshold (e.g., allow up to 5% missing instead of 0%), or add another check?`;
}

const PHONE_CHECK: Omit<Check, "id"> = {
  rule: "phone_number is not null",
  description: "Every row must have a phone number, nulls block outreach and identity matching",
  dimension: "Completeness",
  field: "phone_number",
  creator: { kind: "reltio" },
};

/** Right-hand assistant column inside the Add dataset wizard. */
export function WizardChatPanel({
  context,
  suggestions,
  onSelectAssets,
  assetSummary,
  onAddCheck,
}: {
  context: "select" | "checks" | "schedule";
  suggestions?: string[];
  /** Step 1 only: the scripted conversation checks these assets for the user. */
  onSelectAssets?: (keys: string[]) => void;
  /** Step 2 only: the tables in play with their current check counts. */
  assetSummary?: WizardAssetSummary[];
  /** Step 2 only: the scripted conversation adds a check to a table. */
  onAddCheck?: (assetKey: string, check: Check) => void;
}) {
  const chatId = useMemo(() => `wizard-${context}-${newChatId()}`, [context]);
  const summaryRef = useRef(assetSummary ?? []);
  summaryRef.current = assetSummary ?? [];

  const seeded = useMemo<UIMessage[]>(() => {
    if (context !== "checks") return [];
    const assets = summaryRef.current;
    if (assets.length === 0) return [];
    return [
      {
        id: "checks-intro",
        role: "assistant",
        parts: [{ type: "text", text: openingChecksMessage(assets) }],
      },
    ];
    // Seeded once per chat session on purpose.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId, context]);

  const [messages, setMessages] = useState<UIMessage[]>(seeded);
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
          PHONE_PROMPT,
          "Which checks matter most for this table?",
          "Why is completeness recommended here?",
        ]
      : [
          "Run profiling nightly and checks every 6 hours",
          "What cadence do you recommend for this table?",
          "Weekly profiling, daily checks",
        ];

  const followUps =
    context === "select" && scriptStage === "offered"
      ? [CONFIRM_PROMPT]
      : context === "checks" && scriptStage === "idle"
      ? [PHONE_PROMPT]
      : [];

  function handleIntercept(text: string): string | null {
    const value = text.trim().toLowerCase();

    if (context === "select") {
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

    if (context === "checks" && scriptStage === "idle" && value === PHONE_PROMPT.toLowerCase()) {
      const assets = summaryRef.current;
      const target =
        assets.find((a) => a.name.toLowerCase().includes("customer")) ?? assets[0];
      if (!target) return null;
      setScriptStage("done");
      onAddCheck?.(target.key, { ...PHONE_CHECK, id: `script-phone-${target.key}` });
      return phoneReply(target.name, target.count + 1);
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
