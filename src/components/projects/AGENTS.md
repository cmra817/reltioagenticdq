# Architecture decisions

- Projects (`/projects`, `projects/projects-screen.tsx`) is a kanban of remediation efforts, one domain each (Suggested, In progress, Validating, Done). Done is blocked while acceptance criteria are unmet. A card opens `/projects?project=<id>` with a chat on the left and the project detail (goal, criteria, data, activity and comments) on the right. State (status, owner, comments) is in `agentflow.projects.v1` via `useProjects`.
- Projects data lives in `lib/mock-projects.ts` and `lib/projects-store.ts`. Nothing in phase 1 acts on its own: no agent activity log, no Undo.
