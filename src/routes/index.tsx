import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { DataHealthScreen } from "@/components/data-health-brief/data-health-screen";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Data Health — Data Quality" },
      {
        name: "description",
        content:
          "A daily brief on the tables you own: scorecard, anomalies, check failures, and a conversation to dig in.",
      },
      { property: "og:title", content: "Data Health — Data Quality" },
      {
        property: "og:description",
        content: "A daily brief on the tables you own, with a scorecard built from what you chose to watch.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <AppShell activeNav="data-health" hideDock>
      <DataHealthScreen />
    </AppShell>
  );
}
