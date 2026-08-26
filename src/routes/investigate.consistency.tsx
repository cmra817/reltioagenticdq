import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/app-shell";
import { InvestigationThread } from "@/components/chat/investigation-thread";

type InvestigateSearch = { q?: string; thread?: string };

export const Route = createFileRoute("/investigate/consistency")({
  validateSearch: (search: Record<string, unknown>): InvestigateSearch => ({
    q: typeof search.q === "string" ? search.q : undefined,
    thread: typeof search.thread === "string" ? search.thread : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Investigating: Consistency — Data Quality" },
      {
        name: "description",
        content:
          "Agentic investigation of the monthly consistency decline: failures by table, the dim_customer failure trend, and the rule behind it.",
      },
      { property: "og:title", content: "Investigating: Consistency — Data Quality" },
      {
        property: "og:description",
        content:
          "See which tables drive the consistency drop and the rule causing dim_customer failures.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: InvestigatePage,
});

function InvestigatePage() {
  const { q, thread } = Route.useSearch();
  return (
    <AppShell activeNav="data-health" hideDock>
      <InvestigationThread
        question={q?.trim() || "Why did consistency drop this month?"}
        threadId={thread}
      />
    </AppShell>
  );
}
