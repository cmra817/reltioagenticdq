import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { DashboardThreadScreen } from "@/components/data-health-brief/dashboard-thread-screen";

export const Route = createFileRoute("/dashboard/$threadId")({
  validateSearch: (search: Record<string, unknown>): { ask?: string } => ({
    ask: typeof search.ask === "string" ? search.ask : undefined,
  }),
  head: () => ({
    meta: [
      { title: "New dashboard — Data Quality" },
      {
        name: "description",
        content:
          "Describe the dashboard you want in chat; its stats appear beside the chat once it is built.",
      },
      { property: "og:title", content: "New dashboard — Data Quality" },
      {
        property: "og:description",
        content:
          "Describe the dashboard you want in chat; its stats appear beside the chat once it is built.",
      },
    ],
  }),
  component: DashboardThreadPage,
});

function DashboardThreadPage() {
  const { threadId } = Route.useParams();
  const { ask } = Route.useSearch();
  return (
    <AppShell activeNav="none" hideDock>
      <DashboardThreadScreen threadId={threadId} ask={ask} />
    </AppShell>
  );
}
