import type { Check } from "../add-dataset/mock-checks";
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

// ---- Plan proposal (stated in chat before anything is drafted) ----

export const PROPOSAL_YES = /^(y|yes|yep|yeah|yup|sure|ok|okay|go ahead|proceed|looks good|sounds good|do it|generate|build it|confirm|perfect|that works)\b/;
export const PROPOSAL_CHIPS = ["Yes, generate the plan", "Change the schedule", "Add more tables"];


// ---- Create-a-check flow ----

export const WANTS_NEW_CHECK = /\b(create|new|make|build|write|add)\b[^.]*\b(dq )?(check|rule)\b/;

/** Draft a rule from a plain-language description, the way the Create rule modal does. */
export function draftRule(text: string): Check | null {
  const t = text.toLowerCase();
  const col =
    t.match(/\b([a-z]+_[a-z_]+)\b/)?.[1] ??
    t.match(/(?:column|field|on)\s+([a-z_]+)/)?.[1] ??
    (/email/.test(t) ? "email" : /phone/.test(t) ? "phone_number" : null);
  if (!col) return null;
  const id = `chat-rule-${Date.now()}`;
  const base = { id, field: col, fields: [col], creator: { kind: "reltio" as const }, threshold: 0 };
  if (/null|empty|missing|blank|required|always (have|has)/.test(t))
    return { ...base, rule: `${col} is not null`, description: `Every row must have a ${col}`, dimension: "Completeness", expectation: "expect_column_values_to_not_be_null", pattern: "not_null" };
  if (/unique|duplicate|repeat/.test(t))
    return { ...base, rule: `${col} is unique`, description: `${col} values must not repeat`, dimension: "Uniqueness", expectation: "expect_column_values_to_be_unique", pattern: "unique" };
  if (/email/.test(t))
    return { ...base, rule: `${col} is a valid email`, description: `${col} must look like name@domain.tld`, dimension: "Validity", expectation: "expect_column_values_to_match_regex", pattern: "^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$" };
  const range = t.match(/between\s+(-?\d+)\s+and\s+(-?\d+)/) ?? (/(positive|greater than 0|above zero)/.test(t) ? ["", "0", "∞"] : null);
  if (range)
    return { ...base, rule: `${col} is between ${range[1]} and ${range[2]}`, description: `${col} must stay within the expected range`, dimension: "Format and range", expectation: "expect_column_values_to_be_between", pattern: `between(${range[1]}, ${range[2]})` };
  if (/format|pattern|match|regex|valid/.test(t))
    return { ...base, rule: `${col} matches expected format`, description: `${col} must match the agreed format`, dimension: "Validity", expectation: "expect_column_values_to_match_regex", pattern: "^[A-Za-z0-9_-]+$" };
  return null;
}

export const APPLY_CHIPS = ["This table", "All tables", "Choose tables"];
