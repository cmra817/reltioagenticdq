# Data Health, rebuilt as an agentic dashboard

Replace the current Data Health page (widget grid, widget library, create-widget modal) with a first-run setup flow that produces a generated dashboard: a scorecard, a daily brief, and a conversation. Single centred column, ~900px, no right evidence panel.

## Part 1 — First run (shown once, remembered in the browser)

Three screens in sequence, then never again unless the user restarts setup. A small "Restart setup" control stays available in the dashboard header for demos.

**Screen 1 — the prompt.** Eyebrow "DATA HEALTH · FIRST RUN", heading "What are you responsible for?", subline about describing it like you'd say it to a colleague. Multi-line textarea, prefilled with "I own the customer data going into our Q4 migration". Below: "Or start from something I found in your warehouse" and three starter buttons that fill the textarea as editable text (Customer data quality across CRM_STG and CUSTOMER_RAW / Everything in PROD_ANALYTICS / Finance reporting tables). Continue button.

**Screen 2 — resolving (~2.5s).** Eyebrow "READING YOUR WAREHOUSE". The user's sentence shown unchanged in a bordered card. Three steps check off one at a time ~600ms apart: matching the description to schemas and column names, reading 90 days of profiling history, ranking by how much each table has moved recently. No generic spinner.

**Screen 3 — the negotiation draft.** Eyebrow "HERE'S MY DRAFT — CHANGE ANYTHING".

- Restatement paragraph that also states the agent's limits (can't see downstream readers yet; connect dbt or query history and it will rank on that too), plus an "Edit this sentence" link.
- **WATCHING — 14 tables.** Six rows visible, monospace table name plus a one-line reason (customer_data, contact_master, account_roll, orders_fact, payments, cust_addresses — including the deliberately debatable "payments — stable, included because it's the largest table matching your description"). Each row has an always-visible remove control; removing strikes the row through and updates the count. "Show 8 more" link.
- **PRIORITISING** (note: "these become your scorecard"). Three toggles on by default with reasons: Uniqueness, Completeness, Volume drift. Live preview line underneath — "Scorecard will show: Uniqueness · Fill rate · Volume drift · Checks passing" — updating immediately as toggles change.
- **DEPRIORITISING.** Two toggles off by default with reasons: Timeliness on `*_archive`, Format checks on free-text columns. Turning either on adds its tile to the preview line.
- **Considered and excluded.** Collapsed disclosure, closed by default: "I considered 6 more and left them out — see why", revealing six tables with reasons (backup copy, superseded version, event log with churn by design, static reference table, derived not source, no rows in 200 days).
- **Refine** input at the bottom of the draft.
- Prefilled name field ("Q4 migration") and a "Create dashboard" button.

## Part 2 — The dashboard

Header: "Data health", the intent name and table count, right-aligned Today / Healthy day toggle (plus Restart setup).

Layout is one flex column at full height:
- **Composed region** — pinned at the top, flex-shrink 0, its own `overflow-y: auto`, max height ~64vh. Not a sticky header. Built and verified first.
- **Thread** — flex 1, scrolls independently beneath.
- **Input** — fixed at the bottom.

**A. Scorecard.** Heading with intent name and table count, right-aligned "Why these metrics?" link that asks that question in the chat. Cards are generated from the dimensions chosen in setup — not hardcoded. Each card: uppercase dimension tag, label, large value, sparkline with its learned band behind it, delta line. Defaults: Uniqueness 75.4% (↓ 23.8 since Aug 21, breaching), Fill rate 88.6% (↑ 0.5 since last run, normal), Volume drift +6.2% (outside band 21 days, breaching), Checks passing 94.2% (118 of 124 · 6 failing, no band). Checks passing is always present, always last, never banded. Turning Timeliness on in setup adds a "Timeliness · 13m" card.

**B. Today's brief.** Heading with scope line "6:00am today · 14 tables checked · 3 need you". Verdict paragraph about the three SFDC tables. Then three findings at three visual weights, nothing behind an accordion:

1. Large card, emphasised border. Badge "ANOMALY · 3 TABLES", right-aligned "Started Aug 21 · 21 days". Title about duplicates climbing across the SFDC connector, two silently. Body on the single upstream cause. Full three-series 30-day duplicate-rate chart diverging from a shaded band at Aug 21. Three-column stat strip separated by hairlines (24.6% customer_data alerted 7:41am in red · 18.9% contact_master no check silent · 13.5% account_roll no check silent). Actions: "What should I do first?" (primary), "Compare the three", "Pin ↑".
2. Medium card. Badge "ANOMALY", right-aligned "3 of the last 9 days". orders_fact loads late intermittently, nothing failed. Compact load-time chart spiking out of band three days and returning. Actions: "Should I worry?", "Pin ↑".
3. Single-line item, not a card. "CHECK" badge, `cust_addresses.state` null rate doubled 1.1% → 2.4%, sub-line about the 2% threshold. Actions: "Look", "Snooze".

Closing line: "11 other tables checked — nothing needed you." with a link asking "What did you clear?" in the chat.

**C. Level control** at the bottom of the composed region, right-aligned "Updated 6:00am · next run 6:00am tomorrow": Full (scorecard + brief) / Hide scorecard (brief only) / Minimise (one-line clickable bar: intent name, "3 findings" badge, "SFDC duplicates · orders_fact late · cust_addresses nulls", Expand).

**Thread.** Empty state: "Ask a question, or use a finding's actions above. Anything worth keeping can be pinned into your scorecard." User questions right-aligned in bubbles, answers full-width as paragraphs, key-value cards, charts, tables, action buttons. Every "Pin ↑" appends a card to the scorecard grid, flashes it, and forces the composed region back to Full; pinned cards carry a remove control.

**Input.** Suggested chips above it that change with the day's state — Today: "What should I do first?", "Why is this ranked first?", "Add duplicate rate by table"; Healthy day: "What did you clear?", "Why these metrics?", "Add duplicate rate by table". Placeholder "Ask about your data, or change this dashboard…".

## Part 3 — Healthy day

Toggling swaps the brief and moves scorecard values in-band. Reads as a conclusion: verdict that nothing needs the user today, all 14 tables inside their bands, 124 of 124 checks passed, the Sep 8 fix hasn't regressed. Heading "Worth keeping an eye on · 1 of 14 tables" with one WATCH card ("~7 weeks out") on payments growing 3% a week and crossing its partition size around Nov 3, with the honest-extrapolation body, a stat strip (112,890 rows today +3%/week for 11 weeks · Nov 3 projected partition threshold · 7 wks headroom scheduled job vs incident) and actions "Remind me in 3 weeks" (primary), "Pin ↑", "Dismiss". Closing: "13 other tables checked — all clear."

## Scripted conversation

Matching on lowercased, punctuation-stripped input; unmatched returns "This prototype answers the suggested questions — try a chip below, or a card's actions above." Scripted answers, each with the content described in the brief: "Why these metrics?", "What should I do first?", "Why is this ranked first?" (opens with the muted "⌁ Ranking without downstream lineage" note), "Add duplicate rate by table", "Show me the three tables", "Should I worry about orders_fact?", "Should I worry about cust_addresses?", "What did you clear?" (muted "⌁ Checked at 6:00am this morning" note).

## Technical notes

- New folder `src/components/data-health-brief/`: `data.ts` (30 days of daily, noisy series per table and metric, bands, watching/excluded lists, dimension definitions), `charts.tsx` (one shared renderer — sparkline, banded full chart, multi-series), `answers.ts` (scripted script + normaliser), `setup-flow.tsx` (three first-run screens), `scorecard.tsx`, `brief.tsx`, `thread.tsx`, `data-health-screen.tsx` (owns setup state, dimensions, pins, level, day state, messages).
- Setup result (intent sentence, name, watched tables, dimensions) is persisted in browser storage; the dashboard reads dimensions from it to generate scorecard tiles.
- `src/routes/data-health.tsx` and `src/routes/index.tsx` render the new screen inside `AppShell` with the dock composer hidden (the page has its own input). `data-health-dashboard.tsx` and `src/components/data-health/*` are retired.
- Charts: one renderer over the same daily data so a sparkline and a full chart of a metric are the same numbers at different scales. Full charts get gridlines, a y-axis with units, a dated x-axis with four labels, shaded "learned normal range", line coloured by whether it left the band, and a dashed vertical annotation where a cause is known ("Aug 21 — SFDC sync schedule changed"). Multi-series distinguished by dash pattern plus an end-of-line label, never opacity or colour alone, no separate legend.

## Constraints held throughout

Band-based colouring, never direction-based. Anomalies and check failures never merge — separate badges, separate counts, no combined "issues" number. No composite health score. No claims about downstream consumers; where lineage would help ranking, the agent says so. No hover-only interactions. Findings cap at three and the "11 other tables checked" line is always present. Chips are the primary path. The scorecard is generated from setup choices.
