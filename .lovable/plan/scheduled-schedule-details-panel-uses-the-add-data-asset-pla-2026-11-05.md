# Scheduled: schedule details panel uses the add-data-asset plan view

## What changes
When you open a schedule on Scheduled, the right panel shows the same layout as "Your plan" in Add data asset:

- **What will run** — tables grouped by warehouse (e.g. Databricks · 2 tables · 21 checks), each table expandable to its DQ checks, with "+ Add tables", per-table remove (x), and add/remove checks — all edited in place.
- **When will it run** — Profiling and DQ checks rows ("Daily at 6:00 PM · Next run …") that expand to edit inline, same as in the plan.
- **Top row kept**: Active / Paused toggle and the **Run now** button.
- **Removed**: the Edit button and the "Edit schedule" pop-up.
- Changes save immediately and apply from the next run (a short note says so). Past runs keep their settings.
- The panel widens to match the add-asset workspace (half the screen), with the run history and schedule chat staying on the left.
- Heading reads the schedule name instead of "Your plan"; Owner and Permissions stay as small read-only lines under the header.

## Technical details
- Reuse `PlanView` directly (no copy) so the two can't drift; add an optional `title`/`subtitle` prop and hide stage-specific bits (reveal/filter/flash) when not passed.
- Add `scheduleToPlan` / `planToSchedule` adapters in `plan-state.ts`: map schedule table names to warehouse asset keys via `ALL_ASSETS`, rule IDs to per-table checks, and `repeats` to/from `ScheduleConfig` for profiling and checks. Store the full plan on the schedule (new optional `plan` field in `Schedule`) so inline edits round-trip without loss; derive `tables`, `ruleIds`, `repeats`, `kind` from it on every change.
- The Add tables dialog keeps its "already selected = locked" behaviour; its dimming overlay is anchored to the panel.
- `schedule-view.tsx`: delete `EditScheduleDialog`, `Field`, `ChipList`, Pencil button; `panelWidth` set to 50vw.
- Verify in the preview: open a schedule, add a table, remove a check, change the DQ checks time, toggle Active, Run now.
