## Goal

Turn the right-panel profile stats from point-in-time snapshots into a compact "last 5 runs" history so users can see whether each metric went up, down, or stayed flat since the previous profiling run — and whether any new patterns/values appeared.

## Scope

Edits are confined to `src/routes/assets.$assetSlug.tsx` (right panel + small helper components). Mock data only; no backend.

## Changes

### 1. Mock history helper
Add a small helper near the existing mock data that, given a column name + metric key, returns a deterministic 5-point series (seeded by column name so it's stable across renders). Series values fluctuate ±a few points around the current value. Also produces:
- `delta` (last vs previous run, in the metric's units)
- `direction` ("up" | "down" | "flat")

### 2. New atoms
- `Sparkline({ values, color, width?, height? })` — tiny inline SVG line + soft area fill, 5 points, no axes.
- `DeltaChip({ delta, direction, suffix })` — small pill like `↑ 2.1%` / `↓ 0.4%` / `= 0`, colored green/red/neutral, matches the existing `DeltaPill` style in `data-health-dashboard.tsx` for consistency.
- `NewBadge` — small "NEW" pill (light-blue tint, brand-blue text) for patterns/values that didn't appear in the previous run.

### 3. Completeness section
Under the donut + fill-rate/null bars, add a single-row `Trend over last 5 runs` block:
- Label "Fill rate — last 5 runs"
- `Sparkline` + current value + `DeltaChip` vs previous run

### 4. Uniqueness section
Same treatment: a row per stat (`Uniqueness`, `Distinct`) with sparkline + delta chip beside the existing bars.

### 5. Pattern section (`FreqTable` for patterns)
Extend each row to include a small trailing cell:
- If pattern existed last run: `Sparkline` (5-run frequency) + `DeltaChip` (change in count/pct)
- If pattern is new this run: `NewBadge` instead of the sparkline
Mark 1 of the 3 mock patterns as NEW so stakeholders can see the state.

### 6. Most frequent value section
Same trailing cell as Pattern:
- Sparkline of that value's frequency across last 5 runs, plus `DeltaChip`
- 1–2 rows flagged `NEW` to demonstrate newly-introduced frequent values

### 7. Layout notes
- Sparklines: ~72×24, stroke `#14a6a6` for stable metrics, red `#ef4444` when trending down for the metric's meaning.
- Reuse existing tokens (`var(--hairline)`, `var(--ink-*)`, `var(--surface-soft)`); no new CSS variables.
- Each section keeps its rounded-xl soft-surface card; history sits inside, below the current widgets, separated by a thin hairline divider.

## Out of scope
- Wiring to real profiling history.
- Historical charts for Distribution stats (min/max/mean length) — not requested.
- Timeline modal / drill-in view.

## Technical notes
All changes stay client-side, deterministic mocks derived from column name so re-renders are stable. No new dependencies. No changes to routing, loaders, or global state.
