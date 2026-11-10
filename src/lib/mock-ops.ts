/**
 * Prototype data for schedules, runs, rules, and dashboards. One place, so the
 * brief, dashboards, Scheduled, Rules, and the domain page all agree on the
 * same names and numbers. Stands in for the real metric and job layers.
 */

export const ALL_DOMAINS = "All domains";
export const ME = "Molly Gordon";

export type RunStatus = "passed" | "failed" | "attention" | "running";

export const RUN_STATUS_LABEL: Record<RunStatus, string> = {
  passed: "Passed",
  failed: "Failed",
  attention: "Needs attention",
  running: "Running",
};

export type ScheduleKind = "Profiling" | "DQ checks" | "Profiling + checks";

export type Schedule = {
  id: string;
  name: string;
  domain: string;
  kind: ScheduleKind;
  tables: string[];
  ruleIds: string[];
  repeats: string;
  nextRun: string;
  active: boolean;
  owner: string;
  /** Who can see and run it. */
  permissions: string;
  /** Full editable plan (tables, checks, schedules) once edited inline. */
  plan?: import("@/components/add-dataset-agentic/plan-state").Plan;
};

export type Finding = {
  title: string;
  table: string;
  ruleId: string;
  detail: string;
  failingRows: number;
};

export type Run = {
  id: string;
  scheduleId: string;
  hoursAgo: number;
  status: RunStatus;
  durationSec: number;
  checksRun: number;
  checksFailed: number;
  findings: Finding[];
};

export type RuleType = "Completeness" | "Uniqueness" | "Validity" | "Freshness" | "Consistency";
export type Severity = "Low" | "Medium" | "High";
export type RuleScope = "Yours" | "Team" | "Template";

export type RuleVersion = { v: number; author: string; at: string; note: string };

export type Rule = {
  id: string;
  name: string;
  /** Plain-language definition: what the rule checks. */
  description: string;
  type: RuleType;
  severity: Severity;
  owner: string;
  status: "Draft" | "Active" | "Disabled";
  scope: RuleScope;
  /** Share of rows allowed to fail before the check fails. */
  threshold: number;
  /** Optional row filter, in plain language. */
  appliesWhen: string;
  versions: RuleVersion[];
};

export const RULE_TYPES: RuleType[] = [
  "Completeness",
  "Uniqueness",
  "Validity",
  "Freshness",
  "Consistency",
];

export const SEVERITIES: Severity[] = ["Low", "Medium", "High"];

export const REPEAT_PRESETS = [
  "Every hour",
  "Every 6 hours",
  "Every day at 2:00am",
  "Every day at 6:00am",
  "Every day at 8:00am",
  "Every 2 days",
  "Mondays at 5:00am",
  "Mondays at 7:00am",
];

export const BASE_SCHEDULES: Schedule[] = [
  {
    id: "s1",
    name: "Nightly profiling — Finance core",
    domain: "Finance",
    kind: "Profiling + checks",
    tables: ["gl_entries", "invoices", "ap_payments"],
    ruleIds: ["r1", "r2", "r5"],
    repeats: "Every day at 2:00am",
    nextRun: "Tomorrow, 2:00am",
    active: true,
    owner: ME,
    permissions: "Finance stewards can view and run",
  },
  {
    id: "s2",
    name: "Customer master checks",
    domain: "Sales",
    kind: "DQ checks",
    tables: ["customers", "contacts", "accounts"],
    ruleIds: ["r1", "r3", "r4"],
    repeats: "Every day at 6:00am",
    nextRun: "Tomorrow, 6:00am",
    active: true,
    owner: ME,
    permissions: "Sales data team can view and run",
  },
  {
    id: "s3",
    name: "Orders freshness",
    domain: "Operations",
    kind: "DQ checks",
    tables: ["orders_fact", "shipments"],
    ruleIds: ["r6"],
    repeats: "Every hour",
    nextRun: "In 38 minutes",
    active: true,
    owner: "Priya Nair",
    permissions: "Everyone can view",
  },
  {
    id: "s4",
    name: "Weekly profiling — Marketing",
    domain: "Marketing",
    kind: "Profiling",
    tables: ["campaigns", "leads", "web_events"],
    ruleIds: [],
    repeats: "Mondays at 5:00am",
    nextRun: "Monday, 5:00am",
    active: true,
    owner: "Jonas Weber",
    permissions: "Everyone can view",
  },
  {
    id: "s5",
    name: "HR headcount validation",
    domain: "Human Resources",
    kind: "DQ checks",
    tables: ["employees", "positions"],
    ruleIds: ["r2", "r4"],
    repeats: "Mondays at 7:00am",
    nextRun: "Monday, 7:00am",
    active: true,
    owner: ME,
    permissions: "Only you",
  },
  {
    id: "s6",
    name: "Supplier quality sweep",
    domain: "Supply Chain",
    kind: "Profiling + checks",
    tables: ["suppliers", "purchase_orders", "inventory"],
    ruleIds: ["r1", "r3", "r6"],
    repeats: "Every 2 days",
    nextRun: "Thursday, 3:00am",
    active: true,
    owner: "Priya Nair",
    permissions: "Supply chain team can view and run",
  },
  {
    id: "s7",
    name: "Product usage checks",
    domain: "Product",
    kind: "DQ checks",
    tables: ["events", "accounts_usage"],
    ruleIds: ["r6", "r2"],
    repeats: "Every 6 hours",
    nextRun: "In 2 hours",
    active: true,
    owner: "Jonas Weber",
    permissions: "Everyone can view",
  },
  {
    id: "s8",
    name: "Customer success health",
    domain: "Customer Success",
    kind: "DQ checks",
    tables: ["tickets", "nps_responses"],
    ruleIds: ["r1", "r4"],
    repeats: "Every day at 8:00am",
    nextRun: "Paused",
    active: false,
    owner: ME,
    permissions: "Only you",
  },
];

export const BASE_RULES: Rule[] = [
  {
    id: "r1",
    name: "No missing customer or account ID",
    description: "Every row must have a customer or account ID filled in.",
    type: "Completeness",
    severity: "High",
    owner: "Dana Whitfield",
    status: "Active",
    scope: "Team",
    threshold: 0,
    appliesWhen: "",
    versions: [
      { v: 2, author: "Dana Whitfield", at: "Oct 12", note: "Raised severity to High" },
      { v: 1, author: "Dana Whitfield", at: "Aug 3", note: "Created" },
    ],
  },
  {
    id: "r2",
    name: "Amounts are never negative",
    description: "Payment, invoice, and usage amounts must be zero or more.",
    type: "Validity",
    severity: "Medium",
    owner: "Dana Whitfield",
    status: "Active",
    scope: "Team",
    threshold: 0.1,
    appliesWhen: "Row is not a credit memo",
    versions: [{ v: 1, author: "Dana Whitfield", at: "Aug 3", note: "Created" }],
  },
  {
    id: "r3",
    name: "Email addresses are valid",
    description: "Email fields must look like a real address (name, @, domain).",
    type: "Validity",
    severity: "Medium",
    owner: ME,
    status: "Active",
    scope: "Yours",
    threshold: 1,
    appliesWhen: "",
    versions: [
      { v: 2, author: ME, at: "Sep 21", note: "Allowed 1% of rows to fail" },
      { v: 1, author: ME, at: "Sep 2", note: "Created" },
    ],
  },
  {
    id: "r4",
    name: "No duplicate records by key",
    description: "No two rows may share the same business key.",
    type: "Uniqueness",
    severity: "High",
    owner: "Priya Nair",
    status: "Active",
    scope: "Team",
    threshold: 0,
    appliesWhen: "",
    versions: [{ v: 1, author: "Priya Nair", at: "Jul 18", note: "Created" }],
  },
  {
    id: "r5",
    name: "Ledger balances reconcile to source",
    description: "Ledger totals must match the source system totals for the same period.",
    type: "Consistency",
    severity: "High",
    owner: ME,
    status: "Active",
    scope: "Yours",
    threshold: 0,
    appliesWhen: "Period is closed",
    versions: [{ v: 1, author: ME, at: "Oct 1", note: "Created" }],
  },
  {
    id: "r6",
    name: "Data arrives within the expected window",
    description: "The table must be refreshed within its expected window.",
    type: "Freshness",
    severity: "Medium",
    owner: "Jonas Weber",
    status: "Active",
    scope: "Team",
    threshold: 0,
    appliesWhen: "",
    versions: [{ v: 1, author: "Jonas Weber", at: "Jul 30", note: "Created" }],
  },
  {
    id: "r7",
    name: "Country codes are ISO standard",
    description: "Country fields must use a valid two-letter ISO country code.",
    type: "Validity",
    severity: "Low",
    owner: ME,
    status: "Draft",
    scope: "Yours",
    threshold: 2,
    appliesWhen: "",
    versions: [{ v: 1, author: ME, at: "Oct 29", note: "Created" }],
  },
  {
    id: "t1",
    name: "Null rate stays under a limit",
    description: "The share of empty values in a column stays under a limit you choose.",
    type: "Completeness",
    severity: "Medium",
    owner: "Reltio",
    status: "Active",
    scope: "Template",
    threshold: 5,
    appliesWhen: "",
    versions: [{ v: 1, author: "Reltio", at: "Template", note: "Template" }],
  },
  {
    id: "t2",
    name: "Values come from an allowed list",
    description: "A column may only contain values from a list you provide.",
    type: "Validity",
    severity: "Low",
    owner: "Reltio",
    status: "Active",
    scope: "Template",
    threshold: 0,
    appliesWhen: "",
    versions: [{ v: 1, author: "Reltio", at: "Template", note: "Template" }],
  },
];

const F = (
  title: string,
  table: string,
  ruleId: string,
  detail: string,
  failingRows: number,
): Finding => ({ title, table, ruleId, detail, failingRows });

const R = (
  id: string,
  scheduleId: string,
  hoursAgo: number,
  status: RunStatus,
  checksRun: number,
  checksFailed: number,
  durationSec: number,
  findings: Finding[] = [],
): Run => ({ id, scheduleId, hoursAgo, status, checksRun, checksFailed, durationSec, findings });

export const BASE_RUNS: Run[] = [
  R("run-101", "s1", 3, "failed", 42, 3, 212, [
    F(
      "Negative invoice amounts",
      "invoices",
      "r2",
      "212 invoices posted with a negative total since yesterday, mostly from one billing region.",
      212,
    ),
    F(
      "Ledger out of balance",
      "gl_entries",
      "r5",
      "Closed-period ledger totals differ from the source by 0.4%.",
      1840,
    ),
    F("Missing account ID", "ap_payments", "r1", "57 payments arrived without an account ID.", 57),
  ]),
  R("run-102", "s2", 6, "attention", 36, 1, 95, [
    F(
      "Duplicate customers",
      "customers",
      "r4",
      "Salesforce sync created 318 duplicate customer records overnight.",
      318,
    ),
  ]),
  R("run-103", "s3", 1, "passed", 8, 0, 22),
  R("run-104", "s6", 20, "failed", 30, 4, 340, [
    F(
      "Late supplier feed",
      "suppliers",
      "r6",
      "Supplier feed is 9 hours late against a 4 hour window.",
      0,
    ),
    F(
      "Invalid supplier emails",
      "suppliers",
      "r3",
      "143 supplier contacts have malformed email addresses.",
      143,
    ),
    F(
      "Missing supplier ID",
      "purchase_orders",
      "r1",
      "29 purchase orders have no supplier ID.",
      29,
    ),
    F("Stale inventory", "inventory", "r6", "Inventory last refreshed 31 hours ago.", 0),
  ]),
  R("run-105", "s7", 4, "passed", 14, 0, 48),
  R("run-114", "s7", 10, "passed", 14, 0, 51),
  R("run-107", "s4", 30, "passed", 0, 0, 187),
  R("run-108", "s5", 40, "passed", 12, 0, 33),
  R("run-109", "s1", 27, "passed", 42, 0, 205),
  R("run-110", "s2", 30, "passed", 36, 0, 92),
  R("run-111", "s3", 25, "failed", 8, 1, 24, [
    F(
      "orders_fact arrived late",
      "orders_fact",
      "r6",
      "Orders table refreshed 3 hours past its window.",
      0,
    ),
  ]),
  R("run-112", "s6", 68, "passed", 30, 0, 331),
  R("run-113", "s1", 51, "passed", 42, 0, 208),
  R("run-115", "s4", 120, "passed", 0, 0, 190),
  R("run-116", "s5", 150, "passed", 12, 0, 35),
  R("run-117", "s1", 200, "passed", 42, 0, 210),
];

/** Short, plain-language account of a run, as the agent wrote it when the run finished. */
export function narrativeFor(run: Run, schedule: Schedule | undefined): string[] {
  const name = schedule?.name ?? "This schedule";
  if (run.status === "running")
    return [`${name} is running now. Results will appear here when it finishes.`];
  if (run.findings.length === 0) {
    return [
      run.checksRun === 0
        ? `${name} profiled ${schedule?.tables.length ?? 0} tables. There are no checks on this schedule, so nothing could fail.`
        : `All ${run.checksRun} checks passed. Nothing in this run needs attention.`,
      "Values stayed inside their usual range for every table.",
    ];
  }
  const top = run.findings[0];
  const rest = run.findings.length - 1;
  return [
    `${run.checksFailed} of ${run.checksRun} checks failed. The most important is "${top.title}" on ${top.table}: ${top.detail}`,
    rest > 0
      ? `${rest} other ${rest === 1 ? "finding" : "findings"} came up on ${[
          ...new Set(run.findings.slice(1).map((f) => f.table)),
        ].join(", ")}.`
      : "Nothing else failed in this run.",
    "I'd start with the finding at the top. Ask me what changed, or which downstream reports are affected.",
  ];
}

export function hash(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i += 1) h = (h * 31 + text.charCodeAt(i)) % 9973;
  return h;
}

export function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

export type TableInfo = {
  name: string;
  domain: string;
  rows: string;
  score: number;
  openFindings: number;
  lastChecked: string;
};

/** Tables in a domain: the ones its schedules cover, scored around the domain score. */
export function tablesFor(
  domain: string,
  domainScore: number | null,
  schedules: Schedule[],
): TableInfo[] {
  const names = [...new Set(schedules.filter((s) => s.domain === domain).flatMap((s) => s.tables))];
  const base = domainScore ?? 85;
  return names
    .map((name) => {
      const h = hash(name);
      const score = clamp(base + (h % 17) - 9, 52, 99);
      return {
        name,
        domain,
        rows: `${(((h % 90) + 5) / 10).toFixed(1)}M`,
        score,
        openFindings: score >= 90 ? 0 : score >= 80 ? 1 : 2 + (h % 3),
        lastChecked: `${(h % 11) + 1}h ago`,
      };
    })
    .sort((a, b) => a.score - b.score);
}

export type ColumnInfo = { name: string; type: string; nullPct: number; distinct: string };

export function columnsFor(table: string): ColumnInfo[] {
  const h = hash(table);
  return [
    { name: "id", type: "string", nullPct: 0, distinct: "100%" },
    { name: "created_at", type: "timestamp", nullPct: 0, distinct: "88%" },
    { name: "status", type: "string", nullPct: +((h % 5) / 10).toFixed(1), distinct: "0.01%" },
    { name: "amount", type: "decimal", nullPct: +((h % 30) / 10).toFixed(1), distinct: "41%" },
    { name: "email", type: "string", nullPct: +((h % 70) / 10).toFixed(1), distinct: "96%" },
  ];
}

export type DashboardStat = { label: string; value: string; note?: string };

export type DashboardDef = {
  id: string;
  name: string;
  scope: string;
  sharedBy?: string;
  briefing: string[];
  turns?: import("@/components/workspace/primitives").ChatTurn[];
  audience?: string;
  stats?: DashboardStat[];
  breakdown?: { label: string; score: number }[];
};

/** Dashboards an admin shared with everyone who has access. They appear as tabs automatically. */
export const SHARED_DASHBOARDS: DashboardDef[] = [
  {
    id: "exec",
    name: "Executive overview",
    scope: ALL_DOMAINS,
    sharedBy: "Dana Whitfield (Admin)",
    briefing: [
      "Supply Chain is the one domain at risk this week, held down by late supplier and inventory feeds.",
      "Finance is slipping: three failed checks on invoices and the general ledger since last night.",
      "Seven of eight domains were stable or improved against last week.",
    ],
  },
  {
    id: "finance-stewards",
    name: "Finance stewardship",
    scope: "Finance",
    sharedBy: "Dana Whitfield (Admin)",
    briefing: [
      "Three checks failed in the nightly Finance run: negative invoices, ledger balance, and missing account IDs.",
      "ap_payments is the healthiest table; invoices needs a steward today.",
    ],
  },
];

export const MY_BRIEF: DashboardDef = {
  id: "mine",
  name: "My brief",
  scope: "Marketing contacts",
  briefing: [
    "78.4% of Marketing contacts are good records, down 1.7 points from last week. Your target is 90%.",
    "Email is the biggest reason records fail: 41% of bad records have an invalid, missing or duplicate email, most of them from web_forms and partner_lists.",
    "The quickest win is Email: fixing it alone turns about 14,200 bad records good.",
  ],
};

/** A smooth-ish 14 point history ending at the current score. */
export function trendFor(score: number, seed: string): number[] {
  const h = hash(seed);
  return Array.from({ length: 14 }, (_, i) => {
    const wobble = Math.sin((i + h) * 1.7) * 2.4;
    const drift = ((i - 13) * ((h % 5) - 2)) / 6;
    return clamp(Math.round(score + wobble + drift), 40, 100);
  });
}

const ASSET_SOURCES: Record<string, string[]> = {
  Databricks: ["customer_data", "product_catalog", "loyalty_points"],
  BigQuery: ["marketing_analytics", "web_events", "finance"],
  Snowflake: ["supply_chain", "hr_core"],
};
const ASSET_TAGS = ["PII", "Operational", "Analytical", "Marketing", "Confidential business"];

/** Mock warehouse metadata for a domain table, stable per table name (shown in Explore's list style). */
export function tableAssetFor(t: TableInfo) {
  const h = hash(t.name + t.domain);
  const sources = Object.keys(ASSET_SOURCES);
  const source = sources[h % sources.length];
  const ds = ASSET_SOURCES[source];
  const n = Number(String(t.rows).replace(/[^0-9.]/g, "")) || 0;
  const mult = /m/i.test(t.rows) ? 1_000_000 : /k/i.test(t.rows) ? 1_000 : 1;
  return {
    name: t.name,
    kind: "table" as const,
    description: `${t.domain} table checked for quality on its schedule.`,
    source,
    dataset: ds[h % ds.length],
    columns: 8 + (h % 40),
    rows: Math.round(n * mult) || null,
    checks: 2 + (h % 9),
    tags: [ASSET_TAGS[h % ASSET_TAGS.length], ASSET_TAGS[(h >> 3) % ASSET_TAGS.length]].filter(
      (x, i, a) => a.indexOf(x) === i,
    ),
    lastAnalyzed: t.lastChecked,
  };
}
