import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { PlaceholderScreen } from "@/components/placeholder-screen";

export const Route = createFileRoute("/rules")({
  head: () => ({
    meta: [
      { title: "Rules — Data Quality" },
      {
        name: "description",
        content: "The shared library of data quality rules used by every domain and schedule.",
      },
      { property: "og:title", content: "Rules — Data Quality" },
      {
        property: "og:description",
        content: "The shared library of data quality rules used by every domain and schedule.",
      },
    ],
  }),
  component: RulesPage,
});

function RulesPage() {
  return (
    <AppShell activeNav="rules">
      <PlaceholderScreen
        title="Rules"
        summary="A shared library of data quality rules. Each domain applies them as checks on its own tables."
        planned={[
          {
            heading: "Rule library",
            body: "A list of rules with type, severity, owner, and where each one is used.",
          },
          {
            heading: "Create and edit by chat",
            body: "Describe a rule in plain words; the agent drafts it, tests it on real data, and you save it.",
          },
          {
            heading: "Versions and impact check",
            body: "Every save is a new version, and you see which checks a change affects before it applies.",
          },
        ]}
      />
    </AppShell>
  );
}
