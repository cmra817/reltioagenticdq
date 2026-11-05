import * as React from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Pencil, Play } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useDomainState } from "@/components/domain-context";
import {
  GhostButton,
  PrimaryButton,
  RunPill,
  ScopedChat,
  SectionTitle,
  SplitWorkspace,
  Tag,
} from "@/components/workspace/primitives";
import { REPEAT_PRESETS, tablesFor, type Schedule } from "@/lib/mock-ops";
import { useRules, useRuns, useSchedules } from "@/lib/ops-store";
import { ago } from "./format";
import { useScheduledNav } from "./nav";

const PERMISSIONS = ["Only you", "Everyone can view", "Domain team can view and run"];

/**
 * One schedule: run history in the center (with a chat scoped to the schedule),
 * its definition on the right.
 */
export function ScheduleView({ scheduleId }: { scheduleId: string }) {
  const go = useScheduledNav();
  const { schedules, update } = useSchedules();
  const { runs, startRun } = useRuns(schedules);
  const { rules } = useRules();

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
  const ruleName = (id: string) => rules.find((r) => r.id === id)?.name ?? "Deleted rule";

  function reply(q: string): string {
    if (/fail|why|wrong/i.test(q)) {
      const bad = history.find((r) => r.status === "failed" || r.status === "attention");
      return bad
        ? `The latest problem was ${ago(bad.hoursAgo)}: ${bad.checksFailed} of ${bad.checksRun} checks failed. Open that run to see the findings and ask about any of them.`
        : "This schedule hasn't failed recently.";
    }
    if (/cadence|often|time|when/i.test(q)) {
      return `It repeats ${schedule!.repeats.toLowerCase()}. Change it under When will it run, or tell me what you want and I'll draft the change.`;
    }
    return `${schedule!.name} has run ${history.length} times in the history I keep. ${history.filter((r) => r.status === "passed").length} passed.`;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 px-6 pt-4">
        <button
          type="button"
          onClick={() => go({ tab: "schedules" })}
          className="flex items-center gap-1.5 text-[13px]"
          style={{ color: "var(--ink-500)" }}
        >
          <ArrowLeft size={14} /> Schedules
        </button>
      </div>

      <SplitWorkspace
        panelLabel="Schedule definition"
        panelWidth="50vw"
        center={
          <ScopedChat
            key={schedule.id}
            scopeLabel="This schedule"
            placeholder="Ask about this schedule…"
            suggestions={["Why did the last run fail?", "How often does this run?"]}
            reply={reply}
            header={
              <section aria-label="Run history">
                <h1 className="text-[20px] font-semibold" style={{ color: "var(--ink-900)" }}>
                  {schedule.name}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <Tag>{schedule.domain}</Tag>
                  <Tag>{schedule.kind}</Tag>
                  {!schedule.active && <Tag>Paused</Tag>}
                </div>
                <h2
                  className="mb-2 mt-6 text-[13px] font-semibold"
                  style={{ color: "var(--ink-900)" }}
                >
                  Run history
                </h2>
                {history.length === 0 ? (
                  <p className="text-[13.5px]" style={{ color: "var(--ink-500)" }}>
                    This schedule hasn't run yet.
                  </p>
                ) : (
                  <ul
                    className="divide-y rounded-xl border bg-white"
                    style={{ borderColor: "var(--hairline)" }}
                  >
                    {history.map((r) => (
                      <li key={r.id}>
                        <button
                          type="button"
                          onClick={() => go({ run: r.id })}
                          className="flex w-full items-center gap-4 px-4 py-2.5 text-left hover:bg-[color:var(--surface-soft)]"
                        >
                          <span className="w-[120px] shrink-0">
                            <RunPill status={r.status} />
                          </span>
                          <span
                            className="min-w-0 flex-1 text-[13px]"
                            style={{ color: "var(--ink-700)" }}
                          >
                            {r.status === "running"
                              ? "In progress"
                              : r.checksRun === 0
                                ? "Profiled, no checks"
                                : `${r.checksFailed} of ${r.checksRun} checks failed`}
                          </span>
                          <span className="text-[12.5px]" style={{ color: "var(--ink-300)" }}>
                            {ago(r.hoursAgo)}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            }
          />
        }
        panel={
          <div className="relative flex h-full min-h-0 flex-col bg-white">
            <PlanView
              plan={plan}
              stage={3}
              onChange={(next) => update(schedule.id, planToSchedule(next, schedule.kind))}
              reveal={null}
              ruleRequest={null}
              filter={null}
              onClearFilter={() => {}}
              onDialogChange={() => {}}
              title={schedule.name}
              subtitle={`Owner ${schedule.owner} · ${schedule.permissions}. Edit any part directly; changes apply from the next run.`}
              headerActions={
                <div className="flex shrink-0 items-center gap-3">
                  <label className="flex items-center gap-2 text-[13.5px]" style={{ color: "var(--ink-900)" }}>
                    <Switch
                      checked={schedule.active}
                      onCheckedChange={(on) =>
                        update(schedule.id, { active: on, nextRun: on ? "Next scheduled time" : "Paused" })
                      }
                      aria-label="Active"
                    />
                    {schedule.active ? "Active" : "Paused"}
                  </label>
                  <PrimaryButton
                    onClick={() => startRun(schedule.id)}
                    disabled={running}
                    className="flex items-center gap-1.5"
                  >
                    <Play size={13} /> {running ? "Running…" : "Run now"}
                  </PrimaryButton>
                </div>
              }
            />
          </div>
        }
      />
    </div>
  );
}

