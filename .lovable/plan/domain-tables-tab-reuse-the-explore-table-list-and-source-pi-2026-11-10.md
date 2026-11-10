# Domain Tables tab: reuse the Explore table list and source picker

## What changes
1. **Table list** — The domain page's Tables tab drops its current Table / Health / Updated / Project grid and shows the exact same list used on Explore: source logo, name, "Table › dataset" line, description, No. of columns / rows / checks, Last analyzed with clock, and tag chips, under the same "<title> · N" header strip.
2. **Source filter** — Next to the existing search box, add a "Source" dropdown button. Opening it shows the same Data Source tree as Explore's left panel: collapsible warehouse rows (logo + "Databricks (3)") with checkboxes, and datasets beneath them with checkboxes. Selecting a warehouse or dataset narrows the list; the button shows how many are picked, with a Clear option.
3. **Behavior kept** — Clicking a row still opens that table in the same domain chat (swaps the right panel) rather than going to the Explore asset page. Search still filters by name. Empty states ("No tables yet…", "No tables match.") stay.

## Data note
Domain tables today only carry name, domain, rows, score and last checked — no warehouse, dataset, columns, checks or tags. Each domain table will be given a stable, made-up warehouse + dataset + description + column/check counts + tags (same mock style as Explore), so the list and source filter have something real to show. Health score is no longer shown in this list (it isn't in the Explore design).

## Technical details
- `explore-screen.tsx`: extract the asset-rows `<table>` from `AssetOverview` into an exported `AssetTable({ title, rows, onOpen? })` (Link to `/assets/$slug` when no `onOpen`), and extract the source tree from `FilterPanel` into an exported `SourceTree({ sources, trees, selected, onToggle })`. Explore keeps using both, so it renders unchanged.
- `mock-ops.ts`: add `tableAssetFor(t: TableInfo)` returning the AssetRow-shaped fields, hashed from the table name across Databricks / BigQuery / Snowflake and a few datasets.
- `domain-screen.tsx` Tables tab: search + `Source` popover (shadcn Popover) containing `SourceTree` built from the domain's tables; filter `shown` by selected sources/datasets; render `AssetTable` with `onOpen={onOpenTable}`.
- Update `src/components/domain/AGENTS.md` with the reuse rule.
