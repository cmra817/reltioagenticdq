# Agentic "Add data asset": accordion workspace and tighter chat

Everything that works today stays: chat-first entry, the single "which tables?" question only when needed (no questions about checks or time zone, per your earlier call), workspace sliding in, always-clickable Confirm, the shared plan, and the manual step-by-step path with its stepper.

## 1. Accordion replaces the three cards
- Remove the summary cards, their Edit buttons and the separate "Back to plan" editor.
- Workspace becomes a vertical accordion: Select data, Apply checks, Schedule. One open at a time; opening one closes the others.
- The open section shows the existing screen for that step, fills the workspace height and scrolls inside itself. Closed sections are header bars. The accordion itself never scrolls.
- Totals bar and Confirm stay pinned at the bottom.
- Smooth open/close animation, off when reduced motion is set. Headers are keyboard-operable buttons with aria-expanded.

## 2. Headers show the real content
- Step number, or a checkmark once the step has content, plus title and a one-line summary:
  - Select data: warehouse icon and table names ("dim_customers, fct_orders_daily"); beyond two, "+N more" and total rows.
  - Apply checks: the dimension badges in use plus the check count.
  - Schedule: the actual schedule with time zone ("Daily at 6:00 PM ET").
- Empty step: muted "Not set".

## 3. Workspace = state, chat = commentary
- No warnings, banners or "needs attention" styling anywhere in the workspace.
- Anything the agent notices (e.g. a table without a primary key) goes in chat with a "Show me" link that opens the right section and highlights those rows.

## 4. Chat and workspace follow each other
- A chat change opens the affected section, highlights changed rows for about 2 seconds, and posts a short line with Undo.
- Workspace edits post a neutral chat line ("You removed 4 tables").
- An open section stays open and updates live while you keep chatting.

## 5. Drafting sequence
Select data opens and fills with a loading state, then closes as Apply checks opens and fills, then Schedule. When drafting finishes, all three are collapsed and show their summaries.

## 6. Time zone
Shown in the Schedule header, totals bar and chat. A single plain Time zone field sits under the Profiling and DQ checks cards (already there; styling stays neutral). Never asked about.

## 7. Chat fixes
- No generic "here's what I can do" lists. "Can you create a new DQ check?" gets a follow-up: what should it check? Then the agent drafts the rule (name, dimension, expectation, pattern, threshold) the way the Create rule modal does, shows it, and asks where to apply it with chips: This table / All tables / Choose tables. Then it applies the rule, opens Apply checks and highlights it.
- If something truly isn't supported, the agent says so plainly and offers the closest thing it can do.
- After drafting, one message: a single-sentence plan ("I'm monitoring 2 tables in Databricks for completeness, uniqueness and validity, daily at 6 PM ET.") plus only unusual items, each with a Show me link.
- "Recommended defaults" is only mentioned for things actually defaulted. A schedule you typed is never called recommended.

## Not in scope
The larger-scale Select data filters and the grouped check search from the earlier spec stay unbuilt. This change is only about the layout and chat behaviour.

## Technical notes
- `AgenticAddAssetModal.tsx`: replace the `view` state (overview/select/checks/schedule) with `openSection: "select" | "checks" | "schedule" | null`; new `PlanAccordion` component (grid-rows 0fr→1fr transition, `motion-reduce:transition-none`, flex column where the open panel is `flex-1 min-h-0 overflow-auto`). Drafting drives `openSection` on timers.
- `highlight: { section, keys: string[], until }` state is passed to Step1/Step2 via optional `highlightKeys` props (a soft background tint on matching rows, default off, so the old wizard is unchanged).
- `agent-script.ts`: new intents `create_check` (multi-turn: describe → draft → apply-target chips → choose tables), `unsupported` fallback; remove capability-list replies; the drafting summary builder tracks which fields came from the prompt and which were defaulted.
- Observations (tables without an `id`-like column) are computed in plan-state and only surfaced in chat.
