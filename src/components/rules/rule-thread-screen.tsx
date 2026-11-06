import { useLocalStore } from "@/lib/use-local-store";
import { useRules } from "@/lib/ops-store";
import { ruleIdFromThread } from "./open-rule";
import { buildInsights, openingTurns } from "./rule-insights";
import {
  RULE_THREADS_INIT,
  RULE_THREADS_KEY,
  RuleWorkspace,
  type RuleThreadState,
} from "./rule-workspace";

/**
 * A rule chat thread: either "New rule" (starts empty) or an existing rule
 * opened from the table (starts with the agent's summary of how it is doing).
 * Waits for saved state so a reopened thread comes back as it was.
 */
export function RuleThreadScreen({ threadId }: { threadId: string }) {
  const [threads, , ready] = useLocalStore(RULE_THREADS_KEY, RULE_THREADS_INIT);
  const { rules, usedBy, ready: rulesReady } = useRules();
  if (!ready) return <div className="flex-1" />;

  const stored = threads[threadId];
  const viewing = ruleIdFromThread(threadId);
  if (!viewing) return <RuleWorkspace key={threadId} threadId={threadId} initial={stored} />;

  if (!rulesReady) return <div className="flex-1" />;
  const ruleId = stored?.savedId ?? viewing;
  const rule = rules.find((r) => r.id === ruleId);
  const initial: RuleThreadState | undefined =
    stored ??
    (rule
      ? {
          turns: openingTurns(rule, buildInsights(rule, usedBy(rule.id))),
          draft: null,
          savedId: rule.id,
        }
      : undefined);
  return <RuleWorkspace key={threadId} threadId={threadId} ruleId={ruleId} initial={initial} />;
}
