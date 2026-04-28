
# "Add new dataset" — Full-Page Stepper Modal

Wire the topbar's **Add new dataset** menu item to a full-page modal that takes over the viewport. It uses the same workflow stepper structure as the reference "Create new template" screen, scoped to two steps for this flow:

1. **Select data**
2. **Apply checks** (placeholder content this turn)

Only **Step 1** body is built out; Step 2 renders a simple placeholder card so the stepper, Continue, Back, and Cancel wiring all work end-to-end.

Styling reuses existing Reltio tokens (`--brand-blue`, `--ink-900/700/500/300`, `--hairline`, `--surface-soft`, `--canvas`, Inter). Reference image drives header/stepper layout only.

## Trigger

`src/components/agentflow-topbar.tsx` → `NewMenu`:
- Add `datasetOpen` state alongside `domainOpen`.
- **Add new dataset** menu item: `setOpen(false); setDatasetOpen(true);`
- Render `<AddDatasetModal open={datasetOpen} onOpenChange={setDatasetOpen} />`.

## Header & stepper structure (matches reference)

Full-bleed white header, `pt-8 pb-6 px-10`, hairline-bottom. Two rows:

**Row 1** — flex justify-between, items-center:
- Left: page title `Add data asset` (28px, `font-semibold`, `--ink-900`).
- Right cluster: `Cancel` ghost pill button + `Back` outline pill (only when `step > 1`) + `Continue` filled pill (`--brand-blue`, white text, rounded-full, `h-10 px-7`). All buttons rounded-full to match the reference.

**Row 2** — horizontal stepper, left-aligned, `mt-6`:
```text
(1)─────(2)
Select data   Apply checks
```
- Each step: 28px circle + label below.
- **Current** step: filled `--brand-blue` circle, white number, label `--ink-900` font-semibold.
- **Completed** step: filled `--brand-blue` circle with check icon, label `--ink-700`.
- **Upcoming** step: white circle, hairline border, `--ink-300` number and label.
- Connectors: thin `--hairline` line between circles, fills with `--brand-blue` once that segment is completed.
- Steps are **not** clickable (forward navigation only via Continue).

**Continue button behavior:**
- Step 1: enabled only when `selected.size > 0`. Label `Continue`. Advances to step 2.
- Step 2 (placeholder): label changes to `Add N assets`. Closes modal on click.
- `Cancel` always closes the modal and resets state. `Back` returns to previous step.

## Body shell

Full-width below header, `bg-[var(--canvas)]`, scrollable region. Each step renders inside this region.

## Step 1: Select data

Two-panel layout in a single rounded card (`bg-white`, hairline border, `rounded-2xl`, `mx-10 my-8`, `min-h-[calc(100vh-260px)]`).

### Sub-header inside card (full width)
- Subtitle row: `Select tables to monitor` (15px `--ink-700`) on the left.
- Right: ghost **+ Add connection** button (`h-9 px-3 text-[13px]`, `--ink-700`, hairline border, hover `--surface-soft`) → on click, sonner `toast.info("Add connection coming soon")`.
- Hairline divider below.

### Two panels
```text
┌───────────────────────────────────────────────────────────┐
│ Sidebar 280px  │           Right Panel (flex-1)           │
│  scrollable    │  search + (idle | browse | search)       │
└───────────────────────────────────────────────────────────┘
```

#### Left sidebar (`w-[280px]`, hairline-right, scroll-y)
- Grouped by **warehouse type** (Databricks, Snowflake, BigQuery).
- Group label: uppercase 11px `--ink-300`, `tracking-wide`, with caret (rotates) — collapsible. All expanded by default.
- Under each: connections (small db icon + name, 13px `--ink-700`).
- Under each connection: schemas — clickable rows showing `<schema name>` + right-aligned `<n>` table count (`--ink-300`, 12px). Active schema: bg `rgba(67,134,250,0.10)`, text `--brand-blue`, 2px left edge `--brand-blue`.

#### Right panel — three states
Driven by `query` and `activeSchema`:
- empty query + no schema → **Idle**
- empty query + active schema → **Browse**
- non-empty query → **Search**

**Idle:** Centered vertically + horizontally. Large search input (`h-12 w-[520px] rounded-xl`, hairline, search icon left, placeholder `Search tables across all connections`). Hint below: `Or select a schema on the left to browse its tables.` (13px `--ink-500`).

**Browse / Search:** Search bar shrinks to `h-10 w-full max-w-[640px]` and anchors top-left of right panel (`mt-6 ml-8`). Use `transition-all duration-200` on the wrapper for the slide-up animation.

- **Browse body:** breadcrumb `Connection › SCHEMA` (13px `--ink-500`, schema bold `--ink-900`); meta row `{n} tables · {totalRows} rows · {selectedInSchema} selected` (12px `--ink-500`); scrollable list of `AssetRow`s.
- **Search body:** results grouped by connection. If `activeSchema` is set, that connection's group floats to top. Match: case-insensitive substring on asset name. Highlight matched chars with `<mark>` styled `bg-[rgba(67,134,250,0.18)] text-[--ink-900] rounded-sm px-0.5`.
- **Clearing rules:** clearing search with active schema → Browse; clearing with no schema → Idle.

#### `AssetRow`
Full-width clickable row, `py-2.5 px-4 rounded-lg hover:bg-[--surface-soft]`, click anywhere toggles selection.
- Left: shadcn `Checkbox` (controlled).
- Type indicator badge: `T` (table, blue tint) or `V` (view, purple tint).
- Asset name in `font-mono text-[13px] text-[--ink-900]`.
- Below name: `{schema} · {connection}` (11px `--ink-300`).
- Right side (`text-[12px] text-[--ink-500]`, gap-6): row count formatted (`1.2M`, `48K`), `Updated 2h ago` (relative), `Table`/`View` label.

### Footer strip inside card (sticky bottom)
- Empty state: hint `Select tables to start monitoring.` (13px `--ink-500`).
- With selections: chips for selected (max 4 visible, then `+N more`). Each chip: small pill with asset name + `×` to remove. **Clear all** ghost button.
- (Primary CTA lives in the global header `Continue` button — not duplicated here.)

## Step 2: Apply checks (placeholder)

Renders a centered card inside the body region: `Apply checks — coming next` with the count of carried-over assets (`{n} assets selected`). The header's primary button label switches to `Add {n} assets` and closing it dismisses the modal.

## New files

- `src/components/add-dataset/mock-warehouses.ts` — types + static mock (4 connections, 2-3 warehouse types, 2-4 schemas each, 6-12 assets per schema with realistic names, row counts, last-synced timestamps, health).
- `src/components/add-dataset/AddDatasetModal.tsx` — top-level modal: overlay, header + stepper, body switcher, owns `step`, `selected`, `activeSchema`, `query` state. Uses `sonner` for the Add-connection placeholder toast.
- `src/components/add-dataset/Step1SelectData.tsx` — sidebar + right-panel layout with the three states described above.
- `src/components/add-dataset/AssetRow.tsx` — selectable asset row.
- `src/components/add-dataset/Stepper.tsx` — small reusable stepper (numbered circles + connectors + labels).

## Files edited

- `src/components/agentflow-topbar.tsx` — wire **Add new dataset** menu item to open the new modal.

## Out of scope (this turn)

- Real Step 2 (Apply checks) content — placeholder only.
- Real "Add connection" flow.
- Persisting selected assets anywhere outside modal state.
- Keyboard arrow navigation through the asset list.
- Virtualization (mock data is small).
- Step circles being clickable for backward navigation (use the `Back` button in header).

