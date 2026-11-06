import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { useChatThreads } from "@/components/chat/chat-context";

const VIEW_PREFIX = "rule-view-";

/** One thread per rule, so opening the same rule again returns to the same conversation. */
export const ruleThreadId = (ruleId: string) => `${VIEW_PREFIX}${ruleId}`;

export function ruleIdFromThread(threadId: string): string | undefined {
  return threadId.startsWith(VIEW_PREFIX) ? threadId.slice(VIEW_PREFIX.length) : undefined;
}

/** Opens a rule as a chat thread, reusing its thread when one already exists. */
export function useOpenRule() {
  const navigate = useNavigate();
  const { getThread, createThread } = useChatThreads();
  return React.useCallback(
    (rule: { id: string; name: string }) => {
      const id = ruleThreadId(rule.id);
      if (!getThread(id)) createThread({ id, title: rule.name, kind: "rule" });
      void navigate({ to: "/rule/$threadId", params: { threadId: id } });
    },
    [getThread, createThread, navigate],
  );
}
