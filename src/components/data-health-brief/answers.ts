export type PinPayload = { title: string; value: string; sub: string };

export type Action = { label: string; primary?: boolean; ask?: string; pin?: PinPayload };

export type ChartId = "dupe-three" | "orders-freshness" | "payments-growth";

export type Block =
  | { kind: "note"; text: string }
  | { kind: "p"; text: string; lead?: boolean }
  | { kind: "kv"; rows: { k: string; v: string }[] }
  | { kind: "table"; headers: string[]; rows: string[][]; foot?: string }
  | { kind: "chart"; chart: ChartId; caption?: string }
  | { kind: "actions"; actions: Action[] };

export type ScriptedAnswer = { blocks: Block[] };

export const FALLBACK: ScriptedAnswer = {
  blocks: [
    {
      kind: "p",
      text: "This prototype answers the suggested questions — try a chip below, or a card's actions above.",
    },
  ],
};

const SCRIPT: { match: string[]; answer: ScriptedAnswer }[] = [
  {
    match: ["why these metrics"],
    answer: {
      blocks: [
        {
          kind: "p",
          lead: true,
          text: "Your scorecard came out of what you told me during setup, not a template. Each tile maps to a dimension you kept.",
        },
        {
          kind: "kv",
          rows: [
            { k: "Uniqueness", v: "You prioritised it — three tables here have keys that aren't enforced unique at source." },
            { k: "Fill rate", v: "You prioritised completeness — 4 tables have columns that go null intermittently." },
            { k: "Volume drift", v: "You prioritised it so I can catch movement before a threshold is crossed." },
            { k: "Checks passing", v: "Always shown. It's the one metric that isn't a judgement call." },
          ],
        },
        {
          kind: "p",
          text: "Timeliness on *_archive and format checks on free-text columns are deprioritised, which is why they aren't here. Turn either back on and a tile appears.",
        },
        { kind: "actions", actions: [{ label: "Edit what I'm watching", primary: true }] },
      ],
    },
  },
  {
    match: ["what should i do first"],
    answer: {
      blocks: [
        { kind: "p", lead: true, text: "Fix the connector, not the tables." },
        {
          kind: "kv",
          rows: [
            { k: "1 · Now", v: "Notify the SFDC connector owner — the Aug 21 task change is still re-inserting on every run." },
            { k: "2 · Today", v: "Add uniqueness checks to contact_master and account_roll so they can report for themselves." },
            { k: "3 · Leave", v: "orders_fact — it returns to band on its own and nothing has failed." },
            { k: "4 · Later", v: "cust_addresses — 2.4% against a 2% threshold, newly failing rather than badly failing." },
          ],
        },
        {
          kind: "p",
          text: "One caveat: the duplicates already in these tables won't clear themselves. Cleanup is worth doing, but not until the source stops adding to them — otherwise you'll do it twice.",
        },
        {
          kind: "actions",
          actions: [
            { label: "Notify connector owner", primary: true },
            { label: "Track this on my dashboard", pin: { title: "SFDC connector", value: "Aug 21", sub: "upsert → insert · 3 tables" } },
          ],
        },
      ],
    },
  },
  {
    match: ["why is this ranked first"],
    answer: {
      blocks: [
        { kind: "note", text: "⌁ Ranking without downstream lineage" },
        {
          kind: "p",
          text: "I can't see what reads these tables. Nothing in this ranking is based on how much depends on them — it's based on movement, recency, your stated intent, and spread.",
        },
        {
          kind: "kv",
          rows: [
            { k: "Magnitude", v: "0.8% → 24.6% duplicate rate. Nothing else you watch moved more than 4%." },
            { k: "Novelty", v: "Started Aug 21. Three weeks old outranks something that's been stable for months." },
            { k: "Your intent", v: "You prioritised uniqueness, and this is a uniqueness failure on a join key." },
            { k: "Spread", v: "Three tables, one cause — fixing one place fixes all three." },
          ],
        },
        {
          kind: "p",
          text: "Connecting dbt would add \"how many things depend on this\", which would probably reorder the bottom two of today's three findings. It wouldn't change the first.",
        },
        {
          kind: "actions",
          actions: [
            { label: "Pin this to the top anyway", pin: { title: "Ranked first", value: "24.6%", sub: "magnitude · novelty · spread" } },
            { label: "Connect dbt" },
          ],
        },
      ],
    },
  },
  {
    match: ["add duplicate rate by table"],
    answer: {
      blocks: [
        { kind: "p", text: "Duplicate rate for the three SFDC tables over the last 30 days." },
        { kind: "chart", chart: "dupe-three", caption: "Aug 21 — SFDC sync schedule changed" },
        {
          kind: "p",
          text: "Pinned, this stays on your scorecard until you remove it and updates with each profiling run.",
        },
        {
          kind: "actions",
          actions: [
            { label: "Pin ↑ to scorecard", primary: true, pin: { title: "Duplicate rate", value: "24.6%", sub: "customer_data · 3 tables tracked" } },
          ],
        },
      ],
    },
  },
  {
    match: ["show me the three tables", "compare the three"],
    answer: {
      blocks: [
        {
          kind: "table",
          headers: ["Table", "Rows", "Distinct key", "Dupe rate", "Uniqueness check"],
          rows: [
            ["customer_data", "4,897", "3,693", "24.6%", "failing"],
            ["contact_master", "3,070", "2,489", "18.9%", "none"],
            ["account_roll", "1,914", "1,656", "13.5%", "none"],
          ],
        },
        {
          kind: "p",
          text: "Same connector, same start date, same shape. Only the first has a check, which is why it's the only one that reached you.",
        },
        {
          kind: "actions",
          actions: [{ label: "Add uniqueness checks to the other two", primary: true }],
        },
      ],
    },
  },
  {
    match: ["should i worry about orders fact", "should i worry"],
    answer: {
      blocks: [
        { kind: "p", lead: true, text: "Not this week." },
        {
          kind: "p",
          text: "Load time leaves its band and comes back on its own within a day, every time. No check failed, and the spike days don't line up with the SFDC change — different connector, different task.",
        },
        { kind: "chart", chart: "orders-freshness" },
        {
          kind: "p",
          text: "It matters if it becomes consistent. I'd let it run another week and flag it if the gaps close up.",
        },
      ],
    },
  },
  {
    match: ["should i worry about cust addresses", "look"],
    answer: {
      blocks: [
        { kind: "p", lead: true, text: "No." },
        {
          kind: "p",
          text: "The state null rate is 2.4% against a 2% threshold, and it's two days old. cust_addresses isn't on the SFDC connector, so it's unrelated to the duplicate problem.",
        },
        {
          kind: "p",
          text: "I'd leave it until the connector is fixed. If it keeps climbing past 4% I'll raise it properly.",
        },
      ],
    },
  },
  {
    match: ["what did you clear"],
    answer: {
      blocks: [
        { kind: "note", text: "⌁ Checked at 6:00am this morning" },
        {
          kind: "table",
          headers: ["Table", "Checks", "Anomalies", "Last profiled"],
          rows: [
            ["payments", "14 of 14 passed", "none", "6:00am"],
            ["cust_consents", "9 of 9 passed", "none", "6:00am"],
            ["cust_segments", "7 of 7 passed", "none", "6:00am"],
            ["crm_stg_accounts", "11 of 11 passed", "none", "6:00am"],
            ["crm_stg_contacts", "11 of 11 passed", "none", "6:00am"],
            ["customer_raw", "8 of 8 passed", "none", "6:00am"],
          ],
          foot: "5 more, all clear",
        },
        {
          kind: "p",
          text: "Nothing here moved outside its band or failed a check. They're not in the brief because there's nothing to say about them.",
        },
      ],
    },
  },
];

export function normalise(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function answerFor(input: string): ScriptedAnswer {
  const n = normalise(input);
  for (const entry of SCRIPT) {
    if (entry.match.some((m) => n === m || n.includes(m))) return entry.answer;
  }
  return FALLBACK;
}
