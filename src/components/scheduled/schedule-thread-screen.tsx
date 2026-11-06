import { useSchedules } from "@/lib/ops-store";
import { useLocalStore } from "@/lib/use-local-store";
import { scheduleIdFromThread } from "./open-schedule";
import {
  SCHEDULE_THREADS_INIT,
  SCHEDULE_THREADS_KEY,
  ScheduleWorkspace,
} from "./schedule-workspace";

/**
 * A schedule opens with its page on the right and its conversation on the left
 * (empty until you ask; a saved conversation comes back as it was). `run` (from
 * a failed-run alert) brings that run into focus and asks about it.
 */
export function ScheduleThreadScreen({ threadId, run }: { threadId: string; run?: string }) {
  const [threads, , threadsReady] = useLocalStore(SCHEDULE_THREADS_KEY, SCHEDULE_THREADS_INIT);
  const { schedules, ready } = useSchedules();
  const scheduleId = scheduleIdFromThread(threadId);

  if (!threadsReady || !ready) return <div className="flex-1" />;
  if (!scheduleId || !schedules.some((s) => s.id === scheduleId)) {
    return (
      <div className="p-8">
        <p className="text-[14px]" style={{ color: "var(--ink-500)" }}>
          This schedule isn't available. Choose another from Scheduled.
        </p>
      </div>
    );
  }
  return (
    <ScheduleWorkspace
      key={threadId}
      threadId={threadId}
      scheduleId={scheduleId}
      initialRun={run}
      initial={threads[threadId]}
    />
  );
}
