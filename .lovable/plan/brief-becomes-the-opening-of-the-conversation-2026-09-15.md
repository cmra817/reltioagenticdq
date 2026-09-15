# Brief becomes the opening of the conversation

## What changes

Today the agent brief (verdict, three chart cards, "44 other columns" line) sits in its own pinned container above the thread. This change makes it part of the conversation itself.

- The brief renders as the first content inside the scrolling conversation area, fully expanded when the page opens.
- When the user sends a question (from the chips or the prompt box), or clicks Collapse, the brief folds itself up into the existing one-line summary bar.
- Once collapsed, the summary bar stays pinned at the top of the conversation while the messages scroll beneath it, so the user can re-expand it at any time with one click.
- If the user re-expands it, it opens in place again; asking another question collapses it again.

## What stays the same

- The brief content itself — the lay-of-the-land paragraph, the three chart cards, the "44 other columns — nothing needed you" line — is untouched.
- The collapsed summary bar keeps its current content (table name, "3 findings" badge, one-line takeaway).
- Right-hand overview panel, evidence views, chips, and the prompt box are unchanged.

## Technical details

- `src/components/table-brief/table-brief-screen.tsx` — move `ComposedBrief` from its own shrink-0 region into the top of the `Thread` scroll area; make the collapsed bar `sticky top-0` so it remains visible once folded; auto-collapse in the `ask` handler.
- `src/components/table-brief/composed-brief.tsx` — no content edits; the component already supports collapsed/expanded states, so only its placement and sticky behavior change.
- Thread auto-scroll still anchors to the newest message; on first open, the view starts at the top showing the expanded brief rather than jumping to the bottom.
