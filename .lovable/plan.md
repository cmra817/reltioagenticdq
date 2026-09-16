# Right panel: Cursor-style tabbed evidence with chat

Make the right panel behave like the Cursor side panel: always present, tabs across the top, a "+" to open another evidence view in a new tab, a widen control, and a collapse control. In the expanded state the first tab is the conversation itself, and every evidence tab has a composer at the bottom that writes into the same table thread.

## Behavior

**Width states**
- Compact (default, ~300px): Overview cards + the Evidence list. No tabs.
- Docked (~545px): as soon as the first evidence tab exists.
- Expanded (~60% of the window, max ~980px): the widen control pushes the conversation column narrower; the same control restores to docked.

**Tabs**
- Tab bar at the top: first tab is always "Chat" (the table conversation), followed by open evidence tabs. Clicking an Evidence line item opens it as a tab and focuses it; an already-open item just gets focused.
- Each evidence tab shows an icon + label and an x to close. The Chat tab cannot be closed.
- "+" at the end of the bar opens a small menu of evidence views not yet open (Sample data, Column profiling, Checks, Activity, Duplicate rows) — like Cursor's "Open any file…" menu.
- Closing the last evidence tab returns the panel to Compact.
- Overview status cards still open their matching evidence view, now as a tab.

**Controls, right of the tab bar**
- Widen / restore (diagonal arrows): Docked ↔ Expanded.
- Collapse (panel icon): closes the tab strip and returns to Compact; the same control re-opens the last tab set.

**Chat inside evidence tabs**
- Every evidence tab has the styled composer pinned at its bottom (same #E3E3F2 box as the center column, sized to the narrower panel).
- The composer is contextual: placeholder names the current evidence ("Ask about the duplicate rows…"), and the question is sent with that evidence as scope, so the answer is framed around it.
- Sending from an evidence tab appends the user message and the agent reply to the one table thread — the same messages the center column shows. Nothing forks.
- After sending, the panel switches to the Chat tab so the reply is visible, and the center column stays in sync (its brief collapses as it does today).
- The Chat tab renders the same thread as the center column, with its own composer at the bottom.

**Kept as-is**
- Overview (activity band + 2x2 status cards) stays visible in Compact and scrolls above the tab strip.
- SFDC mentions still open the duplicates tab with the "SFDC re-inserts · 900" filter chip.
- No hover-only interactions: close x and "+" menu are click/keyboard reachable.

## Technical notes

All in `src/components/table-brief/`:
- Lift the thread state (`messages`, `ask`) usage so both columns read it: `table-brief-screen.tsx` keeps owning `messages` and passes `messages` + `ask` into `EvidencePanel`.
- New tab state in `table-brief-screen.tsx`: `tabs: EvidenceId[]`, `activeTab: "chat" | EvidenceId`, `widthMode: "compact" | "docked" | "expanded"`; `openTab(id)` dedupes and focuses.
- `evidence-panel.tsx`: add `EvidenceTabBar` (Chat tab + evidence tabs + add-menu + widen + collapse) and a `PanelComposer` rendered at the bottom of each tab body. The existing view components (`DuplicateRowsView`, `SampleDataView`, `ProfilingView`, `ChecksView`, `ActivityView`) are unchanged and fill the scroll area above the composer; the Chat tab renders the existing `Thread`.
- `PanelComposer` reuses the center composer's styling at a smaller min-height; submitting calls `ask(question, { scope: activeTab })` and then sets `activeTab = "chat"`.
- `answers.ts`: `answerFor` takes an optional scope so scripted matching can prefer an evidence-specific reply; unmatched questions fall back to the current default.
- Panel width driven by the existing inline `width` style with three values, keeping `transition-[width] duration-200`.
- Add-menu is an absolutely-positioned list closed on outside click/Escape — no new dependency.
