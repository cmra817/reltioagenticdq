# Clicking a check in the domain panel opens it as a card in the chat

## What changes
1. On a domain's Checks tab (or a table's Checks tab), clicking a check's name asks the domain chat "Tell me about the '<check>' check". The question appears in the same chat; no new chat opens.
2. The agent answers with a short summary and a **check card** in its reply: the check's name, its type, and its pass rate.
3. Clicking the card switches the right panel to that check, laid over the domain panel. It has the same three tabs as a rule's page:
   - **Insights:** pass rate, trend, top failing table.column, coverage by task
   - **Edit:** name, description, type, severity, status, owner, parameters, with the usual impact check when saving
   - **History**
4. The card has an **×** in its header. Closing it brings back the domain panel exactly as you left it, on the same tab with the same filters. You can open it again from the card in the chat at any time.
5. Clicking things inside the card (bars, trend, tiles) asks about them in the same domain chat, just like the rest of the panel.
6. Three checks become rules in the library, so they also show on the Rules page: **Phone Number Completeness**, **Date Range Validation** and **Status Value Set Check**. **Email Format Validation** uses the existing "Email addresses are valid" and **Customer ID Uniqueness** uses "No duplicate records by key".
7. The small arrow next to each check still opens and closes the row without asking anything.

This "card that takes over the panel, close to return" pattern becomes the way any chat answer can show a richer view on top of an existing panel.

## Technical details
- `chat-visuals.tsx`: add a `ChatVisual` kind `rule` (`{ kind: "rule"; ruleId; title; meta }`). It is plain data, so saved chats restore it, and it renders as a card. Add `OverlayOpenContext` (`(v) => void`) for opening it.
- Extract the rule panel body (tabs plus Insights/Edit/History, currently inside `RuleWorkspace`) into an exported `RulePanel({ ruleId, onAsk, onClose? })` in `rules/rule-panel.tsx`. `RuleWorkspace` uses it too, so both stay identical.
- `domain-screen.tsx`: keep `overlay` state (`{ kind: "rule", ruleId } | null`). When it is set, the panel renders `RulePanel` with a close button (×). Closing clears it, and the domain panel's tab and filters stay put because that state lives in `DomainScreen`. Provide `OverlayOpenContext`.
- `ChecksView`: add an optional `onOpen(group)` prop. The name calls it and the chevron toggles the row; Explore doesn't pass it, so it stays the same. Domain and table Checks tabs send the check question with a reply that carries the `rule` visual.
- `CHECK_GROUPS` gets a `ruleId`. `BASE_RULES` gets r8, r9 and r10. `buildInsights` works for the new rules.
- Domain AGENTS.md: rule for answer cards that lay a panel over the domain panel and close back to it.
