import * as React from "react";
import { useChatThreads } from "@/components/chat/chat-context";
import { useDomainState } from "@/components/domain-context";
import {
  FloatingPrompt,
  PanelToggle,
  ScopedChat,
  SplitWorkspace,
  useChatThread,
  type ChatThread,
  type ChatTurn,
} from "@/components/workspace/primitives";
import { ALL_DOMAINS } from "@/lib/mock-ops";
import { useLocalStore } from "@/lib/use-local-store";
import {
  CUSTOM_INIT,
  CUSTOM_KEY,
  DashboardPanel,
  customToDashboard,
  dashboardReply,
  type CustomDashboard,
} from "./data-health-page";
import {
  EMPTY_ANSWERS,
  SETUP_PROMPT,
  SETUP_QUESTIONS,
  assetsLabel,
  dashboardName,
  hasAssets,
  isYes,
  missing,
  parseAnswers,
  summary,
  type SetupAnswers,
} from "./dashboard-setup";

/** What a dashboard thread remembers, so it can be reopened from Recents. */
type DashboardThreadState = { turns: ChatTurn[]; answers: SetupAnswers; dashId?: string };
const THREADS_KEY = "agentflow.dashboard-threads.v1";
const THREADS_INIT: Record<string, DashboardThreadState> = {};

/** A "New dashboard" chat thread. Waits for saved state so a reopened thread comes back as it was. */
export function DashboardThreadScreen({ threadId }: { threadId: string }) {
  const [threads, , ready] = useLocalStore(THREADS_KEY, THREADS_INIT);
  if (!ready) return <div className="flex-1" />;
  return <DashboardThread key={threadId} threadId={threadId} initial={threads[threadId]} />;
}

/**
 * Building a dashboard is a chat thread of its own. The starter message is
 * already sent and the agent asks its questions; the right panel appears only
 * once the dashboard has been built, and then shows its stats.
 */
function DashboardThread({
  threadId,
  initial,
}: {
  threadId: string;
  initial?: DashboardThreadState;
}) {
  const { domains } = useDomainState();
  const { renameThread } = useChatThreads();
  const [custom, setCustom] = useLocalStore<CustomDashboard[]>(CUSTOM_KEY, CUSTOM_INIT);
  const [, setThreads] = useLocalStore(THREADS_KEY, THREADS_INIT);

  const [answers, setAnswers] = React.useState<SetupAnswers>(initial?.answers ?? EMPTY_ANSWERS);
  const answersRef = React.useRef(answers);
  answersRef.current = answers;
  const [dashId, setDashId] = React.useState<string | undefined>(initial?.dashId);
  const threadRef = React.useRef<ChatThread | null>(null);
  const [chatOpen, setChatOpen] = React.useState(true);

  const entry = dashId ? custom.find((c) => c.id === dashId) : undefined;
  const dash = entry ? customToDashboard(entry) : undefined;

  function reply(q: string): string {
    if (dash) return dashboardReply(dash, q);

    const current = answersRef.current;
    if (missing(current).length === 0 && isYes(q)) {
      const id = `dash-${Date.now()}`;
      const name = dashboardName(current);
      const done = `Done. I built ${name}. Its stats are on the right, and it's in the dashboard list on Data health. Ask me to add or remove cards any time.`;
      const prior = threadRef.current?.turns ?? [];
      const turns: ChatTurn[] = [
        ...prior,
        { id: prior.length, role: "user", text: q },
        { id: prior.length + 1, role: "agent", text: done },
      ];
      setCustom((prev) => [
        ...prev,
        { id, name, scope: current.domain ?? ALL_DOMAINS, answers: current, turns },
      ]);
      setDashId(id);
      renameThread(threadId, name);
      return done;
    }

    const next = parseAnswers(q, current, domains);
    answersRef.current = next;
    setAnswers(next);
    const gaps = missing(next);
    if (gaps.length === 0) return summary(next);
    const got = [
      hasAssets(next) ? `watching ${assetsLabel(next)}` : null,
      next.goal ? `goal: ${next.goal.toLowerCase()}` : null,
      next.audience ? next.audience.toLowerCase() : null,
      next.refresh ? `refresh ${next.refresh.toLowerCase()}` : null,
    ].filter(Boolean);
    const lead = got.length ? `Got it — ${got.join(", ")}. ` : "I didn't catch that. ";
    return `${lead}Still need:\n\n${gaps.map((g, i) => `${i + 1}. ${g}`).join("\n")}`;
  }

  const thread = useChatThread(
    reply,
    initial?.turns ?? [
      { id: 0, role: "user", text: SETUP_PROMPT },
      { id: 1, role: "agent", text: SETUP_QUESTIONS },
    ],
  );
  threadRef.current = thread;

  // Keep the thread so it can be reopened from Recents.
  React.useEffect(() => {
    setThreads((prev) => ({ ...prev, [threadId]: { turns: thread.turns, answers, dashId } }));
  }, [threadId, thread.turns, answers, dashId, setThreads]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <SplitWorkspace
        panelLabel={dash ? `${dash.name} stats` : "Dashboard"}
        panelWidth="59vw"
        collapsed={!!dash && !chatOpen}
        onToggle={dash ? () => setChatOpen(!chatOpen) : undefined}
        floating={
          <FloatingPrompt
            thread={thread}
            placeholder="Ask about this dashboard, or change it…"
            onOpen={() => setChatOpen(true)}
          />
        }
        center={
          <ScopedChat
            thread={thread}
            scopeLabel={dash ? dash.name : "New dashboard"}
            placeholder={dash ? "Ask about this dashboard, or change it…" : "Reply"}
            suggestions={dash ? ["What changed since yesterday?", "Add a card for freshness"] : []}
            reply={reply}
          />
        }
        panel={
          dash ? (
            <DashboardPanel
              dash={dash}
              leading={
                chatOpen ? null : (
                  <PanelToggle label="Show chat" onClick={() => setChatOpen(true)} />
                )
              }
            />
          ) : undefined
        }
      />
    </div>
  );
}
