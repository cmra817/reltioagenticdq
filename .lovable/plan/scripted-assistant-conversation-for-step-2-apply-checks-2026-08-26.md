# Scripted assistant conversation for Step 2 (Apply checks)

Give the Step 2 chat panel a fixed, click-through conversation that opens automatically and can add a real check to the table.

## The conversation

When the user lands on Step 2, the panel already shows the assistant's opening message (no typing, no chip needed):

- "Based on the 2 tables you selected, I've analyzed the column names and data types."
- "I recommend starting with 21 data quality checks across your tables. I've automatically selected these for you based on common validation patterns."
- Breakdown: `dim_customers`: 14 checks, `fct_orders_daily`: 7 checks
- Note that these are basic validations (email format, ID uniqueness, null checks)
- Ends with an invitation to add more checks

Suggested chip below it: **"Create me a check to make sure phone_number column is not null"**

Clicking it posts the user turn and the scripted reply:

- Rule: `phone_number is not null`
- Dimension: Completeness · Column: `phone_number` · Expectation: `expect_column_values_to_not_be_null`
- Threshold: fails if more than 0% of values are null (default)
- What it does: flags rows where `phone_number` is missing
- Closes with: added to your `dim_customers` checks — you're now at 15 checks on that table — and offers to adjust the threshold or add another check.

The check is really added to the `dim_customers` tab in the main panel, so the tab count goes 14 → 15 and the total goes 21 → 22.

## Behavior rules

- Counts in the opening message are derived from the actual selection (table names and their generated check counts), so the copy stays truthful if the selection differs from the scripted two tables.
- Both turns are scripted; anything the user types goes to the live assistant as today.
- After the script finishes, the panel behaves normally.
- Steps 1 and 3 panels are unchanged.

## Technical notes

- `wizard-chat-panel.tsx`: add a `checks` script alongside the existing `select` one. It needs new optional props: a seeded opening assistant message (rendered as the first message instead of the empty state) and an `onAddCheck(assetKey, check)` callback.
- `ChatWindow` already supports `initialMessages`, `suggestions`, `followUps`, and `onIntercept`; the opening message is passed via `initialMessages` so the empty state is skipped. No changes to `/api/chat`.
- `AddDatasetModal.tsx`: pass the selected-asset summary (names + check counts) and its existing `addCustomCheck` into the step-1 (`checks`) panel; the scripted check targets the `dim_customers` selection key when present, otherwise the first selected table.
- The new check reuses the existing `Check` shape (`rule`, `description`, `dimension: "Completeness"`, `field: "phone_number"`), so it renders in the Step 2 table and flows into the created asset on Finish.
