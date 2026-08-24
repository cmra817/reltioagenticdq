import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { DataHealthDashboard } from "@/components/data-health-dashboard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Data Health — Data Quality" },
      {
        name: "description",
        content:
          "Monitor overall data quality scores, job summaries, and detailed usage metrics across your data warehouses.",
      },
      { property: "og:title", content: "Data Health — Data Quality" },
      { property: "og:description", content: "Monitor data quality scores and detailed usage metrics." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <AppShell activeNav="data-health">
      <DataHealthDashboard />
    </AppShell>
  );
}
