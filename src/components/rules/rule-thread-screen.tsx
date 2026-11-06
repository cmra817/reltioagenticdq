import { useLocalStore } from "@/lib/use-local-store";
import { useRules } from "@/lib/ops-store";
import { ruleIdFromThread } from "./open-rule";
import { RULE_THREADS_INIT, RULE_THREADS_KEY, RuleWorkspace } from "./rule-workspace";

/**
 * A rule thread: either "New rule" (chat first, starts empty) or an existing
 * rule opened from the table (the rule's page first, nothing said until you
 * ask). Waits for saved state so a reopened thread comes back as it was;
 * `chat` (from Recents) opens it with the conversation showing.
 */
export function RuleThreadScreen({ threadId, chat }: { threadId: string; chat?: boolean }) {
  const [threads, , ready] = useLocalStore(RULE_THREADS_KEY, RULE_THREADS_INIT);
  const { rules, ready: rulesReady } = useRules();
  if (!ready) return <div className="flex-1" />;

  const stored = threads[threadId];
  const viewing = ruleIdFromThread(threadId);
  if (!viewing) return <RuleWorkspace key={threadId} threadId={threadId} initial={stored} />;

  if (!rulesReady) return <div className="flex-1" />;
  const ruleId = stored?.savedId ?? viewing;
  const rule = rules.find((r) => r.id === ruleId);
  return (
    <RuleWorkspace
      key={threadId}
      threadId={threadId}
      ruleId={rule ? ruleId : viewing}
      showChat={!!chat}
      initial={stored}
    />
  );
}
