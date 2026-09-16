# Activity evidence as a chronological check-run history

## What will change

- Replace the current generic activity list with a chronological history of individual data-quality check runs.
- Add a compact annual activity heatmap at the top, using a failed-to-passed color scale to summarize check outcomes over time.
- Group run rows by relative day (Today, Yesterday, Sunday, Saturday, and earlier dates) so the timeline is easy to scan.
- Show the same fields as the reference: Check, Dimension, Column, Ran on, and Status.
- Use the existing semantic dimension badges and Passed / Failed / Warning status badges from the Checks view.
- Keep Great Expectations check names in monospace and show multi-column checks clearly.
- Add enough realistic history rows for the evidence page to scroll naturally, with incremental loading rather than a short fixed list.

## Behavior

- **Checks tab:** remains the grouped configuration and historical rollup view, organized by parent check and covered columns.
- **Activity tab:** becomes the chronological execution view, organized by run date and time.
- The heatmap summarizes historical outcomes; the table provides the exact run-level evidence beneath it.
- Existing evidence tabs, panel sizing, expanded-mode chat, and contextual prompt behavior remain unchanged.

## Technical details

- Replace `ACTIVITY_ROWS` with typed check-run records containing date group, expectation, dimension, column(s), run time, and status.
- Add deterministic heatmap data and a small responsive calendar-grid component using existing design tokens.
- Reuse `DIMENSION_STYLES`, `StatusBadge`, and the existing evidence table shell for visual consistency.
- Render activity rows in paged batches with an intersection observer and a live loaded-count footer.
