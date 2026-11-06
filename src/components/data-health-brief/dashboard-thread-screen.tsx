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
import { ALL_DOMAINS, MY_BRIEF, SHARED_DASHBOARDS, type DashboardDef } from "@/lib/mock-ops";
import { todayLabel } from "@/lib/ops-store";
import { useLocalStore } from "@/lib/use-local-store";
import {
  CUSTOM_INIT,
  CUSTOM_KEY,
  DashboardBody,
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
import type { ChatReply } from "@/components/workspace/chat-visuals";
import { discussPrompt, parseViewId, topicFrom } from "./dashboard-topics";

/** What a dashboard thread remembers, so it can be reopened from Recents. */
type DashboardThreadState = { turns: ChatTurn[]; answers: SetupAnswers; dashId?: string };
const THREADS_KEY = "agentflow.dashboard-threads.v1";
const THREADS_INIT: Record<string, DashboardThreadState> = {};

/**
 * A dashboard chat thread: either "New dashboard" (the build conversation) or
 * a dashboard's conversation for one day. Waits for saved state so a reopened
 * thread comes back as it was.
 */
export function DashboardThreadScreen({ threadId }: { threadId: string }) {
  const [threads, , ready] = useLocalStore(THREADS_KEY, THREADS_INIT);
  const [custom, , customReady] = useLocalStore<CustomDashboard[]>(CUSTOM_KEY, CUSTOM_INIT);
  if (!ready || !customReady) return <div className="flex-1" />;

  const view = parseViewId(threadId);
  if (!view)
    return <DashboardThread key={threadId} threadId={threadId} initial={threads[threadId]} />;

  const dash: DashboardDef | undefined = [
    MY_BRIEF,
    ...SHARED_DASHBOARDS,
    ...custom.map(customToDashboard),
  ].find((d) => d.id === view.dashId);
  if (!dash) return <div className="flex-1" />;
  return (
    <DashboardViewThread
      key={threadId}
      threadId={threadId}
      dash={dash}
      initial={threads[threadId]}
    />
  );
}

/** The day's first message: that day's brief, each line selectable. */
function briefTurn(dash: DashboardDef): ChatTurn {
  return {
    id: 0,
    role: "agent",
    text: `Good morning. Here's today's brief for ${dash.name}.`,
    visual: {
      kind: "brief",
      title: "Today's brief",
      stamp: "Generated today, 6:00am",
      lines: dash.briefing.map((text) => ({ text, ask: discussPrompt(text) })),
    },
  };
}

/**
 * One conversation per dashboard per day, always beside the dashboard. It opens
 * with that day's brief; selecting a brief line, card or chart asks about it
 * here, and whatever was selected is highlighted on the dashboard. The thread
 * joins Recents with the first question.
 */
function DashboardViewThread({
  threadId,
  dash,
  initial,
}: {
  threadId: string;
  dash: DashboardDef;
  initial?: DashboardThreadState;
}) {
  const { getThread, createThread } = useChatThreads();
  const [, setThreads] = useLocalStore(THREADS_KEY, THREADS_INIT);
  const [chatOpen, setChatOpen] = React.useState(true);
  const saved = initial?.turns ?? [];
  const startTurns =
    saved[0]?.visual?.kind === "brief"
      ? saved
      : [briefTurn(dash), ...saved.map((t, i) => ({ ...t, id: i + 1 }))];
  const thread = useChatThread((q) => dashboardReply(dash, q), startTurns);

  const asked = thread.turns.some((t) => t.role === "user");
  React.useEffect(() => {
    if (!asked) return;
    if (!getThread(threadId)) {
      createThread({
        id: threadId,
        title: `${dash.name} · ${todayLabel()}`,
        kind: "dashboard",
      });
    }
    setThreads((prev) => ({
      ...prev,
      [threadId]: { turns: thread.turns, answers: EMPTY_ANSWERS, dashId: dash.id },
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asked, threadId, thread.turns, dash.id, setThreads]);

  const lastAsked = [...thread.turns].reverse().find((t) => t.role === "user");
  const focus = lastAsked ? (topicFrom(lastAsked.text) ?? null) : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <SplitWorkspace
        panelLabel={`${dash.name} dashboard`}
        panelWidth="59vw"
        collapsed={!chatOpen}
        onToggle={() => setChatOpen(!chatOpen)}
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
            scopeLabel={dash.name}
            placeholder="Ask about this dashboard, or change it…"
            suggestions={["What changed since yesterday?", "Add a card for freshness"]}
            reply={(q) => dashboardReply(dash, q)}
          />
        }
        panel={
          <DashboardBody
            dash={dash}
            focus={focus}
            onAsk={(topic) => thread.send(discussPrompt(topic))}
            leading={
              chatOpen ? null : <PanelToggle label="Show chat" onClick={() => setChatOpen(true)} />
            }
          />
        }
      />
    </div>
  );
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

  function reply(q: string): ChatReply {
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
