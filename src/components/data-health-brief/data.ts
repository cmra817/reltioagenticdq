/**
 * Data Health — shared data layer.
 *
 * Every chart on this screen comes from the same 30 days of daily values, so a
 * sparkline and a full chart of the same metric are literally the same numbers
 * at different scales. Data is daily and noisy on purpose.
 */

/* ---------- deterministic noise ---------- */
function lcg(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483647;
    return s / 2147483647;
  };
}

export const DAY_COUNT = 30;
/** Index of Aug 21 — the day the SFDC sync schedule changed. */
export const AUG21 = 7;

const MONTH_START = new Date(Date.UTC(2026, 7, 14)); // Aug 14
export const DAY_LABELS: string[] = Array.from({ length: DAY_COUNT }, (_, i) => {
  const d = new Date(MONTH_START.getTime() + i * 86400000);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
});

/** Four evenly spaced x-axis labels. */
export const X_TICKS = [0, 9, 19, 29].map((i) => ({ index: i, label: DAY_LABELS[i] }));

/* ---------- series builders ---------- */

/** Flat until Aug 21, then a noisy climb to `target`. */
function driftSeries(base: number, target: number, seed: number, wobble = 0.18) {
  const rnd = lcg(seed);
  return Array.from({ length: DAY_COUNT }, (_, i) => {
    if (i < AUG21) return Number((base + (rnd() - 0.5) * wobble * 2).toFixed(2));
    const t = (i - AUG21) / (DAY_COUNT - 1 - AUG21);
    const eased = t ** 0.92;
    const v = base + (target - base) * eased + (rnd() - 0.5) * wobble * 6;
    return Number(Math.max(0, v).toFixed(2));
  });
}

function noisySeries(base: number, seed: number, wobble: number, slope = 0) {
  const rnd = lcg(seed);
  return Array.from({ length: DAY_COUNT }, (_, i) =>
    Number((base + slope * i + (rnd() - 0.5) * wobble * 2).toFixed(2)),
  );
}

/* ---------- duplicate rate, three SFDC tables ---------- */
export const DUPE_BAND: [number, number] = [0.3, 1.8];
export const DUPE_CUSTOMER = driftSeries(0.8, 24.6, 9001, 0.22);
export const DUPE_CONTACT = driftSeries(0.7, 18.9, 4242, 0.2);
export const DUPE_ACCOUNT = driftSeries(0.9, 13.5, 7331, 0.24);

/* ---------- orders_fact load time (minutes) ---------- */
export const LOAD_BAND: [number, number] = [3.5, 9];
export const LOAD_TIME = (() => {
  const rnd = lcg(5150);
  const spikes: Record<number, number> = { 21: 17.4, 25: 13.8, 28: 19.1 };
  return Array.from({ length: DAY_COUNT }, (_, i) =>
    Number((spikes[i] ?? 5.4 + (rnd() - 0.5) * 2.6).toFixed(2)),
  );
})();

/* ---------- scorecard series ---------- */
export const UNIQ_SERIES = driftSeries(99.2, 75.4, 2210, 0.12).map((v, i) =>
  i < AUG21 ? v : Number((99.2 - (99.2 - 75.4) * ((i - AUG21) / (DAY_COUNT - 1 - AUG21)) ** 0.9).toFixed(2)),
);
export const UNIQ_BAND: [number, number] = [97, 100];

export const FILL_SERIES = noisySeries(88.4, 3120, 1.1);
export const FILL_BAND: [number, number] = [86, 91.5];

export const DRIFT_SERIES = (() => {
  const rnd = lcg(8080);
  return Array.from({ length: DAY_COUNT }, (_, i) => {
    const t = i < AUG21 ? 0 : (i - AUG21) / (DAY_COUNT - 1 - AUG21);
    return Number((0.4 + 5.8 * t + (rnd() - 0.5) * 1.2).toFixed(2));
  });
})();
export const DRIFT_BAND: [number, number] = [-2.5, 2.5];

export const CHECKS_SERIES = (() => {
  const rnd = lcg(6162);
  return Array.from({ length: DAY_COUNT }, (_, i) =>
    Number((i < AUG21 ? 99.6 - rnd() * 0.8 : 98.6 - (i - AUG21) * 0.16 - rnd() * 0.9).toFixed(2)),
  );
})();

export const TIMELINESS_SERIES = noisySeries(12.6, 9110, 2.2);
export const TIMELINESS_BAND: [number, number] = [8, 18];

export const FORMAT_SERIES = noisySeries(96.2, 1414, 1.4);
export const FORMAT_BAND: [number, number] = [93, 99];

/* ---------- healthy-day variants ---------- */
export const UNIQ_SERIES_OK = noisySeries(99.1, 2211, 0.25);
export const FILL_SERIES_OK = noisySeries(89.4, 3121, 0.9);
export const DRIFT_SERIES_OK = noisySeries(1.1, 8081, 0.9);
export const CHECKS_SERIES_OK = noisySeries(99.7, 6163, 0.4);
export const TIMELINESS_SERIES_OK = noisySeries(11.9, 9111, 1.6);
export const FORMAT_SERIES_OK = noisySeries(97.1, 1415, 1.0);

/** payments row count, healthy-day watch card. */
export const PAYMENTS_ROWS = (() => {
  const rnd = lcg(3030);
  return Array.from({ length: DAY_COUNT }, (_, i) =>
    Number((96000 * 1.0043 ** i + (rnd() - 0.5) * 900).toFixed(0)),
  );
})();

/* ---------- dimensions chosen during setup ---------- */
export type DimensionId =
  | "uniqueness"
  | "completeness"
  | "volume"
  | "timeliness"
  | "format";

export type DimensionDef = {
  id: DimensionId;
  name: string;
  /** Scorecard tile label. */
  tile: string;
  reason: string;
  /** true = offered in PRIORITISING, false = offered in DEPRIORITISING */
  prioritised: boolean;
};

export const DIMENSIONS: DimensionDef[] = [
  {
    id: "uniqueness",
    name: "Uniqueness",
    tile: "Uniqueness",
    reason: "three tables here have keys that aren't enforced unique at source",
    prioritised: true,
  },
  {
    id: "completeness",
    name: "Completeness",
    tile: "Fill rate",
    reason: "4 tables have columns that go null intermittently",
    prioritised: true,
  },
  {
    id: "volume",
    name: "Volume drift",
    tile: "Volume drift",
    reason: "how I'll catch problems before a threshold is crossed",
    prioritised: true,
  },
  {
    id: "timeliness",
    name: "Timeliness on *_archive",
    tile: "Timeliness",
    reason: "not written to in 90 days",
    prioritised: false,
  },
  {
    id: "format",
    name: "Format checks on free-text columns",
    tile: "Format validity",
    reason: "high noise, low signal in this set",
    prioritised: false,
  },
];

export const DEFAULT_DIMS: Record<DimensionId, boolean> = {
  uniqueness: true,
  completeness: true,
  volume: true,
  timeliness: false,
  format: false,
};

/* ---------- scorecard metric definitions ---------- */
export type MetricCard = {
  id: string;
  tag: string;
  label: string;
  value: string;
  delta: string;
  breaching: boolean;
  series: number[];
  band?: [number, number];
  unit?: string;
};

export function metricFor(id: DimensionId, healthy: boolean): MetricCard {
  switch (id) {
    case "uniqueness":
      return healthy
        ? { id, tag: "Uniqueness", label: "Uniqueness", value: "99.1%", delta: "↑ 0.1 since last run", breaching: false, series: UNIQ_SERIES_OK, band: UNIQ_BAND }
        : { id, tag: "Uniqueness", label: "Uniqueness", value: "75.4%", delta: "↓ 23.8 since Aug 21", breaching: true, series: UNIQ_SERIES, band: UNIQ_BAND };
    case "completeness":
      return healthy
        ? { id, tag: "Completeness", label: "Fill rate", value: "89.4%", delta: "↑ 0.3 since last run", breaching: false, series: FILL_SERIES_OK, band: FILL_BAND }
        : { id, tag: "Completeness", label: "Fill rate", value: "88.6%", delta: "↑ 0.5 since last run", breaching: false, series: FILL_SERIES, band: FILL_BAND };
    case "volume":
      return healthy
        ? { id, tag: "Volume drift", label: "Volume drift", value: "+1.1%", delta: "inside band 30 days", breaching: false, series: DRIFT_SERIES_OK, band: DRIFT_BAND }
        : { id, tag: "Volume drift", label: "Volume drift", value: "+6.2%", delta: "outside band 21 days", breaching: true, series: DRIFT_SERIES, band: DRIFT_BAND };
    case "timeliness":
      return healthy
        ? { id, tag: "Timeliness", label: "Timeliness", value: "11m", delta: "inside band", breaching: false, series: TIMELINESS_SERIES_OK, band: TIMELINESS_BAND }
        : { id, tag: "Timeliness", label: "Timeliness", value: "13m", delta: "inside band", breaching: false, series: TIMELINESS_SERIES, band: TIMELINESS_BAND };
    case "format":
      return healthy
        ? { id, tag: "Format", label: "Format validity", value: "97.1%", delta: "inside band", breaching: false, series: FORMAT_SERIES_OK, band: FORMAT_BAND }
        : { id, tag: "Format", label: "Format validity", value: "96.2%", delta: "↓ 0.4 since last run", breaching: false, series: FORMAT_SERIES, band: FORMAT_BAND };
  }
}

export function checksCard(healthy: boolean): MetricCard {
  return healthy
    ? { id: "checks", tag: "Checks", label: "Checks passing", value: "100%", delta: "124 of 124 · 0 failing", breaching: false, series: CHECKS_SERIES_OK }
    : { id: "checks", tag: "Checks", label: "Checks passing", value: "94.2%", delta: "118 of 124 · 6 failing", breaching: false, series: CHECKS_SERIES };
}

/* ---------- setup: watching / excluded ---------- */
export type WatchRow = { table: string; reason: string };

export const WATCHING: WatchRow[] = [
  { table: "customer_data", reason: "Duplicate rate has moved more than anything else here — 0.8% to 24.6% in three weeks" },
  { table: "contact_master", reason: "Same SFDC connector, same divergence pattern, no uniqueness check" },
  { table: "account_roll", reason: "Same SFDC connector, row growth outside its band" },
  { table: "orders_fact", reason: "Load time outside its band 3 of the last 9 days" },
  { table: "payments", reason: "Stable, included because it's the largest table matching your description" },
  { table: "cust_addresses", reason: "Joins to customer_data on the key that's currently unreliable" },
];

export const WATCHING_HIDDEN: WatchRow[] = [
  { table: "cust_consents", reason: "Shares the customer key and feeds the migration payload" },
  { table: "cust_segments", reason: "Derived from customer_data, inherits its key problems" },
  { table: "crm_stg_accounts", reason: "Staging source for account_roll on the same connector" },
  { table: "crm_stg_contacts", reason: "Staging source for contact_master on the same connector" },
  { table: "customer_raw", reason: "Landing table the SFDC sync writes to first" },
  { table: "billing_accounts", reason: "Joins to payments on account_id" },
  { table: "cust_preferences", reason: "Intermittent nulls on two columns over the last 60 days" },
  { table: "cust_identifiers", reason: "Holds the external IDs the migration matches on" },
];

export const EXCLUDED: WatchRow[] = [
  { table: "customer_data_bkp", reason: "Backup copy — same rows, written by a copy job, not a source" },
  { table: "customer_data_v1", reason: "Superseded version — no writes since the v2 cutover" },
  { table: "customer_events", reason: "Event log — row churn is by design, bands would be meaningless" },
  { table: "country_ref", reason: "Static reference table — 249 rows, unchanged in 90 days" },
  { table: "cust_360_view", reason: "Derived, not source — problems here would be reported twice" },
  { table: "cust_legacy_import", reason: "No rows written in 200 days" },
];

export const INTENT_RESTATEMENT =
  "You own the customer data feeding the Q4 migration. I'll watch the tables that flow into it and prioritise uniqueness and completeness, since those are what break a migration. I can't see what reads these tables downstream yet — connect dbt or query history and I'll rank on that too.";

export const DEFAULT_INTENT = "I own the customer data going into our Q4 migration";

export const STARTERS = [
  "Customer data quality across CRM_STG and CUSTOMER_RAW",
  "Everything in PROD_ANALYTICS",
  "Finance reporting tables",
];
