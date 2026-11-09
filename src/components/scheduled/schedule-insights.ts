import { narrativeFor, type Rule, type Run, type Schedule } from "@/lib/mock-ops";
import { ago } from "./format";

export type FailingItem = {
  label: string;
  table: string;
  failingRows: number;
};

export type ScheduleInsights = {
  /** Finished runs, newest first. */
  history: Run[];
  lastRun?: Run;
  /** Share of finished runs that passed. */
  successRate: number;
  /** Check pass rate per run for the last 14 runs, oldest first. */
  trend: number[];
  /** The five table and rule pairs with the most failing rows across the history. */
  failing: FailingItem[];
};

export function buildScheduleInsights(
  runs: Run[],
  ruleName: (id: string) => string,
): ScheduleInsights {
  const history = runs.filter((r) => r.status !== "running");
  const passed = history.filter((r) => r.status === "passed").length;
  const trend = history
    .slice(0, 14)
    .reverse()
    .map((r) => (r.checksRun === 0 ? 100 : +((1 - r.checksFailed / r.checksRun) * 100).toFixed(1)));

  const totals = new Map<string, FailingItem>();
  for (const r of history) {
    for (const f of r.findings) {
      const label = `${f.table} · ${ruleName(f.ruleId)}`;
      const prev = totals.get(label);
      totals.set(label, {
        label,
        table: f.table,
        failingRows: (prev?.failingRows ?? 0) + f.failingRows,
      });
    }
  }
  const failing = [...totals.values()].sort((a, b) => b.failingRows - a.failingRows).slice(0, 5);

  return {
    history,
    lastRun: history[0],
    successRate: history.length === 0 ? 100 : +((passed / history.length) * 100).toFixed(0),
    trend,
    failing,
  };
}

/** What the agent says when a run is opened: the stored account of what happened. */
export function runNarrative(run: Run, schedule: Schedule | undefined): string {
  return narrativeFor(run, schedule).join("\n\n");
}

const STATUS_WORD: Record<Run["status"], string> = {
  passed: "passed",
  failed: "failed",
  attention: "needs-attention",
  running: "running",
};

/** The question sent for the person whenever a run is opened, from anywhere. */
export function runPrompt(run: Run): string {
  return `Tell me more about the ${STATUS_WORD[run.status]} run ${ago(run.hoursAgo)}.`;
}

/** Which rule in the library a message refers to, by the words it shares with the rule's name. */
export function matchRule(text: string, pool: Rule[]): Rule | null {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(
      (w) =>
        w.length > 2 &&
        !["add", "the", "rule", "remove", "drop", "apply", "check", "with", "from", "and"].includes(
          w,
        ),
    );
  let best: Rule | null = null;
  let bestScore = 0;
  for (const r of pool) {
    const name = r.name.toLowerCase();
    const score = words.filter((w) => name.includes(w)).length;
    if (score > bestScore) {
      best = r;
      bestScore = score;
    }
  }
  return best;
}
