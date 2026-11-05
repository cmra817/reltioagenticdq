import * as React from "react";
import { ArrowLeft } from "lucide-react";
import {
  GhostButton,
  RunPill,
  ScopedChat,
  SectionTitle,
  SplitWorkspace,
  StatTile,
} from "@/components/workspace/primitives";
import { narrativeFor } from "@/lib/mock-ops";
import { useRules, useRuns, useSchedules } from "@/lib/ops-store";
import { durationLabel, ago } from "./format";
import { useScheduledNav } from "./nav";

/**
 * One run. The agent's stored summary is the center; results sit in the right
 * panel. No chat appears until the person types, and the chat is scoped to
 * this run.
 */
export function RunView({ runId }: { runId: string }) {
  const go = useScheduledNav();
  const { schedules } = useSchedules();
  const { runs, markViewed } = useRuns(schedules);
  const { rules } = useRules();
  const [ask, setAsk] = React.useState<{ id: number; q: string } | null>(null);

  const run = runs.find((r) => r.id === runId);
  const schedule = schedules.find((s) => s.id === run?.scheduleId);

  React.useEffect(() => {
    if (run) markViewed(run.id);
    // markViewed is stable; only mark when the run changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run?.id]);

  if (!run) {
    return (
      <div className="p-8">
        <GhostButton onClick={() => go({ tab: "runs" })}>Back to runs</GhostButton>
        <p className="mt-4 text-[14px]" style={{ color: "var(--ink-500)" }}>
          This run isn't available.
        </p>
      </div>
    );
  }

  const ruleName = (id: string) => rules.find((r) => r.id === id)?.name ?? "Deleted rule";
  const passed = Math.max(0, run.checksRun - run.checksFailed);
  const top = run.findings[0];

  const suggestions =
    run.findings.length > 0
      ? ["What changed since the last run?", "What's affected downstream?", "How do I fix this?"]
      : ["Anything unusual, even though it passed?", "Compare with last week"];

  function reply(q: string): string {
    if (!top) {
      return "Nothing failed here. Row counts and value ranges matched the last seven runs, so I have nothing to flag.";
    }
    if (/downstream|affect|impact|report/i.test(q)) {
      return `${top.table} feeds the weekly revenue report and the customer 360 view. Both would show the issue until it's fixed. I can post a heads-up to the owners if you'd like.`;
    }
    if (/fix|resolve|how/i.test(q)) {
      return `Start with "${top.title}". ${top.detail} Quarantine the affected ${top.failingRows.toLocaleString()} rows, correct them at the source, and re-run this schedule to confirm.`;
    }
    if (/change|last run|since|compare/i.test(q)) {
      return `The previous run passed this check. The failure started in the window between the two runs, which is when the latest load to ${top.table} landed.`;
    }
    return `On this run, ${run!.checksFailed} of ${run!.checksRun} checks failed. The top finding is "${top.title}" on ${top.table}.`;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 px-6 pt-4">
        <button
          type="button"
          onClick={() => go({ tab: "runs" })}
          className="flex items-center gap-1.5 text-[13px]"
          style={{ color: "var(--ink-500)" }}
        >
          <ArrowLeft size={14} /> Runs
        </button>
      </div>
      <SplitWorkspace
        panelLabel="Run results"
        panelWidth={420}
        center={
          <ScopedChat
            key={run.id}
            scopeLabel="This run"
            placeholder="Ask about this run…"
            suggestions={suggestions}
            reply={reply}
            ask={ask}
            header={
              <section aria-label="Run summary">
                <h1 className="text-[20px] font-semibold" style={{ color: "var(--ink-900)" }}>
                  {schedule?.name ?? "Run"}
                </h1>
                <div
                  className="mt-2 flex flex-wrap items-center gap-3 text-[12.5px]"
                  style={{ color: "var(--ink-500)" }}
                >
                  <RunPill status={run.status} />
                  <span>{ago(run.hoursAgo)}</span>
                  <span>Took {durationLabel(run.durationSec)}</span>
                  {schedule && (
                    <button
                      type="button"
                      onClick={() => go({ schedule: schedule.id })}
                      className="underline"
                      style={{ color: "var(--brand-blue)" }}
                    >
                      Open schedule
                    </button>
                  )}
                </div>
                <div className="mt-4 space-y-3">
                  {narrativeFor(run, schedule).map((p) => (
                    <p
                      key={p}
                      className="text-[14px] leading-relaxed"
                      style={{ color: "var(--ink-700)" }}
                    >
                      {p}
                    </p>
                  ))}
                </div>
              </section>
            }
          />
        }
        panel={
          <div className="space-y-6 p-5">
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
                    <li
                      key={f.title + f.table}
                      className="rounded-xl border bg-white p-3.5"
                      style={{ borderColor: "var(--hairline)" }}
                    >
                      <div
                        className="text-[13.5px] font-semibold"
                        style={{ color: "var(--ink-900)" }}
                      >
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
                        onClick={() =>
                          setAsk({
                            id: Date.now(),
                            q: `What's going on with ${f.title.toLowerCase()}?`,
                          })
                        }
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
        }
      />
    </div>
  );
}
