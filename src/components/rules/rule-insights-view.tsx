import { Link } from "@tanstack/react-router";
import { SectionTitle, Sparkline, StatTile } from "@/components/workspace/primitives";
import type { Rule } from "@/lib/mock-ops";
import { describeTest, testRule } from "./rule-test";
import type { RuleInsights } from "./rule-insights";

const card = { borderColor: "var(--hairline)" } as const;

/** What the rule covers, how often it passes, and where it fails most. */
export function RuleInsightsView({
  rule,
  insights,
  onAsk,
}: {
  rule: Rule;
  insights: RuleInsights;
  onAsk: (question: string) => void;
}) {
  if (!insights.applied) {
    return (
      <div className="space-y-5">
        <div className="rounded-xl border bg-white p-4" style={card}>
          <div className="text-[14px] font-semibold" style={{ color: "var(--ink-900)" }}>
            Not applied anywhere yet
          </div>
          <p className="mt-1 text-[13.5px]" style={{ color: "var(--ink-500)" }}>
            A rule is checked when a schedule applies it to a table. Add this rule to a schedule and
            its pass rate, coverage, and top failures show up here.
          </p>
        </div>
        <div>
          <SectionTitle>Tested on sample data</SectionTitle>
          <div
            className="rounded-xl border bg-white p-3.5 text-[13.5px]"
            style={{ ...card, color: "var(--ink-700)" }}
          >
            {describeTest(testRule(rule), rule.threshold)}
          </div>
        </div>
      </div>
    );
  }

  const delta = +(insights.passRate - insights.lastWeekRate).toFixed(1);
  const max = Math.max(...insights.failing.map((f) => f.failedRows), 1);
  const schedules = [...new Map(insights.coverage.map((c) => [c.scheduleId, c] as const)).values()];

  return (
    <div className="space-y-6">
      {rule.status === "Disabled" && (
        <p
          className="rounded-lg px-3 py-2 text-[13px]"
          style={{ background: "var(--surface-soft)", color: "var(--ink-700)" }}
        >
          This rule is disabled. The numbers below are from before it was turned off.
        </p>
      )}

      <div className="grid grid-cols-3 gap-3">
        <StatTile
          label="Pass rate"
          value={`${insights.passRate}%`}
          note={
            delta === 0
              ? "Same as last week"
              : `${delta > 0 ? "Up" : "Down"} ${Math.abs(delta)} pts vs last week`
          }
        />
        <StatTile
          label="Checks run"
          value={String(insights.runs)}
          note={`${insights.passes} passed, last 30 days`}
        />
        <StatTile
          label="Tables covered"
          value={String(insights.tableCount)}
          note={`${insights.columnCount} columns, ${insights.scheduleCount} ${
            insights.scheduleCount === 1 ? "schedule" : "schedules"
          }`}
        />
      </div>

      <div>
        <SectionTitle>Pass rate, last 14 days</SectionTitle>
        <div className="rounded-xl border bg-white p-3.5" style={card}>
          <Sparkline values={insights.trend} label="Pass rate" />
        </div>
      </div>

      <div>
        <SectionTitle>Where it fails most</SectionTitle>
        <ul className="space-y-1.5 rounded-xl border bg-white p-2" style={card}>
          {insights.failing.map((f) => (
            <li key={f.label}>
              <button
                type="button"
                onClick={() => onAsk(`Why does ${f.label} fail?`)}
                className="block w-full rounded-lg px-2 py-1.5 text-left hover:bg-[color:var(--surface-soft)]"
                aria-label={`${f.label}: ${f.failedRows.toLocaleString()} failing rows. Ask why.`}
              >
                <span className="flex items-baseline justify-between gap-3 text-[13px]">
                  <span className="font-medium" style={{ color: "var(--ink-900)" }}>
                    {f.label}
                  </span>
                  <span className="tabular-nums" style={{ color: "var(--ink-500)" }}>
                    {f.failedRows.toLocaleString()} rows
                  </span>
                </span>
                <span
                  className="mt-1 block h-2 rounded-full"
                  style={{ background: "var(--surface-soft)" }}
                >
                  <span
                    className="block h-2 rounded-full"
                    style={{
                      width: `${Math.max(4, (f.failedRows / max) * 100)}%`,
                      background: "var(--brand-blue)",
                    }}
                  />
                </span>
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-1.5 text-[12px]" style={{ color: "var(--ink-300)" }}>
          Last 30 days. Select a row to ask why it fails.
        </p>
      </div>

      <div>
        <SectionTitle>Where it's applied</SectionTitle>
        <ul className="space-y-2.5">
          {schedules.map((s) => {
            const rows = insights.coverage.filter((c) => c.scheduleId === s.scheduleId);
            return (
              <li key={s.scheduleId} className="rounded-xl border bg-white p-3.5" style={card}>
                <Link
                  to="/scheduled"
                  search={{ schedule: s.scheduleId }}
                  className="text-[13.5px] font-medium underline"
                  style={{ color: "var(--brand-blue)" }}
                >
                  {s.scheduleName}
                </Link>
                <div className="text-[12px]" style={{ color: "var(--ink-500)" }}>
                  {s.domain}
                </div>
                <ul className="mt-2 space-y-0.5 text-[13px]" style={{ color: "var(--ink-700)" }}>
                  {rows.map((r) => (
                    <li key={r.table}>
                      <span className="font-medium">{r.table}</span>
                      <span style={{ color: "var(--ink-500)" }}>: {r.columns.join(", ")}</span>
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
