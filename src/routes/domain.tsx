import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { DomainScreen, type DomainSearch } from "@/components/domain/domain-screen";

export const Route = createFileRoute("/domain")({
  validateSearch: (search: Record<string, unknown>): DomainSearch => ({
    table: typeof search.table === "string" ? search.table : undefined,
    thread: typeof search.thread === "string" ? search.thread : undefined,
    all: search.all === true || search.all === "true" ? true : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Domain — Data Quality" },
      {
        name: "description",
        content: "One domain: a briefing in chat, with its summary, tables and checks beside it.",
      },
      { property: "og:title", content: "Domain — Data Quality" },
      {
        property: "og:description",
        content: "One domain: a briefing in chat, with its summary, tables and checks beside it.",
      },
    ],
  }),
  component: DomainPage,
});

function DomainPage() {
  const search = Route.useSearch();
  return (
    <AppShell activeNav="domain" hideDock>
      <DomainScreen search={search} />
    </AppShell>
  );
}
