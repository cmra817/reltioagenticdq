# Recents grouped by domain

## The rule
Every item in Recents sits under exactly one group: a domain, or "All domains".

| Item | Group |
|---|---|
| Chat started in a domain (domain row +, or Scope set to a domain) | That domain |
| Chat with Scope "All domains" (default for New chat) | All domains |
| Job chat (opening a job or a run) | The job's domain (a job always has one domain) |
| Failed-run alert | The job's domain |
| Project chat | The project's domain |
| "Add asset" setup in progress | The domain it is adding to |
| Dashboard chat (new dashboard, or a dashboard's daily chat) | Always All domains |
| Rule chat (new rule, or opening a rule) | Always All domains |

## What you will see
- No flat list at the top of Recents anymore. Alerts and setups move into their domain group, still with their warning or setup icons, listed first in the group.
- Every domain is always shown (score, opens the domain page, + starts a chat), even without chats, sorted lowest health first as today.
- "All domains" sits below the domains and is always shown once it has anything in it.
- Pinned stays its own section on top.
- A domain with an unread alert stays expanded so the alert is visible.

## Technical details
- `schedule-workspace.tsx`: tag schedule threads with `schedule.domain` on create; on load, backfill `domain` for existing schedule threads (the one exception to "domain is never rewritten", since these were created untagged).
- `projects-screen.tsx`: once a project chat has a first message, create a thread (kind `project`, id `project-view-<projectId>`, domain = project's domain) that reopens `/projects?project=<id>`; add `project` to the thread kinds and to `ThreadRow`/search routing.
- Rule and dashboard threads: force `domain: undefined` so they always land in All domains.
- `domain-groups.tsx`: remove the top "Needs a look" list; put alerts (by `schedules.find(...).domain`) and setup sessions (by `session.domain`) at the start of each domain's list; expand a group automatically when it has an alert.
- Update the AGENTS.md sidebar rule to describe this grouping.
