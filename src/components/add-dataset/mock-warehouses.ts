export type Health = "healthy" | "warning" | "stale";
export type AssetType = "table" | "view";
export type WarehouseType = "Databricks" | "Snowflake" | "BigQuery";

export type Asset = {
  name: string;
  type: AssetType;
  rows: number;
  lastSyncedISO: string;
  health: Health;
};

export type Schema = {
  name: string;
  assets: Asset[];
};

export type Connection = {
  id: string;
  name: string;
  warehouse: WarehouseType;
  schemas: Schema[];
};

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();
const daysAgo = (d: number) => hoursAgo(d * 24);

export const WAREHOUSES: Connection[] = [
  {
    id: "dbx-data-science",
    name: "Data Science",
    warehouse: "Databricks",
    schemas: [
      {
        name: "raw_events",
        assets: [
          { name: "page_views", type: "table", rows: 482_300_000, lastSyncedISO: hoursAgo(1), health: "healthy" },
          { name: "click_events", type: "table", rows: 218_950_400, lastSyncedISO: hoursAgo(2), health: "healthy" },
          { name: "session_starts", type: "table", rows: 38_120_000, lastSyncedISO: hoursAgo(3), health: "healthy" },
          { name: "session_ends", type: "table", rows: 37_980_200, lastSyncedISO: hoursAgo(3), health: "warning" },
          { name: "ad_impressions", type: "table", rows: 1_204_500_000, lastSyncedISO: hoursAgo(1), health: "healthy" },
          { name: "vw_recent_events", type: "view", rows: 12_400_000, lastSyncedISO: hoursAgo(1), health: "healthy" },
          { name: "error_log", type: "table", rows: 2_410_000, lastSyncedISO: hoursAgo(6), health: "stale" },
        ],
      },
      {
        name: "prod_analytics",
        assets: [
          { name: "fct_orders_daily", type: "table", rows: 4_820_000, lastSyncedISO: hoursAgo(2), health: "healthy" },
          { name: "fct_revenue_daily", type: "table", rows: 4_820_000, lastSyncedISO: hoursAgo(2), health: "healthy" },
          { name: "dim_customers", type: "table", rows: 1_240_000, lastSyncedISO: hoursAgo(4), health: "healthy" },
          { name: "dim_products", type: "table", rows: 48_200, lastSyncedISO: hoursAgo(8), health: "healthy" },
          { name: "vw_active_users_30d", type: "view", rows: 920_400, lastSyncedISO: hoursAgo(1), health: "healthy" },
          { name: "vw_top_skus", type: "view", rows: 12_800, lastSyncedISO: hoursAgo(2), health: "healthy" },
          { name: "agg_funnel_steps", type: "table", rows: 720_000, lastSyncedISO: daysAgo(1), health: "warning" },
        ],
      },
      {
        name: "ml_features",
        assets: [
          { name: "feature_user_ltv", type: "table", rows: 1_240_000, lastSyncedISO: hoursAgo(5), health: "healthy" },
          { name: "feature_churn_30d", type: "table", rows: 1_240_000, lastSyncedISO: hoursAgo(5), health: "healthy" },
          { name: "feature_session_depth", type: "table", rows: 920_400, lastSyncedISO: hoursAgo(7), health: "warning" },
          { name: "vw_feature_store_latest", type: "view", rows: 1_240_000, lastSyncedISO: hoursAgo(5), health: "healthy" },
          { name: "embeddings_user_768d", type: "table", rows: 1_240_000, lastSyncedISO: daysAgo(2), health: "stale" },
          { name: "embeddings_item_768d", type: "table", rows: 48_200, lastSyncedISO: daysAgo(2), health: "stale" },
        ],
      },
    ],
  },
  {
    id: "dbx-ml",
    name: "ML",
    warehouse: "Databricks",
    schemas: [
      {
        name: "stg_events",
        assets: [
          { name: "stg_page_views", type: "table", rows: 482_300_000, lastSyncedISO: hoursAgo(2), health: "healthy" },
          { name: "stg_click_events", type: "table", rows: 218_950_400, lastSyncedISO: hoursAgo(2), health: "healthy" },
          { name: "stg_orders", type: "table", rows: 4_820_000, lastSyncedISO: hoursAgo(3), health: "healthy" },
          { name: "stg_users", type: "table", rows: 1_240_000, lastSyncedISO: hoursAgo(3), health: "healthy" },
          { name: "stg_payments", type: "table", rows: 4_120_000, lastSyncedISO: hoursAgo(4), health: "warning" },
          { name: "vw_stg_qa", type: "view", rows: 12_400, lastSyncedISO: hoursAgo(1), health: "healthy" },
        ],
      },
      {
        name: "qa_sandbox",
        assets: [
          { name: "qa_orders_sample", type: "table", rows: 482_000, lastSyncedISO: daysAgo(3), health: "stale" },
          { name: "qa_users_sample", type: "table", rows: 124_000, lastSyncedISO: daysAgo(3), health: "stale" },
          { name: "qa_anomaly_seed", type: "table", rows: 18_400, lastSyncedISO: daysAgo(7), health: "stale" },
          { name: "vw_qa_anomalies", type: "view", rows: 1_820, lastSyncedISO: daysAgo(7), health: "stale" },
          { name: "qa_dq_baseline", type: "table", rows: 92_000, lastSyncedISO: daysAgo(5), health: "stale" },
          { name: "qa_freshness_log", type: "table", rows: 480_000, lastSyncedISO: daysAgo(1), health: "warning" },
        ],
      },
    ],
  },
  {
    id: "snow-finance",
    name: "Finance DW",
    warehouse: "Snowflake",
    schemas: [
      {
        name: "FINANCE",
        assets: [
          { name: "GL_TRANSACTIONS", type: "table", rows: 84_200_000, lastSyncedISO: hoursAgo(2), health: "healthy" },
          { name: "AR_INVOICES", type: "table", rows: 12_400_000, lastSyncedISO: hoursAgo(3), health: "healthy" },
          { name: "AP_INVOICES", type: "table", rows: 8_240_000, lastSyncedISO: hoursAgo(3), health: "healthy" },
          { name: "REVENUE_DAILY", type: "table", rows: 4_820_000, lastSyncedISO: hoursAgo(2), health: "healthy" },
          { name: "VW_FINANCIAL_KPIS", type: "view", rows: 4_820, lastSyncedISO: hoursAgo(1), health: "healthy" },
          { name: "FX_RATES", type: "table", rows: 124_000, lastSyncedISO: hoursAgo(6), health: "warning" },
          { name: "JOURNAL_ENTRIES", type: "table", rows: 38_240_000, lastSyncedISO: hoursAgo(2), health: "healthy" },
          { name: "VW_PNL_MONTHLY", type: "view", rows: 1_820, lastSyncedISO: hoursAgo(1), health: "healthy" },
        ],
      },
      {
        name: "SALES",
        assets: [
          { name: "OPPORTUNITIES", type: "table", rows: 1_240_000, lastSyncedISO: hoursAgo(2), health: "healthy" },
          { name: "ACCOUNTS", type: "table", rows: 482_000, lastSyncedISO: hoursAgo(4), health: "healthy" },
          { name: "CONTACTS", type: "table", rows: 1_820_000, lastSyncedISO: hoursAgo(4), health: "healthy" },
          { name: "PIPELINE_DAILY", type: "table", rows: 4_820_000, lastSyncedISO: hoursAgo(2), health: "healthy" },
          { name: "VW_PIPELINE_HEALTH", type: "view", rows: 480, lastSyncedISO: hoursAgo(1), health: "healthy" },
          { name: "QUOTAS", type: "table", rows: 12_400, lastSyncedISO: daysAgo(2), health: "warning" },
          { name: "ACTIVITIES", type: "table", rows: 12_400_000, lastSyncedISO: hoursAgo(5), health: "healthy" },
        ],
      },
      {
        name: "MARKETING",
        assets: [
          { name: "CAMPAIGNS", type: "table", rows: 38_400, lastSyncedISO: hoursAgo(3), health: "healthy" },
          { name: "AD_SPEND_DAILY", type: "table", rows: 4_820_000, lastSyncedISO: hoursAgo(2), health: "healthy" },
          { name: "EMAIL_SENDS", type: "table", rows: 218_950_000, lastSyncedISO: hoursAgo(2), health: "healthy" },
          { name: "EMAIL_OPENS", type: "table", rows: 84_200_000, lastSyncedISO: hoursAgo(2), health: "warning" },
          { name: "ATTRIBUTION_DAILY", type: "table", rows: 4_820_000, lastSyncedISO: hoursAgo(4), health: "healthy" },
          { name: "VW_CAMPAIGN_ROI", type: "view", rows: 38_400, lastSyncedISO: hoursAgo(1), health: "healthy" },
        ],
      },
      {
        name: "HR",
        assets: [
          { name: "EMPLOYEES", type: "table", rows: 12_400, lastSyncedISO: daysAgo(1), health: "healthy" },
          { name: "PAYROLL_RUNS", type: "table", rows: 480, lastSyncedISO: daysAgo(2), health: "healthy" },
          { name: "TIME_OFF_REQUESTS", type: "table", rows: 38_400, lastSyncedISO: hoursAgo(8), health: "healthy" },
          { name: "VW_HEADCOUNT", type: "view", rows: 124, lastSyncedISO: hoursAgo(2), health: "healthy" },
          { name: "PERFORMANCE_REVIEWS", type: "table", rows: 18_400, lastSyncedISO: daysAgo(3), health: "warning" },
          { name: "RECRUITING_PIPELINE", type: "table", rows: 4_820, lastSyncedISO: hoursAgo(6), health: "healthy" },
        ],
      },
    ],
  },
  {
    id: "bq-eu",
    name: "EU (Belgium)",
    warehouse: "BigQuery",
    schemas: [
      {
        name: "events",
        assets: [
          { name: "events_intraday", type: "table", rows: 218_950_000, lastSyncedISO: hoursAgo(1), health: "healthy" },
          { name: "events_2026_04", type: "table", rows: 4_820_000_000, lastSyncedISO: hoursAgo(2), health: "healthy" },
          { name: "events_2026_03", type: "table", rows: 4_510_000_000, lastSyncedISO: daysAgo(28), health: "stale" },
          { name: "vw_events_last_24h", type: "view", rows: 124_000_000, lastSyncedISO: hoursAgo(1), health: "healthy" },
          { name: "vw_events_last_7d", type: "view", rows: 920_000_000, lastSyncedISO: hoursAgo(1), health: "healthy" },
          { name: "ga4_user_props", type: "table", rows: 12_400_000, lastSyncedISO: hoursAgo(3), health: "healthy" },
        ],
      },
      {
        name: "product",
        assets: [
          { name: "feature_flags", type: "table", rows: 4_820, lastSyncedISO: hoursAgo(4), health: "healthy" },
          { name: "experiment_assignments", type: "table", rows: 38_400_000, lastSyncedISO: hoursAgo(2), health: "healthy" },
          { name: "experiment_results_daily", type: "table", rows: 218_400, lastSyncedISO: hoursAgo(3), health: "warning" },
          { name: "vw_active_experiments", type: "view", rows: 84, lastSyncedISO: hoursAgo(1), health: "healthy" },
          { name: "user_cohorts_weekly", type: "table", rows: 4_820_000, lastSyncedISO: daysAgo(1), health: "healthy" },
          { name: "retention_curves", type: "table", rows: 920_000, lastSyncedISO: daysAgo(1), health: "healthy" },
        ],
      },
    ],
  },
];

export function formatRows(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diffMs / 60_000);
  if (m < 60) return `Updated ${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Updated ${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `Updated ${d}d ago`;
  const w = Math.floor(d / 7);
  return `Updated ${w}w ago`;
}

export function assetKey(connId: string, schema: string, asset: string): string {
  return `${connId}::${schema}::${asset}`;
}
