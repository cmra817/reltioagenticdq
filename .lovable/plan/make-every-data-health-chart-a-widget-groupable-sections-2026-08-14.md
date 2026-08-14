# Make every Data Health chart a widget + groupable sections

Right now only the top part of Data Health is widget-driven. The "Data health metrics" cards (Overall Data Quality Score, Job Summary) and the six charts inside "Detailed usage breakdown" are hardcoded blocks — they can't be dragged, resized, removed, or reused from the library. This plan turns them into real widgets and adds user-defined section groups on the canvas.

## 1. Convert the remaining charts into widgets

Split the hardcoded content into individual widgets, each with the same behavior as existing widgets (drag, resize 1–3 cols, remove, library entry, drill-through where meaningful):

- Overall Data Quality Score — line widget (default 2 cols × 2 rows), drillable.
- Job Summary — new `donut` chart type (1 col × 2 rows), drillable by segment (Passed / Failed / Aborted → Incident Manager).
- Detailed usage breakdown becomes six separate widgets, one per dimension: Completeness, Uniqueness, Validity, Accuracy, Consistency, Timeliness. Each keeps its current visual (big %, delta pill, progress bar, "x/200 Passed", mini area line) as a new `metric` chart type, 1 col × 1 row, drillable into incidents filtered by that dimension.

All eight are Reltio-created widgets, appear in the widget library, and are applied by default so the page looks the same on first load — just now as movable tiles.

The old hardcoded sections and their now-unused chart/card helpers are removed from `data-health-dashboard.tsx`; the filter bar (domains / sources / timeframe) stays where it is.

## 2. Section groups on the canvas

Widgets on the canvas can be organized under titled sections, replacing the current fixed "Data health metrics" / "Detailed usage breakdown" headings with user-controlled ones:

- Default sections: "Data health metrics" (score + job summary + the six dimension widgets) and one untitled top group for the rest, matching today's visual order.
- Section header shows the title, a widget count, a collapse caret, and an overflow menu with Rename and Delete (delete keeps widgets, moves them to the section above).
- Inline rename by clicking the title.
- Hovering the vertical gap between widget rows (and between sections) reveals a thin full-width "+ Add category" divider; clicking it inserts a new section at that point with the title in edit mode.
- Widgets can be dragged between sections; the drop target is scoped to the section under the cursor.
- Collapsing a section hides its widgets but keeps the header.
- Sections are part of the layout state, so per-mode layouts, publish, reset-to-org-default, and the customized flag all carry section titles and order.

## Technical notes

- `widget-model.ts`: add `"donut"` and `"metric"` to `ChartType`; add optional widget fields for donut segments and metric details (delta, direction, passed ratio, progress color). Add `Section = { id: string; title: string; collapsed?: boolean }` plus `sectionId?: string` on `LayoutItem`, and a `DashboardLayout = { items: LayoutItem[]; sections: Section[] }`. Extend `defaultLayoutFor` and the OOTB/mock widget lists with the eight new widgets and default sections.
- `WidgetVisual.tsx`: add donut and metric renderers, porting the SVG donut and metric-card markup from `data-health-dashboard.tsx` so styling is identical.
- `dashboard-grid.tsx`: `WidgetCanvas` renders section headers + grouped grids instead of one flat grid, with `SectionDivider` hover affordance and section-aware drag targets. KPI strip behavior unchanged.
- `DataHealthWidgets.tsx`: hold sections in state alongside layout items for both `mine` and `org` modes; add handlers for add/rename/delete/collapse section and section-aware move.
- Drill-through reuses the existing `navigate({ to: "/incidents", search: { segment, widget } })` call.
- Styling follows the existing flat-card / hairline / 12px-radius conventions; no new dependencies.
