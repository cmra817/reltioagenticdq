import { DEFAULT_SCHEDULE, frequencyLabel, type ScheduleConfig } from "../add-dataset/Step3Schedule";
import { generateChecks, type Check } from "../add-dataset/mock-checks";
import { WAREHOUSES, assetKey } from "../add-dataset/mock-warehouses";
import type { CreatedAssetInput } from "../created-assets-context";

/** Single source of truth for the agentic add-asset flow. */
export type Plan = {
  selected: string[];
  checked: Record<string, string[]>;
  customChecks: Record<string, Check[]>;
  profiling: ScheduleConfig | null;
  checks: ScheduleConfig | null;
  linked: boolean;
  timeZone: string | null;
};

export const EMPTY_PLAN: Plan = {
  selected: [],
  checked: {},
  customChecks: {},
  profiling: null,
  checks: null,
  linked: true,
  timeZone: null,
};

export const RECOMMENDED_SCHEDULE: ScheduleConfig = { ...DEFAULT_SCHEDULE, frequency: "daily", time: "18:00" };
export const RECOMMENDED_TZ = "ET";
export const TIME_ZONES = ["ET", "CT", "MT", "PT", "UTC"];

export function tableName(key: string) {
  const p = key.split("::");
  return p[2] ?? p[p.length - 1];
}

export type FlatAsset = { key: string; connId: string; warehouse: string; connection: string; schema: string; name: string };
export const ALL_ASSETS: FlatAsset[] = WAREHOUSES.flatMap((c) =>
  c.schemas.flatMap((s) =>
    s.assets.map((a) => ({
      key: assetKey(c.id, s.name, a.name),
      connId: c.id,
      warehouse: c.warehouse,
      connection: c.name,
      schema: s.name,
      name: a.name,
    })),
  ),
);

export function withTables(plan: Plan, keys: string[]): Plan {
  const selected = Array.from(new Set([...plan.selected, ...keys]));
  const checked = { ...plan.checked };
  for (const k of keys) if (!checked[k]) checked[k] = generateChecks(tableName(k)).map((c) => c.id);
  return { ...plan, selected, checked };
}

export function withoutTables(plan: Plan, keys: string[]): Plan {
  const drop = new Set(keys);
  const checked = { ...plan.checked };
  keys.forEach((k) => delete checked[k]);
  return { ...plan, selected: plan.selected.filter((k) => !drop.has(k)), checked };
}

export function checkTotal(plan: Plan) {
  return plan.selected.reduce((n, k) => n + (plan.checked[k]?.length ?? 0), 0);
}

export function to12h(t?: string) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ap = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ap}`;
}

export function scheduleLabel(s: ScheduleConfig | null, tz: string | null) {
  if (!s) return "Not set";
  const base =
    s.frequency === "weekly"
      ? `Weekly on ${s.day ?? "Monday"} at ${to12h(s.time)}`
      : s.frequency === "daily"
        ? `Daily at ${to12h(s.time)}`
        : frequencyLabel(s);
  return tz ? `${base} ${tz}` : base;
}

export function connectionSummary(plan: Plan) {
  if (plan.selected.length === 0) return "Not set";
  const whs = Array.from(new Set(plan.selected.map((k) => ALL_ASSETS.find((a) => a.key === k)?.warehouse ?? "")));
  return `${whs.join(", ")}, ${plan.selected.length} ${plan.selected.length === 1 ? "table" : "tables"}`;
}

/** Fill unset fields with recommended defaults; returns the applied default names. */
export function finalize(plan: Plan): { plan: Plan; defaults: string[] } {
  const defaults: string[] = [];
  let p = plan;
  if (!p.profiling) {
    p = { ...p, profiling: RECOMMENDED_SCHEDULE };
    defaults.push("profiling schedule: daily at 6:00 PM");
  }
  if (!p.checks) {
    p = { ...p, checks: p.linked ? p.profiling : RECOMMENDED_SCHEDULE };
    defaults.push("DQ checks schedule: same as profiling");
  }
  if (!p.timeZone) {
    p = { ...p, timeZone: RECOMMENDED_TZ };
    defaults.push("time zone: ET");
  }
  return { plan: p, defaults };
}

export function buildAssets(plan: Plan, domain: string): { tables: string[]; checkCount: number; assets: CreatedAssetInput[] } {
  const tables: string[] = [];
  const assets: CreatedAssetInput[] = [];
  let checkCount = 0;
  for (const key of plan.selected) {
    const [connId, schemaName, assetName] = key.split("::");
    const name = assetName ?? tableName(key);
    const all = [...generateChecks(name), ...(plan.customChecks[key] ?? [])];
    const keep = new Set(plan.checked[key] ?? all.map((c) => c.id));
    const kept = all.filter((c) => keep.has(c.id));
    tables.push(name);
    checkCount += kept.length;
    const conn = WAREHOUSES.find((c) => c.id === connId);
    const schema = conn?.schemas.find((s) => s.name === schemaName);
    const asset = schema?.assets.find((a) => a.name === assetName);
    assets.push({
      name,
      type: asset?.type ?? "table",
      source: conn?.warehouse ?? "Databricks",
      connection: conn?.name ?? "New connection",
      schema: schemaName ?? "default",
      description: asset?.description ?? "Newly added data asset.",
      rows: asset?.rows ?? 0,
      checks: kept,
      profilingSchedule: plan.profiling ?? RECOMMENDED_SCHEDULE,
      checksSchedule: plan.checks ?? RECOMMENDED_SCHEDULE,
      domain,
    });
  }
  return { tables, checkCount, assets };
}
