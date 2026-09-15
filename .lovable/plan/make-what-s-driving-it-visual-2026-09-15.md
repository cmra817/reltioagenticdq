# Make "What's driving it" visual

Turn the three findings from text accordions into three chart cards that show the evidence immediately — no clicking required to see the shape of the problem.

## Card 1 — Rows up, unique customers flat

Two lines on one chart, Aug 19 marked: total rows climbing 6%, distinct `customer_id` dead flat. Below the chart, two compact stats side by side: rows +287 since Aug 19, distinct customers +5. One sentence: the table gained rows, not customers.

## Card 2 — Duplicate rows over time

Area/line chart of the *count* of rows carrying a duplicate `customer_id`, rising from ~40 on Aug 19 to 1,204 today, with the 1,000 alert threshold drawn as a dashed line so it's visible that the curve crossed it only this week. Beneath it, a small stacked breakdown bar splitting today's 1,204 into 900 SFDC re-inserts (new) / 300 test records (old) / 4 genuine collisions, with a legend.

## Card 3 — Sibling tables with the same shape

A small multiples row: one mini chart per table (`customer_data`, `contact_master`, `account_roll`), each showing rows vs distinct IDs with the Aug 19 marker. Each mini chart is labelled with the table name and a one-line read ("rows +6%, distinct flat", "rows +5.5%, distinct −0.4%", "rows +4%, distinct flat"), so it's obvious the same divergence hits all three on the same day. `contact_master` and `account_roll` are additionally tagged "no uniqueness check — never alerted".

## Interaction

- Charts and headline numbers are always visible; the existing prose detail (the three duplicate groups, the upstream reasoning) collapses under a "Details" toggle inside each card.
- Existing action buttons stay at the bottom of each card (Investigate the 900, Pin, Compare all three, Propose a rule).
- Colour rules unchanged: red only for check failures, anomaly treatment for the divergence charts, amber only for connector staleness. No composite score. The "44 other columns — nothing needed you" line stays.

## Technical notes

- New series in `src/components/table-brief/data.ts`: duplicate-row counts over 18 points (40 → 1,204), sibling distinct-ID series for `contact_master` and `account_roll`, and a `DUPE_BREAKDOWN` array for the stacked bar.
- `charts.tsx` gains two small additions: an optional dashed threshold line on `LineChart`, and a `StackedBar` component for the breakdown.
- `composed-brief.tsx`: the `Finding` accordion becomes a `FindingCard` that renders header + chart + stats always, with `Details` toggling the prose. Card 3 uses a 3-up grid of compact `LineChart`s.
