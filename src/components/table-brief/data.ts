/** Static prototype data for the customer_data table brief. */

export const TABLE = {
  name: "customer_data",
  domain: "Finance · Orders",
  entry: "",
};

export const ROWS_SERIES = [
  4610, 4618, 4625, 4631, 4640, 4652, 4668, 4690, 4712, 4736, 4758, 4780, 4802,
  4826, 4848, 4866, 4880, 4897,
];
export const DISTINCT_SERIES = [
  3688, 3690, 3689, 3691, 3693, 3690, 3692, 3694, 3691, 3693, 3692, 3694, 3693,
  3692, 3694, 3693, 3692, 3693,
];
export const DUPE_SERIES = [
  0.9, 1.1, 1.4, 2.2, 3.6, 5.4, 7.1, 9.0, 11.2, 13.1, 15.0, 16.8, 18.4, 20.0,
  21.3, 22.6, 23.7, 24.6,
];
export const CHECKS_SERIES = [21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 20];

export const SIBLING_SERIES = {
  customer_data: ROWS_SERIES,
  contact_master: [
    2910, 2914, 2918, 2921, 2927, 2934, 2944, 2957, 2970, 2984, 2997, 3010,
    3022, 3035, 3046, 3055, 3063, 3070,
  ],
  account_roll: [
    1840, 1842, 1845, 1847, 1851, 1856, 1862, 1870, 1878, 1886, 1894, 1901,
    1908, 1915, 1921, 1926, 1910, 1914,
  ],
};

/** Distinct-ID series per sibling table, aligned to SIBLING_SERIES. */
export const SIBLING_DISTINCT = {
  customer_data: DISTINCT_SERIES,
  contact_master: [
    2902, 2904, 2903, 2905, 2906, 2903, 2900, 2898, 2897, 2895, 2896, 2893,
    2891, 2892, 2890, 2889, 2891, 2894,
  ],
  account_roll: [
    1832, 1833, 1834, 1834, 1836, 1835, 1836, 1837, 1835, 1836, 1837, 1836,
    1835, 1837, 1836, 1835, 1837, 1836,
  ],
};

/** Count of rows carrying a duplicate customer_id, per point. */
export const DUPE_COUNT_SERIES = [
  36, 37, 38, 39, 40, 96, 178, 268, 362, 470, 566, 668, 762, 868, 954, 1040,
  1128, 1204,
];

export const DUPE_ALERT_THRESHOLD = 1000;

export const DUPE_BREAKDOWN = [
  { label: "SFDC re-inserts", value: 900, color: "var(--brand-blue)", tag: "new" },
  { label: "Test records", value: 300, color: "var(--ink-300)", tag: "months old" },
  { label: "ID collisions", value: 4, color: "var(--brand-blue-bright)" },
];

export const SIBLING_CARDS: {
  name: keyof typeof SIBLING_SERIES;
  read: string;
  tag?: string;
}[] = [
  { name: "customer_data", read: "rows +6% · distinct flat", tag: "this table" },
  { name: "contact_master", read: "rows +5.5% · distinct −0.4%", tag: "no uniqueness check" },
  { name: "account_roll", read: "rows +4% · distinct flat", tag: "no uniqueness check" },
];

/** Index in the 18-point series where Aug 19 sits. */
export const AUG19 = 4;


export type MetricTile = {
  id: "rows" | "distinct" | "checks" | "dupe";
  label: string;
  value: string;
  values: number[];
  band?: [number, number];
  breaching?: boolean;
  delta: string;
  evidence: EvidenceId;
};

export const METRIC_TILES: MetricTile[] = [
  {
    id: "rows",
    label: "Rows",
    value: "4,897",
    values: ROWS_SERIES,
    band: [0.05, 0.45],
    breaching: true,
    delta: "+6% · above normal range",
    evidence: "profiling",
  },
  {
    id: "distinct",
    label: "Distinct customer_id",
    value: "3,693",
    values: DISTINCT_SERIES,
    band: [0.1, 0.9],
    breaching: false,
    delta: "0% · within range",
    evidence: "profiling",
  },
  {
    id: "checks",
    label: "Checks passing",
    value: "20/21",
    values: CHECKS_SERIES,
    breaching: false,
    delta: "1 failing · uniqueness",
    evidence: "checks",
  },
  {
    id: "dupe",
    label: "Duplicate rate",
    value: "24.6%",
    values: DUPE_SERIES,
    band: [0.0, 0.12],
    breaching: true,
    delta: "from 0.9% on Aug 19",
    evidence: "duplicates",
  },
];

export type EvidenceId =
  | "duplicates"
  | "sample"
  | "profiling"
  | "checks"
  | "activity";

export const EVIDENCE_ITEMS: {
  id: EvidenceId;
  label: string;
  count: string;
  tone: "red" | "amber" | "neutral";
}[] = [
  { id: "sample", label: "Sample data", count: "10 rows", tone: "neutral" },
  { id: "profiling", label: "Column profiling", count: "47", tone: "neutral" },
  { id: "checks", label: "Checks", count: "20/21", tone: "red" },
  { id: "activity", label: "Activity", count: "14h", tone: "amber" },
];

export const SAMPLE_COLUMNS = ["customer_id", "email", "source_system", "country", "created_at"];

const CURATED_SAMPLE_ROWS: string[][] = [
  ["C-40194", "m.reyes@northwind.com", "SFDC", "US", "2026-09-12"],
  ["C-40194", "m.reyes@northwind.com", "SFDC", "US", "2026-09-12"],
  ["C-40211", "j.tanaka@kobe-eng.jp", "SFDC", "JP", "2026-09-11"],
  ["C-40288", "hello@brightbox.co.uk", "SFDC", "GB", "2026-09-09"],
  ["C-40310", "a.silva@vertexmed.br", "SFDC", "BR", "2026-09-04"],
  ["C-39877", "lena.k@aurorafin.de", "SFDC", "DE", "2026-08-28"],
  ["TEST_0091", "qa+91@internal.test", "LEGACY", "US", "2026-03-02"],
  ["C-11820", "p.okafor@lagosgrid.ng", "LEGACY", "NG", "2026-01-14"],
  ["C-30442", "s.dubois@cielpar.fr", "SFDC", "FR", "2026-07-19"],
  ["C-28810", "r.nilsen@fjordlog.no", "LEGACY", "NO", "2026-06-02"],
];

const SAMPLE_FIRST = ["m.reyes", "j.tanaka", "hello", "a.silva", "lena.k", "p.okafor", "s.dubois", "r.nilsen", "k.mensah", "d.novak", "t.andersen", "y.chen", "f.rossi", "n.haddad", "e.moreau", "b.olsen"];
const SAMPLE_DOMAIN = ["northwind.com", "kobe-eng.jp", "brightbox.co.uk", "vertexmed.br", "aurorafin.de", "lagosgrid.ng", "cielpar.fr", "fjordlog.no", "helixdata.io", "summitops.com"];
const SAMPLE_COUNTRY = ["US", "JP", "GB", "BR", "DE", "NG", "FR", "NO", "CA", "AU", "IN", "ES"];

// Deterministic pseudo-rows so the prototype can page through a realistic volume.
function buildSampleRows(total: number): string[][] {
  const rows = [...CURATED_SAMPLE_ROWS];
  let seed = 991;
  const next = (n: number) => {
    seed = (seed * 1103515245 + 12345) % 2147483647;
    return seed % n;
  };
  for (let i = rows.length; i < total; i++) {
    const isTest = next(100) < 4;
    const id = isTest
      ? `TEST_${String(100 + next(900)).padStart(4, "0")}`
      : `C-${10000 + next(39000)}`;
    const email = isTest
      ? `qa+${next(900)}@internal.test`
      : `${SAMPLE_FIRST[next(SAMPLE_FIRST.length)]}@${SAMPLE_DOMAIN[next(SAMPLE_DOMAIN.length)]}`;
    const source = isTest ? "LEGACY" : next(10) < 7 ? "SFDC" : "LEGACY";
    const country = SAMPLE_COUNTRY[next(SAMPLE_COUNTRY.length)];
    const month = 1 + next(9);
    const day = 1 + next(28);
    const created = `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    rows.push([id, email, source, country, created]);
  }
  return rows;
}

export const SAMPLE_TOTAL_ROWS = 4897;
export const SAMPLE_ROWS: string[][] = buildSampleRows(600);

export type DupeRow = {
  id: string;
  times: number;
  source: string;
  created: string;
  updated: string;
  group: "sfdc" | "test" | "collision";
};

export const DUPE_ROWS: DupeRow[] = [
  { id: "C-40194", times: 3, source: "SFDC", created: "Sep 12", updated: "Sep 12", group: "sfdc" },
  { id: "C-40211", times: 2, source: "SFDC", created: "Sep 11", updated: "Sep 11", group: "sfdc" },
  { id: "C-40288", times: 4, source: "SFDC", created: "Sep 09", updated: "Sep 09", group: "sfdc" },
  { id: "C-40310", times: 2, source: "SFDC", created: "Sep 04", updated: "Sep 04", group: "sfdc" },
  { id: "C-40377", times: 3, source: "SFDC", created: "Aug 29", updated: "Aug 29", group: "sfdc" },
  { id: "TEST_0091", times: 2, source: "LEGACY", created: "Mar 02", updated: "Mar 02", group: "test" },
  { id: "TEST_0114", times: 2, source: "LEGACY", created: "Feb 18", updated: "Feb 18", group: "test" },
  { id: "C-11820", times: 2, source: "SFDC / LEGACY", created: "Jan 14", updated: "Jul 22", group: "collision" },
  { id: "C-12043", times: 2, source: "SFDC / LEGACY", created: "Feb 03", updated: "Jun 09", group: "collision" },
];

export type ColumnRow = {
  name: string;
  type: string;
  length: string;
  min: string;
  max: string;
  mean: string;
  nulls: string;
  distinct: string;
  fill: string;
  unique: string;
  status: string;
  bad: boolean;
};

const CURATED_COLUMNS_ROWS: ColumnRow[] = [
  { name: "customer_id", type: "string", length: "8", min: "C-10001", max: "C-49882", mean: "—", nulls: "0", distinct: "3,693", fill: "100%", unique: "75.4%", status: "1,204 dupes", bad: true },
  { name: "email", type: "string", length: "24", min: "a.abbot@…", max: "zoe.yu@…", mean: "—", nulls: "39", distinct: "4,835", fill: "99.2%", unique: "98.7%", status: "pass", bad: false },
  { name: "phone_number", type: "string", length: "12", min: "+1 201…", max: "+61 9…", mean: "—", nulls: "289", distinct: "4,436", fill: "94.1%", unique: "96.3%", status: "pass", bad: false },
  { name: "created_at", type: "timestamp", length: "—", min: "2021-03-04", max: "2026-09-14", mean: "2024-02-11", nulls: "0", distinct: "4,309", fill: "100%", unique: "88.0%", status: "pass", bad: false },
  { name: "updated_at", type: "timestamp", length: "—", min: "2021-03-04", max: "2026-09-15", mean: "2025-06-02", nulls: "0", distinct: "3,530", fill: "100%", unique: "72.1%", status: "pass", bad: false },
  { name: "source_system", type: "string", length: "6", min: "LEGACY", max: "SNOWFLK", mean: "—", nulls: "0", distinct: "4", fill: "100%", unique: "0.1%", status: "pass", bad: false },
  { name: "country", type: "string", length: "2", min: "AU", max: "US", mean: "—", nulls: "127", distinct: "42", fill: "97.4%", unique: "0.9%", status: "pass", bad: false },
  { name: "segment", type: "string", length: "10", min: "Enterprise", max: "SMB", mean: "—", nulls: "401", distinct: "9", fill: "91.8%", unique: "0.2%", status: "pass", bad: false },
];


const EXTRA_COLUMN_NAMES: [string, string][] = [
  ["first_name", "string"],
  ["last_name", "string"],
  ["company", "string"],
  ["job_title", "string"],
  ["address_line1", "string"],
  ["address_line2", "string"],
  ["city", "string"],
  ["state", "string"],
  ["postal_code", "string"],
  ["account_id", "string"],
  ["account_name", "string"],
  ["account_tier", "string"],
  ["lifetime_value", "number"],
  ["order_count", "number"],
  ["last_order_at", "timestamp"],
  ["first_order_at", "timestamp"],
  ["signup_at", "timestamp"],
  ["signup_channel", "string"],
  ["referral_code", "string"],
  ["marketing_opt_in", "boolean"],
  ["email_verified", "boolean"],
  ["phone_verified", "boolean"],
  ["preferred_locale", "string"],
  ["timezone", "string"],
  ["currency", "string"],
  ["tax_id", "string"],
  ["billing_email", "string"],
  ["billing_country", "string"],
  ["shipping_country", "string"],
  ["loyalty_points", "number"],
  ["loyalty_tier", "string"],
  ["last_login_at", "timestamp"],
  ["login_count", "number"],
  ["support_tier", "string"],
  ["notes_count", "number"],
  ["is_active", "boolean"],
  ["deleted_at", "timestamp"],
  ["merged_into_id", "string"],
  ["sync_batch_id", "string"],
];

// Deterministic stats for the remaining columns so the prototype can page
// through the full profiled column set.
function buildColumnRows(): ColumnRow[] {
  const rows = [...CURATED_COLUMNS_ROWS];
  let seed = 4242;
  const next = (n: number) => {
    seed = (seed * 1103515245 + 12345) % 2147483647;
    return seed % n;
  };
  for (const [name, type] of EXTRA_COLUMN_NAMES) {
    const fillBase = type === "boolean" ? 96 + next(4) : 88 + next(13);
    const fill = fillBase >= 100 ? "100%" : `${fillBase}.${next(9)}%`;
    let unique: string;
    if (type === "boolean") unique = "0.0%";
    else if (name.includes("_count") || name === "loyalty_points" || name === "lifetime_value") unique = `${(2 + next(30)).toFixed(1)}%`;
    else if (name.endsWith("_at") || name === "tax_id") unique = `${(60 + next(35)).toFixed(1)}%`;
    else if (name.includes("country") || name === "currency" || name.includes("tier") || name === "timezone" || name === "preferred_locale") unique = `0.${next(9)}%`;
    else unique = `${(10 + next(60)).toFixed(1)}%`;
    rows.push({ name, type, fill, unique, status: "pass", bad: false });
  }
  return rows;
}

export const COLUMNS_ROWS: ColumnRow[] = buildColumnRows();

export const CHECK_ROWS = [
  { check: "expect_column_values_to_be_unique", column: "customer_id", result: "1,204 fail", bad: true },
  { check: "expect_column_values_to_not_be_null", column: "customer_id", result: "pass", bad: false },
  { check: "expect_column_values_to_not_be_null", column: "email", result: "pass", bad: false },
  { check: "expect_column_values_to_match_regex", column: "email", result: "pass", bad: false },
  { check: "expect_column_values_to_be_in_set", column: "source_system", result: "pass", bad: false },
  { check: "expect_column_values_to_be_between", column: "created_at", result: "pass", bad: false },
];

export const ACTIVITY_ROWS: { text: string; when: string; tone: "red" | "amber" | "neutral" }[] = [
  { text: "Uniqueness check failed", when: "7:41am today", tone: "red" },
  { text: "Profiled", when: "6 hours ago", tone: "neutral" },
  { text: "Synced from Snowflake", when: "14 hours ago", tone: "amber" },
  { text: "SFDC connector sync schedule changed", when: "Aug 19, 02:10", tone: "neutral" },
];
