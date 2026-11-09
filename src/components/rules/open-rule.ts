import * as React from "react";
import { useNavigate } from "@tanstack/react-router";

const VIEW_PREFIX = "rule-view-";

/** One thread per rule, so opening the same rule again returns to the same conversation. */
export const ruleThreadId = (ruleId: string) => `${VIEW_PREFIX}${ruleId}`;

export function ruleIdFromThread(threadId: string): string | undefined {
  return threadId.startsWith(VIEW_PREFIX) ? threadId.slice(VIEW_PREFIX.length) : undefined;
}

/**
 * Opens a rule as its page. The page comes first; the thread (and its place in
 * Recents) is made when the first question is asked.
 */
export function useOpenRule() {
  const navigate = useNavigate();
  return React.useCallback(
    (rule: { id: string; name: string }) => {
      void navigate({
        to: "/rule/$threadId",
        params: { threadId: ruleThreadId(rule.id) },
        search: {},
      });
    },
    [navigate],
  );
}
