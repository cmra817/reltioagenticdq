import { useLocalStore } from "@/lib/use-local-store";
import { RULE_THREADS_INIT, RULE_THREADS_KEY, RuleWorkspace } from "./rule-workspace";

/** A "New rule" chat thread. Waits for saved state so a reopened thread comes back as it was. */
export function RuleThreadScreen({ threadId }: { threadId: string }) {
  const [threads, , ready] = useLocalStore(RULE_THREADS_KEY, RULE_THREADS_INIT);
  if (!ready) return <div className="flex-1" />;
  return <RuleWorkspace key={threadId} threadId={threadId} initial={threads[threadId]} />;
}
