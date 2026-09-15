# Brief flows inline as the conversation's opening — no inner container

## Problem

The expanded brief still renders as its own card: a bordered, tinted box capped at 58% of the viewport height with its own internal scrollbar. It reads as a panel sitting above the chat, not as part of the conversation.

## What changes

- Remove the card chrome from the expanded brief: no border, no background tint, no rounded box.
- Remove the `max-h-[58vh]` cap and the internal `overflow-y-auto` — the brief renders at its natural height and scrolls together with the conversation, like a long opening message from the agent.
- On load, the page shows the brief fully expanded at the top of the conversation, with the empty-thread hint below it.
- Behavior from the previous change is kept: asking a question or clicking Collapse folds it into the one-line summary bar, which stays pinned at the top while the thread scrolls beneath; expanding re-opens it inline.

## Technical details

- `src/components/table-brief/composed-brief.tsx` — on the expanded root element (line ~201): drop `max-h-[58vh]`, `overflow-y-auto`, `rounded-xl`, and the border/background styles; keep padding minimal so it aligns with the thread's agent messages.
- `src/components/table-brief/table-brief-screen.tsx` — keep the brief and `Thread` in the single shared scroll container; only the collapsed bar wrapper keeps `sticky top-0`. When expanded, the brief scrolls away naturally with the conversation.
- Verify: load `/assets/orders`, confirm no inner scrollbar or box around the brief; ask a question; confirm the collapse-then-scroll behavior still works.
