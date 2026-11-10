# Domain table panel: reuse the Explore table views

When you open a table from the domain page's right panel, its tabs show the same views as the table page you reach from Explore.

## Tab by tab
- **Overview**: swapped for Explore's Overview: "Last profiled / Checks run / Last synced" line plus the four cards (Columns, Rows, Fill rate, Checks passing) with their small charts and notes. Clicking a card jumps to the matching tab (Columns → Columns, Checks passing → Checks, and so on).
- **Columns**: swapped for Explore's column profiling table (data type, length, min/max/mean, nulls, distinct, uniqueness, completeness).
- **Sample data**: swapped for Explore's sample data view.
- **Checks**: swapped for Explore's checks list with pass/fail badges.
- **Events → Activity log**: the tab is renamed "Activity log" and shows Explore's activity view.
- The back link, table name and health pill above the tabs stay the same. The current "Open findings" and "Project" blocks under Overview go away, since Explore's Overview doesn't have them.

## Note
Explore's views use the same sample numbers for every table, so each domain table will show those same sample values (for example, 47 columns and 4,897 rows). They won't match the domain table's own row count. I can make them vary per table later if you want.

## Technical details
- `table-brief/evidence-panel.tsx`: export `OverviewSection`, `ProfilingView`, `SampleDataView`, `ChecksView`, `ActivityView` (no change to how they render).
- `domain/domain-screen.tsx` `TableContext`: render those for overview/columns/sample/checks/activity; rename the `events` tab id/label to `activity` / "Activity log"; map `OverviewSection` `onOpen` ids (columns/rows → columns, fill → columns, checks → checks) to tabs; pass a no-op `onScope` to ProfilingView. Remove now-unused locals/imports.
- Update `domain/AGENTS.md` table-tab description.
