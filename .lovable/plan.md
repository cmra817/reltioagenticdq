# Data health: default dashboard, dashboard you can talk to, investigations in their own chat

Three changes, all on the Data health screen.

## 1. No setup on first visit

Today a new visitor gets the setup conversation. Instead, the screen opens straight into the
finished dashboard — the same scorecard, brief and conversation you see after setup today,
built from the tables this account is already connected to and monitoring.

There is no setup step on entry at all. The setup conversation only appears when you ask for
something bigger than a tweak — "build me a dashboard for the finance tables", "start over with
a new dashboard" — and it happens inside the dashboard page's own conversation: the agent states
the plan for the new dashboard, you confirm, and it regenerates in place. No separate screen,
no wizard.

## 2. The dashboard changes when you ask it to

The conversation under the dashboard can already answer questions. It will now also be able to
change what the dashboard shows:

- "add duplicate rate by table", "show me load times for orders_fact", "track fill rate on
  cust_addresses" → the agent replies with the chart, and adds a matching card to the
  scorecard (same pinning behaviour, minus the extra click).
- "remove the volume drift tile", "drop the duplicates card" → the card comes off, with a
  one-line confirmation and an Undo.
- "show freshness too", "stop watching completeness" → turns a whole dimension on or off,
  so the scorecard regenerates.
- Anything it can't map to a metric it owns gets an honest reply listing what it can add,
  rather than a silent no-op.

Every change is stated in words in the thread before it happens, and the dashboard shape
persists with the rest of the setup so it survives a reload.

New suggestion chips reflect this: one question chip, one "add a chart" chip, one investigate chip.

## 3. Investigating opens a new chat

Asking the dashboard to dig into something — "what's happening with the duplicates?",
"why is orders_fact late?", "look into the cust_addresses nulls" — no longer answers inline.
The agent posts a short line in the dashboard thread ("Opening an investigation into duplicate
growth →") and opens a **new chat thread** on its own page, the way the consistency
investigation already works today. The dashboard thread stays where it was; the investigation
lives in Recent chats and can be reopened.

Each investigation is a scripted, chart-heavy thread, in the shape of the existing consistency
one:

- **Duplicates** — duplicate rate across the three SFDC tables, the Aug 21 marker, a
  rows-vs-distinct-keys breakdown per table, then the connector change as the cause, ending with
  a link into `customer_data` profiling and a follow-up prompt box.
- **orders_fact freshness** — load time against its learned band, the three spike days, how each
  recovered within a day, and why it isn't worth acting on this week.
- **cust_addresses nulls** — the `state` null rate against its 2% threshold, when it started, and
  the failing check.

Below the scripted turns, the prompt box stays live, so follow-ups continue in that thread.

Finding cards and answer actions in the dashboard get an "Investigate" action that opens the
matching thread.

## Technical notes

- `data-health-screen.tsx`: seed `config` from a new `DEFAULT_CONFIG` when nothing is stored,
  instead of rendering `SetupFlow`; `SetupFlow` renders only when restart is pressed.
- Dashboard shape moves into state (`dims` plus a list of added metric cards) persisted under the
  existing `dq.datahealth.setup.v1` key; `Scorecard` renders dimension cards + added cards +
  pins from that state.
- New `dashboard-commands.ts` next to `answers.ts`: parses an input into
  `{ kind: "add" | "remove" | "dimension" | "investigate" | "answer", ... }` against a registry of
  known metrics (duplicate rate, load time, fill rate, volume drift, uniqueness, checks passing).
  `ask()` in `data-health-screen.tsx` routes on the result.
- New route `src/routes/investigate.$topic.tsx` with `topic` in `duplicates | freshness | nulls`,
  plus `src/components/data-health-brief/investigations.tsx` holding the scripted turns and
  charts, reusing `HealthChart`/`StatStrip` from `charts.tsx` and the series in `data.ts`.
  It creates a thread through `useChatThreads` (kind `investigation`) and keeps the live
  follow-up prompt box, mirroring `investigation-thread.tsx`.
- All numbers stay in `data.ts`; no new data sources, no merged anomaly/check counts, no
  composite score.
