export type PinPayload = { title: string; value: string; sub: string };

export type Action = {
  label: string;
  primary?: boolean;
  ask?: string;
  pin?: PinPayload;
};

export type Block =
  | { kind: "note"; text: string }
  | { kind: "p"; text: string }
  | { kind: "kv"; rows: { k: string; v: string }[] }
  | { kind: "causes"; items: { text: string; ruled: boolean }[] }
  | { kind: "rules"; cards: { heading: string; config: string; backtest: string }[] }
  | { kind: "actions"; actions: Action[] };

export type ScriptedAnswer = { blocks: Block[] };

export const FALLBACK: ScriptedAnswer = {
  blocks: [
    {
      kind: "p",
      text: "This prototype answers the suggested questions — try a chip below, an anomaly on the right, or a finding's actions above.",
    },
  ],
};

const SCRIPT: { match: string[]; answer: ScriptedAnswer }[] = [
  {
    match: ["why did the check only fire now"],
    answer: {
      blocks: [
        { kind: "note", text: "⌁ Memory — the check has none, I have 90 days of it" },
        {
          kind: "p",
          text: "The uniqueness check is a tripwire. It fires the moment duplicates cross 1,000 and says nothing at all below that. Every day before today it returned pass, and pass meant \"under the number\", not \"clean\".",
        },
        {
          kind: "kv",
          rows: [
            { k: "Aug 19", v: "40 duplicates — the day the SFDC sync schedule changed" },
            { k: "Aug 26", v: "310" },
            { k: "Sep 02", v: "780" },
            { k: "Today", v: "1,204 — threshold crossed, alert fires" },
          ],
        },
        {
          kind: "p",
          text: "Three weeks of signal your threshold was designed to suppress. Nothing was broken about the check — it did what it was configured to do. It just can't tell you about a trend.",
        },
        {
          kind: "actions",
          actions: [
            { label: "Propose a rate-of-change rule", primary: true, ask: "Prevent this" },
            {
              label: "Pin ↑",
              pin: { title: "Started", value: "Aug 19", sub: "21 days before the alert" },
            },
          ],
        },
      ],
    },
  },
  {
    match: ["how bad is this on a join"],
    answer: {
      blocks: [
        { kind: "note", text: "⌁ Arithmetic on the check's own result" },
        {
          kind: "p",
          text: "Duplicates don't add on a join, they multiply. Each duplicated key produces a row for every copy it has, so the raw duplicate count understates what any join to customer_id actually produces.",
        },
        {
          kind: "kv",
          rows: [
            { k: "1,204", v: "duplicated ID values" },
            { k: "2.7×", v: "average multiplicity" },
            { k: "~3,200", v: "extra rows produced on any join to this key" },
            { k: "~8%", v: "inflation on any count over that join — not 2%" },
          ],
        },
        { kind: "p", text: "So the exposure is roughly four times what the raw count suggests." },
        {
          kind: "actions",
          actions: [
            {
              label: "Pin ↑",
              pin: { title: "Join exposure", value: "~3,200", sub: "extra rows · ~8% inflation" },
            },
            { label: "Find the cause", primary: true, ask: "Investigate the SFDC re-inserts" },
          ],
        },
      ],
    },
  },
  {
    match: ["investigate the sfdc re inserts", "investigate the 900", "investigate the sfdc reinserts"],
    answer: {
      blocks: [
        { kind: "note", text: "⌁ Checked 6 possible causes" },
        {
          kind: "causes",
          items: [
            { text: "Schema changed — no DDL in 90 days", ruled: true },
            { text: "Pipeline failed or ran late — all runs completed", ruled: true },
            { text: "Rule or threshold edited — no changes in 30 days", ruled: true },
            { text: "Connector config changed — SFDC sync schedule edited Aug 19, 02:10", ruled: false },
            {
              text: "Insert pattern shifted — duplicates never have a later updated_at, so they're inserts, not upserts",
              ruled: false,
            },
            {
              text: "Isolated to this table — 2 siblings on the same connector diverge the same day",
              ruled: true,
            },
          ],
        },
        {
          kind: "p",
          text: "Likely cause. The Aug 19 schedule change appears to have switched the SFDC sync from upsert to insert. Every run since re-inserts records it should be matching. Confidence is high — the date is exact, the insert-vs-update signature is unambiguous, and it reproduces across three tables.",
        },
        {
          kind: "p",
          text: "One thing this doesn't explain: the 4 cross-system collisions predate Aug 19 and are a separate issue.",
        },
        {
          kind: "actions",
          actions: [
            { label: "Notify the connector owner", primary: true },
            { label: "Prevent this", ask: "Prevent this" },
            {
              label: "Pin ↑",
              pin: { title: "Root cause", value: "Aug 19 02:10", sub: "SFDC upsert → insert" },
            },
          ],
        },
      ],
    },
  },
  {
    match: ["check the sibling tables", "compare all three"],
    answer: {
      blocks: [
        { kind: "note", text: "⌁ Compared against tables on the same connector" },
        {
          kind: "kv",
          rows: [
            { k: "customer_data", v: "+6% rows, distinct flat · has a uniqueness check · alerted" },
            { k: "contact_master", v: "+5% rows, distinct flat · no uniqueness check · silent" },
            { k: "account_roll", v: "+4% rows, distinct flat · no uniqueness check · silent" },
          ],
        },
        {
          kind: "p",
          text: "All three turn on Aug 19. Only this one had a check, so only this one told you. The other two have the same problem and no way to report it.",
        },
        {
          kind: "actions",
          actions: [
            { label: "Add the rule to all three", primary: true, ask: "Prevent this" },
            {
              label: "Pin ↑",
              pin: { title: "Siblings affected", value: "2", sub: "contact_master · account_roll" },
            },
          ],
        },
      ],
    },
  },
  {
    match: ["prevent this", "propose a rule"],
    answer: {
      blocks: [
        { kind: "p", text: "Two rules. The existing one stays — it's not wrong, it's just late." },
        {
          kind: "rules",
          cards: [
            {
              heading: "expect_column_values_to_be_unique",
              config: "column: customer_id · fail above: 0.5% of rows",
              backtest:
                "Backtested over 90 days: fires Aug 21, when this was 61 duplicates instead of 1,204. No other firings — the column was genuinely clean before Aug 19, so zero false positives.",
            },
            {
              heading: "expect_column_distinct_values_to_grow_with_row_count",
              config: "columns: customer_id vs row_count · fail if divergence > 2%",
              backtest:
                "This is the one that catches growth that isn't growth. Backtested: fires Aug 22. It would also have caught the two sibling tables, which have no uniqueness check at all.",
            },
          ],
        },
        {
          kind: "actions",
          actions: [
            { label: "Add both to rules library", primary: true },
            { label: "Apply to all SFDC tables" },
            {
              label: "Pin ↑",
              pin: {
                title: "Would have caught it",
                value: "Aug 21",
                sub: "at 61 dupes, not 1,204",
              },
            },
          ],
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

export function mentionsSfdc(input: string) {
  return normalise(input).includes("sfdc");
}
