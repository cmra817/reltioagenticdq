export type Health = "healthy" | "warning" | "stale";
export type AssetType = "table" | "view";
export type WarehouseType = "Databricks" | "Snowflake" | "BigQuery";

export type Asset = {
  name: string;
  type: AssetType;
  rows: number;
  lastSyncedISO: string;
  health: Health;
  description: string;
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
          { name: "page_views", type: "table", rows: 482_300_000, lastSyncedISO: hoursAgo(1), health: "healthy", description: "Raw page view events from web and mobile clients, one row per page load." },
          { name: "click_events", type: "table", rows: 218_950_400, lastSyncedISO: hoursAgo(2), health: "healthy", description: "Click and tap interactions captured from instrumented UI elements." },
          { name: "session_starts", type: "table", rows: 38_120_000, lastSyncedISO: hoursAgo(3), health: "healthy", description: "First event of each user session, used as the session anchor." },
          { name: "session_ends", type: "table", rows: 37_980_200, lastSyncedISO: hoursAgo(3), health: "warning", description: "Final event of each session, derived from inactivity timeout." },
          { name: "ad_impressions", type: "table", rows: 1_204_500_000, lastSyncedISO: hoursAgo(1), health: "healthy", description: "Ad impression beacons across owned and partner placements." },
          { name: "vw_recent_events", type: "view", rows: 12_400_000, lastSyncedISO: hoursAgo(1), health: "healthy", description: "Rolling 24-hour window over all raw event tables." },
          { name: "error_log", type: "table", rows: 2_410_000, lastSyncedISO: hoursAgo(6), health: "stale", description: "Client-side JS errors and unhandled promise rejections." },
        ],
      },
      {
        name: "prod_analytics",
        assets: [
          { name: "fct_orders_daily", type: "table", rows: 4_820_000, lastSyncedISO: hoursAgo(2), health: "healthy", description: "Daily order grain fact table with status, channel, and totals." },
          { name: "fct_revenue_daily", type: "table", rows: 4_820_000, lastSyncedISO: hoursAgo(2), health: "healthy", description: "Daily recognized revenue by product and region." },
          { name: "dim_customers", type: "table", rows: 1_240_000, lastSyncedISO: hoursAgo(4), health: "healthy", description: "Slowly-changing customer dimension with segment and tenure." },
          { name: "dim_products", type: "table", rows: 48_200, lastSyncedISO: hoursAgo(8), health: "healthy", description: "Product catalog dimension including SKU, category, and price tier." },
          { name: "vw_active_users_30d", type: "view", rows: 920_400, lastSyncedISO: hoursAgo(1), health: "healthy", description: "Distinct users with at least one session in the last 30 days." },
          { name: "vw_top_skus", type: "view", rows: 12_800, lastSyncedISO: hoursAgo(2), health: "healthy", description: "Top SKUs ranked by trailing 7-day units sold." },
          { name: "agg_funnel_steps", type: "table", rows: 720_000, lastSyncedISO: daysAgo(1), health: "warning", description: "Pre-aggregated step counts for the core conversion funnel." },
        ],
      },
      {
        name: "ml_features",
        assets: [
          { name: "feature_user_ltv", type: "table", rows: 1_240_000, lastSyncedISO: hoursAgo(5), health: "healthy", description: "Predicted lifetime value features per user, refreshed daily." },
          { name: "feature_churn_30d", type: "table", rows: 1_240_000, lastSyncedISO: hoursAgo(5), health: "healthy", description: "30-day churn risk features used by the retention model." },
          { name: "feature_session_depth", type: "table", rows: 920_400, lastSyncedISO: hoursAgo(7), health: "warning", description: "Per-user session depth aggregates over rolling windows." },
          { name: "vw_feature_store_latest", type: "view", rows: 1_240_000, lastSyncedISO: hoursAgo(5), health: "healthy", description: "Latest feature vector per user across the active feature set." },
          { name: "embeddings_user_768d", type: "table", rows: 1_240_000, lastSyncedISO: daysAgo(2), health: "stale", description: "768-dimensional user embeddings produced by the recsys tower." },
          { name: "embeddings_item_768d", type: "table", rows: 48_200, lastSyncedISO: daysAgo(2), health: "stale", description: "768-dimensional item embeddings aligned with the user space." },
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
          { name: "stg_page_views", type: "table", rows: 482_300_000, lastSyncedISO: hoursAgo(2), health: "healthy", description: "Cleaned and deduped page views ready for downstream modeling." },
          { name: "stg_click_events", type: "table", rows: 218_950_400, lastSyncedISO: hoursAgo(2), health: "healthy", description: "Normalized click events with bot traffic filtered out." },
          { name: "stg_orders", type: "table", rows: 4_820_000, lastSyncedISO: hoursAgo(3), health: "healthy", description: "Staged order records joined to customer and product keys." },
          { name: "stg_users", type: "table", rows: 1_240_000, lastSyncedISO: hoursAgo(3), health: "healthy", description: "Conformed user records merged from auth and CRM sources." },
          { name: "stg_payments", type: "table", rows: 4_120_000, lastSyncedISO: hoursAgo(4), health: "warning", description: "Payment attempts with gateway response codes standardized." },
          { name: "vw_stg_qa", type: "view", rows: 12_400, lastSyncedISO: hoursAgo(1), health: "healthy", description: "QA spot-check view comparing staged vs. raw row counts." },
        ],
      },
      {
        name: "qa_sandbox",
        assets: [
          { name: "qa_orders_sample", type: "table", rows: 482_000, lastSyncedISO: daysAgo(3), health: "stale", description: "10% deterministic sample of orders used for analyst sandboxing." },
          { name: "qa_users_sample", type: "table", rows: 124_000, lastSyncedISO: daysAgo(3), health: "stale", description: "Matched user sample aligned to qa_orders_sample." },
          { name: "qa_anomaly_seed", type: "table", rows: 18_400, lastSyncedISO: daysAgo(7), health: "stale", description: "Synthetic anomalies seeded for monitoring rule regression tests." },
          { name: "vw_qa_anomalies", type: "view", rows: 1_820, lastSyncedISO: daysAgo(7), health: "stale", description: "Detected anomalies surfaced from the seeded QA dataset." },
          { name: "qa_dq_baseline", type: "table", rows: 92_000, lastSyncedISO: daysAgo(5), health: "stale", description: "Reference data quality baselines used by check authors." },
          { name: "qa_freshness_log", type: "table", rows: 480_000, lastSyncedISO: daysAgo(1), health: "warning", description: "Historical freshness measurements for monitored tables." },
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
          { name: "GL_TRANSACTIONS", type: "table", rows: 84_200_000, lastSyncedISO: hoursAgo(2), health: "healthy", description: "General ledger journal lines, the system of record for finance." },
          { name: "AR_INVOICES", type: "table", rows: 12_400_000, lastSyncedISO: hoursAgo(3), health: "healthy", description: "Accounts receivable invoices with customer and aging detail." },
          { name: "AP_INVOICES", type: "table", rows: 8_240_000, lastSyncedISO: hoursAgo(3), health: "healthy", description: "Accounts payable invoices issued by suppliers." },
          { name: "REVENUE_DAILY", type: "table", rows: 4_820_000, lastSyncedISO: hoursAgo(2), health: "healthy", description: "Daily recognized revenue by entity and reporting segment." },
          { name: "VW_FINANCIAL_KPIS", type: "view", rows: 4_820, lastSyncedISO: hoursAgo(1), health: "healthy", description: "Curated KPI view powering the executive finance dashboard." },
          { name: "FX_RATES", type: "table", rows: 124_000, lastSyncedISO: hoursAgo(6), health: "warning", description: "Daily foreign exchange rates used for currency conversion." },
          { name: "JOURNAL_ENTRIES", type: "table", rows: 38_240_000, lastSyncedISO: hoursAgo(2), health: "healthy", description: "Posted journal entries with approver and source system." },
          { name: "VW_PNL_MONTHLY", type: "view", rows: 1_820, lastSyncedISO: hoursAgo(1), health: "healthy", description: "Monthly P&L roll-up by department and cost center." },
        ],
      },
      {
        name: "SALES",
        assets: [
          { name: "OPPORTUNITIES", type: "table", rows: 1_240_000, lastSyncedISO: hoursAgo(2), health: "healthy", description: "Sales opportunities with stage, amount, and close date." },
          { name: "ACCOUNTS", type: "table", rows: 482_000, lastSyncedISO: hoursAgo(4), health: "healthy", description: "Customer account master from Salesforce." },
          { name: "CONTACTS", type: "table", rows: 1_820_000, lastSyncedISO: hoursAgo(4), health: "healthy", description: "Contacts associated with accounts, including roles." },
          { name: "PIPELINE_DAILY", type: "table", rows: 4_820_000, lastSyncedISO: hoursAgo(2), health: "healthy", description: "Daily snapshot of open pipeline by stage and owner." },
          { name: "VW_PIPELINE_HEALTH", type: "view", rows: 480, lastSyncedISO: hoursAgo(1), health: "healthy", description: "Pipeline coverage and slippage indicators by segment." },
          { name: "QUOTAS", type: "table", rows: 12_400, lastSyncedISO: daysAgo(2), health: "warning", description: "Quarterly quotas assigned per rep and team." },
          { name: "ACTIVITIES", type: "table", rows: 12_400_000, lastSyncedISO: hoursAgo(5), health: "healthy", description: "Sales activities including calls, emails, and meetings." },
        ],
      },
      {
        name: "MARKETING",
        assets: [
          { name: "CAMPAIGNS", type: "table", rows: 38_400, lastSyncedISO: hoursAgo(3), health: "healthy", description: "Marketing campaigns with channel, budget, and audience." },
          { name: "AD_SPEND_DAILY", type: "table", rows: 4_820_000, lastSyncedISO: hoursAgo(2), health: "healthy", description: "Daily ad spend reconciled across paid media platforms." },
          { name: "EMAIL_SENDS", type: "table", rows: 218_950_000, lastSyncedISO: hoursAgo(2), health: "healthy", description: "Outbound email send events from the marketing platform." },
          { name: "EMAIL_OPENS", type: "table", rows: 84_200_000, lastSyncedISO: hoursAgo(2), health: "warning", description: "Email open beacons attributed to a send and recipient." },
          { name: "ATTRIBUTION_DAILY", type: "table", rows: 4_820_000, lastSyncedISO: hoursAgo(4), health: "healthy", description: "Multi-touch attribution credit by channel and campaign." },
          { name: "VW_CAMPAIGN_ROI", type: "view", rows: 38_400, lastSyncedISO: hoursAgo(1), health: "healthy", description: "Campaign ROI computed from spend and attributed revenue." },
        ],
      },
      {
        name: "HR",
        assets: [
          { name: "EMPLOYEES", type: "table", rows: 12_400, lastSyncedISO: daysAgo(1), health: "healthy", description: "Active and terminated employees with role and manager." },
          { name: "PAYROLL_RUNS", type: "table", rows: 480, lastSyncedISO: daysAgo(2), health: "healthy", description: "Payroll run summaries per pay period and entity." },
          { name: "TIME_OFF_REQUESTS", type: "table", rows: 38_400, lastSyncedISO: hoursAgo(8), health: "healthy", description: "PTO and leave requests with approval status." },
          { name: "VW_HEADCOUNT", type: "view", rows: 124, lastSyncedISO: hoursAgo(2), health: "healthy", description: "Current headcount by department and location." },
          { name: "PERFORMANCE_REVIEWS", type: "table", rows: 18_400, lastSyncedISO: daysAgo(3), health: "warning", description: "Cycle-based performance review ratings and comments." },
          { name: "RECRUITING_PIPELINE", type: "table", rows: 4_820, lastSyncedISO: hoursAgo(6), health: "healthy", description: "Open requisitions and candidates by stage." },
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
          { name: "events_intraday", type: "table", rows: 218_950_000, lastSyncedISO: hoursAgo(1), health: "healthy", description: "Streaming intraday events table updated continuously by GA4 export." },
          { name: "events_2026_04", type: "table", rows: 4_820_000_000, lastSyncedISO: hoursAgo(2), health: "healthy", description: "Daily-partitioned events for April 2026 from GA4." },
          { name: "events_2026_03", type: "table", rows: 4_510_000_000, lastSyncedISO: daysAgo(28), health: "stale", description: "Frozen monthly partition for March 2026, kept for backfills." },
          { name: "vw_events_last_24h", type: "view", rows: 124_000_000, lastSyncedISO: hoursAgo(1), health: "healthy", description: "Convenience view unioning intraday and the last full day." },
          { name: "vw_events_last_7d", type: "view", rows: 920_000_000, lastSyncedISO: hoursAgo(1), health: "healthy", description: "Trailing 7-day events view used by weekly dashboards." },
          { name: "ga4_user_props", type: "table", rows: 12_400_000, lastSyncedISO: hoursAgo(3), health: "healthy", description: "User-scoped GA4 properties at last seen timestamp." },
        ],
      },
      {
        name: "product",
        assets: [
          { name: "feature_flags", type: "table", rows: 4_820, lastSyncedISO: hoursAgo(4), health: "healthy", description: "Feature flag definitions and rollout state from LaunchDarkly." },
          { name: "experiment_assignments", type: "table", rows: 38_400_000, lastSyncedISO: hoursAgo(2), health: "healthy", description: "User-to-variant assignments for active experiments." },
          { name: "experiment_results_daily", type: "table", rows: 218_400, lastSyncedISO: hoursAgo(3), health: "warning", description: "Daily metric deltas per experiment and variant." },
          { name: "vw_active_experiments", type: "view", rows: 84, lastSyncedISO: hoursAgo(1), health: "healthy", description: "Currently running experiments with primary metric and owner." },
          { name: "user_cohorts_weekly", type: "table", rows: 4_820_000, lastSyncedISO: daysAgo(1), health: "healthy", description: "Weekly cohorted user lists used for retention analysis." },
          { name: "retention_curves", type: "table", rows: 920_000, lastSyncedISO: daysAgo(1), health: "healthy", description: "Computed retention curves per cohort and surface." },
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
