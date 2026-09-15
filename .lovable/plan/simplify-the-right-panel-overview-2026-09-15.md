# Simplify the right-panel Overview

Replace the chart-heavy Overview with a compact status snapshot based on the supplied reference.

## Overview layout

- Add a single-row activity band with four facts:
  - Last profiled — 6 hrs ago
  - Checks run — 6 hrs ago
  - Last synced — 14 hrs ago, using the existing amber staleness treatment
  - Loaded to Reltio — 3 days ago
- Keep the activity band compact enough to remain one row in the default right panel, with short labels and values that remain readable.
- Replace the current metric tiles and large rows-vs-distinct chart with a 2×2 grid:
  - Columns — 47, with the recent schema-change warning
  - Rows — 4,897, outside its normal range
  - Fill rate — 85%, within range
  - Checks passing — 20/21, neutral rollup treatment
- Use small sparklines only where they add status context, matching the supplied reference. Do not restore the larger analytical charts already shown in the conversation.
- Preserve the established status rules: red for failures or breached ranges, amber for staleness, and neutral styling for the checks rollup.

## Remove duplication

- Remove the separate chart-based Anomalies section and its “Ask about these” action from the right panel.
- Place Evidence immediately below the compact Overview, keeping Duplicate rows, Sample data, Column profiling, Checks, and Activity unchanged and clickable.
- Keep opened Evidence views and the panel’s existing expand/close behavior unchanged.

## Verification

- Check the default and expanded right-panel widths to ensure the activity band stays on one row and the 2×2 cards do not overflow.
- Confirm Evidence interactions still open and close correctly.
- Confirm the page renders without console or build errors.
