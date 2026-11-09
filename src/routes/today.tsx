import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { TodayScreen } from "@/components/today/today-screen";

export const Route = createFileRoute("/today")({
  head: () => ({
    meta: [
      { title: "Today — Data Quality" },
      {
        name: "description",
        content: "What needs you, what changed overnight, and what the agent did.",
      },
      { property: "og:title", content: "Today — Data Quality" },
      { property: "og:description", content: "What needs you, what changed overnight, and what the agent did." },
    ],
  }),
  component: TodayPage,
});

function TodayPage() {
  return (
    <AppShell activeNav="today" hideDock>
      <TodayScreen />
    </AppShell>
  );
}
