# Table detail, rebuilt as an agent brief

Replace today's tabbed table page with a screen that opens by telling the user what's wrong and what to do — with the profiling tables demoted to evidence on the right. Demo table: `customer_data`. The app's existing left navigation stays as-is; the new work is the two columns to the right of it.

## Shape of the screen

```text
| app sidebar |          center: brief + conversation          |  evidence  |
|             |  header: customer_data · Finance · Orders      |  overview  |
|             |  ------------------------------------------    |  (always)  |
|             |  COMPOSED BRIEF (pinned, own scroll, ~58vh)    |  ---------- |
|             |  ------------------------------------------    |  anomalies |
|             |  THREAD (scrolls independently)                |  ---------- |
|             |  ------------------------------------------    |  evidence  |
|             |  chips + input (fixed at bottom)               |  launcher  |
```

The defining behaviour: the brief stays pinned at the top of the centre column and never scrolls away as the conversation grows. This gets built and verified first.

## The brief

- Header row shows the table name, its domain path, and, right-aligned, why the user is here: "Opened from uniqueness alert · 7:41am".
- A muted acknowledgement of what the alert already said, then a larger verdict paragraph: this started three weeks ago, it's three problems not one, only 900 are new, and the 6% row growth is entirely these duplicates.
- "What the check couldn't see · 3 findings" — three accordion rows, collapsed by default, several can be open at once. Each shows a two-line capability label, a one-line summary, a type badge (check failing / anomaly), and a chevron.
  1. **Rows behind it** — the 1,204 split into 900 SFDC re-inserts (new), 300 TEST_ records (months old), 4 genuine collisions the agent says it cannot adjudicate. Actions: Investigate the 900, See the rows, Propose a rule.
  2. **Two metrics** — rows up 6%, distinct customers flat, shown as a dual-line chart diverging at Aug 19. Actions: Pin, How bad is this on a join?
  3. **Sibling tables** — contact_master and account_roll turn the same day on the same connector, neither has a uniqueness check. Actions: Compare all three, Pin.
- Required closing line: "44 other columns — nothing needed you." with a show-all link.
- A pinned-widgets strip, empty at first; pinning appends a small card (title, large value, sub-line) with a remove control, briefly highlights it, and expands the brief if collapsed.
- Collapsed state is a single bar: table name, "3 findings" badge, "1,204 duplicates · growth is fake · 2 siblings affected", Expand. The whole bar is clickable.

## The conversation

Empty state: "Ask a question, or open something on the right. Anything worth keeping can be pinned up into the brief." Questions appear right-aligned in bubbles; answers render full-width as formatted content — paragraphs, key-value cards, charts, action buttons.

Five scripted answers, matched on lowercased, punctuation-stripped input:

- **Why did the check only fire now?** — the tripwire explanation plus the Aug 19 → today escalation table, closing on "it just can't tell you about a trend".
- **How bad is this on a join?** — the multiplicity arithmetic (2.7×, ~3,200 extra rows, ~8% inflation).
- **Investigate the SFDC re-inserts** — six candidate causes with the ruled-out ones struck through, the Aug 19 02:10 connector schedule change named as likely cause, and the required caveat that the 4 collisions predate it.
- **Check the sibling tables** — the three-table comparison, "only this one had a check".
- **Prevent this** — two rule cards with monospace expectation names, config lines, and backtest results.

Anything unmatched returns the prototype fallback line. Chips above the input: "Why did the check only fire now?", "How bad is this on a join?", "Prevent this".

## Right column

- **Overview**, always visible even with a detail view open: four clickable tiles in 2×2 — Rows 4,897 (breaching, red flag), Distinct customer_id 3,693 (normal), Checks passing 20/21 (no band), Duplicate rate 24.6% (breaching). Each has a sparkline; the breaching ones show the line exiting a shaded band. Colouring comes from leaving the band, never from direction — a rising number is styled as a problem.
- **Anomalies**, count badge of 2, counting detected anomalies only and never the failing check. Two clickable cards with left accent borders: rows-vs-distinct, and connector-wide. Clicking each asks its question in the chat. Below them, "Ask about these".
- **Evidence launcher**: Duplicate rows 1,204, Columns 47, Checks 20/21, Trend +6%, Schema history none, Activity 14h (amber — staleness, visually distinct from the red). Footer: "Observed facts only. What the agent makes of them is in the middle."
- Opening any entry widens the panel from ~300px to ~545px and swaps the launcher for that view; Close returns. Views: duplicate rows table (created == updated highlighted, mixed SFDC / TEST_ / collision rows, "1,196 more"), columns, checks with the threshold footnote, trend chart, schema history, activity list.

## Cross-panel behaviour

- Any question mentioning SFDC opens the duplicate-rows view filtered, with a "SFDC re-inserts · 900" chip and a clear control.
- Clicking a row in any evidence table sets a scope chip in the input (`customer_data › C-40194`) and swaps the placeholder to "Ask about C-40194…"; dismissing the chip clears both.
- Everything meaningful is clickable — no hover-only affordances.

## Rules held throughout

Three visual languages kept apart: red for check failures, a separate anomaly treatment, amber for connector staleness. No combined issue count, no composite health score, no direction-based delta colouring, no claims about downstream consumers. GX expectation names always monospace. Findings cap at three.

## Technical notes

- `src/routes/assets.$assetSlug.tsx` keeps its route and `AppShell`, but its body becomes the new two-column layout. Existing panels that map onto evidence views (column profiling, checks) are reused where their shape fits; the rest of the old tabbed body is retired.
- New components under `src/components/table-brief/`: the composed brief, finding accordion, thread renderer with the scripted answer registry, pinned cards, evidence panel and its views.
- All state is local to the screen (findings open/closed, brief collapsed, pins, evidence view, scope chip). No backend, no persistence — same prototype approach as the rest of the app.
- Charts use the existing chart primitives already used by the data health widgets, so the banded and dual-line treatments match the rest of the product.
