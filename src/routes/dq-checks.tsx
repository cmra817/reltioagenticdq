import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { DqChecksScreen } from "@/components/dq-checks/dq-checks-screen";

export const Route = createFileRoute("/dq-checks")({
  head: () => ({
    meta: [
      { title: "DQ Checks — AgentFlow Quality" },
      {
        name: "description",
        content:
          "Browse, filter, and create reusable data quality rules across dimensions and columns.",
      },
      { property: "og:title", content: "DQ Checks — AgentFlow Quality" },
      {
        property: "og:description",
        content: "Reusable data quality rules library with dimensions, creators, and pass rates.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DqChecksPage,
});

function DqChecksPage() {
  return (
    <AppShell activeNav="dq-checks">
      <DqChecksScreen />
    </AppShell>
  );
}
