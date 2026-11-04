import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { PlaceholderScreen } from "@/components/placeholder-screen";

export const Route = createFileRoute("/scheduled")({
  head: () => ({
    meta: [
      { title: "Scheduled — Data Quality" },
      {
        name: "description",
        content: "Profiling and data quality check schedules, and the history of every run.",
      },
      { property: "og:title", content: "Scheduled — Data Quality" },
      {
        property: "og:description",
        content: "Profiling and data quality check schedules, and the history of every run.",
      },
    ],
  }),
  component: ScheduledPage,
});

function ScheduledPage() {
  return (
    <AppShell activeNav="scheduled">
      <PlaceholderScreen
        title="Scheduled"
        summary="Every profiling and data quality check schedule, and what happened each time it ran."
        planned={[
          {
            heading: "Schedules",
            body: "One card per schedule, showing its tables and checks, cadence, latest run status, and next run.",
          },
          {
            heading: "Runs",
            body: "A feed of every execution across schedules, with filters for domain and status.",
          },
          {
            heading: "Run view",
            body: "The agent's summary of one run, with results beside it and a chat scoped to that run.",
          },
        ]}
      />
    </AppShell>
  );
}
