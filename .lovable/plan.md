# Right panel: Cursor-style tabbed evidence

Make the right panel behave like the Cursor side panel in the screenshots: always present, tabs across the top, a "+" to open another evidence view in a new tab, and the same control to widen / restore / collapse it.

## Behavior

**Three width states**
- Compact (default, ~300px): Overview cards + the Evidence list. No tabs.
- Docked (~545px): opens as soon as the first evidence tab exists.
- Expanded (~60% of the window, max ~980px): the widen control pushes the conversation column narrower; the same control restores to docked.

**Tabs**
- Clicking an Evidence line item opens it as a tab and focuses it. Clicking an item that is already open just focuses its tab (no duplicate).
- Tab bar sits at the top of the panel: evidence icon + label per tab, an x on the active/hovered tab, horizontal scroll when tabs overflow.
- "+" at the end of the tab bar opens a small menu listing the evidence views not yet open (Sample data, Column profiling, Checks, Activity, Duplicate rows) — same idea as Cursor's "Open any file…" menu. Picking one adds a tab.
- Closing the last tab returns the panel to Compact with the Overview + Evidence list.
- Overview status cards keep opening their matching evidence view, now as a tab.

**Controls, right side of the tab bar**
- Widen / restore (diagonal arrows icon): toggles Docked ↔ Expanded.
- Collapse (panel icon): closes all tabs and returns to Compact. Same control re-opens the last tab set.

**Kept as-is**
- Overview (activity band + 2x2 status cards) is always visible in Compact; in Docked/Expanded the tabbed content takes the panel and the Overview scrolls above it.
- Duplicate-rows filter chip ("SFDC re-inserts · 900") still applies when a question mentions SFDC; that opens the duplicates tab.
- No hover-only interactions: the close x and "+" menu are always reachable by click/keyboard.

## Technical notes

All in `src/components/table-brief/`:
- `evidence-panel.tsx`: replace the single `openView` prop with tab state — `tabs: EvidenceId[]`, `activeTab`, plus a `widthMode: "compact" | "docked" | "expanded"`. Add `EvidenceTabBar` (tabs, add-menu, widen, collapse) above the existing view renderers; the view switch (`DuplicateRowsView`, `SampleDataView`, `ProfilingView`, `ChecksView`, `ActivityView`) stays unchanged and renders the active tab.
- `table-brief-screen.tsx`: lift tab state here (it already owns `evidence`/`dupeFilter`); `ask()` with an SFDC mention calls `openTab("duplicates")` instead of `setEvidence`. Duplicates stays a valid tab id even though it is not in the launcher list.
- Panel width driven by the existing inline `width` style with the three values; transition stays `transition-[width] duration-200`.
- Add-menu is a plain absolutely-positioned list closed on outside click/Escape — no new dependency.
