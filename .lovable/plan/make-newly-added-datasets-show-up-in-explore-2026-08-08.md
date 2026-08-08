# Make newly added datasets show up in Explore

Yes, this is doable. Today the wizard only reports back a table-name list and a check count, and Explore plus the table detail page read from hardcoded demo data — so a newly added table disappears after the wizard closes. The plan is to carry the full wizard selection into a shared store and render it as a real asset.

## What the demo will do after this

1. In "Add data asset", pick tables, keep/uncheck recommended quality checks, set profiling + DQ schedules, click Finish setup.
2. Explore now lists each selected table as a new asset — same name, same source (Databricks / Snowflake / BigQuery), same schema, the description from the browser, and a check count matching exactly what was left checked. Filter tree and source/dataset filters include it.
3. Clicking it opens the table detail page:
   - Header shows source, schema breadcrumb, column/row counts, and the schedule ("Profiling: every 6 hours", "DQ checks: daily").
   - Checks tab lists precisely the checks selected in step 2, each grouped by column and dimension, all with a single passing run.
   - Overview shows first-run values with no sparklines and no "since last run" deltas — instead a "First run" note, since there is only one run.
   - Activity shows a single entry: profiling completed and checks completed for that first run.
   - Columns tab shows profiling stats for the run, with the historical trend charts replaced by a "No history yet — trends appear after the next run" state.
4. A "New" tag on the Explore row makes it easy to spot during the demo.

## Technical notes

- **Lift check selection**: `Step2ApplyChecks` currently keeps its `checked` map in local state. Move that state up into `AddDatasetModal` (passed down as `checked` / `onToggleCheck`) so the final selection is available at Finish.
- **New store** `src/components/created-assets-context.tsx`: provider holding `CreatedAsset[]` with name, warehouse/source, connection, schema, description, rows, type (table/view), selected `Check[]`, profiling and checks `ScheduleConfig`, domain, and `createdAt`. Exposes `addAssets(...)` and a slug lookup helper (reusing the same slug rule as notifications). Mounted in `src/routes/__root.tsx` alongside the existing providers.
- **Wizard completion**: extend `AddDatasetCompletion` to include the resolved asset records (from `WAREHOUSES` in `mock-warehouses.ts`, keyed off the `connection::schema::table` selection keys), selected checks, and both schedules. `agentflow-sidebar.tsx` calls `addAssets` in addition to the existing `completeConnection`, so the domain banner behavior stays as-is.
- **Explore** (`explore-screen.tsx`): keep the static demo data, but merge created assets in at render time — map each into the existing `AssetRow` shape, append to the per-source dataset maps and `SOURCE_ALL`/`SOURCE_DATASETS` derivations via a `useMemo` that reads the store instead of the module-level constants directly. New schemas appear as new dataset nodes in the filter tree.
- **Detail page** (`assets.$assetSlug.tsx`): before falling back to `ASSET_DETAILS.orders`, look the slug up in the created-assets store. When found, render the same layout in a "first run" mode: `hasHistory: false` suppresses sparklines, `DeltaPts`, and `MetricTrendSection` charts; Checks tab renders the stored checks; Activity renders the single first-run event pair. Existing demo tables are untouched.
- State is in-memory React context (no persistence), consistent with the current prototype — a page refresh resets it.
