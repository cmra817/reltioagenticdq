# Scripted assistant conversation for Step 1 (Select data)

Make the wizard's right-panel chat on step 1 play a fixed, click-through conversation that ends with two real tables auto-selected — no typing required.

## The conversation

Panel opens in its normal empty state with one suggested prompt chip:

- **Show me tables by freshness** (click)
- Assistant replies: "Based on frequency of use, here are your top 2 tables:" followed by
  - `dim_customers` — 42 columns, 1.2M rows, updated daily · Contains: email, phone, address fields
  - `fct_orders_daily` — 28 columns, 4.8M rows, updated hourly · Contains: transaction dates, amounts
  - then "Would you like me to add these tables to your analysis?"
- Next suggested chip: **Yes** (click)
- Assistant replies: "Done! I've selected these tables." — and the two rows get checked in the main panel (chips appear in the toolbar).

Row counts/descriptions come from the existing mock data so the chat matches the table.

## Behavior rules

- Both user turns are suggestion chips only; the script advances on click.
- After the script finishes (or if the user types anything of their own), the panel falls back to the live AI assistant as it does today.
- Auto-selection just checks the two rows; no sidebar expansion or scrolling.
- Steps 2 and 3 chat panels are unchanged.

## Technical notes

- Both tables live in Databricks › Data Science › `prod_analytics`, so selection keys are `assetKey("dbx-data-science", "prod_analytics", name)`.
- `WizardChatPanel` gains an optional script: an ordered list of `{ userPrompt, assistantText, onDone? }` steps used when `context === "select"`. Clicking a scripted suggestion appends the user + assistant messages locally instead of calling `/api/chat`; once the script is exhausted, `ChatWindow` behaves normally.
- `ChatWindow` needs a small hook so a suggestion click can be intercepted (e.g. an optional `onSuggestionClick` returning `true` when handled) rather than always calling `sendMessage`.
- `AddDatasetModal` passes an `onSelectAssets(keys: string[])` callback into the step-0 panel, which merges the keys into the existing `selected` set (reusing the same `toggle`/set state that drives chips and step 2).
