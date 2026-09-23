import {
  DUPE_BAND,
  DUPE_CUSTOMER,
  FILL_BAND,
  FILL_SERIES,
  LOAD_BAND,
  LOAD_TIME,
  PAYMENTS_ROWS,
  type DimensionId,
  type MetricCard,
} from "./data";

/* ---------- extra cards the conversation can add ---------- */

export type ExtraId = "dupe-by-table" | "orders-load" | "cust-addresses-fill" | "payments-rows";

export const EXTRA_CARDS: Record<ExtraId, MetricCard & { name: string }> = {
  "dupe-by-table": {
    id: "dupe-by-table",
    name: "duplicate rate by table",
    tag: "Duplicates",
    label: "Duplicate rate · customer_data",
    value: "24.6%",
    delta: "↑ 23.8 since Aug 21",
    breaching: true,
    series: DUPE_CUSTOMER,
    band: DUPE_BAND,
  },
  "orders-load": {
    id: "orders-load",
    name: "load time for orders_fact",
    tag: "Load time",
    label: "orders_fact load",
    value: "19m",
    delta: "outside band 3 of 9 days",
    breaching: true,
    series: LOAD_TIME,
    band: LOAD_BAND,
  },
  "cust-addresses-fill": {
    id: "cust-addresses-fill",
    name: "fill rate on cust_addresses",
    tag: "Fill rate",
    label: "cust_addresses.state",
    value: "97.6%",
    delta: "null rate 2.4% · threshold 2%",
    breaching: true,
    series: FILL_SERIES,
    band: FILL_BAND,
  },
  "payments-rows": {
    id: "payments-rows",
    name: "row count for payments",
    tag: "Volume",
    label: "payments rows",
    value: "112,890",
    delta: "+3% a week for 11 weeks",
    breaching: false,
    series: PAYMENTS_ROWS,
  },
};

/* ---------- what the dashboard can talk about ---------- */

type Target = { extra?: ExtraId; dim?: DimensionId; name: string };

const TARGETS: { aliases: string[]; target: Target }[] = [
  { aliases: ["duplicate rate by table", "duplicate rate", "duplicates by table", "duplicate"], target: { extra: "dupe-by-table", name: "duplicate rate by table" } },
  { aliases: ["load time", "load times", "orders_fact load", "orders fact load"], target: { extra: "orders-load", name: "load time for orders_fact" } },
  { aliases: ["fill rate on cust_addresses", "cust_addresses fill", "cust_addresses nulls", "cust_addresses"], target: { extra: "cust-addresses-fill", name: "fill rate on cust_addresses" } },
  { aliases: ["payments row", "row count", "payments volume", "payments"], target: { extra: "payments-rows", name: "row count for payments" } },
  { aliases: ["freshness", "timeliness"], target: { dim: "timeliness", name: "timeliness" } },
  { aliases: ["fill rate", "completeness"], target: { dim: "completeness", name: "completeness" } },
  { aliases: ["volume drift", "volume"], target: { dim: "volume", name: "volume drift" } },
  { aliases: ["uniqueness"], target: { dim: "uniqueness", name: "uniqueness" } },
  { aliases: ["format"], target: { dim: "format", name: "format validity" } },
];

export const KNOWN_METRICS =
  "duplicate rate by table, load time for orders_fact, fill rate on cust_addresses, row count for payments, and the uniqueness, completeness, volume drift, timeliness and format dimensions";

/* ---------- investigations ---------- */

export type InvestigationTopic = "duplicates" | "freshness" | "nulls";

const INVESTIGATION_VERBS = [
  "investigate",
  "dig into",
  "look into",
  "what's happening",
  "whats happening",
  "what is happening",
  "what's going on",
  "whats going on",
  "why is",
  "why are",
  "why did",
  "explain",
];

function topicOf(t: string): InvestigationTopic | null {
  if (t.includes("duplicate")) return "duplicates";
  if (t.includes("orders_fact") || t.includes("orders fact") || t.includes("late") || t.includes("freshness") || t.includes("load time"))
    return "freshness";
  if (t.includes("cust_addresses") || t.includes("null")) return "nulls";
  return null;
}

export const TOPIC_TITLES: Record<InvestigationTopic, string> = {
  duplicates: "Duplicates on the SFDC connector",
  freshness: "orders_fact freshness",
  nulls: "cust_addresses nulls",
};

/* ---------- parsing ---------- */

export type Command =
  | { kind: "add"; target: Target }
  | { kind: "remove"; target: Target }
  | { kind: "unknown-metric"; verb: "add" | "remove" }
  | { kind: "investigate"; topic: InvestigationTopic; question: string }
  | { kind: "rebuild" }
  | { kind: "answer" };

function findTarget(t: string): Target | null {
  for (const entry of TARGETS) {
    if (entry.aliases.some((a) => t.includes(a))) return entry.target;
  }
  return null;
}

export function parseCommand(raw: string): Command {
  const t = raw.toLowerCase().trim();

  // rebuild / new dashboard
  if (
    /(build|create|make|set ?up|generate)\b.*\bdashboard/.test(t) ||
    t.includes("new dashboard") ||
    t.includes("start over") ||
    t.includes("rebuild") ||
    t.includes("restart setup")
  ) {
    return { kind: "rebuild" };
  }

  // investigation
  const topic = topicOf(t);
  if (topic && INVESTIGATION_VERBS.some((v) => t.includes(v))) {
    return { kind: "investigate", topic, question: raw.trim() };
  }

  // remove
  if (/\b(remove|drop|hide|delete|stop (showing|watching|tracking))\b/.test(t)) {
    const target = findTarget(t);
    return target ? { kind: "remove", target } : { kind: "unknown-metric", verb: "remove" };
  }

  // add
  if (/\b(add|track|show|chart|include|watch|plot)\b/.test(t)) {
    const target = findTarget(t);
    if (target) return { kind: "add", target };
    // "show me the three tables" and friends are scripted answers, not dashboard edits
    if (/\b(add|track|chart|plot|include)\b/.test(t)) return { kind: "unknown-metric", verb: "add" };
  }

  return { kind: "answer" };
}
