import { ArrowLeft } from "lucide-react";
import { RunPill, SectionTitle, Sparkline, StatTile } from "@/components/workspace/primitives";
import type { Rule, Run, Schedule } from "@/lib/mock-ops";
import { ago, durationLabel } from "./format";
import type { ScheduleInsights } from "./schedule-insights";

const card = { borderColor: "var(--hairline)" } as const;

function runSummary(r: Run): string {
  if (r.status === "running") return "In progress";
  if (r.checksRun === 0) return "Profiled, no checks";
  return `${r.checksFailed} of ${r.checksRun} checks failed`;
}

/** How the schedule is doing: recent health, where it fails, and what it checks. */
export function ScheduleInsightsView({
  schedule,
  insights,
  rules,
  onAsk,
  onOpenRule,
  onOpenRun,
}: {
  schedule: Schedule;
  insights: ScheduleInsights;
  rules: Rule[];
  onAsk: (question: string) => void;
  onOpenRule: (rule: Rule) => void;
  onOpenRun: (runId: string) => void;
}) {
  const { lastRun, history } = insights;
  const max = Math.max(...insights.failing.map((f) => f.failingRows), 1);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <StatTile
          label="Runs passed"
          value={`${insights.successRate}%`}
          note={`${history.length} ${history.length === 1 ? "run" : "runs"} so far`}
        />
        <StatTile
          label="Last run"
          value={lastRun ? ago(lastRun.hoursAgo) : "Never"}
          note={lastRun ? runSummary(lastRun) : "Not run yet"}
          onClick={lastRun ? () => onOpenRun(lastRun.id) : undefined}
        />
        <StatTile
          label="Next run"
          value={schedule.active ? schedule.nextRun : "Paused"}
          note={schedule.repeats}
        />
      </div>

      {insights.trend.length > 1 && (
        <div>
          <SectionTitle>Checks passing, recent runs</SectionTitle>
          <div className="rounded-xl border bg-white p-3.5" style={card}>
            <Sparkline values={insights.trend} label="Checks passing" />
          </div>
        </div>
      )}

      <div>
        <SectionTitle>Where it fails most</SectionTitle>
        {insights.failing.length === 0 ? (
          <p className="text-[13.5px]" style={{ color: "var(--ink-500)" }}>
            Nothing has failed in the runs so far.
          </p>
        ) : (
          <>
            <ul className="space-y-1.5 rounded-xl border bg-white p-2" style={card}>
              {insights.failing.map((f) => (
                <li key={f.label}>
                  <button
                    type="button"
                    onClick={() => onAsk(`Why does ${f.label} fail?`)}
                    className="block w-full rounded-lg px-2 py-1.5 text-left hover:bg-[color:var(--surface-soft)]"
                    aria-label={`${f.label}: ${f.failingRows.toLocaleString()} failing rows. Ask why.`}
                  >
                    <span className="flex items-baseline justify-between gap-3 text-[13px]">
                      <span className="font-medium" style={{ color: "var(--ink-900)" }}>
                        {f.label}
                      </span>
                      <span className="tabular-nums" style={{ color: "var(--ink-500)" }}>
                        {f.failingRows.toLocaleString()} rows
                      </span>
                    </span>
                    <span
                      className="mt-1 block h-2 rounded-full"
                      style={{ background: "var(--surface-soft)" }}
                    >
                      <span
                        className="block h-2 rounded-full"
                        style={{
                          width: `${Math.max(4, (f.failingRows / max) * 100)}%`,
                          background: "var(--brand-blue)",
                        }}
                      />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-1.5 text-[12px]" style={{ color: "var(--ink-300)" }}>
              Across all runs. Select a row to ask why it fails.
            </p>
          </>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <SectionTitle>Tables</SectionTitle>
          <ul className="space-y-1 text-[13.5px]" style={{ color: "var(--ink-700)" }}>
            {schedule.tables.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
        <div>
          <SectionTitle>Rules</SectionTitle>
          {rules.length === 0 ? (
            <p className="text-[13.5px]" style={{ color: "var(--ink-500)" }}>
              No rules, so this task only profiles.
            </p>
          ) : (
            <ul className="space-y-1 text-[13.5px]">
              {rules.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => onOpenRule(r)}
                    className="text-left underline"
                    style={{ color: "var(--brand-blue)" }}
                  >
                    {r.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

/** Every run of this schedule, newest first. */
export function RunsList({ runs, onOpen }: { runs: Run[]; onOpen: (runId: string) => void }) {
  if (runs.length === 0) {
    return (
      <p className="text-[13.5px]" style={{ color: "var(--ink-500)" }}>
        This task hasn't run yet.
      </p>
    );
  }
  return (
    <ul
      className="divide-y overflow-hidden rounded-xl border bg-white"
      style={{ borderColor: "var(--hairline)" }}
    >
      {runs.map((r) => (
        <li key={r.id} style={{ borderColor: "var(--hairline)" }}>
          <button
            type="button"
            onClick={() => onOpen(r.id)}
            className="flex w-full items-center gap-4 px-3 py-3 text-left hover:bg-[color:var(--surface-soft)]"
          >
            <span className="w-[110px] shrink-0">
              <RunPill status={r.status} />
            </span>
            <span className="min-w-0 flex-1 text-[13px]" style={{ color: "var(--ink-700)" }}>
              {runSummary(r)}
            </span>
            <span className="text-[12.5px]" style={{ color: "var(--ink-300)" }}>
              {ago(r.hoursAgo)}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/** One run's results, inside the panel. */
export function RunDetail({
  run,
  ruleName,
  onBack,
  onAsk,
}: {
  run: Run;
  ruleName: (id: string) => string;
  onBack: () => void;
  onAsk: (question: string) => void;
}) {
  const passed = Math.max(0, run.checksRun - run.checksFailed);
  return (
    <div className="space-y-5">
      <div>
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-[13px]"
          style={{ color: "var(--ink-500)" }}
        >
          <ArrowLeft size={14} aria-hidden="true" /> All runs
        </button>
        <div
          className="mt-2 flex flex-wrap items-center gap-3 text-[12.5px]"
          style={{ color: "var(--ink-500)" }}
        >
          <RunPill status={run.status} />
          <span>{ago(run.hoursAgo)}</span>
          <span>Took {durationLabel(run.durationSec)}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatTile label="Checks run" value={String(run.checksRun)} />
        <StatTile label="Passed" value={String(passed)} />
        <StatTile label="Failed" value={String(run.checksFailed)} />
      </div>

      <div>
        <SectionTitle>Needs attention</SectionTitle>
        {run.findings.length === 0 ? (
          <p className="text-[13.5px]" style={{ color: "var(--ink-500)" }}>
            Nothing failed in this run.
          </p>
        ) : (
          <ul className="space-y-2.5">
            {run.findings.map((f) => (
              <li key={f.title + f.table} className="rounded-xl border bg-white p-3.5" style={card}>
                <div className="text-[13.5px] font-semibold" style={{ color: "var(--ink-900)" }}>
                  {f.title}
                </div>
                <div className="mt-0.5 text-[12px]" style={{ color: "var(--ink-500)" }}>
                  {f.table} · {ruleName(f.ruleId)}
                  {f.failingRows > 0 && ` · ${f.failingRows.toLocaleString()} rows`}
                </div>
                <p className="mt-2 text-[13px]" style={{ color: "var(--ink-700)" }}>
                  {f.detail}
                </p>
                <button
                  type="button"
                  onClick={() => onAsk(`What's going on with ${f.title.toLowerCase()}?`)}
                  className="mt-2 text-[12.5px] underline"
                  style={{ color: "var(--brand-blue)" }}
                >
                  Ask about this
                </button>
              </li>
            ))}
          </ul>
        )}
        {passed > 0 && (
          <p className="mt-3 text-[12.5px]" style={{ color: "var(--ink-500)" }}>
            {passed} other {passed === 1 ? "check" : "checks"} passed.
          </p>
        )}
      </div>
    </div>
  );
}
