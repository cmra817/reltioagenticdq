import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/app-shell";
import { InvestigationScreen } from "@/components/data-health-brief/investigations";
import type { InvestigationTopic } from "@/components/data-health-brief/dashboard-commands";

type InvestigateSearch = { q?: string; thread?: string };

const TOPICS: InvestigationTopic[] = ["duplicates", "freshness", "nulls"];

export const Route = createFileRoute("/investigate/$topic")({
  validateSearch: (search: Record<string, unknown>): InvestigateSearch => ({
    q: typeof search.q === "string" ? search.q : undefined,
    thread: typeof search.thread === "string" ? search.thread : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Investigation — Data Quality" },
      {
        name: "description",
        content:
          "A chart-led investigation into a finding from your data health brief: what moved, when it started, and what caused it.",
      },
      { property: "og:title", content: "Investigation — Data Quality" },
      {
        property: "og:description",
        content: "What moved, when it started, and what caused it — with the charts behind it.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: InvestigateTopicPage,
});

function InvestigateTopicPage() {
  const { topic } = Route.useParams();
  const { q, thread } = Route.useSearch();
  const safe = (TOPICS as string[]).includes(topic) ? (topic as InvestigationTopic) : "duplicates";
  return (
    <AppShell activeNav="data-health" hideDock>
      <InvestigationScreen topic={safe} question={q} threadId={thread} />
    </AppShell>
  );
}
