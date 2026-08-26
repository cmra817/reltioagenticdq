# Reltio | Data Quality — Demo Script

A presenter-ready walkthrough of the prototype. Total runtime: **~20 minutes** (7 acts).

**The story arc:** onboard data in minutes → get told when something's off → understand it at table and column level → govern rules centrally → see health across the estate → and when a number moves the wrong way, let the agent investigate it with you.

## Setup checklist (do this before the audience is watching)

- Open the app at `/` — the **Data Health** dashboard is the homepage.
- Collapse nothing; the left nav should show `+ New`, the nav items, and **Recent chats**.
- If you've rehearsed already: clear the browser's local storage so previously created datasets, chats, and dashboard layout changes don't clutter the demo.
- **Important:** the wizard chat panel, the consistency investigation, and notifications are scripted. Click the suggested prompt chips exactly as written below rather than typing your own text into those panels — freeform text goes to the live assistant instead of the script.
- Have this file open on a second screen.

---

## Act 1 — Add a new dataset (~4 min)

**Goal:** show that onboarding data into monitoring takes three steps, and that the agent can do the work for you.

**Click path**

1. Left nav → **`+ New`** → **Add new dataset**. A full-page wizard opens on step **Select data**.
2. *Manual path first.* In the left connections panel, expand **Databricks** (also available: Snowflake, BigQuery), pick a connection and schema. Check one or two tables in the main list. Point out the selected-table chips that appear in the table toolbar, then clear them.
   - Optional: **+ Add connection** at the top of the connections panel → pick Databricks → catalog/schema → **Connect**. It succeeds instantly in the prototype.
3. *Agent path.* In the right-hand assistant panel, click the chip **"Show me tables by freshness"**.
   - Agent replies with the top 2 tables by usage: **`dim_customers`** (42 columns, 1.2M rows, daily) and **`fct_orders_daily`** (28 columns, 4.8M rows, hourly), then asks if it should add them.
4. Click the follow-up chip **"Yes"** → agent replies *"Done! I've selected these tables."* and both rows get checked in the main panel.
5. **Continue** → step **Apply checks**.
6. The assistant opens with an analysis: recommended checks per table, with counts. In the main panel, walk one **accordion rule row**: chevron open shows the read-only **Expectation** (`expect_column_values_to_not_be_null`-style function name), the **Pattern** field, and the editable **"Fail rule if more than [0]%…"** threshold, plus a live **"What this rule does"** summary. Hover a collapsed row to reveal the **X** → *Remove*.
7. In the assistant, click the chip **"Create me a check to make sure phone_number column is not null"** → the agent authors the rule (Dimension: Completeness, column, expectation, fail rule) and adds it to the table's checks; the count goes up.
8. **Continue** → step **Schedule**. Set **profiling** and **DQ checks** cadence in the UI, or mention you could just tell the assistant *"Run profiling nightly and checks every 6 hours"*.
9. **Finish setup**.

**What to say**

> "Three steps: pick the data, confirm the checks, set the cadence. But notice the assistant on the right isn't a help chatbot — it selected the tables for me, and it authored a real data quality rule into the wizard. Everything it did, I could also have done by hand."

**Fallback:** if the agent doesn't advance, you clicked or typed something other than the exact chip. Reopen the wizard and click the chips only.

---

## Act 2 — You get told when it's done (~1 min)

**Goal:** onboarding kicks off real work, and the user doesn't have to watch it.

**Click path**

1. After finishing, a confirmation appears at the bottom of the page (with the domain-connected breadcrumb if you came from **Create new domain**).
2. Toasts announce **"Profiling started for …"**, then **"Profiling completed"** and **"DQ checks completed"**.
3. Click the **notification bell** in the header. Two entries: *Profiling completed* and *DQ checks completed*, each naming the table.

**What to say**

> "Adding a dataset triggers profiling and the check run. You get notified per table when each finishes — and the same notifications fire for ad-hoc runs you trigger yourself from a table's **Actions** menu."

---

## Act 3 — Table detail: profiling, anomalies, column metrics (~4 min)

**Goal:** the depth behind the notification.

**Click path**

1. From the bell, click the notification → lands on the table detail page, **Overview**.
2. Top of the page: the **activity strip** (recent runs, uncontained, scannable).
3. Stat cards: **Rows** and **Fill rate** carry sparklines with **baseline bands** — these are drift signals, and they flag red with a warning icon when the latest value falls outside the band. **Checks passing** keeps its sparkline but has **no band and no warning icon** — it's a rollup of explicit rule results, not an independent anomaly signal.
4. Header: the **anomaly badge** counts auto-detected anomalies (volume, schema, drift). Explicit DQ check failures are shown separately, tagged **new** or **recurring** — they are not counted as anomalies.
5. If the connector is stale, **Last synced** renders amber. Click the schema change entry to open the **schema diff modal** — discrete added/removed/changed columns.
6. Open the **Actions** dropdown: *Run profiling*, *Run DQ checks*, *Load to Reltio*, *Edit DQ checks*, *Edit schedules*, and *Remove from monitoring* (red).
7. Go to the **Columns / profiling** tab. The **Name** column is sticky while you scroll horizontally; **Completeness** is a column; anomaly warning icons sit next to the offending cell values.
8. Click a column → the **column profile panel** opens. Show: breadcrumb *Domain > Table > Column*, the anomaly badge, **Completeness** and **Uniqueness** as slim split bars with trend lines and bands, the **Distribution** bell curve, and **Pattern** / **Most frequent value** tables where newly appearing values carry a **NEW** badge. Expand it to the full-page state.

**What to say**

> "Two different classes of problem live on this page. Anomalies are things nobody wrote a rule for — the volume moved, the schema changed, a distribution drifted. Check failures are rules you did write. We keep them visually separate so the anomaly count stays meaningful. And the NEW badges at column level are usually the first sign of an upstream change."

---

## Act 4 — Explore the estate (~2 min)

**Goal:** find anything, and confirm the new dataset landed.

**Click path**

1. Left nav → **Explore**.
2. Warehouse/connection tree on the left, plus the **Filters** panel: asset type (table, view, dashboard) and tags. Combine with search.
3. Select a single table to drill into its **columns** view.
4. Find the dataset you created in Act 1 — same name, same schedule, the checks you kept. Note it has only one run of history, because it has only run once.

**What to say**

> "Whatever you onboard shows up here immediately with the configuration you chose — nothing to reconcile by hand."

---

## Act 5 — DQ rules library (~3 min)

**Goal:** rules are a governed, reusable asset, not per-table copy-paste.

**Click path**

1. Left nav → **DQ checks**.
2. Search; filter by **dimension** and **creator**; sort the table by **pass rate** or **columns**. Toggle **list ↔ card** view.
3. Open a rule → the rule modal. Show the two authoring modes: **Describe it** (natural language) and **Write it directly**.
4. Use **Test your pattern** — run it against a real column or paste manual values and show pass/fail.
5. Mention **clone** for variants and **edit** for in-place changes.

**What to say**

> "One definition, applied across many columns, with a live pass rate. Stewards can describe a rule in English; engineers can write the expression directly — same object either way."

---

## Act 6 — Data Health dashboard, personalized (~4 min)

**Goal:** the executive view, and it's theirs to shape.

**Click path**

1. Left nav → **Data health** (also the homepage).
2. Top **KPI strip**: passing %, incidents, and friends. Note the strip only accepts number widgets.
3. Below: the widget grid — bar, line, area, and table widgets.
4. Open the **widget library**. Already-applied widgets show a left-aligned green checkmark instead of a button. **Apply** one and watch it land on the grid.
5. **Create widget** — build a custom one from the metric/visual options.
6. **Drag** a widget to a new position; **resize** it (1–3 columns wide, 1–2 rows tall) on the 3-column grid.
7. Hover the vertical gap between any two widget rows → the **+ Add category** strip appears → click to split into a titled category. Rename it, collapse it.
8. Use a widget's overflow menu to **remove** it. If you're showing admin mode, mention inheritance and publishing a layout to everyone.

**What to say**

> "Out-of-the-box metrics get you value on day one, but every team watches something different — so the layout, the categories, and the widgets themselves are all editable, and an admin can publish a standard layout down to the org."

---

## Act 7 — "Why did consistency drop?" (~3 min)

**Goal:** the closing beat — the agent investigates, not just answers.

**Click path**

1. Still on the Data Health page, in the prompt box at the bottom type: **`Why did consistency drop this month?`** and send.
2. A full-screen investigation thread opens. **Turn 1:** the agent summarizes the drop and embeds a **"Consistency failures by table"** horizontal bar chart.
3. Click the suggested chip **"What's going on with dim_customer?"** (the other chip is intentionally inactive).
4. **Turn 2:** a **"Failure trend — dim_customer consistency checks"** line chart with a **"Schema sync"** marker at **Aug 14**. The agent explains the root cause: a new **`APAC-2`** value entering the column, which the existing rule doesn't allow.
5. Click the CTA **"Open dim_customer in Table Profiling →"** — straight back to Act 3's surface, now with a reason to be there.
6. Open the left nav → **Recent chats**: the investigation is saved. Reopen it; the charts and turns are intact, and you can ask freeform follow-ups from the prompt box at the bottom.

**What to say**

> "The dashboard told me consistency fell. It didn't tell me why. The agent decomposed the metric to the table, correlated it with a schema sync, and named the actual offending value — then handed me the page where I fix it. And because it's a saved thread, the next person doesn't redo the investigation."

---

## Closing (30 sec)

> "You saw the whole loop. We **detected** — profiling and rules running on a cadence you set in three steps. We **explained** — anomalies and check failures kept distinct, down to the column and the value. And we **resolved** — the agent drove the investigation and dropped us on the fix. That's the difference between a dashboard and a data quality practice."

Then: *"Where in your estate would you point this first?"*

---

## Presenter cheat sheet

### Scripted prompts — click these, don't type them

| Where | Click exactly | What happens |
| --- | --- | --- |
| Wizard step 1, right panel | **Show me tables by freshness** | Agent lists `dim_customers` + `fct_orders_daily` |
| Wizard step 1, follow-up chip | **Yes** | Both tables get checked in the main panel |
| Wizard step 2, right panel | **Create me a check to make sure phone_number column is not null** | Agent authors and adds the Completeness rule |
| Any page prompt box (typing is fine here) | **Why did consistency drop this month?** | Opens the scripted investigation thread |
| Investigation turn 1 | **What's going on with dim_customer?** | Trend chart, Aug 14 schema sync, `APAC-2` root cause |

Anything else typed into those two panels goes to the live assistant — the script won't advance.

### Say this / avoid this

- Say **"Data Quality"** or **"Reltio Data Quality"**. The product is not called AgentFlow.
- Say **anomaly** for auto-detected drift/volume/schema movement; say **check failure** for an explicit rule result. Don't blend them — the demo's visual language depends on the distinction.
- Call **Checks passing** a *rollup*, never a drift signal.
- It's a prototype: connections succeed without credentials and the data is representative, not live. Say so once, up front, then stop apologizing for it.
- If a scripted panel stalls, don't debug on stage — narrate the intended outcome and move to the next act.
