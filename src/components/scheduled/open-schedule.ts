import * as React from "react";
import { useNavigate } from "@tanstack/react-router";

const PREFIX = "schedule-view-";

/** One thread per schedule, so opening it again returns to the same conversation. */
export const scheduleThreadId = (scheduleId: string) => `${PREFIX}${scheduleId}`;

export function scheduleIdFromThread(threadId: string): string | undefined {
  return threadId.startsWith(PREFIX) ? threadId.slice(PREFIX.length) : undefined;
}

/** Opens a schedule as a chat thread, optionally with one of its runs in focus. */
export function useOpenSchedule() {
  const navigate = useNavigate();
  return React.useCallback(
    (scheduleId: string, runId?: string) => {
      void navigate({
        to: "/schedule/$threadId",
        params: { threadId: scheduleThreadId(scheduleId) },
        search: runId ? { run: runId } : {},
      });
    },
    [navigate],
  );
}
