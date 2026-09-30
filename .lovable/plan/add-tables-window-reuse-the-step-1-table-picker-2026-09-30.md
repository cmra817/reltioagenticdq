# Add tables window: reuse the Step 1 table picker

Keep "Add tables" as a window over the plan. Swap what's inside it for the same table picker used in Step 1 of the regular wizard, so both look and behave the same.

## What changes
- **Left panel:** "+ Add connection" at the top. Below it, a tree grouped as warehouse (Databricks / Snowflake / BigQuery) > catalog (Data Science, Finance DW...) > schema, with a table count next to each schema. This matches the screenshot.
- **Add connection:** opens the same connect window in the middle of the screen as Step 1, on top of the Add tables window.
- **Right side:** search across all connections at the top, a breadcrumb ("Data Science › raw_events"), the "7 tables · 2.0B rows · 0 selected" line, then table rows. Each row has a checkbox, the source logo, the table name, "Table › schema", a one-line description, a row count, and when it was last updated. Paging works the same as Step 1.
- **Stays the same:** the window header with a × button, the bottom bar ("N in this job · +added −removed", Cancel, Done), Escape to close, and recommended checks added to each new table.

## Technical details
- In `PlanView.tsx` `AddTablesDialog`, replace the custom connection select, schema checkboxes and row list with `<Step1SelectData selected={picked} onToggle={...} onClear={...} />`. Drop the dialog's own search box, because Step 1 has one.
- Plan keys and Step 1 keys use the same asset key format. Check this first, and add a small key mapping if they differ.
- Make the window wider (about 1200px), because Step 1 needs room for the tree plus the rows. Check that `NewConnectionModal` stacks above the Add tables window, and raise its z-index if it doesn't.
- Check in the preview: open Add tables, pick tables in two schemas, open Add connection, click Done, and confirm the plan updates.
