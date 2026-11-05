import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { DataHealthPage as DataHealthView } from "@/components/data-health-brief/data-health-page";

export const Route = createFileRoute("/data-health")({
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
  component: DataHealthPage,
});

function DataHealthPage() {
  return (
    <AppShell activeNav="data-health" hideDock>
      <DataHealthView />
    </AppShell>
  );
}
