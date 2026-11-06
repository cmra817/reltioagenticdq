import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { ScheduleThreadScreen } from "@/components/scheduled/schedule-thread-screen";

export const Route = createFileRoute("/schedule/$threadId")({
  validateSearch: (search: Record<string, unknown>): { run?: string; chat?: boolean } => ({
    run: typeof search.run === "string" ? search.run : undefined,
    chat: search.chat === true || search.chat === "1" || search.chat === "true" ? true : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Schedule — Data Quality" },
      {
        name: "description",
        content: "How a schedule is doing, its plan, and every run, beside a chat about it.",
      },
      { property: "og:title", content: "Schedule — Data Quality" },
      {
        property: "og:description",
        content: "How a schedule is doing, its plan, and every run, beside a chat about it.",
      },
    ],
  }),
  component: ScheduleThreadPage,
});

function ScheduleThreadPage() {
  const { threadId } = Route.useParams();
  const { run, chat } = Route.useSearch();
  return (
    <AppShell activeNav="none" hideDock>
      <ScheduleThreadScreen threadId={threadId} run={run} chat={chat} />
    </AppShell>
  );
}
