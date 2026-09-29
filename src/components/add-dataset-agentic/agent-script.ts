import { DEFAULT_SCHEDULE, type ScheduleConfig } from "../add-dataset/Step3Schedule";
import { ALL_ASSETS, RECOMMENDED_SCHEDULE, type FlatAsset } from "./plan-state";

export const EXAMPLES = [
  "Monitor dim_customers and fct_orders_daily in Databricks, daily at 6pm",
  "Add the Snowflake tables with customer data",
  "Watch everything in prod_analytics",
];

export const UNSUPPORTED_WAREHOUSES = ["redshift", "postgres", "oracle", "synapse"];

export function findTables(text: string): FlatAsset[] {
  const t = text.toLowerCase();
  const byName = ALL_ASSETS.filter((a) => t.includes(a.name.toLowerCase()));
  if (byName.length) return byName;
  const schemas = Array.from(new Set(ALL_ASSETS.map((a) => a.schema))).filter((s) => t.includes(s.toLowerCase()));
  if (schemas.length) return ALL_ASSETS.filter((a) => schemas.includes(a.schema) && !a.name.startsWith("vw_"));
  if (/customer/.test(t)) {
    const wh = ["snowflake", "bigquery", "databricks"].find((w) => t.includes(w));
    return ALL_ASSETS.filter((a) => /customer|contact|account/.test(a.name) && (!wh || a.warehouse.toLowerCase() === wh)).slice(0, 4);
  }
  return [];
}

export function findSchema(text: string): string | null {
  const t = text.toLowerCase();
  return Array.from(new Set(ALL_ASSETS.map((a) => a.schema))).find((s) => t.includes(s.toLowerCase())) ?? null;
}

/** Parse a schedule phrase; null if none mentioned. */
export function parseSchedule(text: string): ScheduleConfig | null {
  const t = text.toLowerCase();
  let freq: ScheduleConfig["frequency"] | null = null;
  if (/every 6|6 ?h/.test(t)) freq = "6h";
  else if (/every 12|12 ?h/.test(t)) freq = "12h";
  else if (/weekly|every week|monday|tuesday|wednesday|thursday|friday|saturday|sunday/.test(t)) freq = "weekly";
  else if (/daily|every day|nightly|each day/.test(t)) freq = "daily";
  const tm = t.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/);
  if (!freq && !tm) return null;
  let time = RECOMMENDED_SCHEDULE.time;
  if (tm) {
    let h = Number(tm[1]) % 12;
    if (tm[3] === "pm") h += 12;
    time = `${String(h).padStart(2, "0")}:${tm[2] ?? "00"}`;
  } else if (/nightly/.test(t)) time = "02:00";
  const day = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].find((d) => t.includes(d));
  return {
    ...DEFAULT_SCHEDULE,
    frequency: freq ?? "daily",
    time,
    day: day ? day[0].toUpperCase() + day.slice(1) : "Monday",
  };
}

export function parseTimeZone(text: string): string | null {
  const m = text.toUpperCase().match(/\b(ET|EST|EDT|CT|MT|PT|PST|PDT|UTC|GMT)\b/);
  if (!m) return null;
  const v = m[1];
  if (v.startsWith("E")) return "ET";
  if (v.startsWith("P")) return "PT";
  if (v === "GMT") return "UTC";
  return v;
}

export type Question = {
  id: "tables" | "checks" | "schedule" | "tz";
  text: string;
  options: { label: string; recommended?: boolean }[];
};

export const Q_TABLES: Question = {
  id: "tables",
  text: "I couldn't tell which tables you mean. Which should I start with?",
  options: [
    { label: "dim_customers and fct_orders_daily (most used)", recommended: true },
    { label: "Everything in prod_analytics" },
    { label: "Customer tables in Snowflake" },
  ],
};
export const Q_CHECKS: Question = {
  id: "checks",
  text: "Which checks should I start with?",
  options: [
    { label: "Recommended checks for each table", recommended: true },
    { label: "Only null and uniqueness checks" },
  ],
};
export const Q_SCHEDULE: Question = {
  id: "schedule",
  text: "How often should profiling and checks run?",
  options: [
    { label: "Daily at 6:00 PM", recommended: true },
    { label: "Every 6 hours" },
    { label: "Weekly on Monday" },
  ],
};
export const Q_TZ: Question = {
  id: "tz",
  text: "Which time zone should the schedule use?",
  options: [{ label: "ET", recommended: true }, { label: "PT" }, { label: "UTC" }],
};

export const CONFIRM_WORDS = /^(go ahead|confirm|create( it)?|do it|ship it|yes,? create|finish|looks good,? create)/;
