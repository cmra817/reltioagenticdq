import { useRules, useRuns, useSchedules } from "@/lib/ops-store";
import { useLocalStore } from "@/lib/use-local-store";
import { scheduleIdFromThread } from "./open-schedule";
import { buildScheduleInsights, openingTurns, runOpeningTurns } from "./schedule-insights";
import {
  SCHEDULE_THREADS_INIT,
  SCHEDULE_THREADS_KEY,
  ScheduleWorkspace,
  type ScheduleThreadState,
} from "./schedule-workspace";

/**
 * A schedule chat thread. A new one starts with the agent's summary of how the
 * schedule is doing, or, when opened from a failed-run alert, with what happened
 * in that run. A reopened thread comes back as it was.
 */
export function ScheduleThreadScreen({ threadId, run }: { threadId: string; run?: string }) {
  const [threads, , threadsReady] = useLocalStore(SCHEDULE_THREADS_KEY, SCHEDULE_THREADS_INIT);
  const { schedules, ready } = useSchedules();
  const { runs } = useRuns(schedules);
  const { rules } = useRules();
  const scheduleId = scheduleIdFromThread(threadId);

  if (!threadsReady || !ready) return <div className="flex-1" />;
  const schedule = schedules.find((s) => s.id === scheduleId);
  if (!scheduleId || !schedule) {
    return (
      <div className="p-8">
        <p className="text-[14px]" style={{ color: "var(--ink-500)" }}>
          This schedule isn't available. Choose another from Scheduled.
        </p>
      </div>
    );
  }

  let initial: ScheduleThreadState | undefined = threads[threadId];
  if (!initial) {
    const history = runs.filter((r) => r.scheduleId === scheduleId);
    const focus = run ? history.find((r) => r.id === run) : undefined;
    const ins = buildScheduleInsights(
      history,
      (id) => rules.find((r) => r.id === id)?.name ?? "Deleted rule",
    );
    initial = { turns: focus ? runOpeningTurns(focus, schedule) : openingTurns(schedule, ins) };
  }
  return (
    <ScheduleWorkspace
      key={threadId}
      threadId={threadId}
      scheduleId={scheduleId}
      initialRun={run}
      initial={initial}
    />
  );
}
