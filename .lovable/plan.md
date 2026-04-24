

# Build "Activity" Tab

Replace the empty Activity tab placeholder with a real activity feed showing DQ check run events for the current table, plus a GitHub-style yearly heatmap.

## Layout

```text
┌────────────────────────────────────────────────────────────────────────┐
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │           Jan  Feb  Mar  Apr  May  Jun  Jul  Aug  Sep  Oct  Nov  │ │
│  │  Sun     ▢▢▢▢ ▢▢▢▢ ▢▢▢▢ ▢▢▢▢ ▢▢▣▣ ▣▣▣▣ ▣▣▣▣ ▣▣▣▣ ▣▣▣▣ …          │ │
│  │  Mon     …                                                        │ │
│  │  Sat                                          Passed ▢▣▣▣▣ Failed │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│  Today                                                                 │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │ ExpectColumnMostCommonValueToBeInSet  [Validity]  first_name     │ │
│  │                                          Today 2:45 AM   [Passed]│ │
│  ├──────────────────────────────────────────────────────────────────┤ │
│  │ ExpectColumnValueLengthsToBeBetween   [Validity]  ssn         ⓘ  │ │
│  │                                          Today 1:30 AM   [Failed]│ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│  Yesterday                                                             │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │ …                                                                │ │
│  └──────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

- Top card: yearly heatmap, 7 rows (Sun→Sat) × 53 weekly columns. Cell colors represent pass/fail intensity (5 shades from light grey "no run" to deep green "all passed", with subtle yellow-green for mixed). Month labels span the top. Hovering a cell shows a date tooltip (e.g. `Aug 30, 2025`).
- Below: activity sections grouped by date label (`Today`, `Yesterday`, `This Week`, then weekly).
- Each event row: check name (mono-ish), dimension pill, target column(s), timestamp on the right, status pill (Passed = green, Failed = red).
- Failed rows show a small ⓘ trailing icon; hovering it reveals a dark tooltip with `Expected:` and a short failure description.

## Data model

Add to `src/routes/assets.$assetSlug.tsx`:

```ts
type ActivityStatus = "Passed" | "Failed" | "Warning";
type ActivityEvent = {
  id: string;
  check: string;          // e.g. "ExpectColumnValueLengthsToBeBetween"
  dimension: "Validity" | "Completeness" | "Uniqueness" | "Accuracy" | "Consistency";
  target: string;         // e.g. "ssn" or "shipped_date, order_date"
  ranAt: string;          // ISO; rendered as "Today 2:45 AM" / "Yesterday 6:12 PM" / "Apr 19 9:05 AM"
  status: ActivityStatus;
  detail?: string;        // shown in ⓘ tooltip when present (failed rows)
};

type HeatmapCell = { date: string; passed: number; failed: number };
// Generate 365 cells deterministically from the slug so the chart is stable.
```

## Component changes

In `src/routes/assets.$assetSlug.tsx`:
1. Replace `{activeTab === "Activity" && <EmptyPanel … />}` with `<ActivityPanel events={SAMPLE_ACTIVITY} />`.
2. Add `ActivityPanel`:
   - Renders `<HeatmapCard />` then a list of date-grouped sections.
   - Groups events by `Today` / `Yesterday` / weekday name for current week / `MMM D` otherwise.
3. Add `HeatmapCard`:
   - Builds a 53-week × 7-day grid using a deterministic pseudo-random seeded by the asset slug + date so the visual is stable and trends greener mid-year (matches screenshot).
   - Renders inline SVG (~880×170) with month labels along the top and Sun/Mon/…/Sat row labels on the left.
   - Bottom-right legend: `Passed ▢▣▣▣▣ Failed` using the same 5-step color scale.
   - Native `<title>` element inside each `<rect>` for the hover tooltip (date + counts).
4. Add small helpers (kept inside the file, no new files):
   - `ActivityStatusPill({ status })` – reuses the same green/red/amber tokens as `StatusPill`.
   - `InfoTooltip({ text })` – ⓘ icon (lucide `Info`) wrapped in a custom tooltip (absolute-positioned dark bubble on hover, matching the screenshot's dark popover with light text).
   - `formatActivityTime(iso: string)` – returns `"Today 2:45 AM"`, `"Yesterday 6:12 PM"`, or `"Apr 19 9:05 AM"`.

## Visual tokens

- Heatmap palette (light → dark): `#EEF2F7`, `#D6F0DA`, `#9FE0AC`, `#5BC074`, `#1F8A3E`. (Same green family as the existing Passed pill.)
- Section headers (`Today`, `Yesterday`): existing heading style used by other panel section labels.
- Cards: same `border / rounded-lg / bg-white` tokens as the Checks and Profiling panels for consistency.

## Sample data

~12 events spread across Today / Yesterday / earlier-this-week, mirroring the screenshot (e.g. `ExpectColumnMostCommonValueToBeInSet` Validity Passed, `ExpectColumnValueLengthsToBeBetween` Validity Failed with `detail: "Length between 9 and 11 characters. 1,247 records contain SSN values that are shorter or longer than the expected length…"`, `ExpectColumnValuesToNotNull` Completeness, `ExpectColumnPairValuesAToBeGreaterThanB` Consistency Failed, etc.).

## Out of scope (this turn)

- Date range filtering on the heatmap.
- Pagination / infinite scroll for older activity.
- Real navigation when clicking a check name (will deep-link to the Checks tab in a later pass).
- Click-to-filter from heatmap cell to the events on that day.

