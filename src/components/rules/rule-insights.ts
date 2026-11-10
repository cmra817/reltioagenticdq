import { clamp, hash, type Rule, type RuleType, type Schedule } from "@/lib/mock-ops";

/** One table a schedule checks with this rule, and the columns the rule looks at. */
export type CoverageItem = {
  scheduleId: string;
  scheduleName: string;
  domain: string;
  table: string;
  columns: string[];
};

export type FailureItem = {
  label: string;
  table: string;
  column: string;
  failedRows: number;
  /** Share of that table's rows that failed. */
  pct: number;
};

export type RuleInsights = {
  /** False when no schedule applies the rule, so there is no history yet. */
  applied: boolean;
  coverage: CoverageItem[];
  scheduleCount: number;
  tableCount: number;
  columnCount: number;
  /** Checks run in the last 30 days. */
  runs: number;
  passes: number;
  passRate: number;
  lastWeekRate: number;
  /** Daily pass rate for the last 14 days, oldest first. */
  trend: number[];
  /** The five table.column pairs that fail most. */
  failing: FailureItem[];
};

/** Columns each kind of rule usually looks at. The prototype has no real column mapping yet. */
const COLUMNS_BY_TYPE: Record<RuleType, string[]> = {
  Completeness: ["id", "status"],
  Validity: ["amount", "email"],
  Uniqueness: ["id", "email"],
  Freshness: ["created_at"],
  Consistency: ["status", "amount"],
};

const CAUSE_BY_TYPE: Record<RuleType, string> = {
  Completeness: "rows where the value is empty",
  Validity: "values that don't match the expected format",
  Uniqueness: "keys that appear more than once",
  Freshness: "records that arrived late",
  Consistency: "values that disagree with the source system",
};

/**
 * Prototype stand-in for the metric layer: how a rule is doing across the
 * schedules that apply it. Deterministic per rule, so numbers don't jump.
 */
export function buildInsights(rule: Rule, used: Schedule[]): RuleInsights {
  const coverage: CoverageItem[] = [];
  for (const s of used) {
    for (const table of s.tables) {
      const pool = COLUMNS_BY_TYPE[rule.type];
      const take = hash(`${rule.id}|${table}`) % 2 === 0 ? pool.length : 1;
      coverage.push({
        scheduleId: s.id,
        scheduleName: s.name,
        domain: s.domain,
        table,
        columns: pool.slice(0, Math.max(1, take)),
      });
    }
  }

  const tables = new Set(coverage.map((c) => c.table));
  const pairs = new Map<string, { table: string; column: string }>();
  for (const c of coverage) {
    for (const column of c.columns) pairs.set(`${c.table}.${column}`, { table: c.table, column });
  }

  const h = hash(rule.id);
  const passRate = +clamp(97.5 - (h % 70) / 10, 88, 99.5).toFixed(1);
  const lastWeekRate = +clamp(passRate + (((h >> 3) % 40) - 20) / 10, 85, 99.5).toFixed(1);
  const runs = coverage.length * 30;
  const passes = Math.round((runs * passRate) / 100);

  const trend = Array.from({ length: 14 }, (_, i) => {
    const wobble = (((h >> (i % 5)) + i * 7) % 30) / 10 - 1.5;
    const drift = ((i - 13) / 13) * (passRate - lastWeekRate);
    return +clamp(passRate + wobble + drift, 80, 100).toFixed(1);
  });
  trend[13] = passRate;

  const failing = [...pairs.entries()]
    .map(([label, p]) => {
      const rows = 40_000 + (hash(p.table) % 160_000);
      const failedRows = Math.round(rows * (((hash(`${rule.id}|${label}`) % 90) + 5) / 10_000));
      return { label, ...p, failedRows, pct: (failedRows / rows) * 100 };
    })
    .sort((a, b) => b.failedRows - a.failedRows)
    .slice(0, 5);

  return {
    applied: coverage.length > 0,
    coverage,
    scheduleCount: used.length,
    tableCount: tables.size,
    columnCount: pairs.size,
    runs,
    passes,
    passRate,
    lastWeekRate,
    trend,
    failing,
  };
}

export function causeFor(type: RuleType): string {
  return CAUSE_BY_TYPE[type];
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
const pct = (n: number) => (n < 0.01 ? "<0.01%" : `${n.toFixed(2)}%`);

/** Answers "why does it fail?" from the insights. */
export function whyFailing(rule: Rule, ins: RuleInsights): string {
  const top = ins.failing[0];
  if (!ins.applied || !top) return "It isn't applied anywhere yet, so nothing has failed.";
  const next = ins.failing[1];
  return `${top.label} fails most: ${top.failedRows.toLocaleString()} rows (${pct(top.pct)}) in the last 30 days, mostly ${causeFor(rule.type)}.${
    next ? ` Next is ${next.label} with ${next.failedRows.toLocaleString()} rows.` : ""
  } I can allow a few failures or add a condition to skip them. Tell me which.`;
}

export function passRateText(ins: RuleInsights): string {
  if (!ins.applied) return "No history yet, because no task applies this rule.";
  return `It passed ${ins.passes} of ${ins.runs} checks in the last 30 days (${ins.passRate}%). Last week it was ${ins.lastWeekRate}%.`;
}

export function coverageText(ins: RuleInsights): string {
  if (!ins.applied) return "No task applies this rule yet, so changing it affects nothing.";
  const names = [...new Set(ins.coverage.map((c) => c.scheduleName))];
  return `It covers ${plural(ins.tableCount, "table")} and ${plural(ins.columnCount, "column")}, through ${names.join(", ")}. When you save a change I'll ask whether to update all of them, some, or save a new rule.`;
}
