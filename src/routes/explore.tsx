import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { ExploreScreen } from "@/components/explore-screen";

export const Route = createFileRoute("/explore")({
  head: () => ({
    meta: [
      { title: "Explore — Data Quality" },
      {
        name: "description",
        content:
          "Browse data sources, datasets, tables, and dashboards across your warehouses with Data Quality.",
      },
      { property: "og:title", content: "Explore — Data Quality" },
      {
        property: "og:description",
        content: "Browse datasets, tables, and dashboards across your data warehouses.",
      },
    ],
  }),
  component: ExplorePage,
});

function ExplorePage() {
  return (
    <AppShell activeNav="explore">
      <ExploreScreen />
    </AppShell>
  );
}
