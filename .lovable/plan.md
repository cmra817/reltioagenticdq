# Agentic "Add new data asset" (alongside the current wizard)

The existing wizard stays exactly as it is. The "+ New" menu gains a second item, **Add new data asset (agentic)**, which opens a new chat-first experience.

## What the user sees

1. **Chat first** — full-page centered chat: short prompt, 2-3 example chips (e.g. "Monitor dim_customers and fct_orders_daily in Databricks, daily at 6pm"), and a small "Set it up step by step" link.
2. **Clarifying questions in chat** — the agent "looks up" tables, then asks open questions one at a time with answer chips (one marked Recommended), free text accepted, plus "Use the recommended answers". If the named connection isn't set up, the existing New connection dialog opens.
3. **Drafting** — the agent says it's drafting; the workspace slides in from the right (~70%), chat becomes a collapsible left rail (~30%).
4. **Plan overview (no stepper)** — three sections: Select data ("Databricks, 2 tables"), Apply checks ("9 checks"), Schedule ("Daily at 6:00 PM ET"), filling in one after another with loading states. Each has Edit. Unset values show neutrally as "Not set". No warnings or badges anywhere in the workspace.
5. **Edit** — swaps the workspace to the existing Select data / Apply checks / Schedule screen at full width with "Back to plan", no stepper. Changes save immediately.
6. **Sticky bottom bar** — totals (tables, checks, schedule) and an always-clickable Confirm. Unset fields silently get recommended defaults, listed in the success message. Typing "go ahead" in chat gets a reply pointing to the button, which briefly highlights.
7. **Manual path** — "Set it up step by step" opens the workspace with the existing stepper; chat rail present but quiet.
8. **Small screens** — Chat and Plan become two tabs.

## One plan, two ways to edit
- Chat commands: add/remove tables or a whole schema, add/remove a check, change schedule, undo. Changed workspace area flashes; chat shows a short line with Undo.
- Workspace edits post a neutral chat line ("You removed 4 tables").
- Replies can include "Show me" links opening the relevant step with items highlighted.

## Scale additions (agentic version only)
- Select data: filters (connection, schema, last updated, size, has primary key, hide scratch), sort, "Select all N matching", bottom bar with selected count and estimated cost.
- Apply checks: searchable left tree with counts; when >25 tables, apply/remove a check for a whole schema group.
- Schedule: adds a single time zone field under the two cards.

Confirming creates assets the same way the current wizard does (they appear in Explore).

## Technical notes
- New `src/components/add-dataset-agentic/`: `AgenticAddAssetModal.tsx` (layout states), `plan-state.ts` (single plan object + undo stack + reducer), `agent-script.ts` (scripted parser for intents/commands and question sequence, like other scripted flows in the app), `PlanOverview.tsx`, `ChatRail.tsx`.
- Reuse `Step1SelectData`, `Step2ApplyChecks`, `Step3Schedule` via their existing props; add optional props (filters/sort/select-all, searchable tree + group apply, time zone) that default off so the old wizard is unchanged.
- `agentflow-sidebar.tsx`: new menu item + state to open the new modal; shared completion logic extracted from `AddDatasetModal` into a helper used by both.
- Scripted agent (no live AI calls) to match the rest of the prototype.
