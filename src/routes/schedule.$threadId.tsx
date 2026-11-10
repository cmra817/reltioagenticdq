import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { ScheduleThreadScreen } from "@/components/scheduled/schedule-thread-screen";

export const Route = createFileRoute("/schedule/$threadId")({
  validateSearch: (search: Record<string, unknown>): { run?: string } => ({
    run: typeof search.run === "string" ? search.run : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Task — Data Quality" },
      {
        name: "description",
        content: "How a task is doing, its plan, and every run, beside a chat about it.",
      },
      { property: "og:title", content: "Task — Data Quality" },
      {
        property: "og:description",
        content: "How a task is doing, its plan, and every run, beside a chat about it.",
      },
    ],
  }),
  component: ScheduleThreadPage,
});

function ScheduleThreadPage() {
  const { threadId } = Route.useParams();
  const { run } = Route.useSearch();
  return (
    <AppShell activeNav="none" hideDock>
      <ScheduleThreadScreen threadId={threadId} run={run} />
    </AppShell>
  );
}
