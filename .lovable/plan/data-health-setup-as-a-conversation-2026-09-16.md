# Data health setup as a conversation

Agreed — the draft screen is doing too much at once: a restatement, a 14-table list with removals, dimension toggles, an excluded disclosure, a refine box and a name field, all competing on one page. Setup is a negotiation, so it should read like one.

## The new shape

A single centered thread (~720px), same visual language as the dashboard conversation, no panels or grids.

1. **Agent opens.** "What are you responsible for?" plus the three warehouse-found starters as chips under the composer.
2. **User answers** in the composer, in their own words.
3. **Agent thinks** — the three resolution step labels check off in place inside the thread, not as a separate screen.
4. **Agent proposes, in prose.** One message: what it understood, what it would watch (named tables in a sentence, "and 8 more" inline, expandable to a plain list), what it would measure, and what it is leaving out and why. It ends with a direct question: "Want me to build this?"
5. **User replies.** "Yes" builds it. Anything else — "drop orders_fact", "add the payment tables", "I care about freshness too" — gets a short acknowledging message and an updated proposal, then asks again.
6. **On yes** the agent names the dashboard itself (from the intent), confirms in one line, and the dashboard generates.

The thread is discarded once the dashboard exists. The dashboard starts on its own fresh conversation — nothing from setup is carried over or replayed there.

## What is removed

- The three-screen wizard (intent page, resolving page, draft page) and its step state.
- The always-visible watching list with per-row remove/Undo, the Prioritising/Deprioritising toggle rows with live tile preview, the excluded disclosure, the separate refine input, the name field, "Edit this sentence", and the "Create dashboard" button.

Everything these did is still reachable: removals, additions and dimension changes happen by saying so; the name is derived and correctable in the same reply; the excluded list appears when asked ("what are you skipping?").

## What stays

- The same generated result: `SetupConfig` (intent, name, tableCount, dims) drives the scorecard exactly as today, persisted to the same browser key with "Restart setup" unchanged.
- The same underlying content — restatement, watched tables, hidden tables, excluded tables, dimensions — now delivered as sentences instead of controls.
- Dashboard behaviour untouched: scorecard, Today/Healthy, brief, pinning, chips.

## Technical notes

- `setup-flow.tsx` becomes a message-thread component: `{role, content}` list, scripted agent turns, a composer, and a small intent-parser (keyword/regex over table names and dimension words) that mutates the draft config and re-renders the proposal message.
- Reuse the existing conversation primitives from `thread.tsx` and the dashboard composer styling rather than new chat UI.
- `data.ts` keeps `WATCHING` / `WATCHING_HIDDEN` / `EXCLUDED` / `DIMENSIONS` / `STARTERS`; the proposal message is generated from them.
- `data-health-screen.tsx` keeps calling `onCreate(config)`; it resets its conversation state on create so the setup thread never appears in the dashboard.

## Constraints kept

No composite score, no merged anomaly/check-failure counts, no hover-only interactions, no downstream-consumer claims; band-based deltas; findings capped at three.
