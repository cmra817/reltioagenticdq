import { hash, type Rule } from "@/lib/mock-ops";

export type RuleTestResult = {
  table: string;
  total: number;
  failing: number;
  pct: number;
  passes: boolean;
};

const TABLES = ["customers", "invoices", "orders_fact", "suppliers", "ap_payments"];

/** Prototype stand-in for running a rule against real rows from the last run. */
export function testRule(rule: Pick<Rule, "name" | "description" | "threshold">): RuleTestResult {
  const h = hash(`${rule.name}|${rule.description}`);
  const total = 120_000 + (h % 9) * 10_000;
  const failing = h % 400;
  const pct = (failing / total) * 100;
  return {
    table: TABLES[h % TABLES.length],
    total,
    failing,
    pct,
    passes: pct <= rule.threshold,
  };
}

export function describeTest(t: RuleTestResult, threshold: number): string {
  const pct = t.pct < 0.01 && t.failing > 0 ? "<0.01" : t.pct.toFixed(2);
  return `On ${t.table} from the last run, ${t.failing.toLocaleString()} of ${t.total.toLocaleString()} rows fail (${pct}%). ${
    t.passes
      ? `That is inside the ${threshold}% you allow, so this check would pass.`
      : `That is over the ${threshold}% you allow, so this check would fail.`
  }`;
}
