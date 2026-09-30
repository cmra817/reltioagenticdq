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
};

export const EMPTY_PLAN: Plan = {
  selected: [],
  checked: {},
  customChecks: {},
  profiling: null,
  checks: null,
  linked: true,
};

export const RECOMMENDED_SCHEDULE: ScheduleConfig = { ...DEFAULT_SCHEDULE, frequency: "daily", time: "18:00" };

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
      ? `Weekly on ${s.day ?? "Monday"}s at ${to12h(s.time)}`
      : s.frequency === "daily"
        ? `Daily at ${to12h(s.time)}`
        : s.frequency === "custom" && s.repeatUnit === "hours"
          ? s.repeatEvery === 1 ? "Every hour" : `Every ${s.repeatEvery} hours`
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

/** Checks currently kept for a table (generated + custom). */
export function keptChecks(plan: Plan, key: string): Check[] {
  const all = [...generateChecks(tableName(key)), ...(plan.customChecks[key] ?? [])];
  const keep = new Set(plan.checked[key] ?? []);
  return all.filter((c) => keep.has(c.id));
}

export function dimensionsInUse(plan: Plan): string[] {
  const s = new Set<string>();
  for (const k of plan.selected) keptChecks(plan, k).forEach((c) => s.add(c.dimension));
  return Array.from(s);
}

/** Why the recommended checks were picked, grounded in the columns they landed on. */
const RATIONALE: Record<string, string> = {
  Uniqueness: "these read as identifiers, so a repeat means the same record is counted twice",
  Completeness: "every row has a value there today, so an empty one would be new",
  Validity: "the values follow one shape today, so I check they keep it",
  Consistency: "these values agree with each other today, and drift is easy to miss",
  Timeliness: "this is how I can tell the table stopped loading on time",
  "Format and range": "the values sit inside a steady range today",
};

export function checkRationale(plan: Plan): { dimension: string; columns: string[]; count: number; why: string }[] {
  const by = new Map<string, { columns: Set<string>; count: number }>();
  for (const k of plan.selected)
    for (const c of keptChecks(plan, k)) {
      const e = by.get(c.dimension) ?? { columns: new Set<string>(), count: 0 };
      (c.fields ?? [c.field]).forEach((f) => f && e.columns.add(f));
      e.count += 1;
      by.set(c.dimension, e);
    }
  return Array.from(by.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 4)
    .map(([dimension, e]) => ({
      dimension,
      columns: Array.from(e.columns).slice(0, 3),
      count: e.count,
      why: RATIONALE[dimension] ?? "these columns behave consistently today",
    }));
}


export function assetOf(key: string) {
  const [connId, schemaName, assetName] = key.split("::");
  const conn = WAREHOUSES.find((c) => c.id === connId);
  return { conn, asset: conn?.schemas.find((s) => s.name === schemaName)?.assets.find((a) => a.name === assetName) };
}

export function totalRows(plan: Plan) {
  return plan.selected.reduce((n, k) => n + (assetOf(k).asset?.rows ?? 0), 0);
}

export function formatRowCount(n: number) {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${Math.round(n / 1e3)}K`;
  return String(n);
}

/** Things worth saying in chat (never shown as warnings in the workspace). */
export function observations(plan: Plan): { text: string; keys: string[] }[] {
  const out: { text: string; keys: string[] }[] = [];
  const views = plan.selected.filter((k) => assetOf(k).asset?.type === "view");
  if (views.length)
    out.push({ text: `${views.map(tableName).join(", ")} ${views.length === 1 ? "is a view" : "are views"}, so checks run against the view's query each time.`, keys: views });
  const empty = plan.selected.filter((k) => (assetOf(k).asset?.rows ?? 1) === 0);
  if (empty.length) out.push({ text: `${empty.map(tableName).join(", ")} has no rows yet, so its checks would fail on day one.`, keys: empty });
  const noKey = plan.selected.filter((k) => !keptChecks(plan, k).some((c) => c.dimension === "Uniqueness"));
  if (noKey.length && noKey.length < plan.selected.length)
    out.push({ text: `I couldn't find a primary key on ${noKey.map(tableName).join(", ")}, so there's no uniqueness check there.`, keys: noKey });
  return out.slice(0, 2);
}
