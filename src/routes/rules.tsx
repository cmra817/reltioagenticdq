import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { RulesScreen } from "@/components/rules/rules-screen";
import type { RulesSearch } from "@/components/rules/nav";

export const Route = createFileRoute("/rules")({
  validateSearch: (search: Record<string, unknown>): RulesSearch => ({
    rule: typeof search.rule === "string" ? search.rule : undefined,
    new: search.new === true || search.new === "true" ? true : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Rules — Data Quality" },
      {
        name: "description",
        content: "The shared library of data quality rules used by every domain and schedule.",
      },
      { property: "og:title", content: "Rules — Data Quality" },
      {
        property: "og:description",
        content: "The shared library of data quality rules used by every domain and schedule.",
      },
    ],
  }),
  component: RulesPage,
});

function RulesPage() {
  const search = Route.useSearch();
  return (
    <AppShell activeNav="rules" hideDock>
      <RulesScreen search={search} />
    </AppShell>
  );
}
