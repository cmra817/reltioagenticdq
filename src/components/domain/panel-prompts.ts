import type { ChatReply } from "@/components/workspace/chat-visuals";
import { OVERVIEW_CARDS } from "@/components/table-brief/evidence-panel";
import { ACTIVITY_ROWS, CHECK_GROUPS, COLUMNS_ROWS } from "@/components/table-brief/data";

/**
 * Auto prompts sent when someone clicks something in the domain right panel,
 * and the scripted answers to them. Prompt text and the matcher live together
 * so they can never drift apart.
 */
export const panelPrompt = {
  card: (label: string, table: string) => `Tell me about the ${label} card for ${table}`,
  column: (column: string, table: string) => `Tell me about the ${column} column in ${table}`,
  check: (check: string, table?: string) =>
    table ? `Let's discuss the ${check} check on ${table}` : `Let's discuss the ${check} check`,
  day: (day: string, table: string) =>
    day.startsWith("week ") ? `What happened in ${day} in ${table}?` : `What happened on ${day} in ${table}?`,
  run: (check: string, column: string, table: string) => `Tell me about the ${check} run on ${column} in ${table}`,
};

const pct = (s: string) => Number.parseFloat(s.replace(/[^\d.]/g, "")) || 0;
const rateOf = (s: string) => {
  const m = s.match(/\((\d+(?:\.\d+)?)%\)/);
  return m ? Number(m[1]) : pct(s);
};
const nextStep = (s: string) => ` Next: ${s}`;

function seedOf(s: string) {
  let h = 7;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}
function series(base: number, key: string, n = 14) {
  const h = seedOf(key);
  return Array.from({ length: n }, (_, i) =>
    Math.max(0, Math.min(100, Math.round(base - ((h >> i % 16) % 7) + 3 + (i - n) * 0.2))),
  );
}

/** Answers a panel auto prompt, or returns null when the prompt is something else. */
export function panelReply(q: string): ChatReply | null {
  let m = q.match(/^Tell me about the (.+) card for (.+)$/);
  if (m) {
    const [, label, table] = m;
    const card = OVERVIEW_CARDS.find((c) => c.label === label);
    if (!card) return null;
    const worst = [...COLUMNS_ROWS].sort((a, b) => pct(a.fill) - pct(b.fill)).slice(0, 5);
    if (card.id === "fill") {
      return {
        text: `${table} is ${card.value} filled overall (${card.detail}). The gaps are concentrated in a few columns, shown lowest first.${nextStep("open the lowest column to see which rows are empty.")}`,
        visual: {
          kind: "bars",
          title: "Fill rate, lowest columns",
          max: 100,
          rows: worst.map((c) => ({ label: c.name, value: pct(c.fill), display: c.fill, ask: panelPrompt.column(c.name, table) })),
        },
      };
    }
    if (card.id === "checks") {
      const groups = CHECK_GROUPS.slice(0, 6);
      return {
        text: `${card.value} checks passed on ${table} in the latest run (${card.detail.toLowerCase()}).${nextStep("open the lowest check to see which columns failed.")}`,
        visual: {
          kind: "bars",
          title: "Pass rate by check",
          max: 100,
          rows: groups.map((g) => ({ label: g.name, value: rateOf(g.passRate), display: `${rateOf(g.passRate)}%`, ask: panelPrompt.check(g.name, table) })),
        },
      };
    }
    if (card.id === "rows") {
      return {
        text: `${table} has ${card.value} rows in the latest profile, ${card.detail}. A jump like this usually means a late or duplicated load.${nextStep("check the Activity log for the load that day.")}`,
        visual: card.values
          ? { kind: "trend", title: "Row count, recent runs", values: card.values, startLabel: "Earlier", endLabel: "Latest" }
          : undefined,
      };
    }
    return {
      text: `${table} has ${card.value} columns (${card.detail}). New columns are not yet covered by checks.${nextStep("ask me to suggest checks for the new columns.")}`,
      visual: {
        kind: "bars",
        title: "Columns by type",
        rows: Object.entries(
          COLUMNS_ROWS.reduce<Record<string, number>>((acc, c) => ({ ...acc, [c.type]: (acc[c.type] ?? 0) + 1 }), {}),
        ).map(([t, n]) => ({ label: t, value: n, display: String(n) })),
      },
    };
  }

  m = q.match(/^Tell me about the (.+) column in (.+)$/);
  if (m) {
    const [, column, table] = m;
    const c = COLUMNS_ROWS.find((x) => x.name === column);
    const related = CHECK_GROUPS.filter((g) => g.columns.some((x) => x.column.toLowerCase().includes(column.toLowerCase())));
    if (!c) {
      return {
        text: `${column} in ${table} is a sampled field. It has no profile yet, so I can only show the sampled values on the right.${nextStep("ask me to profile it on the next run.")}`,
      };
    }
    return {
      text: `${column} is a ${c.type} column in ${table}: ${c.fill} filled, ${c.nulls} nulls, ${c.distinct} distinct values (${c.unique} unique). ${c.bad ? `It needs attention: ${c.status}.` : "Nothing looks wrong."} ${related.length ? `Covered by ${related.map((g) => g.name).join(", ")}.` : "No checks cover it yet."}${nextStep(c.bad ? "ask why it fails." : "ask me to suggest a check for it.")}`,
      visual: {
        kind: "bars",
        title: `${column} profile`,
        max: 100,
        rows: [
          { label: "Completeness", value: pct(c.fill), display: c.fill },
          { label: "Uniqueness", value: pct(c.unique), display: c.unique },
        ],
      },
    };
  }

  m = q.match(/^Let's discuss the (.+) check(?: on (.+))?$/);
  if (m) {
    const [, name, table] = m;
    const g = CHECK_GROUPS.find((x) => x.name === name);
    if (!g) return null;
    const rate = rateOf(g.passRate);
    return {
      text: `${g.name} is a ${g.dimension.toLowerCase()} check${table ? ` on ${table}` : ""}, applied to ${g.columns.length} column${g.columns.length === 1 ? "" : "s"}. It last ran ${g.lastRun} and ${g.status.toLowerCase()} at ${g.passRate}.${nextStep(g.status === "Passed" ? "nothing to do; ask to tighten the threshold if needed." : "open the failing column to see sample rows.")}`,
      visual: {
        kind: "trend",
        title: "Pass rate, last 14 runs",
        values: series(rate, g.id),
        startLabel: "14 runs ago",
        endLabel: "Latest",
      },
    };
  }

  m = q.match(/^What happened (?:on|in) (.+) in (.+)\?$/);
  if (m) {
    const [, day, table] = m;
    const runs = ACTIVITY_ROWS.filter((r) => r.day === day);
    const pick = runs.length ? runs : ACTIVITY_ROWS.slice(seedOf(day) % 40, (seedOf(day) % 40) + 6);
    const failed = pick.filter((r) => r.status !== "Passed");
    const counts = ["Passed", "Warning", "Failed"].map((s) => ({ s, n: pick.filter((r) => r.status === s).length }));
    return {
      text: `${pick.length} checks ran on ${table} ${day.startsWith("week") ? `in ${day}` : day}. ${failed.length ? `${failed.length} did not pass: ${failed.map((r) => `${r.check} on ${r.column}`).join("; ")}.` : "All of them passed."}${nextStep(failed.length ? "open a failed run to see why." : "nothing to follow up.")}`,
      visual: {
        kind: "bars",
        title: "Results that day",
        rows: counts.map(({ s, n }) => ({ label: s, value: n, display: String(n) })),
      },
    };
  }

  m = q.match(/^Tell me about the (.+) run on (.+) in (.+)$/);
  if (m) {
    const [, check, column, table] = m;
    const run = ACTIVITY_ROWS.find((r) => r.check === check && r.column === column);
    return {
      text: `${check} ran on ${column} in ${table}${run ? ` ${run.day.toLowerCase()} at ${run.ranOn}` : ""} and ${run?.status.toLowerCase() ?? "finished"}. ${run && run.status !== "Passed" ? "The failing rows share the same load batch, so this is likely an upstream issue." : "No rows broke the rule."}${nextStep(`ask about the ${column} column.`)}`,
      visual: {
        kind: "trend",
        title: `${check}, recent runs`,
        values: series(run?.status === "Passed" ? 97 : 82, check + column),
        startLabel: "Earlier",
        endLabel: "Latest",
      },
    };
  }
  return null;
}
