# Step 2: accordion rule rows for DQ check selection

Replace the current flat table in Step 2 (Apply checks) with a list of single-line accordion rows, so each applied rule can be expanded to show its logic exactly as the Edit rule modal presents it.

## Collapsed row

One line per rule, left to right:

- Chevron (right when collapsed, down when expanded)
- Rule name, bold
- Description / business rationale, muted
- Dimension badge (existing `DimensionBadge`)
- Target column in monospace
- X button on the far right, visible on row hover only, with the existing "remove" tooltip. Removes the rule from this table's applied checks only — the Rules Library is untouched.

## Accordion behavior

- Clicking the chevron or the rule name expands that row and collapses any other open row (single panel at a time).
- Clicking the open row collapses it.
- Read-mostly: only the fail threshold is editable.

## Expanded panel (mirrors the Edit rule modal)

1. `Expectation:` followed by the GX function name in inline monospace, with a copy icon at the far right of that row (same copy behavior and toast as the modal).
2. Read-only pattern/expression field below it (e.g. `in_set(customers.customer_id)`, `not_null`).
3. Threshold sentence with an inline numeric input: "Fail rule if more than [ 0 ]% of values don't match". Defaults to the rule's authored threshold; changing it overrides the threshold only for this table's application.
4. "What this rule does" bordered box with checkmark icon, bold label, and the plain-language summary — same sentence template as the modal, recomputed live as the threshold changes.
5. Footer: red "Remove" text link bottom left, dark filled "Save changes" button bottom right (persists the threshold override for this table).

Zero selected checks stays valid — the user can continue to Schedule with none.

## Technical notes

- `mock-checks.ts`: extend `Check` with `expectation`, `pattern`, and `threshold`, and populate them for every generated check by inferring from the rule name/dimension (not-null → `expect_column_values_to_not_be_null` / `not_null`, unique → `expect_column_values_to_be_unique` / `unique`, format/regex → `expect_column_values_to_match_regex` with the pattern, allowed values → `expect_column_values_to_be_in_set`, range → `expect_column_values_to_be_between`). Defaults are filled for anything unmatched so no rule renders without a summary, including Reltio-managed ones.
- `Step2ApplyChecks.tsx`: swap the grid table body for the accordion list; keep the sub-header, recommendation note, tabs, library search, and "+ Checks" modal as-is. Local state holds the expanded row id and per-table threshold overrides keyed by `assetKey::checkId`, so the summary sentence and input reflect them.
- Library-added and modal-created checks reuse `ruleToCheck`, extended to carry `expectation`, `pattern`, and `threshold` from the `Rule`.
- Summary text reuses the modal's template: "Flags {dimension} issues by checking values against {pattern}, and fails the rule when more than {threshold}% of values don't match."
- The Creator column is dropped from the row (not in the requested row structure); Reltio-managed rules keep the lock affordance next to the name.
