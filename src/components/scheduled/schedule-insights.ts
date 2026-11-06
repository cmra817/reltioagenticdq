import { narrativeFor, type Rule, type Run, type Schedule } from "@/lib/mock-ops";
import type { ChatTurn } from "@/components/workspace/primitives";
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

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

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

function runLine(r: Run): string {
  if (r.status === "running") return "in progress";
  if (r.checksRun === 0) return "it profiled the tables, with no checks";
  if (r.checksFailed === 0) return `all ${r.checksRun} checks passed`;
  const top = r.findings[0];
  return `${r.checksFailed} of ${r.checksRun} checks failed${
    top ? `, the biggest being "${top.title}" on ${top.table}` : ""
  }`;
}

/** The agent's opening message when a schedule is opened. */
export function scheduleSummary(
  schedule: Schedule,
  ins: ScheduleInsights,
  ruleCount = schedule.ruleIds.length,
): string {
  const lead = `${schedule.name} runs ${schedule.repeats.toLowerCase()} on ${plural(schedule.tables.length, "table")} with ${plural(ruleCount, "rule")}.`;
  const next = schedule.active ? `Next run: ${schedule.nextRun}.` : "It is paused right now.";
  if (!ins.lastRun) return `${lead} ${next} It hasn't run yet.`;
  return `${lead} ${next} The last run was ${ago(ins.lastRun.hoursAgo)}: ${runLine(ins.lastRun)}.\n\nThe right panel has Insights, the Plan, and every Run. Ask me to run it now, pause it, change when it runs, or add a rule.`;
}

export function openingTurns(schedule: Schedule, ins: ScheduleInsights): ChatTurn[] {
  return [
    { id: 0, role: "user", text: `Show me how "${schedule.name}" is doing.` },
    { id: 1, role: "agent", text: scheduleSummary(schedule, ins) },
  ];
}

/** What the agent says when a run is opened: the stored account of what happened. */
export function runNarrative(run: Run, schedule: Schedule | undefined): string {
  return narrativeFor(run, schedule).join("\n\n");
}

export function runOpeningTurns(run: Run, schedule: Schedule | undefined): ChatTurn[] {
  return [
    { id: 0, role: "user", text: `What happened in the run ${ago(run.hoursAgo)}?` },
    { id: 1, role: "agent", text: runNarrative(run, schedule) },
  ];
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
