import * as React from "react";
import { Play } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { GhostButton, PrimaryButton, RunPill, Tag } from "@/components/workspace/primitives";
import { PlanView } from "@/components/add-dataset-agentic/PlanView";
import { planToSchedule, scheduleToPlan } from "@/components/add-dataset-agentic/plan-state";
import { useRuns, useSchedules } from "@/lib/ops-store";
import { ago } from "./format";
import { useScheduledNav } from "./nav";

/**
 * One schedule: run history in the center (with a chat scoped to the schedule),
 * its definition on the right.
 */
export function ScheduleView({ scheduleId }: { scheduleId: string }) {
  const go = useScheduledNav();
  const { schedules, update } = useSchedules();
  const { runs, startRun } = useRuns(schedules);

  const schedule = schedules.find((s) => s.id === scheduleId);
  const plan = React.useMemo(() => (schedule ? scheduleToPlan(schedule) : null), [schedule]);
  if (!schedule) {
    return (
      <div className="p-8">
        <GhostButton onClick={() => go({ tab: "schedules" })}>Back to schedules</GhostButton>
        <p className="mt-4 text-[14px]" style={{ color: "var(--ink-500)" }}>
          This schedule isn't available.
        </p>
      </div>
    );
  }

  if (!plan) return null;
  const history = runs.filter((r) => r.scheduleId === schedule.id);
  const running = history.some((r) => r.status === "running");

  return (
    <div className="relative min-h-0 flex-1 overflow-y-auto bg-white">
      <div
        className="sticky top-0 z-10 flex h-12 items-center gap-2 border-b bg-white px-6 text-[13.5px]"
        style={{ borderColor: "var(--hairline)" }}
      >
        <button type="button" onClick={() => go({ tab: "schedules" })} style={{ color: "var(--ink-500)" }} className="hover:underline">
          Schedules
        </button>
        <span style={{ color: "var(--ink-300)" }}>/</span>
        <span className="truncate" style={{ color: "var(--ink-900)" }}>{schedule.name}</span>
      </div>

      <div className="mx-auto max-w-[1240px] px-8 pb-16 pt-8">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b pb-6" style={{ borderColor: "var(--hairline)" }}>
          <div className="min-w-0">
            <h1 className="text-[26px] font-semibold" style={{ color: "var(--ink-900)" }}>
              {schedule.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[13.5px]" style={{ color: "var(--ink-500)" }}>
              <Tag>{schedule.domain}</Tag>
              <Tag>{schedule.kind}</Tag>
              <span className="ml-1">Owner {schedule.owner} · {schedule.permissions} · Next run: {schedule.nextRun}</span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-4">
            <PrimaryButton onClick={() => startRun(schedule.id)} disabled={running} className="flex items-center gap-1.5">
              <Play size={13} /> {running ? "Running…" : "Run now"}
            </PrimaryButton>
            <label className="flex items-center gap-2 text-[13.5px]" style={{ color: "var(--ink-900)" }}>
              {schedule.active ? "Active" : "Paused"}
              <Switch
                checked={schedule.active}
                onCheckedChange={(on) => update(schedule.id, { active: on, nextRun: on ? "Next scheduled time" : "Paused" })}
                aria-label="Active"
              />
            </label>
          </div>
        </header>

        <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
          <section
            aria-label="Run history"
            className="overflow-hidden rounded-2xl border"
            style={{ borderColor: "var(--hairline)", background: "var(--surface-soft)" }}
          >
            <div
              className="flex min-h-[57px] items-center justify-between gap-3 border-b px-4 py-3"
              style={{ borderColor: "var(--hairline)", background: "rgba(255,255,255,0.6)" }}
            >
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--ink-500)" }}>
                Run history
              </h2>
            </div>
            <div className="p-3">
              {history.length === 0 ? (
                <p className="px-1 py-4 text-[13.5px]" style={{ color: "var(--ink-500)" }}>
                  This schedule hasn't run yet.
                </p>
              ) : (
                <ul
                  className="divide-y overflow-hidden rounded-xl border bg-white"
                  style={{ borderColor: "var(--hairline)", boxShadow: "var(--shadow-card)" }}
                >
                  {history.map((r) => (
                    <li key={r.id} style={{ borderColor: "var(--hairline)" }}>
                      <button
                        type="button"
                        onClick={() => go({ run: r.id })}
                        className="flex w-full items-center gap-4 px-3 py-3 text-left hover:bg-[color:var(--surface-soft)]"
                      >
                        <span className="w-[110px] shrink-0"><RunPill status={r.status} /></span>
                        <span className="min-w-0 flex-1 text-[13px]" style={{ color: "var(--ink-700)" }}>
                          {r.status === "running" ? "In progress" : r.checksRun === 0 ? "Profiled, no checks" : `${r.checksFailed} of ${r.checksRun} checks failed`}
                        </span>
                        <span className="text-[12.5px]" style={{ color: "var(--ink-300)" }}>{ago(r.hoursAgo)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section aria-label="Schedule definition">
            <PlanView
              bare
              plan={plan}
              stage={3}
              onChange={(next) => update(schedule.id, planToSchedule(next, schedule.kind))}
              reveal={null}
              ruleRequest={null}
              filter={null}
              onClearFilter={() => {}}
              onDialogChange={() => {}}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
