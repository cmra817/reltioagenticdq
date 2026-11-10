# Everything in the domain right panel sends an auto prompt

Rule: any click in the domain page's right panel does its normal action (open a table, switch tab, filter) and also sends a prompt into the chat. The agent answers with a short explanation and, where it fits, a chart.

## What sends a prompt

Domain level (some already do this — the brief, score tile and lowest-table bars):
- Tables tab: clicking a table row → opens the table and sends "Let's discuss the gl_entries table". Answer: a summary plus a DQ score trend and check pass/fail bars.
- Overview tab: each stat tile and the health-by-table bars (check and fill any gaps).
- Checks tab: expanding a check → "Let's discuss the <check> check" — what it tests, where it fails, a pass-rate trend.

Table level (gl_entries and others):
- Overview cards (Columns, Rows, Fill rate, Checks passing) → still switch to their tab, and send "Tell me about the <card> for gl_entries". Answer explains the number, with bars (for example the fill rate of the worst columns).
- Columns tab: clicking a column → "Tell me about the <column> column in gl_entries" — type, fill rate, distinct values, related checks, with a distribution chart.
- Sample data tab: clicking a column header → same column prompt.
- Checks tab: expanding a check → check prompt for this table.
- Activity log: clicking a day in the year grid or a run in the list → "What happened on <date> in gl_entries?" with that day's pass/fail bars.

Not prompted (pure controls): search, the Source and Domains filters, show/hide columns menus, tab headers, back and minimize buttons. Tell me if you want tab headers to prompt too.

## Agent answers

Scripted mock answers per topic type (table, card, column, check, day), built from the same mock numbers the panel shows so the chat and panel agree. Each answer ends with one suggested next step.

## Details

- Add an optional `onAsk(prompt)` to the shared Explore views (OverviewSection, ProfilingView, SampleDataView, ChecksView, ActivityView). Explore's own page leaves it unset, so it stays unchanged.
- TableContext and DomainPanel pass `discuss` through; the Tables tab uses `discuss` instead of `openTable`.
- Extend the domain reply builder with topic matchers for card/column/check/day prompts, returning text plus `ChatVisual` bars or a trend.
- If a prompt is sent while the chat is hidden, the reply shows in the floating response card, as today.
- Update `src/components/domain/AGENTS.md` with the rule.
