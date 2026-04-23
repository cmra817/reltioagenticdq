import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { DataHealthDashboard } from "@/components/data-health-dashboard";

export const Route = createFileRoute("/data-health")({
  head: () => ({
    meta: [
      { title: "Data Health — AgentFlow Quality" },
      { name: "description", content: "Monitor overall data quality scores, job summaries, and detailed usage metrics across your data warehouses." },
      { property: "og:title", content: "Data Health — AgentFlow Quality" },
      { property: "og:description", content: "Monitor data quality scores and detailed usage metrics." },
    ],
  }),
  component: DataHealthPage,
});

function DataHealthPage() {
  return (
    <AppShell activeNav="data-health">
      <DataHealthDashboard />
    </AppShell>
  );
}
