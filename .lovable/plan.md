# Iterate: Incidents and anomaly-to-action workflow

Build out the Incidents page so it becomes a real triage surface, and connect the anomalies/check failures that already exist in the table detail page to it. This is a state/behavior iteration — keep the existing visual system (tokens, spacing, 12px radius).

## Experience changes

1. **Incidents page overhaul**
   - Replace the flat table with a filterable list: status tabs (Open / Acknowledged / Resolved), severity chips, source (Anomaly vs DQ rule), detected time, affected table/column.
   - Each row opens a right-side detail drawer (not a modal) with: summary, timeline of detection events, affected table/column links, suggested actions, and a notes feed.
   - Actions: Acknowledge, Resolve, Reopen, and Create DQ rule from this incident.
   - Empty state when all filtered out.

2. **Auto-generate incidents from existing signals**
   - The table-detail anomaly badge and "Checks by category" failures now seed incidents into a lightweight in-memory store for the session (extend the existing notification/mock data pattern; no backend).
   - Opening the Incidents page shows pre-seeded examples plus any incidents created during the demo (e.g. when the consistency anomaly is surfaced in the investigation thread).

3. **Sidebar navigation**
   - Add an "Incidents" nav item below DQ Checks with a badge count of open incidents.
   - Active state matches the existing nav styling.

4. **Demo script updates**
   - Add a short Act 7.5 (or fold into existing Act 7): from the investigation thread or table detail, click into Incidents, acknowledge the consistency incident, and create a follow-up DQ rule.
   - Keep the scripted prompts unchanged; just update the click path narrative.

## Technical notes

- `src/routes/incidents.tsx` — rewrite the page shell with tabs, filter bar, incident list, and detail drawer.
- `src/components/incidents/` (new directory) — `incident-model.ts`, `IncidentList.tsx`, `IncidentDrawer.tsx`, `IncidentStatusBadge.tsx`, `severity-utils.ts`.
- Extend `MOCK_INCIDENTS` in `src/components/data-health/widget-model.ts` or move to the new model file; keep backward compatibility with the existing widget click-through that passes `segment`/`widget` search params.
- `src/components/agentflow-sidebar.tsx` — add the Incidents nav item and open-incident count.
- `DEMO_SCRIPT.md` — append the new triage section and adjust act timing.
- No backend changes; continue with local mock/session state.

## Out of scope

- Real persistence or assignment to users.
- Email/Slack notifications.
- Incident creation from outside the seeded/demo flows.
