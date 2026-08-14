# Draggable, resizable Data Health dashboard

## The layout model

Two distinct zones, because they behave differently:

**1. KPI strip (top)** — a single horizontal row of compact number cards. Same fixed height for every tile, 4 across on desktop, 2 on tablet, 1 on mobile. It only accepts number-style widgets (a single value, optional sparkline + delta). Drag to reorder within the strip; no resizing (uniform height is what makes the strip readable). The 4 OOTB metrics live here by default, and any "number" widget from the library can be added to the strip.

**2. Widget canvas (below)** — a 3-column grid. Every widget has a width of 1, 2, or 3 columns and a height of 1 or 2 row units (row unit ≈ 220px, so a bar/line chart at height 2 gets real vertical space). Drag to any position, resize by dragging the bottom-right corner; sizes snap to the grid.

Charts/tables can't be dropped into the KPI strip, and number widgets can also live on the canvas as a 1x1 tile — so nothing is locked out, the strip is just the fast lane for single numbers.

## Interactions

- Drag: grab the card header (or a grip that appears on hover) and drag. A dashed placeholder shows where it will land; other widgets reflow live.
- Resize: bottom-right handle on hover. Snaps to 1/2/3 columns and 1/2 row heights, with a size label (e.g. "2 x 1") while dragging.
- Cross-zone drag: a number widget can be dragged between the strip and the canvas. Non-number widgets dragged over the strip show a "not allowed" state.
- Existing behavior kept intact: drill-through on bar/line, non-clickable numbers, overflow menu with "Remove from dashboard", creator badges.
- Layout is per-mode: "My dashboard" and "Org default template" keep separate layouts, and publishing pushes the org layout (positions + sizes) to non-customized users. Moving or resizing a widget in "My dashboard" marks it customized, so "Reset to org default" restores the published layout too.
- Mobile/tablet: canvas collapses to 1 column (tablet: 2), spans clamp, drag/resize disabled below `sm` — order is preserved from the desktop layout.

## Technical notes

- New `dashboard-layout` model in `src/components/data-health/widget-model.ts`: `{ id, zone: "strip" | "canvas", w: 1|2|3, h: 1|2, order }`, plus default layouts for `DEFAULT_APPLIED` and `ORG_DEFAULT_APPLIED`.
- Drag/resize implemented with native pointer events in a small local hook (`useGridDnd`) — no new dependency, consistent with the rest of the prototype. CSS grid with `grid-template-columns: repeat(3, minmax(0,1fr))` and `grid-auto-rows: 220px`; widgets use `grid-column: span w` / `grid-row: span h`.
- `DataHealthWidgets.tsx` renders the two zones and owns layout state; `WidgetCard.tsx` gains optional drag-handle and resize-handle props plus a `compact` variant for the strip. Card styling stays flat: hairline border, 12px radius, no shadows.
- Layout state lives in React state alongside the existing applied-widget state; no backend changes.
