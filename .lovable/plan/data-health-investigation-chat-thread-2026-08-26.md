# Data Health Investigation Chat Thread

A scripted "explore → investigate" chat thread that opens when someone asks the Data Health dashboard why consistency dropped. It reads as a real conversation with charts embedded in the agent's answers, and ends by handing the user off to Table Profiling.

## Trigger

- The "Ask about your data" box at the bottom of the Data Health dashboard stays as-is.
- If the typed question mentions consistency (e.g. "Why did consistency drop this month?"), it opens the scripted investigation thread instead of the live assistant.
- Any other question keeps working exactly as today (live chat thread).

## The thread

Header: "Back to dashboard" link on the left, thread title "Investigating: Consistency".

No message input in this thread — the conversation moves forward only through tappable suggested-prompt chips, since the script is fixed.

**Opening**: the user's question shown as a right-aligned bubble.

**Turn 1 — agent**
- Summary: consistency dropped 51.2% → 48% over the last month, the sharpest decline of any dimension; the agent looked at which tables drive it since the dashboard only shows the aggregate.
- Embedded chart card "Consistency failures by table" — horizontal bars, sorted descending: dim_customer 62%, dim_account 21%, fct_orders_daily 11%, Other 6%.
- Closing line pointing at dim_customer and offering to dig in.
- Chips: "What's going on with dim_customer?" (advances the script) and "Show me the other tables instead" (present but disabled, so the flow stays linear).

**Turn 2 — agent** (after tapping the first chip, which first appears as a right-aligned user bubble)
- Summary: one rule accounts for nearly all of it.
- Embedded chart card "Failure trend — dim_customer consistency checks" — 30-day daily pass rate, flat ~95% until Aug 14, then dropping to ~60% and staying there, with a vertical marker at Aug 14 labeled "Schema sync".
- Root cause text: the Aug 14 schema sync let customer_region accept "APAC-2", which isn't in the reference list the Country Code ISO List rule checks; that rule is ~9 of every 10 consistency failures on this table since the 14th.
- Closing line offering failing rows or the full profiling view.
- Solid CTA button "Open dim_customer in Table Profiling →" that navigates to the asset detail page.
- Two extra chips for realism ("Show me the failing rows", "Which rule is Country Code ISO List?"), visually present but inert.

## Visual treatment

Charts render as chat-embedded cards — bordered, rounded, contained, slightly smaller than dashboard widgets, chart title above — using the existing teal/red dashboard palette for continuity. They deliberately do not look like dashboard widgets.

No incident or project gets created; the flow ends at the profiling link.

## Technical notes

- New route `src/routes/investigate.consistency.tsx` rendering inside `AppShell` with `hideDock`, plus a new `src/components/chat/investigation-thread.tsx` holding the scripted turns and chip state (a simple `turn` counter, no AI call).
- New `src/components/chat/chat-chart-card.tsx` with two Recharts visuals (horizontal `BarChart`, `LineChart` with a `ReferenceLine` annotation at Aug 14) plus mock series data.
- `DockComposer` gains a keyword check: consistency-related questions navigate to the investigation route; everything else keeps the current `/chat/$chatId` behaviour.
- Reuses the existing `Message`/`MessageContent` bubbles and chip styling from `chat-window.tsx` so bubbles and pills match the rest of the product.
- CTA links to the existing dim_customer asset route; route gets its own head() metadata.
