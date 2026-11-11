# Clicking a check in the domain panel opens it like a rule

## What changes
- On a domain's **Checks** tab (and a table's Checks tab), clicking a check's name opens the same screen as clicking a rule on the Rules page. You get a chat that starts with "Tell me about the '<check>' rule" and an answer. The right panel shows **Insights**, **Edit** and **History**.
- Each check has one chat. Opening it again from the domain panel, the Rules page or Recents brings back the same conversation.
- To go back to the domain, use Recents or the browser's back button.
- Three checks become rules in the library, so they also show up on the Rules page: **Phone Number Completeness** (Completeness), **Date Range Validation** (Accuracy) and **Status Value Set Check** (Consistency). The other two use rules that already exist: **Email Format Validation** opens "Email addresses are valid", and **Customer ID Uniqueness** opens "No duplicate records by key".
- Today, clicking a check's name opens its row and asks about it in the domain chat. That stops. The small arrow at the start of the row now opens and closes the row without leaving the page.

## Technical details
- `lib/mock-ops.ts` `BASE_RULES`: add r8 Phone Number Completeness, r9 Date Range Validation and r10 Status Value Set Check. Each gets a description, severity, owner, Team scope and one "Created" version. "Accuracy" is added as a rule type if it isn't one already.
- `table-brief/data.ts` `CHECK_GROUPS`: add `ruleId` to each group (email-format→r3, phone-completeness→r8, customer-id-uniqueness→r4, date-range→r9, status-values→r10).
- `ChecksView`: add an optional `onOpen(group)` prop. When it is set, clicking the name calls it and the chevron becomes its own expand/collapse button. Explore doesn't pass it, so Explore stays the same.
- `domain-screen.tsx`, domain and table Checks tabs: pass `onOpen={(g) => openRule({ id: g.ruleId, name: g.name })}` using `useOpenRule`, and stop sending the check prompt there. The rule thread sends its own automatic prompt.
- `insightsFor` in `rule-insights.ts` covers the new rule ids; it falls back to defaults where needed.
- Domain AGENTS.md: a check opens its rule's thread.
