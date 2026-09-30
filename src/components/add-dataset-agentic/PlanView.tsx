import { Step1SelectData } from "@/components/add-dataset/Step1SelectData";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronRight, Loader2, Lock, Plus, Search, Table2, X } from "lucide-react";
import { DimensionBadge } from "../dq-dimensions";
import { SourceLogo } from "@/components/explore-screen";
import { RuleModal } from "../dq-checks/RuleModal";
import { MOCK_RULES, type Rule } from "../dq-checks/mock-rules";
import { checkLogic, generateChecks, type Check } from "../add-dataset/mock-checks";
import { WAREHOUSES, formatRows, relativeTime, type WarehouseType } from "../add-dataset/mock-warehouses";
import { DEFAULT_SCHEDULE, type ScheduleConfig } from "../add-dataset/Step3Schedule";
import {
  ALL_ASSETS,
  RECOMMENDED_SCHEDULE,
  assetOf,
  keptChecks,
  scheduleLabel,
  tableName,
  to12h,
  withTables,
  withoutTables,
  type Plan,
} from "./plan-state";

/* ------------------------------------------------------------------ helpers */

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const TABLE_LEVEL = /row count|volume|whole table/i;

export function isTableLevel(c: { field?: string; rule?: string; name?: string }) {
  const f = c.field ?? "";
  return f === "(table)" || TABLE_LEVEL.test(c.rule ?? c.name ?? "");
}

export function columnsOf(key: string): string[] {
  const s = new Set<string>();
  for (const c of generateChecks(tableName(key))) (c.fields ?? [c.field]).forEach((f) => f && !f.startsWith("(") && s.add(f));
  ["created_at", "updated_at"].forEach((f) => s.add(f));
  return Array.from(s);
}

export function hasKey(key: string) {
  return generateChecks(tableName(key)).some((c) => c.dimension === "Uniqueness");
}

/** Columns a library rule would land on by default for a table. Empty = doesn't fit. */
export function suggestedColumns(rule: { name: string }, key: string): string[] {
  const cols = columnsOf(key);
  const n = rule.name.toLowerCase();
  const pick = (re: RegExp) => cols.filter((c) => re.test(c));
  if (/primary key|unique/.test(n)) return hasKey(key) ? pick(/(^id$|_id$)/).slice(0, 1) : [];
  if (/email/.test(n)) return pick(/email/);
  if (/phone/.test(n)) return pick(/phone/);
  if (/fresh|date|past|time/.test(n)) return pick(/_at$|date/).slice(0, 1);
  if (/country|iso/.test(n)) return pick(/country/);
  if (/range|between|negative|amount/.test(n)) return pick(/amount|total|price|qty|quantity/);
  if (/allowed|set|list|status/.test(n)) return pick(/status|state|segment|channel|tier/);
  if (/null|required|empty/.test(n)) return pick(/(^id$|_id$)/).slice(0, 1);
  return [];
}

function ruleToCheck(rule: Rule, fields: string[], key: string): Check {
  return {
    id: `lib-${rule.id}-${tableName(key)}-${Date.now()}`,
    rule: rule.name,
    description: rule.description,
    dimension: rule.dimension,
    field: fields[0] ?? "(table)",
    fields: fields.length ? fields : undefined,
    creator: rule.creator,
    expectation: rule.expectation,
    pattern: rule.pattern,
    threshold: rule.threshold,
  };
}

export function addChecks(plan: Plan, key: string, checks: Check[]): Plan {
  return {
    ...plan,
    customChecks: { ...plan.customChecks, [key]: [...(plan.customChecks[key] ?? []), ...checks] },
    checked: { ...plan.checked, [key]: [...(plan.checked[key] ?? []), ...checks.map((c) => c.id)] },
  };
}

export function nextRun(s: ScheduleConfig, now = new Date()) {
  const [h, m] = (s.time ?? "00:00").split(":").map(Number);
  const d = new Date(now);
  if (s.frequency === "custom" && s.repeatUnit === "hours") {
    d.setMinutes(0, 0, 0);
    d.setHours(d.getHours() + (s.repeatEvery || 1));
  } else if (s.frequency === "6h" || s.frequency === "12h") {
    const step = s.frequency === "6h" ? 6 : 12;
    d.setMinutes(0, 0, 0);
    d.setHours(Math.floor(d.getHours() / step) * step + step);
  } else {
    d.setHours(h, m, 0, 0);
    if (s.frequency === "weekly") {
      const target = (DAYS.indexOf(s.day ?? "Monday") + 1) % 7;
      let add = (target - d.getDay() + 7) % 7;
      if (add === 0 && d <= now) add = 7;
      d.setDate(d.getDate() + add);
    } else if (d <= now) d.setDate(d.getDate() + 1);
  }
  const days = Math.round((d.getTime() - now.getTime()) / 86400000);
  const hrs = Math.max(1, Math.round((d.getTime() - now.getTime()) / 3600000));
  const when = d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  const tm = to12h(`${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`);
  const rel = days >= 1 ? `in ${days} ${days === 1 ? "day" : "days"}` : `in ${hrs} ${hrs === 1 ? "hour" : "hours"}`;
  return `Next run · ${when} at ${tm} · ${rel}`;
}

const label = "text-[11px] font-semibold uppercase tracking-[0.08em]";

/* ------------------------------------------------------------------ types */

export type Reveal = { keys: string[]; nonce: number } | null;
export type RuleRequest = { key: string; description: string; nonce: number } | null;
export type PlanFilter = { label: string; keys: string[] } | null;

type Props = {
  plan: Plan;
  onChange: (next: Plan, line: string) => void;
  /** 0 = nothing yet, 1 = tables, 2 = checks, 3 = schedules. */
  stage: number;
  flashKeys?: Set<string>;
  flashIds?: Set<string>;
  reveal: Reveal;
  ruleRequest: RuleRequest;
  filter: PlanFilter;
  onClearFilter: () => void;
  onDialogChange: (open: boolean) => void;
  pulseSchedule?: boolean;
};

/* ------------------------------------------------------------------ view */

export function PlanView(p: Props) {
  const { plan, onChange, stage } = p;
  const many = plan.selected.length > 10;
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  const [closedGroups, setClosedGroups] = useState<Set<string>>(new Set());
  const [openSchemas, setOpenSchemas] = useState<Set<string>>(new Set());
  const [openTables, setOpenTables] = useState<Set<string>>(new Set());
  const [openCheck, setOpenCheck] = useState<string | null>(null);
  const [addingOn, setAddingOn] = useState<string | null>(null);
  const [showMore, setShowMore] = useState<Record<string, number>>({});
  const [query, setQuery] = useState("");
  const [dialog, setDialog] = useState<null | { kind: "tables" } | { kind: "rule"; key: string; description?: string; source?: Rule; replaceId?: string }>(null);
  const [openSched, setOpenSched] = useState<"profiling" | "checks" | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const initRef = useRef(false);

  // Tables start collapsed; connection groups stay expanded so every table is visible.
  useEffect(() => {
    if (initRef.current || stage < 1 || plan.selected.length === 0) return;
    initRef.current = true;
  }, [stage, plan.selected]);

  useEffect(() => {
    p.onDialogChange(!!dialog);
  }, [dialog]); // eslint-disable-line react-hooks/exhaustive-deps

  // Expand + scroll to revealed tables.
  useEffect(() => {
    if (!p.reveal?.keys.length) return;
    const keys = p.reveal.keys;
    setOpenTables((s) => new Set([...s, ...keys]));
    setOpenGroups((s) => new Set([...s, ...keys.map((k) => assetOf(k).conn?.warehouse ?? "")]));
    setClosedGroups((s) => new Set([...s].filter((g) => !keys.some((k) => assetOf(k).conn?.warehouse === g))));
    setOpenSchemas((s) => new Set([...s, ...keys.map(schemaId)]));
    window.setTimeout(() => {
      document.getElementById(`plan-row-${keys[0]}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }, [p.reveal]);

  useEffect(() => {
    if (!p.ruleRequest) return;
    openerRef.current = document.activeElement as HTMLElement;
    setDialog({ kind: "rule", key: p.ruleRequest.key, description: p.ruleRequest.description });
  }, [p.ruleRequest]);

  const closeDialog = () => {
    setDialog(null);
    window.setTimeout(() => openerRef.current?.focus(), 0);
  };
  const openDialog = (d: NonNullable<typeof dialog>) => {
    if (dialog) return; // never stack
    openerRef.current = document.activeElement as HTMLElement;
    setDialog(d);
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let keys = plan.selected;
    if (p.filter) keys = keys.filter((k) => p.filter!.keys.includes(k));
    if (!q) return keys;
    return keys.filter((k) => {
      const a = ALL_ASSETS.find((x) => x.key === k);
      const hay = [a?.name, a?.schema, a?.connection, a?.warehouse, ...keptChecks(plan, k).map((c) => c.rule)].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [plan, query, p.filter]);

  const groups = useMemo(() => {
    const by = new Map<string, string[]>();
    for (const k of visible) {
      const w = assetOf(k).conn?.warehouse ?? "Other";
      by.set(w, [...(by.get(w) ?? []), k]);
    }
    return Array.from(by.entries());
  }, [visible]);

  const groupOpen = (w: string) => (many || query ? openGroups.has(w) || !!query : !closedGroups.has(w));
  const toggleGroup = (w: string) => {
    if (many) setOpenGroups((s) => toggle(s, w));
    else setClosedGroups((s) => toggle(s, w));
  };

  const removeTable = (k: string) => onChange(withoutTables(plan, [k]), `You removed ${tableName(k)} from the job.`);
  const removeCheck = (k: string, c: Check) =>
    onChange({ ...plan, checked: { ...plan.checked, [k]: (plan.checked[k] ?? []).filter((x) => x !== c.id) } }, `You removed '${c.rule}' from ${tableName(k)}.`);

  const tableRow = (k: string) => {
    const { conn, asset } = assetOf(k);
    const checks = stage >= 2 ? keptChecks(plan, k) : [];
    const open = openTables.has(k);
    const flashed = p.flashKeys?.has(k);
    const schema = k.split("::")[1];
    return (
      <div key={k} id={`plan-row-${k}`} className="scroll-mt-4 border-t first:border-t-0" style={{ borderColor: "var(--hairline)" }}>
        <div
          className="group flex items-center gap-2 px-3 py-3 transition-colors duration-700 motion-reduce:transition-none"
          style={{ background: flashed ? "rgba(67,134,250,0.10)" : undefined }}
        >
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpenTables((s) => toggle(s, k))}
            className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
          >
            <ChevronDown size={15} className={`shrink-0 transition-transform motion-reduce:transition-none ${open ? "" : "-rotate-90"}`} style={{ color: "var(--ink-500)" }} />
            <Table2 size={15} className="shrink-0" style={{ color: "var(--ink-500)" }} />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-mono text-[13.5px] font-semibold" style={{ color: "var(--ink-900)" }}>
                {tableName(k)}
              </span>
              <span className="block truncate text-[12px]" style={{ color: "var(--ink-500)" }}>
                {conn?.warehouse} › {conn?.name} › {schema}
              </span>
            </span>
            <span className="hidden shrink-0 text-[12px] @[640px]:inline" style={{ color: "var(--ink-500)" }}>
              {asset ? `${formatRows(asset.rows)} rows · ${relativeTime(asset.lastSyncedISO)}` : ""}
            </span>
            <span className="w-[100px] shrink-0 text-right text-[12.5px] font-medium" style={{ color: checks.length ? "var(--ink-900)" : "var(--ink-500)" }}>
              {stage < 2 ? <Loader2 size={13} className="ml-auto animate-spin" /> : checks.length ? `${checks.length} DQ checks` : "Profiling only"}
            </span>
          </button>
          <button
            type="button"
            aria-label={`Remove ${tableName(k)}`}
            onClick={() => removeTable(k)}
            className="shrink-0 rounded-full p-1.5 hover:bg-[color:var(--surface-soft)]"
            style={{ color: "var(--ink-500)" }}
          >
            <X size={14} />
          </button>
        </div>
        {open && stage >= 2 && (
          <div className="pb-3 pl-11 pr-3 animate-in fade-in duration-200 motion-reduce:animate-none">
            <div className={`${label} mb-1 flex items-center gap-2`} style={{ color: "var(--ink-500)" }}>
              DQ checks
              <span className="rounded-full px-1.5 py-0.5 text-[11px] normal-case tracking-normal" style={{ background: "var(--surface-soft)", color: "var(--ink-700)" }}>
                {checks.length || "None"}
              </span>
            </div>
            {checks.length === 0 && (
              <p className="py-2 text-[13px]" style={{ color: "var(--ink-500)" }}>
                Profiling only. No checks will run on this table.
              </p>
            )}
            {checks.map((c) => checkRow(k, c))}
            <div className="relative mt-2 w-fit">
              <button
                type="button"
                aria-expanded={addingOn === k}
                aria-haspopup="menu"
                onClick={() => setAddingOn(addingOn === k ? null : k)}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium"
                style={{ background: "rgba(67,134,250,0.08)", color: "var(--brand-blue)" }}
              >
                <Plus size={14} /> Add check
              </button>
              {addingOn === k && (
                <AddCheckInline
                  tableKey={k}
                  existing={checks}
                  onAdd={(check) => {
                    onChange(addChecks(plan, k, [check]), `You added '${check.rule}' to ${tableName(k)}.`);
                    setAddingOn(null);
                  }}
                  onCreate={() => openDialog({ kind: "rule", key: k })}
                />
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const checkRow = (k: string, c: Check) => {
    const id = `${k}::${c.id}`;
    const open = openCheck === id;
    const cols = (c.fields ?? [c.field]).filter((f) => f && !f.startsWith("("));
    const logic = checkLogic(c);
    const managed = !c.creator || c.creator.kind === "reltio";
    const flashed = p.flashIds?.has(c.id);
    return (
      <div key={c.id} className="border-b last:border-b-0" style={{ borderColor: "var(--hairline)" }}>
        <div
          className="flex items-center gap-2 rounded-lg px-2 transition-colors duration-700 hover:bg-[color:var(--surface-soft)] motion-reduce:transition-none"
          style={{ background: flashed ? "rgba(67,134,250,0.12)" : undefined }}
        >
          <button type="button" aria-expanded={open} onClick={() => setOpenCheck(open ? null : id)} className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1.5 gap-y-1 py-2 text-left">
            <span className="text-[13.5px] font-semibold" style={{ color: "var(--ink-900)" }}>
              {c.rule}
            </span>
            {cols.length && !isTableLevel(c) ? (
              <>
                <span className="text-[12.5px]" style={{ color: "var(--ink-500)" }}>
                  on
                </span>
                {cols.map((f) => (
                  <span key={f} className="rounded-full px-2 py-0.5 font-mono text-[12px]" style={{ background: "var(--surface-soft)", color: "var(--ink-700)" }}>
                    {f}
                  </span>
                ))}
              </>
            ) : (
              <span className="text-[12.5px]" style={{ color: "var(--ink-500)" }}>
                on the whole table
              </span>
            )}
          </button>
          <span className="shrink-0">
            <DimensionBadge label={c.dimension} size="sm" />
          </span>
          <button type="button" aria-label={`Remove ${c.rule}`} onClick={() => removeCheck(k, c)} className="shrink-0 rounded-full p-1.5 hover:bg-white" style={{ color: "var(--ink-500)" }}>
            <X size={13} />
          </button>
        </div>
        {open && (
          <div className="mx-2 mb-2 space-y-1.5 rounded-lg border px-3 py-2.5 text-[12.5px]" style={{ borderColor: "var(--hairline)", color: "var(--ink-700)" }}>
            <div>
              Expectation <code className="font-mono text-[12px]" style={{ color: "var(--ink-900)" }}>{logic.expectation}</code>
            </div>
            <div>Fails when more than {logic.threshold}% of {cols.length && !isTableLevel(c) ? "values" : "runs"} don't match{c.description ? ` — ${c.description.replace(/\.$/, "").toLowerCase()}` : ""}.</div>
            {/regex/.test(logic.expectation) && (
              <div>
                Pattern <code className="font-mono text-[12px]" style={{ color: "var(--ink-900)" }}>{logic.pattern}</code>
              </div>
            )}
            {managed ? (
              <div className="flex items-center gap-1.5" style={{ color: "var(--ink-500)" }}>
                <Lock size={12} /> Managed by Reltio, cannot be edited
              </div>
            ) : (
              <button
                type="button"
                className="font-medium underline"
                style={{ color: "var(--brand-blue)" }}
                onClick={() =>
                  openDialog({
                    kind: "rule",
                    key: k,
                    replaceId: c.id,
                    source: {
                      id: c.id,
                      name: c.rule,
                      dimension: c.dimension,
                      description: c.description,
                      creator: c.creator ?? { kind: "me" },
                      columns: cols.length,
                      passRate: 100,
                      expectation: logic.expectation,
                      pattern: logic.pattern,
                      threshold: logic.threshold,
                    },
                  })
                }
              >
                Edit rule
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  const groupBody = (keys: string[]) => {
    if (!many) return keys.map(tableRow);
    const by = new Map<string, string[]>();
    keys.forEach((k) => by.set(schemaId(k), [...(by.get(schemaId(k)) ?? []), k]));
    return Array.from(by.entries()).map(([sid, ks]) => {
      const open = openSchemas.has(sid) || !!query;
      const limit = showMore[sid] ?? 40;
      return (
        <div key={sid} className="border-t" style={{ borderColor: "var(--hairline)" }}>
          <button type="button" aria-expanded={open} onClick={() => setOpenSchemas((s) => toggle(s, sid))} className="flex w-full items-center gap-2 px-4 py-2 text-left text-[13px] hover:bg-[color:var(--surface-soft)]">
            {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <span className="font-mono font-medium" style={{ color: "var(--ink-900)" }}>
              {sid.split("::").slice(1).join(" › ")}
            </span>
            <span className="ml-auto text-[12px]" style={{ color: "var(--ink-500)" }}>
              {ks.length} tables
            </span>
          </button>
          {open && (
            <div className="pl-3">
              {ks.slice(0, limit).map(tableRow)}
              {ks.length > limit && (
                <button type="button" onClick={() => setShowMore((m) => ({ ...m, [sid]: limit + 40 }))} className="px-4 py-2 text-[13px] font-medium" style={{ color: "var(--brand-blue)" }}>
                  Show {Math.min(40, ks.length - limit)} more
                </button>
              )}
            </div>
          )}
        </div>
      );
    });
  };

  const checksAll = plan.selected.reduce((n, k) => n + keptChecks(plan, k).length, 0);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={scrollRef} className="@container min-h-0 flex-1 overflow-y-auto" aria-hidden={!!dialog || undefined}>
        <div className="mx-auto max-w-[980px] px-6 py-7 @[700px]:px-10">
          <h2 className="text-[24px] font-semibold" style={{ color: "var(--ink-900)" }}>
            Your plan
          </h2>
          <p className="mt-1 text-[14px]" style={{ color: "var(--ink-500)" }}>
            Everything that will be set up. Edit any part directly.
          </p>

          {/* WHAT WILL RUN */}
          <div className="mt-8 flex items-center justify-between">
            <div className={label} style={{ color: "var(--ink-500)" }}>
              What will run
            </div>
            <button
              type="button"
              onClick={() => openDialog({ kind: "tables" })}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium"
              style={{ background: "rgba(67,134,250,0.08)", color: "var(--brand-blue)" }}
            >
              <Plus size={14} /> Add tables
            </button>
          </div>

          {plan.selected.length > 3 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <div className="relative min-w-[220px] flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--ink-500)" }} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Filter by table, schema, connection or check"
                  className="h-9 w-full rounded-full border bg-white pl-8 pr-3 text-[13px] outline-none focus:border-[color:var(--brand-blue)]"
                  style={{ borderColor: "var(--hairline)" }}
                />
              </div>
            </div>
          )}
          {p.filter && (
            <div className="mt-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border bg-white py-1 pl-3 pr-1.5 text-[12.5px]" style={{ borderColor: "var(--hairline)", color: "var(--ink-700)" }}>
                {p.filter.label}
                <button type="button" aria-label="Clear filter" onClick={p.onClearFilter} className="rounded-full p-0.5 hover:bg-[color:var(--surface-soft)]">
                  <X size={12} />
                </button>
              </span>
            </div>
          )}

          <div className="mt-3 space-y-3">
            {stage < 1 ? (
              <div className="flex items-center gap-2 rounded-xl border bg-white px-4 py-5 text-[13px]" style={{ borderColor: "var(--hairline)", color: "var(--ink-500)" }}>
                <Loader2 size={14} className="animate-spin" /> Finding your tables…
              </div>
            ) : plan.selected.length === 0 ? (
              <div className="rounded-xl border border-dashed bg-white px-4 py-10 text-center" style={{ borderColor: "var(--hairline)" }}>
                <p className="text-[14px] font-medium" style={{ color: "var(--ink-900)" }}>
                  No tables yet
                </p>
                <button type="button" onClick={() => openDialog({ kind: "tables" })} className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-medium" style={{ color: "var(--brand-blue)" }}>
                  <Plus size={14} /> Add tables
                </button>
              </div>
            ) : visible.length === 0 ? (
              <p className="px-1 py-4 text-[13px]" style={{ color: "var(--ink-500)" }}>
                No tables in this job match.
              </p>
            ) : (
              groups.map(([w, keys]) => {
                const open = groupOpen(w);
                const n = keys.reduce((s, k) => s + keptChecks(plan, k).length, 0);
                return (
                  <section key={w} className="overflow-hidden rounded-xl border bg-white animate-in fade-in slide-in-from-bottom-1 duration-300 motion-reduce:animate-none" style={{ borderColor: "var(--hairline)" }}>
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => toggleGroup(w)}
                      className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left"
                      style={{ background: "var(--surface-soft)" }}
                    >
                      <ChevronDown size={15} className={`transition-transform motion-reduce:transition-none ${open ? "" : "-rotate-90"}`} style={{ color: "var(--ink-500)" }} />
                      <span className="inline-flex h-5 w-5 items-center justify-center">
                        <SourceLogo source={w} />
                      </span>
                      <span className="text-[14px] font-semibold" style={{ color: "var(--ink-900)" }}>
                        {w}
                      </span>
                      <span className="ml-auto text-[12.5px]" style={{ color: "var(--ink-500)" }}>
                        {keys.length} {keys.length === 1 ? "table" : "tables"}
                        {stage >= 2 && ` · ${n} checks`}
                      </span>
                    </button>
                    {open && <div>{groupBody(keys)}</div>}
                  </section>
                );
              })
            )}
          </div>

          {/* WHEN WILL IT RUN */}
          <div className={`${label} mt-10`} style={{ color: "var(--ink-500)" }}>
            When will it run
          </div>
          <div className="mt-3 overflow-hidden rounded-xl border bg-white" style={{ borderColor: "var(--hairline)", boxShadow: p.pulseSchedule ? "0 0 0 3px rgba(67,134,250,0.35)" : undefined }}>
            {stage < 3 ? (
              <div className="flex items-center gap-2 px-4 py-5 text-[13px]" style={{ color: "var(--ink-500)" }}>
                <Loader2 size={14} className="animate-spin" /> Working out the schedule…
              </div>
            ) : (
              <>
                <ScheduleRow
                  title="Profiling"
                  value={plan.profiling ?? RECOMMENDED_SCHEDULE}
                  open={openSched === "profiling"}
                  onToggle={() => setOpenSched(openSched === "profiling" ? null : "profiling")}
                  onChange={(s, what) =>
                    onChange({ ...plan, profiling: s, checks: plan.linked ? s : plan.checks }, `You changed profiling to ${what}.`)
                  }
                />
                <div className="border-t" style={{ borderColor: "var(--hairline)" }} />
                {checksAll === 0 ? (
                  <div className="flex items-center gap-4 px-4 py-3.5">
                    <span className="w-[92px] shrink-0 text-[13px] font-medium" style={{ color: "var(--ink-700)" }}>
                      DQ checks
                    </span>
                    <span className="text-[13.5px]" style={{ color: "var(--ink-500)" }}>
                      No checks to schedule
                    </span>
                  </div>
                ) : (
                  <ScheduleRow
                    title="DQ checks"
                    value={(plan.linked ? plan.profiling : plan.checks) ?? RECOMMENDED_SCHEDULE}
                    open={openSched === "checks"}
                    onToggle={() => setOpenSched(openSched === "checks" ? null : "checks")}
                    linked={plan.linked}
                    onLink={(on) =>
                      onChange(
                        { ...plan, linked: on, checks: on ? plan.profiling : plan.checks ?? plan.profiling },
                        on ? "You set checks to run on the same schedule as profiling." : "You gave checks their own schedule.",
                      )
                    }
                    onChange={(s, what) => onChange({ ...plan, checks: s, linked: false }, `You changed checks to ${what}.`)}
                  />
                )}
              </>
            )}
          </div>
          <div className="h-10" />
        </div>
      </div>

      {dialog?.kind === "tables" && (
        <AddTablesDialog
          plan={plan}
          onClose={closeDialog}
          onDone={(add, remove) => {
            let next = plan;
            if (remove.length) next = withoutTables(next, remove);
            if (add.length) next = withTables(next, add);
            const nChecks = add.reduce((s, k) => s + keptChecks(next, k).length, 0);
            const parts: string[] = [];
            if (add.length) parts.push(`added ${add.length} ${add.length === 1 ? "table" : "tables"} (${add.map(tableName).join(", ")}) with ${nChecks} recommended checks`);
            if (remove.length) parts.push(`removed ${remove.length} ${remove.length === 1 ? "table" : "tables"}`);
            closeDialog();
            if (parts.length) {
              onChange(next, `You ${parts.join(" and ")}.`);
              if (add.length) {
                window.setTimeout(() => document.getElementById(`plan-row-${add[0]}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
              }
            }
          }}
        />
      )}
      {dialog?.kind === "rule" && (
        <RuleModal
          open
          contained
          mode={dialog.source ? "edit" : "create"}
          source={dialog.source ?? null}
          initialDescription={dialog.description}
          onClose={closeDialog}
          onSave={(rule) => {
            const key = dialog.key;
            const cols = suggestedColumns(rule, key);
            const fields = cols.length ? cols : columnsOf(key).slice(0, 1);
            const check = ruleToCheck(rule, fields, key);
            let next = plan;
            if (dialog.replaceId) {
              next = { ...next, checked: { ...next.checked, [key]: (next.checked[key] ?? []).filter((x) => x !== dialog.replaceId) } };
            } else if (!MOCK_RULES.some((r) => r.id === rule.id)) {
              MOCK_RULES.push(rule);
            }
            next = addChecks(next, key, [check]);
            closeDialog();
            setOpenTables((s) => new Set([...s, key]));
            onChange(next, dialog.replaceId ? `You edited '${rule.name}' on ${tableName(key)}.` : `You created '${rule.name}' and applied it to ${tableName(key)} on ${fields.join(", ")}.`);
          }}
        />
      )}
    </div>
  );
}

function schemaId(k: string) {
  const [c, s] = k.split("::");
  const conn = WAREHOUSES.find((x) => x.id === c);
  return `${conn?.warehouse ?? c}::${conn?.name ?? c}::${s}`;
}

function toggle<T>(s: Set<T>, v: T) {
  const n = new Set(s);
  if (n.has(v)) n.delete(v);
  else n.add(v);
  return n;
}

/* ------------------------------------------------------------------ add check (inline) */

function AddCheckInline({
  tableKey,
  existing,
  onAdd,
  onCreate,
}: {
  tableKey: string;
  existing: Check[];
  onAdd: (c: Check) => void;
  onCreate: () => void;
}) {
  const [q, setQ] = useState("");
  const [rule, setRule] = useState<Rule | null>(null);
  const [cols, setCols] = useState<Set<string>>(new Set());
  const [colQ, setColQ] = useState("");
  const key = hasKey(tableKey);
  const names = new Set(existing.map((c) => c.rule.toLowerCase()));
  const lib = MOCK_RULES.filter((r) => {
    if (/primary key/i.test(r.name) && !key) return false;
    if (isTableLevel({ name: r.name }) && names.has(r.name.toLowerCase())) return false;
    return r.name.toLowerCase().includes(q.toLowerCase()) || r.dimension.toLowerCase().includes(q.toLowerCase());
  }).slice(0, 3);
  const allCols = columnsOf(tableKey).filter((c) => c.includes(colQ.toLowerCase()));

  const pick = (r: Rule) => {
    if (isTableLevel({ name: r.name })) return onAdd(ruleToCheck(r, [], tableKey));
    setRule(r);
    setCols(new Set(suggestedColumns(r, tableKey)));
  };

  return (
    <div
      role="menu"
      className="absolute left-0 top-[calc(100%+6px)] z-20 w-[390px] max-w-[min(390px,calc(100vw-5rem))] rounded-xl border bg-white p-3 shadow-lg"
      style={{ borderColor: "var(--hairline)" }}
    >
      {!rule ? (
        <>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--ink-500)" }} />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search your checks library"
              className="h-9 w-full rounded-full border pl-8 pr-3 text-[13px] outline-none focus:border-[color:var(--brand-blue)]"
              style={{ borderColor: "var(--hairline)" }}
            />
          </div>
          <div className="mt-2">
            {lib.map((r) => (
              <button key={r.id} role="menuitem" type="button" onClick={() => pick(r)} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[13px] hover:bg-[color:var(--surface-soft)]">
                {r.creator.kind === "reltio" && <Lock size={12} style={{ color: "var(--ink-500)" }} />}
                <span className="flex-1" style={{ color: "var(--ink-900)" }}>
                  {r.name}
                </span>
                <DimensionBadge label={r.dimension} size="sm" />
              </button>
            ))}
            {lib.length === 0 && (
              <p className="px-2 py-3 text-[13px]" style={{ color: "var(--ink-500)" }}>
                No checks match.
              </p>
            )}
          </div>
          <div className="mt-2 border-t pt-2" style={{ borderColor: "var(--hairline)" }}>
            <button type="button" onClick={onCreate} className="inline-flex items-center gap-1.5 text-[13px] font-medium" style={{ color: "var(--brand-blue)" }}>
              <Plus size={14} /> Create new check
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="text-[13px]" style={{ color: "var(--ink-700)" }}>
            <b style={{ color: "var(--ink-900)" }}>{rule.name}</b> on which columns of <span className="font-mono">{tableName(tableKey)}</span>?
          </div>
          <input
            autoFocus
            value={colQ}
            onChange={(e) => setColQ(e.target.value)}
            placeholder="Search columns"
            className="mt-2 h-8 w-full rounded-full border px-3 text-[13px] outline-none focus:border-[color:var(--brand-blue)]"
            style={{ borderColor: "var(--hairline)" }}
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {allCols.map((c) => {
              const on = cols.has(c);
              return (
                <button
                  key={c}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setCols((s) => toggle(s, c))}
                  className="rounded-full border px-2.5 py-1 font-mono text-[12px]"
                  style={on ? { borderColor: "var(--brand-blue)", background: "rgba(67,134,250,0.08)", color: "var(--brand-blue)" } : { borderColor: "var(--hairline)", color: "var(--ink-700)" }}
                >
                  {c}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button type="button" onClick={() => setRule(null)} className="h-8 rounded-full border px-3 text-[13px]" style={{ borderColor: "var(--hairline)" }}>
              Back
            </button>
            <button
              type="button"
              disabled={cols.size === 0}
              onClick={() => onAdd(ruleToCheck(rule, Array.from(cols), tableKey))}
              className="h-8 rounded-full px-4 text-[13px] font-medium text-white disabled:opacity-50"
              style={{ background: "var(--brand-blue)" }}
            >
              Add check
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ schedule rows */

function ScheduleRow({
  title,
  value,
  open,
  onToggle,
  onChange,
  linked,
  onLink,
}: {
  title: string;
  value: ScheduleConfig;
  open: boolean;
  onToggle: () => void;
  onChange: (s: ScheduleConfig, what: string) => void;
  linked?: boolean;
  onLink?: (on: boolean) => void;
}) {
  const disabled = !!linked;
  const freqValue = value.frequency === "custom" && value.repeatUnit === "hours" ? "1h" : value.frequency;
  const set = (patch: Partial<ScheduleConfig>) => {
    const s = { ...value, ...patch };
    onChange(s, scheduleLabel(s).replace(/^(\w)/, (m) => m.toLowerCase()));
  };
  const field = "h-9 rounded-lg border bg-white px-2.5 text-[13px] disabled:opacity-50";
  return (
    <div>
      <button type="button" aria-expanded={open} onClick={onToggle} className="flex w-full items-center gap-4 px-4 py-3.5 text-left hover:bg-[color:var(--surface-soft)]">
        <span className="w-[92px] shrink-0 text-[13px] font-medium" style={{ color: "var(--ink-700)" }}>
          {title}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-medium" style={{ color: "var(--ink-900)" }}>
            {scheduleLabel(value)}
          </span>
          <span className="block text-[12px]" style={{ color: "var(--ink-500)" }}>
            {nextRun(value)}
          </span>
        </span>
        <ChevronDown size={15} className={`shrink-0 transition-transform motion-reduce:transition-none ${open ? "rotate-180" : ""}`} style={{ color: "var(--ink-500)" }} />
      </button>
      {open && (
        <div className="space-y-3 px-4 pb-4 pl-[124px] max-sm:pl-4">
          {onLink && (
            <label className="flex items-center gap-2 text-[13px]" style={{ color: "var(--ink-700)" }}>
              <input type="checkbox" checked={!!linked} onChange={(e) => onLink(e.target.checked)} className="accent-[color:var(--brand-blue)]" />
              Run on the same schedule as profiling
            </label>
          )}
          <div className="flex flex-wrap gap-3">
            <label className="flex flex-col gap-1 text-[12px]" style={{ color: "var(--ink-500)" }}>
              Frequency
              <select
                disabled={disabled}
                value={freqValue}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "1h") set({ frequency: "custom", repeatEvery: 1, repeatUnit: "hours" });
                  else set({ frequency: v as ScheduleConfig["frequency"], repeatUnit: DEFAULT_SCHEDULE.repeatUnit });
                }}
                className={field}
                style={{ borderColor: "var(--hairline)" }}
              >
                <option value="1h">Every hour</option>
                <option value="6h">Every 6 hours</option>
                <option value="12h">Every 12 hours</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </label>
            {value.frequency === "weekly" && (
              <label className="flex flex-col gap-1 text-[12px]" style={{ color: "var(--ink-500)" }}>
                Day
                <select disabled={disabled} value={value.day ?? "Monday"} onChange={(e) => set({ day: e.target.value })} className={field} style={{ borderColor: "var(--hairline)" }}>
                  {DAYS.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </label>
            )}
            {(value.frequency === "daily" || value.frequency === "weekly") && (
              <label className="flex flex-col gap-1 text-[12px]" style={{ color: "var(--ink-500)" }}>
                Time
                <input type="time" disabled={disabled} value={value.time ?? "18:00"} onChange={(e) => set({ time: e.target.value })} className={field} style={{ borderColor: "var(--hairline)" }} />
              </label>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ add tables dialog */

function useFocusTrap(ref: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const sel = 'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea, [tabindex]:not([tabindex="-1"])';
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const items = Array.from(el.querySelectorAll<HTMLElement>(sel));
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [ref]);
}

function AddTablesDialog({ plan, onClose, onDone }: { plan: Plan; onClose: () => void; onDone: (add: string[], remove: string[]) => void }) {
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref);

  const locked = useMemo(() => new Set(plan.selected), [plan.selected]);
  const add = Array.from(picked).filter((k) => !locked.has(k));
  const remove: string[] = [];
  const dirty = add.length > 0;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  return (
    <div className="absolute inset-0 z-[40] flex items-center justify-center p-6 max-sm:fixed max-sm:p-0">
      <button type="button" tabIndex={-1} aria-label="Close" onClick={() => !dirty && onClose()} className="absolute inset-0 cursor-default" style={{ background: "rgba(15,23,42,0.35)" }} />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label="Add tables"
        className="relative z-10 flex h-full max-h-[820px] w-full max-w-[1200px] flex-col overflow-hidden rounded-2xl border bg-white animate-in fade-in zoom-in-95 duration-200 motion-reduce:animate-none max-sm:max-h-none max-sm:rounded-none"
        style={{ borderColor: "var(--hairline)", boxShadow: "0 24px 64px rgba(15,23,42,0.22)" }}
      >
        <div className="flex items-center gap-4 border-b px-6 py-4" style={{ borderColor: "var(--hairline)" }}>
          <h2 className="flex-1 text-[18px] font-semibold" style={{ color: "var(--ink-900)" }}>
            Add tables
          </h2>
          <button type="button" aria-label="Close" onClick={onClose} className="rounded-full p-2 hover:bg-[color:var(--surface-soft)]">
            <X size={18} />
          </button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <Step1SelectData
            selected={picked}
            lockedKeys={locked}
            onToggle={(k) => !locked.has(k) && setPicked((s) => toggle(s, k))}
            onClear={() => setPicked(new Set())}
          />
        </div>
        <div className="flex items-center gap-3 border-t px-6 py-3" style={{ borderColor: "var(--hairline)" }}>
          <span className="text-[13px]" style={{ color: "var(--ink-900)" }}>
            <b>{add.length}</b> {add.length === 1 ? "table" : "tables"} to add
            <span style={{ color: "var(--ink-500)" }}> · {locked.size} already in this job</span>
          </span>
          <span className="hidden text-[12.5px] sm:inline" style={{ color: "var(--ink-500)" }}>
            Recommended checks are added to each new table.
          </span>
          <div className="ml-auto flex gap-2">
            <button type="button" onClick={onClose} className="h-9 rounded-full border px-4 text-[13px]" style={{ borderColor: "var(--hairline)" }}>
              Cancel
            </button>
            <button
              type="button"
              disabled={!dirty}
              onClick={() => onDone(add, remove)}
              className="h-9 rounded-full px-5 text-[13px] font-medium text-white disabled:opacity-50"
              style={{ background: "var(--brand-blue)" }}
            >
              Add tables
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
