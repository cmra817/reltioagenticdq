import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { RuleThreadScreen } from "@/components/rules/rule-thread-screen";

export const Route = createFileRoute("/rule/$threadId")({
  validateSearch: (search: Record<string, unknown>): { chat?: boolean } => ({
    chat: search.chat === true || search.chat === "1" || search.chat === "true" ? true : undefined,
  }),
  head: () => ({
    meta: [
      { title: "New rule — Data Quality" },
      {
        name: "description",
        content:
          "Describe a data quality rule in chat, then review and fine-tune it beside the chat.",
      },
      { property: "og:title", content: "New rule — Data Quality" },
      {
        property: "og:description",
        content:
          "Describe a data quality rule in chat, then review and fine-tune it beside the chat.",
      },
    ],
  }),
  component: RuleThreadPage,
});

function RuleThreadPage() {
  const { threadId } = Route.useParams();
  const { chat } = Route.useSearch();
  return (
    <AppShell activeNav="none" hideDock>
      <RuleThreadScreen threadId={threadId} chat={chat} />
    </AppShell>
  );
}
