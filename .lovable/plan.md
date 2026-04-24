

# Refactor Activity Feed into a Single Table

Replace the current grouped "card list" layout under the heatmap with one continuous table. Date groupings become subtle full-width separator rows inside the same table, so column headers render only once at the top.

## Recommendation on repeating headers

Don't repeat headers per date block — it's visual noise and breaks scan-ability. Use a single sticky-ish header row at the top of the table, with lightweight inline date dividers (`Today`, `Yesterday`, `Apr 22`, …) spanning all columns between groups. This is the standard pattern (Linear, GitHub Actions, Datadog event feeds) and keeps the eye moving down a stable column grid.

## Layout

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ CHECK                          │ DIMENSION    │ COLUMN     │ RAN ON   │ STATUS │
├──────────────────────────────────────────────────────────────────────────────┤
│ ── Today ────────────────────────────────────────────────────────────────── │
│ ExpectColumnMostCommonValue…   │ [Validity]   │ first_name │ 2:45 AM  │ Passed │
│ ExpectColumnValueLengthsToBe…  │ [Validity]   │ ssn        │ 1:30 AM  │ Failed ⓘ│
├──────────────────────────────────────────────────────────────────────────────┤
│ ── Yesterday ─────────────────────────────────────────────────────────────── │
│ ExpectColumnValuesToNotBeNull  │ [Completen.] │ email      │ 6:12 PM  │ Passed │
│ ExpectColumnPairValuesAToBeG…  │ [Consist.]   │ shipped…   │ 3:01 PM  │ Failed ⓘ│
├──────────────────────────────────────────────────────────────────────────────┤
│ ── Apr 22 ────────────────────────────────────────────────────────────────── │
│ …                              │ …            │ …          │ …        │ …      │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Component changes (in `src/routes/assets.$assetSlug.tsx`)

1. **`ActivityPanel`** — remove the per-group `<div>` cards. Render one `<table>` (same border / typography tokens as the Checks table) wrapped in a single rounded card under the heatmap.
2. **Row generation** — flatten events into a single ordered array. Walk it once; whenever the group label (`Today` / `Yesterday` / weekday / `MMM D`) changes, emit a divider row: `<tr><td colSpan={5} className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 px-4 py-2">{label}</td></tr>`, then emit the event row.
3. **Columns** — exactly five: Check, Dimension, Column, Ran on, Status. Drop the previous "Target" terminology; use the existing `target` field as the Column cell.
4. **Status cell** — render `<ActivityStatusPill />` and, only when `status === "Failed"` and `detail` exists, an `<InfoTooltip />` immediately to the right of the pill (small gap, same row, right-aligned cell).
5. **Ran on** — keep `formatActivityTime`, but inside a date group show only the time portion (e.g. `2:45 AM`) since the group label already conveys the day. For older `MMM D` groups, show just the time too.
6. **Cleanup** — remove now-unused per-group card styling. Keep `activityGroupLabel`, `formatActivityTime`, `ActivityStatusPill`, `InfoTooltip`, and `DimensionPill` helpers.

## Out of scope

- Sticky header on scroll.
- Column sorting / filtering.
- Click-through to the Checks tab.

