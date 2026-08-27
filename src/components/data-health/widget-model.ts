export type ChartType = "line" | "bar" | "number" | "table" | "donut" | "metric";

export type WidgetCreator = { kind: "reltio" } | { kind: "me" } | { kind: "team"; name: string };

export type DonutSegment = { label: string; value: number; color: string; display: string };

export type DonutDetail = { total: string; totalLabel: string; segments: DonutSegment[] };

export type MetricDetail = {
  delta: string;
  direction: "up" | "down";
  passed: string;
  ratio: number;
  color: string;
};

export type Widget = {
  id: string;
  name: string;
  chartType: ChartType;
  creator: WidgetCreator;
  measure: string;
  scope: string;
  timeframe: string;
  /** point-in-time numbers are not drillable */
  drillable: boolean;
  data: number[];
  value?: string;
  rows?: { label: string; value: string }[];
  segments?: string[];
  donut?: DonutDetail;
  metric?: MetricDetail;
};


export function widgetCreatorLabel(c: WidgetCreator) {
  if (c.kind === "reltio") return "Reltio";
  if (c.kind === "me") return "You";
  return c.name;
}

export const OOTB_METRICS = [
  { label: "Checks passing", value: "94.2%" },
  { label: "Open incidents", value: "17" },
  { label: "Fill rate", value: "88.6%" },
  { label: "Tables profiled", value: "412" },
];

export const MOCK_WIDGETS: Widget[] = [
  {
    id: "w1",
    name: "Failed checks by dimension",
    chartType: "bar",
    creator: { kind: "reltio" },
    measure: "failed checks",
    scope: "All domains",
    timeframe: "30 days",
    drillable: true,
    data: [18, 32, 12, 26, 9, 21],
    segments: ["Completeness", "Validity", "Uniqueness", "Consistency", "Accuracy", "Timeliness"],
  },
  {
    id: "w2",
    name: "Open incidents over time",
    chartType: "line",
    creator: { kind: "reltio" },
    measure: "open incidents",
    scope: "All domains",
    timeframe: "30 days",
    drillable: true,
    data: [12, 15, 14, 19, 22, 18, 17],
    segments: ["W1", "W2", "W3", "W4", "W5", "W6", "W7"],
  },
  {
    id: "w3",
    name: "Completeness trend — Customer",
    chartType: "line",
    creator: { kind: "me" },
    measure: "completeness %",
    scope: "Customer domain",
    timeframe: "30 days",
    drillable: true,
    data: [82, 84, 83, 86, 88, 87, 89],
    segments: ["W1", "W2", "W3", "W4", "W5", "W6", "W7"],
  },
  {
    id: "w4",
    name: "Rows profiled today",
    chartType: "number",
    creator: { kind: "me" },
    measure: "rows profiled",
    scope: "All sources",
    timeframe: "today",
    drillable: false,
    data: [],
    value: "1.24M",
  },
  {
    id: "w5",
    name: "Tables missing an owner",
    chartType: "number",
    creator: { kind: "team", name: "M. Gordon" },
    measure: "tables without owner",
    scope: "All domains",
    timeframe: "point in time",
    drillable: false,
    data: [],
    value: "36",
  },
  {
    id: "w6",
    name: "Failed checks by source",
    chartType: "bar",
    creator: { kind: "team", name: "A. Rivera" },
    measure: "failed checks",
    scope: "By warehouse",
    timeframe: "7 days",
    drillable: true,
    data: [24, 14, 31, 8],
    segments: ["Snowflake", "Databricks", "BigQuery", "Redshift"],
  },
  {
    id: "w7",
    name: "Top rules by failure rate",
    chartType: "table",
    creator: { kind: "reltio" },
    measure: "failure rate",
    scope: "All rules",
    timeframe: "30 days",
    drillable: false,
    data: [],
    rows: [
      { label: "Email Format Validation", value: "12.4%" },
      { label: "Customer ID Referential", value: "9.1%" },
      { label: "Country Code ISO List", value: "6.8%" },
      { label: "Credit Score Range", value: "4.2%" },
    ],
  },
  {
    id: "w8",
    name: "Freshness SLA breaches",
    chartType: "bar",
    creator: { kind: "team", name: "J. Park" },
    measure: "SLA breaches",
    scope: "Finance domain",
    timeframe: "14 days",
    drillable: true,
    data: [3, 6, 2, 9, 4],
    segments: ["Mon", "Tue", "Wed", "Thu", "Fri"],
  },
];

/* ---------- data health metrics, modelled as widgets ---------- */

type DimensionSeed = {
  id: string;
  name: string;
  value: string;
  delta: string;
  direction: "up" | "down";
  passed: string;
  ratio: number;
  color: string;
  trend: number[];
};

const DIMENSION_SEEDS: DimensionSeed[] = [
  { id: "dim-completeness", name: "Completeness", value: "89%", delta: "2.3%", direction: "up", passed: "178/200 Passed", ratio: 0.89, color: "#14a6a6", trend: [80, 84, 82, 86, 88, 85, 89] },
  { id: "dim-uniqueness", name: "Uniqueness", value: "82%", delta: "2.3%", direction: "up", passed: "164/200 Passed", ratio: 0.82, color: "#14a6a6", trend: [78, 80, 79, 84, 81, 83, 82] },
  { id: "dim-validity", name: "Validity", value: "72%", delta: "0.3%", direction: "up", passed: "144/200 Passed", ratio: 0.72, color: "#f5b400", trend: [70, 73, 71, 74, 72, 75, 72] },
  { id: "dim-accuracy", name: "Accuracy", value: "96%", delta: "3.7%", direction: "up", passed: "192/200 Passed", ratio: 0.96, color: "#14a6a6", trend: [90, 92, 94, 93, 95, 96, 96] },
  { id: "dim-consistency", name: "Consistency", value: "48%", delta: "3.2%", direction: "down", passed: "96/200 Passed", ratio: 0.48, color: "#ef4444", trend: [55, 52, 50, 48, 49, 47, 48] },
  { id: "dim-timeliness", name: "Timeliness", value: "64%", delta: "0.7%", direction: "up", passed: "128/200 Passed", ratio: 0.64, color: "#f59e0b", trend: [60, 62, 61, 63, 64, 65, 64] },
];

export const HEALTH_WIDGETS: Widget[] = [
  {
    id: "h-quality-score",
    name: "Overall Data Quality Score",
    chartType: "line",
    creator: { kind: "reltio" },
    measure: "quality score %",
    scope: "All domains",
    timeframe: "Last month",
    drillable: true,
    data: [85, 87, 86, 84, 83, 82, 84, 86, 87],
    segments: ["P1", "P2", "P3", "P4", "P5", "P6"],
    value: "87.5%",
    metric: {
      delta: "2.3%",
      direction: "up",
      passed: "",
      ratio: 0.875,
      color: "#14a6a6",
    },
  },
  {
    id: "h-job-summary",
    name: "Job Summary",
    chartType: "donut",
    creator: { kind: "reltio" },
    measure: "job outcomes",
    scope: "All sources",
    timeframe: "Last month",
    drillable: true,
    data: [],
    segments: ["Passed", "Failed", "Aborted"],
    donut: {
      total: "280",
      totalLabel: "Total Jobs",
      segments: [
        { label: "Passed", value: 87.5, color: "#14a6a6", display: "245 (87.5%)" },
        { label: "Failed", value: 10, color: "#ef4444", display: "28 (10.0%)" },
        { label: "Aborted", value: 2.5, color: "#f5b400", display: "7 (2.5%)" },
      ],
    },
  },
  ...DIMENSION_SEEDS.map<Widget>((d) => ({
    id: d.id,
    name: d.name,
    chartType: "metric",
    creator: { kind: "reltio" },
    measure: `${d.name.toLowerCase()} %`,
    scope: "All domains",
    timeframe: "Last month",
    drillable: true,
    data: d.trend,
    value: d.value,
    segments: [d.name],
    metric: {
      delta: d.delta,
      direction: d.direction,
      passed: d.passed,
      ratio: d.ratio,
      color: d.color,
    },
  })),
];

export const HEALTH_WIDGET_IDS = HEALTH_WIDGETS.map((w) => w.id);

export const ALL_LIBRARY_WIDGETS: Widget[] = [...HEALTH_WIDGETS, ...MOCK_WIDGETS];

export const DEFAULT_APPLIED = ["w1", "w3", "w4", "w7", ...HEALTH_WIDGET_IDS];
export const ORG_DEFAULT_APPLIED = ["w1", "w2", "w6", ...HEALTH_WIDGET_IDS];


export type Incident = {
  id: string;
  table: string;
  rule: string;
  segment: string;
  severity: "High" | "Medium" | "Low";
  detected: string;
};

export const MOCK_INCIDENTS: Incident[] = [
  { id: "INC-2041", table: "analytics.customer_master", rule: "Email Format Validation", segment: "Validity", severity: "High", detected: "2h ago" },
  { id: "INC-2038", table: "analytics.customer_master", rule: "Email Completeness Check", segment: "Completeness", severity: "Medium", detected: "5h ago" },
  { id: "INC-2035", table: "sales.orders", rule: "Customer ID Referential Check", segment: "Consistency", severity: "High", detected: "8h ago" },
  { id: "INC-2030", table: "sales.orders", rule: "Order Total Non-Negative", segment: "Accuracy", severity: "Low", detected: "1d ago" },
  { id: "INC-2022", table: "finance.invoices", rule: "Invoice Freshness SLA", segment: "Timeliness", severity: "Medium", detected: "1d ago" },
  { id: "INC-2011", table: "crm.contacts", rule: "Email Uniqueness Check", segment: "Uniqueness", severity: "Medium", detected: "2d ago" },
];

/** Mock keyword-based interpretation of a natural-language widget description. */
export type Interpretation = {
  measure: string;
  scope: string;
  timeframe: string;
  chartType: ChartType;
  /** warehouse the request is scoped to, when named */
  source?: string;
  /** what the non-time axis breaks down by */
  breakdown: "time" | "table" | "domain" | "dimension" | "warehouse";
  /** percentage measures render 0-100, counts render raw */
  unit: "percent" | "count";
};

const WAREHOUSES = ["snowflake", "databricks", "bigquery", "redshift"] as const;

const TABLES_BY_SOURCE: Record<string, string[]> = {
  Databricks: ["dim_customer", "fact_orders", "dim_product", "fact_shipments", "dim_geo"],
  Snowflake: ["customer_master", "orders", "invoices", "contacts", "accounts"],
  BigQuery: ["events_daily", "sessions", "ad_spend", "conversions"],
  Redshift: ["billing_events", "usage_daily", "subscriptions"],
  default: ["analytics.customer_master", "sales.orders", "finance.invoices", "crm.contacts"],
};

const DOMAINS = ["Customer", "Finance", "Sales", "Marketing", "Product"];
const DIMENSIONS = ["Completeness", "Uniqueness", "Validity", "Accuracy", "Consistency", "Timeliness"];

export function interpretDescription(text: string): Interpretation {
  const t = text.toLowerCase();

  let measure = "checks passing %";
  let unit: Interpretation["unit"] = "percent";
  if (t.includes("complete")) measure = "completeness %";
  else if (t.includes("unique") || t.includes("duplicate")) measure = "uniqueness %";
  else if (t.includes("valid")) measure = "validity %";
  else if (t.includes("accur")) measure = "accuracy %";
  else if (t.includes("consisten")) measure = "consistency %";
  else if (t.includes("incident")) { measure = "open incidents"; unit = "count"; }
  else if (t.includes("fail")) { measure = "failed checks"; unit = "count"; }
  else if (t.includes("fresh") || t.includes("sla")) { measure = "freshness SLA breaches"; unit = "count"; }
  else if (t.includes("row")) { measure = "rows profiled"; unit = "count"; }

  // warehouse / source
  let source: string | undefined;
  for (const w of WAREHOUSES) {
    if (t.includes(w)) source = w === "bigquery" ? "BigQuery" : w[0].toUpperCase() + w.slice(1);
  }

  let scope = "All domains";
  for (const d of ["customer", "finance", "sales", "marketing", "product", "supply chain"]) {
    if (t.includes(d)) scope = `${d.replace(/\b\w/g, (c) => c.toUpperCase())} domain`;
  }
  if (source) scope = t.includes("table") ? `${source} tables` : source;

  let timeframe = "30 days";
  const m = t.match(/(\d+)\s*(day|week|month)/);
  if (m) timeframe = `${m[1]} ${m[2]}${Number(m[1]) > 1 ? "s" : ""}`;
  else if (t.includes("today")) timeframe = "today";
  else if (t.includes("quarter")) timeframe = "90 days";

  const wantsTrend = t.includes("trend") || t.includes("over time") || t.includes("history");
  const wantsBreakdown =
    t.includes("per ") || t.includes("by ") || t.includes("breakdown") || t.includes("compare") || t.includes("each");

  let chartType: ChartType = "line";
  if (wantsTrend && !wantsBreakdown) chartType = "line";
  else if (wantsBreakdown) chartType = "bar";
  else if (t.includes("top ") || t.includes("list") || t.includes("ranking")) chartType = "table";
  else if (timeframe === "today" || t.includes("count") || t.includes("total")) chartType = "number";
  else if (wantsTrend) chartType = "line";

  // what the categorical axis represents, if the chart is categorical
  let breakdown: Interpretation["breakdown"] = "time";
  if (t.includes("dimension")) breakdown = "dimension";
  else if (t.includes("domain")) breakdown = "domain";
  else if (t.includes("source") || t.includes("warehouse") || t.includes("connection")) breakdown = "warehouse";
  else if (t.includes("table") || source) breakdown = "table";

  return { measure, scope, timeframe, chartType, source, breakdown, unit };
}

function pseudoRandom(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967295;
  };
}

function categoriesFor(i: Interpretation): string[] {
  if (i.breakdown === "dimension") return DIMENSIONS;
  if (i.breakdown === "domain") return DOMAINS;
  if (i.breakdown === "warehouse") return ["Snowflake", "Databricks", "BigQuery", "Redshift"];
  return TABLES_BY_SOURCE[i.source ?? "default"] ?? TABLES_BY_SOURCE.default;
}

function timeBuckets(timeframe: string): string[] {
  if (timeframe === "today") return ["9a", "11a", "1p", "3p", "5p"];
  if (timeframe.startsWith("7")) return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  if (timeframe.startsWith("90")) return ["M1", "M2", "M3"];
  return ["W1", "W2", "W3", "W4", "W5", "W6"];
}

/** Builds chart data that actually matches the interpreted request. */
export function dataForInterpretation(i: Interpretation, chartType: ChartType) {
  const rand = pseudoRandom(`${i.measure}|${i.scope}|${i.breakdown}`);
  const percent = i.unit === "percent";

  if (chartType === "line") {
    const segments = timeBuckets(i.timeframe);
    const base = percent ? 82 + rand() * 8 : 12 + rand() * 14;
    const data = segments.map((_, idx) =>
      percent
        ? Math.round(Math.min(99, base + idx * 0.9 + (rand() - 0.5) * 3) * 10) / 10
        : Math.max(1, Math.round(base + (rand() - 0.45) * 8)),
    );
    return { data, segments };
  }

  if (chartType === "bar") {
    const segments = categoriesFor(i);
    const data = segments.map(() =>
      percent ? Math.round((72 + rand() * 26) * 10) / 10 : Math.max(1, Math.round(4 + rand() * 30)),
    );
    return { data, segments };
  }

  if (chartType === "table") {
    const cats = categoriesFor(i);
    return {
      data: [],
      rows: cats.slice(0, 5).map((label) => ({
        label,
        value: percent
          ? `${(72 + rand() * 26).toFixed(1)}%`
          : `${Math.max(1, Math.round(2 + rand() * 28))}`,
      })),
    };
  }

  if (chartType === "number") {
    const trend = timeBuckets(i.timeframe).map(() =>
      percent ? Math.round((80 + rand() * 15) * 10) / 10 : Math.round(10 + rand() * 30),
    );
    return {
      data: trend,
      value: percent ? `${trend[trend.length - 1]}%` : `${trend[trend.length - 1]}`,
    };
  }

  return mockDataFor(chartType);
}


export function mockDataFor(chartType: ChartType) {
  switch (chartType) {
    case "line":
      return { data: [72, 76, 74, 80, 83, 81, 86], segments: ["W1", "W2", "W3", "W4", "W5", "W6", "W7"] };
    case "bar":
      return { data: [14, 22, 9, 27, 18], segments: ["Seg A", "Seg B", "Seg C", "Seg D", "Seg E"] };
    case "number":
      return { data: [], value: "1.24M" };
    case "table":
      return {
        data: [],
        rows: [
          { label: "analytics.customer_master", value: "12.4%" },
          { label: "sales.orders", value: "9.1%" },
          { label: "finance.invoices", value: "6.8%" },
          { label: "crm.contacts", value: "4.2%" },
        ],
      };
    case "donut":
      return {
        data: [],
        donut: {
          total: "280",
          totalLabel: "Total Jobs",
          segments: [
            { label: "Passed", value: 87.5, color: "#14a6a6", display: "245 (87.5%)" },
            { label: "Failed", value: 10, color: "#ef4444", display: "28 (10.0%)" },
            { label: "Aborted", value: 2.5, color: "#f5b400", display: "7 (2.5%)" },
          ],
        },
      };
    case "metric":
      return {
        data: [80, 84, 82, 86, 88, 85, 89],
        value: "89%",
        metric: {
          delta: "2.3%",
          direction: "up" as const,
          passed: "178/200 Passed",
          ratio: 0.89,
          color: "#14a6a6",
        },
      };
  }
}


/* ---------- dashboard layout model ---------- */

export type Zone = "strip" | "canvas";
export type WidgetWidth = 1 | 2 | 3;
export type WidgetHeight = 1 | 2;
export type LayoutItem = {
  id: string;
  zone: Zone;
  w: WidgetWidth;
  h: WidgetHeight;
  /** canvas grouping; undefined falls back to the first section */
  sectionId?: string;
};

export type Section = { id: string; title: string; collapsed?: boolean };

export const OVERVIEW_SECTION_ID = "sec-overview";
export const METRICS_SECTION_ID = "sec-health-metrics";

export function defaultSections(): Section[] {
  return [
    { id: OVERVIEW_SECTION_ID, title: "Overview" },
    { id: METRICS_SECTION_ID, title: "Data health metrics" },
  ];
}

export function newSectionId() {
  return `sec-${Math.random().toString(36).slice(2, 9)}`;
}


/** OOTB metrics modelled as number widgets so they can share the KPI strip. */
export const OOTB_WIDGETS: Widget[] = [
  {
    id: "m-checks-passing",
    name: "Checks passing",
    chartType: "number",
    creator: { kind: "reltio" },
    measure: "checks passing %",
    scope: "All domains",
    timeframe: "last run",
    drillable: false,
    data: [91.2, 92.4, 93.1, 92.8, 93.6, 94.2],
    value: "94.2%",
  },
  {
    id: "m-open-incidents",
    name: "Open incidents",
    chartType: "number",
    creator: { kind: "reltio" },
    measure: "open incidents",
    scope: "All domains",
    timeframe: "now",
    drillable: false,
    data: [22, 21, 19, 20, 18, 17],
    value: "17",
  },
  {
    id: "m-fill-rate",
    name: "Fill rate",
    chartType: "number",
    creator: { kind: "reltio" },
    measure: "fill rate %",
    scope: "All sources",
    timeframe: "last run",
    drillable: false,
    data: [86.1, 86.9, 87.4, 87.2, 88.1, 88.6],
    value: "88.6%",
  },
  {
    id: "m-tables-profiled",
    name: "Tables profiled",
    chartType: "number",
    creator: { kind: "reltio" },
    measure: "tables profiled",
    scope: "All sources",
    timeframe: "30 days",
    drillable: false,
    data: [340, 361, 378, 392, 404, 412],
    value: "412",
  },
];

export const OOTB_WIDGET_IDS = OOTB_WIDGETS.map((w) => w.id);

export function isOotbWidget(id: string) {
  return OOTB_WIDGET_IDS.includes(id);
}

function canvasSizeFor(w: Widget): { w: WidgetWidth; h: WidgetHeight } {
  if (w.chartType === "number") return { w: 1, h: 1 };
  if (w.chartType === "table") return { w: 1, h: 1 };
  if (w.chartType === "metric") return { w: 1, h: 1 };
  if (w.chartType === "donut") return { w: 1, h: 2 };
  return { w: 2, h: 2 };
}

function sectionForWidget(id: string) {
  return HEALTH_WIDGET_IDS.includes(id) ? METRICS_SECTION_ID : OVERVIEW_SECTION_ID;
}

/** Default layout: OOTB metrics in the strip, applied widgets on the canvas. */
export function defaultLayoutFor(appliedIds: string[], widgets: Widget[]): LayoutItem[] {
  const strip: LayoutItem[] = OOTB_WIDGET_IDS.map((id) => ({ id, zone: "strip", w: 1, h: 1 }));
  const canvas: LayoutItem[] = appliedIds.map((id) => {
    const widget = widgets.find((w) => w.id === id);
    const size = widget ? canvasSizeFor(widget) : { w: 1 as WidgetWidth, h: 1 as WidgetHeight };
    return { id, zone: "canvas" as Zone, sectionId: sectionForWidget(id), ...size };
  });
  return [...strip, ...canvas];
}


export function layoutItemFor(widget: Widget, sectionId?: string): LayoutItem {
  return {
    id: widget.id,
    zone: "canvas",
    sectionId: sectionId ?? sectionForWidget(widget.id),
    ...canvasSizeFor(widget),
  };
}

