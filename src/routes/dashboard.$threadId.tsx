import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { DashboardThreadScreen } from "@/components/data-health-brief/dashboard-thread-screen";

export const Route = createFileRoute("/dashboard/$threadId")({
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
  return (
    <AppShell activeNav="none" hideDock>
      <DashboardThreadScreen threadId={threadId} />
    </AppShell>
  );
}
