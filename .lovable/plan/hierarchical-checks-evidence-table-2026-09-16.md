# Hierarchical Checks evidence table

## What will change
- Replace the flat Checks evidence list with an expandable hierarchy matching the reference.
- Each parent row will represent a named check and show its dimension, coverage, last run, latest status, and historical average pass rate.
- Expanding a parent will reveal the columns covered by that check, with each column’s last run, latest status, and pass rate.
- Seed the table with the reference check groups adapted to this table, including email format, phone completeness, customer ID uniqueness, date range, status values, and address completeness.

## Interaction and presentation
- Start the most relevant groups expanded so the hierarchy is immediately clear.
- Use distinct semantic badges for dimensions and for Passed, Failed, and Warning states.
- Keep column names monospace and indent child rows with a success/failure indicator.
- Preserve horizontal scrolling at narrower panel widths so no values are clipped.

## Technical details
- Define typed grouped check data in the table brief data module.
- Render accessible expand/collapse controls with `aria-expanded` in the existing Checks evidence view.
- Keep this change limited to the Checks evidence tab; other evidence views and chat behavior remain unchanged.
