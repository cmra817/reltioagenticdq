export type ChartType = "line" | "bar" | "number" | "table";

export type WidgetCreator = { kind: "reltio" } | { kind: "me" } | { kind: "team"; name: string };

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

export const DEFAULT_APPLIED = ["w1", "w3", "w4", "w7"];
export const ORG_DEFAULT_APPLIED = ["w1", "w2", "w6"];

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
export function interpretDescription(text: string): {
  measure: string;
  scope: string;
  timeframe: string;
  chartType: ChartType;
} {
  const t = text.toLowerCase();

  let measure = "checks passing %";
  if (t.includes("complete")) measure = "completeness %";
  else if (t.includes("unique") || t.includes("duplicate")) measure = "uniqueness %";
  else if (t.includes("incident")) measure = "open incidents";
  else if (t.includes("fail")) measure = "failed checks";
  else if (t.includes("fresh") || t.includes("sla")) measure = "freshness SLA breaches";
  else if (t.includes("row")) measure = "rows profiled";

  let scope = "All domains";
  for (const d of ["customer", "finance", "sales", "marketing", "product", "supply chain"]) {
    if (t.includes(d)) scope = `${d.replace(/\b\w/g, (c) => c.toUpperCase())} domain`;
  }
  if (t.includes("source") || t.includes("warehouse")) scope = "By warehouse";

  let timeframe = "30 days";
  const m = t.match(/(\d+)\s*(day|week|month)/);
  if (m) timeframe = `${m[1]} ${m[2]}${Number(m[1]) > 1 ? "s" : ""}`;
  else if (t.includes("today")) timeframe = "today";
  else if (t.includes("quarter")) timeframe = "90 days";

  let chartType: ChartType = "line";
  if (t.includes("trend") || t.includes("over time")) chartType = "line";
  else if (t.includes("by ") || t.includes("compare") || t.includes("breakdown")) chartType = "bar";
  else if (t.includes("top ") || t.includes("list") || t.includes("table")) chartType = "table";
  else if (timeframe === "today" || t.includes("count") || t.includes("total")) chartType = "number";

  return { measure, scope, timeframe, chartType };
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
  }
}

/* ---------- dashboard layout model ---------- */

export type Zone = "strip" | "canvas";
export type WidgetWidth = 1 | 2 | 3;
export type WidgetHeight = 1 | 2;
export type LayoutItem = { id: string; zone: Zone; w: WidgetWidth; h: WidgetHeight };

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
  return { w: 2, h: 2 };
}

/** Default layout: OOTB metrics in the strip, applied widgets on the canvas. */
export function defaultLayoutFor(appliedIds: string[], widgets: Widget[]): LayoutItem[] {
  const strip: LayoutItem[] = OOTB_WIDGET_IDS.map((id) => ({ id, zone: "strip", w: 1, h: 1 }));
  const canvas: LayoutItem[] = appliedIds.map((id) => {
    const widget = widgets.find((w) => w.id === id);
    const size = widget ? canvasSizeFor(widget) : { w: 1 as WidgetWidth, h: 1 as WidgetHeight };
    return { id, zone: "canvas" as Zone, ...size };
  });
  return [...strip, ...canvas];
}

export function layoutItemFor(widget: Widget): LayoutItem {
  return { id: widget.id, zone: "canvas", ...canvasSizeFor(widget) };
}
