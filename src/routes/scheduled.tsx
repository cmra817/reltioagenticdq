import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { ScheduledScreen } from "@/components/scheduled/scheduled-screen";
import type { ScheduledSearch } from "@/components/scheduled/nav";

export const Route = createFileRoute("/scheduled")({
  validateSearch: (search: Record<string, unknown>): ScheduledSearch => ({
    tab: search.tab === "runs" || search.tab === "schedules" ? search.tab : undefined,
    schedule: typeof search.schedule === "string" ? search.schedule : undefined,
    run: typeof search.run === "string" ? search.run : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Tasks — Data Quality" },
      {
        name: "description",
        content: "Profiling and data quality check tasks, and the history of every run.",
      },
      { property: "og:title", content: "Tasks — Data Quality" },
      {
        property: "og:description",
        content: "Profiling and data quality check tasks, and the history of every run.",
      },
    ],
  }),
  component: ScheduledPage,
});

function ScheduledPage() {
  const search = Route.useSearch();
  return (
    <AppShell activeNav="scheduled" hideDock>
      <ScheduledScreen search={search} />
    </AppShell>
  );
}
