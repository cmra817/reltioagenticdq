import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { ProjectsScreen } from "@/components/projects/projects-screen";

export const Route = createFileRoute("/projects")({
  validateSearch: (search: Record<string, unknown>): { project?: string } => ({
    project: typeof search.project === "string" ? search.project : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Projects — Data Quality" },
      { name: "description", content: "Focused efforts to fix data problems, one domain at a time." },
      { property: "og:title", content: "Projects — Data Quality" },
      { property: "og:description", content: "Focused efforts to fix data problems, one domain at a time." },
    ],
  }),
  component: ProjectsPage,
});

function ProjectsPage() {
  const { project } = Route.useSearch();
  return (
    <AppShell activeNav="projects" hideDock>
      <ProjectsScreen projectId={project} />
    </AppShell>
  );
}
