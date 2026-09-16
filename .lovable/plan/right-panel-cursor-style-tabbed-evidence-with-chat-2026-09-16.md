# Right panel: Cursor-style tabbed evidence with chat

Make the right panel behave like the Cursor side panel: always present, tabs across the top, "+" opens another evidence view in a new tab, and one control widens / restores / collapses it. When expanded, the panel fills the whole screen (minus the left nav) and the conversation stops being a center column — it becomes the first tab in the panel.

## Layout states

- **Compact (default, ~300px):** Overview cards + the Evidence list. No tabs, no composer. The center column (brief + thread + input) is the conversation surface.
- **Docked (~545px):** opens as soon as the first evidence tab exists. Tab strip on top, evidence content below, a composer pinned at the bottom of each tab. Center column stays visible alongside.
- **Expanded (full width minus the left nav):** the widen control stretches the panel across the entire content area — the center column disappears and the conversation moves into the panel as the first tab, "Chat", which renders the same thread. The same control restores Docked.

## Tabs

- First tab is **Chat** (always present once the panel is tabbed; cannot be closed). Evidence tabs follow in open order.
- Clicking an Evidence line item opens it as a tab and focuses it; an already-open item just gets focused.
- "+" at the end of the bar opens a menu of evidence views not yet open (Sample data, Column profiling, Checks, Activity, Duplicate rows).
- Each evidence tab has an x; closing the last one returns the panel to Compact (in Docked) and in Expanded returns to the Chat tab.
- Overview status cards still open their matching evidence view as a tab.

## Controls, right of the tab bar

- **Widen / restore:** Docked ↔ Expanded.
- **Collapse:** closes the tab strip and returns to Compact (re-opening restores the last tab set).

## Chat inside evidence tabs

- Every tab (Chat included) has the styled composer pinned at its bottom — same #E3E3F2 box as the center composer, sized to the panel.
- The composer is contextual: the placeholder names the current evidence ("Ask about the duplicate rows…") and the question is sent with that evidence as scope.
- Sending appends the user message and agent reply to the one table thread — the same messages everywhere. Nothing forks.
- After sending from an evidence tab, the panel switches to the Chat tab so the reply is visible; the center column stays in sync when the panel is Docked (its brief collapses as today).
- The center column's composer disappears in Expanded (the panel's Chat tab composer replaces it); collapsing back to Compact/Docked restores it.

## Kept as-is

- Overview (activity band + 2x2 status cards) stays visible in Compact, and scrolls above the tab strip in Docked/Expanded.
- SFDC mentions still open the duplicates tab with the "SFDC re-inserts · 900" filter chip.
- No hover-only interactions; tab close and "+" are click/keyboard reachable.

## Technical notes

All in `src/components/table-brief/`:
- `table-brief-screen.tsx` owns shared state: `messages`, `ask`, plus new `tabs: EvidenceId[]`, `activeTab: "chat" | EvidenceId`, `widthMode: "compact" | "docked" | "expanded"`; `openTab(id)` dedupes and focuses. In Expanded the center column is not rendered (header stays as the panel's Chat tab context); the same `messages`/`ask` feed both columns so nothing is lost on state switches.
- `evidence-panel.tsx`: add `EvidenceTabBar` (Chat tab + evidence tabs + add-menu + widen + collapse) and `PanelComposer` pinned at the bottom of each tab body. Existing view components (`DuplicateRowsView`, `SampleDataView`, `ProfilingView`, `ChecksView`, `ActivityView`) unchanged; the Chat tab renders the existing `Thread`.
- `PanelComposer` reuses the center composer's styling at a smaller min-height; submitting calls `ask(question, { scope: activeTab })`, then focuses the Chat tab.
- `answers.ts`: `answerFor` gains an optional scope argument so scripted matching can prefer an evidence-specific reply; unmatched input falls back to the current default.
- Panel width via the existing inline `width` style; Expanded uses `flex: 1` over the content area. Transition stays `transition-[width] duration-200`.
- Add-menu is an absolutely-positioned list closed on outside click/Escape — no new dependency.
