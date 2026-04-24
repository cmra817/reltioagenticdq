

# Build "Checks" Tab

Replace the empty placeholder for the **Checks** tab on `/assets/:assetSlug` with a real quality-checks table that matches the reference screenshot.

## Concept

A "check" is a quality rule (e.g. *Email Format Validation*, *Phone Number Completeness*) applied to one or more columns of the current table. Each check is a parent row that can be expanded to reveal the individual columns it covers.

## Layout

```text
┌────────────────────────────────────────────────────────────────────────────┐
│  [🔍 Search…]  [⛃ filter]                                                  │
├────────────────────────────────────────────────────────────────────────────┤
│  NAME              │ DIMENSION   │ COVERAGE │ LAST RUN │ STATUS  │ PASS RATE │
├────────────────────────────────────────────────────────────────────────────┤
│ ▾ Email Format Val.│ Validity    │  4 ▦     │ 2h ago   │ Passed  │ 98/100    │
│    ✓ attributes.Email           │          │ 2h ago   │ Passed  │ 100/100   │
│    ✓ attributes.SecondaryEmail  │          │ 2h ago   │ Passed  │ 98/100    │
│    ✓ attributes.WorkEmail       │          │ 2h ago   │ Passed  │ 100/100   │
│    ✓ attributes.RecoveryEmail   │          │ 2h ago   │ Passed  │ 99/100    │
│ ▸ Phone Number Completeness │ Completeness │ 3 ▦ │ 2h ago │ Failed │ 2/3 (67%)│
│ ▸ Customer ID Uniqueness    │ Uniqueness   │ 1 ▦ │ 2h ago │ Failed │ 0/1 (0%) │
│ ▸ Date Range Validation     │ Accuracy     │ 5 ▦ │ 3h ago │ Warning│ 4/5 (80%)│
│ ▸ Status Value Set Check    │ …            │ 2 ▦ │ 2h ago │ Passed │ 2/2 (100%)│
│ ▸ Phone Number Completeness │ Completeness │ 2 ▦ │ 2h ago │ Passed │ 2/2 (100%)│
└────────────────────────────────────────────────────────────────────────────┘
```

- Parent rows: blue check name (clickable chevron to expand/collapse), dimension pill, coverage badge with column count + small table icon, last-run time, status pill (Passed = green, Failed = red, Warning = amber), pass-rate text.
- Child rows: indented under parent, leading ✓ icon, column path (e.g. `attributes.Email`), no dimension/coverage, own last-run/status/pass-rate.
- Search input + filter icon above the table mirror the existing Columns tab toolbar.
- Re-uses the same card/border/typography tokens already used by the Columns table for visual consistency.

## Data model

Add to `src/routes/assets.$assetSlug.tsx`:

```ts
type CheckStatus = "Passed" | "Failed" | "Warning";
type CheckChild  = { column: string; lastRun: string; status: CheckStatus; passRate: string };
type CheckRow    = {
  name: string;
  dimension: "Validity" | "Completeness" | "Uniqueness" | "Accuracy" | "Consistency";
  lastRun: string;
  status: CheckStatus;
  passRate: string;       // e.g. "98/100 (98%)"
  children: CheckChild[]; // coverage = children.length
};

const SAMPLE_CHECKS: CheckRow[] = [ /* the 6 rows shown above */ ];
```

## Component changes

In `src/routes/assets.$assetSlug.tsx`:
1. Replace `{activeTab === "Checks" && <EmptyPanel … />}` with `<ChecksPanel checks={SAMPLE_CHECKS} />`.
2. Add a new `ChecksPanel` component:
   - Local state `expanded: Set<string>` keyed by check name; default first row expanded (matches screenshot).
   - Renders the toolbar (search input, filter button — visual only, no logic this pass).
   - Renders one `<table>` with the columns above. Parent row toggles `expanded`; when expanded, render its children as additional `<tr>` rows immediately after with a soft tinted background (`var(--surface-soft)`).
3. Add small helpers (kept inside the file, no new files):
   - `StatusPill({ status })` – green / red / amber pill using existing token colors.
   - `DimensionPill({ label })` – neutral outlined pill.
   - `CoverageBadge({ count })` – `{count} ▦` using the existing `TableIcon`.

## Out of scope (this turn)

- Wiring search/filter logic.
- Real navigation when clicking a check name or a child column.
- Persisting expanded state across tab switches.

