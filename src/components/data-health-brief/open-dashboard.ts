import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { useChatThreads } from "@/components/chat/chat-context";
import { todayLabel } from "@/lib/ops-store";
import { dashboardViewId } from "./dashboard-topics";

/**
 * Opens a dashboard's chat for today, reusing it when it already exists, and
 * sends `ask` for the person once it is open.
 */
export function useOpenDashboard() {
  const navigate = useNavigate();
  const { getThread, createThread } = useChatThreads();
  return React.useCallback(
    (dash: { id: string; name: string }, ask?: string) => {
      const id = dashboardViewId(dash.id);
      if (!getThread(id)) {
        createThread({ id, title: `${dash.name} · ${todayLabel()}`, kind: "dashboard" });
      }
      void navigate({ to: "/dashboard/$threadId", params: { threadId: id }, search: { ask } });
    },
    [getThread, createThread, navigate],
  );
}
