# Demo script for the Data Quality prototype

Deliverable: a single markdown file, `DEMO_SCRIPT.md`, at the project root — a presenter-ready walkthrough of the seven acts, written from the actual prototype behavior (routes, buttons, scripted chat turns, notification copy).

No app code changes.

## Structure of the script

Front matter:
- One-paragraph framing: Reltio | Data Quality, agentic data observability.
- Demo setup checklist: start on the Data Health homepage (`/`), clear prior state if needed, note that the wizard chat, investigation thread, and notifications are scripted so clicks must follow the script.
- Approximate total runtime and per-act timing.

Each act follows the same layout: **Goal → Click path → What to say → What the audience sees → Fallback if something misfires.**

Act 1 — Add a new dataset (~4 min)
- `+ New` in the left nav → Add new dataset; full-page 3-step wizard.
- Step 1 manual path: connections sidebar (Databricks / Snowflake / BigQuery), Explore-style table rows, checkbox select, chips in the toolbar.
- Step 1 agent path: right panel chip "Show me tables by freshness" → top-2 reply (`dim_customers`, `fct_orders_daily`) → "Yes" → tables auto-checked. Talking point: agent acts in the product, not just answers.
- Step 2: opening message with recommended checks per table, accordion rule rows (expectation, pattern, fail-rule threshold), hover X to remove; then chip "Create me a check to make sure phone_number column is not null" → agent authors the rule and adds it.
- Step 3: profiling + checks cadence via UI, or in natural language in the panel. Finish setup.

Act 2 — Notifications (~1 min)
- Snackbar/domain-connected confirmation, then bell in the header: profiling complete, DQ checks complete. Mention the same notifications fire for ad-hoc runs from a table's Actions menu.

Act 3 — Table detail page (~4 min)
- Open the table from the notification. Overview: activity strip, stat cards with sparklines and deltas, anomaly badge, drift metrics with baseline bands vs. "Checks passing" as a neutral rollup.
- Schema diff modal for column changes; Actions dropdown (Run profiling, Run DQ checks, Load to Reltio, Edit DQ checks, Edit schedules, Remove from monitoring).
- Columns/profiling table: sticky Name column, completeness, anomaly icons → open a column to show the column profile panel (completeness/uniqueness split bars + trend bands, distribution bell curve, pattern and frequent-value tables with NEW badges).

Act 4 — Explore (~2 min)
- `/explore`: warehouse tree, filter panel (asset type, tags), search, drill to columns; point out the newly created dataset appearing with its schedule and checks.

Act 5 — DQ rules library (~3 min)
- `/dq-checks`: search, dimension/creator filters, list vs card view, sort by pass rate. Open the rule modal: "Describe it" vs "Write it directly", test the pattern against real columns or manual input, clone/edit.

Act 6 — Data Health dashboard (~4 min)
- `/data-health` (also the homepage): KPI strip, widget grid. Widget library (applied state shown as a green check), Create widget flow, drag/drop and resize on the 3-column grid, hover the gap between rows to add a titled category, overflow menu to remove.

Act 7 — Investigate the consistency drop (~3 min)
- From the dashboard dock, type "Why did consistency drop this month?" → scripted investigation thread: bar chart of consistency failures by table → chip "What's going on with dim_customer?" → failure-trend line chart with the Aug 14 schema-sync marker, root cause `APAC-2`, CTA "Open dim_customer in Table Profiling".
- Note the thread is saved under Recent chats and supports freeform follow-ups.

Closing section
- Three-sentence wrap-up tying detect → explain → fix.
- "Say this / avoid this" cheat sheet and a table of exact scripted prompts to click, so the presenter never free-types into a scripted panel.

## Technical notes

- Single new file `DEMO_SCRIPT.md` (root). Nothing under `src/` is touched.
- Prompts, chip labels, table names, and route paths quoted verbatim from `wizard-chat-panel.tsx`, `investigation-thread.tsx`, `dock-composer.tsx`, and the route files so the script stays clickable.
