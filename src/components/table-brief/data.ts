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
  { id: "duplicates", label: "Duplicate rows", count: "1,204", tone: "red" },
  { id: "sample", label: "Sample data", count: "10 rows", tone: "neutral" },
  { id: "profiling", label: "Column profiling", count: "47", tone: "neutral" },
  { id: "checks", label: "Checks", count: "20/21", tone: "red" },
  { id: "activity", label: "Activity", count: "14h", tone: "amber" },
];

export const SAMPLE_COLUMNS = ["customer_id", "email", "source_system", "country", "created_at"];

export const SAMPLE_ROWS: string[][] = [
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

export const COLUMNS_ROWS = [
  { name: "customer_id", type: "string", fill: "100%", unique: "75.4%", status: "1,204 dupes", bad: true },
  { name: "email", type: "string", fill: "99.2%", unique: "98.7%", status: "pass", bad: false },
  { name: "phone_number", type: "string", fill: "94.1%", unique: "96.3%", status: "pass", bad: false },
  { name: "created_at", type: "timestamp", fill: "100%", unique: "88.0%", status: "pass", bad: false },
  { name: "updated_at", type: "timestamp", fill: "100%", unique: "72.1%", status: "pass", bad: false },
  { name: "source_system", type: "string", fill: "100%", unique: "0.1%", status: "pass", bad: false },
  { name: "country", type: "string", fill: "97.4%", unique: "0.9%", status: "pass", bad: false },
  { name: "segment", type: "string", fill: "91.8%", unique: "0.2%", status: "pass", bad: false },
];

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
