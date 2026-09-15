import { createFileRoute, useParams } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { TableBriefScreen } from "@/components/table-brief/table-brief-screen";

export const Route = createFileRoute("/assets/$assetSlug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.assetSlug} — Data Quality` },
      {
        name: "description",
        content: `Agent brief, anomalies, and evidence for the ${params.assetSlug} table.`,
      },
      { property: "og:title", content: `${params.assetSlug} — Data Quality` },
      {
        property: "og:description",
        content: `Agent brief, anomalies, and evidence for the ${params.assetSlug} table.`,
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AssetDetailPage,
});

function AssetDetailPage() {
  const { assetSlug } = useParams({ from: "/assets/$assetSlug" });
  return (
    <AppShell activeNav="explore" hideDock>
      <TableBriefScreen tableName={assetSlug === "customer_data" ? "customer_data" : assetSlug} />
    </AppShell>
  );
}
