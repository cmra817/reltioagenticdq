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
import { ALL_DOMAINS, MY_BRIEF, SHARED_DASHBOARDS, trendFor, type DashboardDef } from "@/lib/mock-ops";
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
import { dashboardViewId, dayKey, discussPrompt, parseViewId, topicFrom } from "./dashboard-topics";
import { ArtifactOpenContext } from "@/components/workspace/chat-visuals";
import { DashboardController } from "./dashboard-controller";
import { Minimize2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

/** What a dashboard thread remembers, so it can be reopened from Recents. */
type DashboardThreadState = { turns: ChatTurn[]; answers: SetupAnswers; dashId?: string };
const THREADS_KEY = "agentflow.dashboard-threads.v1";
const THREADS_INIT: Record<string, DashboardThreadState> = {};

/**
 * A dashboard chat thread: either "New dashboard" (the build conversation) or
 * a dashboard's conversation for one day. Waits for saved state so a reopened
 * thread comes back as it was.
 */
export function DashboardThreadScreen({
  threadId,
  onPickDay,
}: {
  threadId: string;
  onPickDay?: (day: string) => void;
}) {
  const navigate = useNavigate();
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
      day={view.day}
      initial={threads[threadId]}
      onPickDay={
        onPickDay ??
        ((d) =>
          void navigate({
            to: "/dashboard/$threadId",
            params: { threadId: dashboardViewId(dash.id, d) },
          }))
      }
    />
  );
}

/** A day's run, as the agent's first messages: the artifact, a summary, and a chart. */
function runTurns(dash: DashboardDef, day: string): ChatTurn[] {
  const isToday = day === dayKey();
  const when = isToday
    ? "today"
    : new Date(`${day}T06:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const trend = trendFor(dash.id === "mine" ? 78 : 84, `${dash.id}-${day}`);
  const prompt = `Run ${dash.name} for ${isToday ? "today" : when}. Follow its instructions: check the tables and rules it watches, tell me what changed since the last run and what needs my attention, and open the dashboard.`;
  return [
    { id: 0, role: "user", text: prompt },
    {
      id: 1,
      role: "agent",
      text: `Scheduled run finished ${isToday ? "today" : `on ${when}`} at 6:00 AM. I checked the tables and rules this dashboard watches.`,
      visual: {
        kind: "artifact",
        title: dash.name,
        meta: `Dashboard · ${isToday ? "Today" : when} · ${dash.sharedBy ? "Shared" : "Only you"}`,
      },
    },
    {
      id: 2,
      role: "agent",
      text: "Here's what needs your attention:",
      visual: {
        kind: "brief",
        title: isToday ? "Today's brief" : `Brief for ${when}`,
        stamp: `Generated ${when}, 6:00am`,
        lines: dash.briefing.map((text) => ({ text, ask: discussPrompt(text) })),
      },
    },
    {
      id: 3,
      role: "agent",
      text: "How the score has moved over the last 14 days:",
      visual: {
        kind: "trend",
        title: "DQ score, 14 days",
        values: trend,
        startLabel: "14 days ago",
        endLabel: isToday ? "Today" : when,
        target: 90,
      },
    },
  ];
}

/**
 * One conversation per dashboard per day. Chat on the left; the right panel
 * starts minimized (instructions and runs) and expands to the dashboard when
 * the artifact is opened. The thread joins Recents with the first question.
 */
function DashboardViewThread({
  threadId,
  dash,
  day,
  initial,
  onPickDay,
}: {
  threadId: string;
  dash: DashboardDef;
  day: string;
  initial?: DashboardThreadState;
  onPickDay: (day: string) => void;
}) {
  const { getThread, createThread } = useChatThreads();
  const [, setThreads] = useLocalStore(THREADS_KEY, THREADS_INIT);
  const [chatOpen, setChatOpen] = React.useState(true);
  const [expanded, setExpanded] = React.useState(false);
  const seed = runTurns(dash, day);
  const prev = initial?.turns ?? [];
  const firstReal = prev.findIndex((t) => t.role === "user" && t.text !== seed[0].text);
  const rest = firstReal < 0 ? [] : prev.slice(firstReal);
  const startTurns = [...seed, ...rest.map((t, i) => ({ ...t, id: seed.length + i }))];
  const thread = useChatThread((q) => dashboardReply(dash, q), startTurns);

  const asked = thread.turns.some((t) => t.role === "user");
  React.useEffect(() => {
    if (!asked) return;
    if (!getThread(threadId)) {
      const label = day === dayKey() ? todayLabel() : day;
      createThread({ id: threadId, title: `${dash.name} · ${label}`, kind: "dashboard" });
    }
    setThreads((prev) => ({
      ...prev,
      [threadId]: { turns: thread.turns, answers: EMPTY_ANSWERS, dashId: dash.id },
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asked, threadId, thread.turns, dash.id, setThreads]);

  const lastAsked = [...thread.turns].reverse().find((t) => t.role === "user");
  const focus = lastAsked ? (topicFrom(lastAsked.text) ?? null) : null;
  const open = React.useCallback(() => setExpanded(true), []);

  return (
    <ArtifactOpenContext.Provider value={open}>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <SplitWorkspace
          panelLabel={expanded ? `${dash.name} dashboard` : `${dash.name} instructions and runs`}
          panelWidth={expanded ? "59vw" : 320}
          collapsed={!chatOpen}
          onToggle={() => setChatOpen(!chatOpen)}
          ownShowToggle={expanded}
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
            expanded ? (
              <div className="relative flex min-h-0 flex-1 flex-col">
                <button
                  type="button"
                  onClick={() => {
                    setExpanded(false);
                    setChatOpen(true);
                  }}
                  aria-label="Minimize dashboard"
                  title="Minimize dashboard"
                  className="absolute right-3 top-3 z-10 grid h-7 w-7 place-items-center rounded-md bg-white hover:bg-[color:var(--surface-soft)]"
                  style={{ color: "var(--ink-500)" }}
                >
                  <Minimize2 size={15} />
                </button>
                <DashboardBody
                  dash={dash}
                  focus={focus}
                  onAsk={(topic) => thread.send(discussPrompt(topic))}
                  leading={
                    chatOpen ? null : (
                      <PanelToggle label="Show chat" onClick={() => setChatOpen(true)} />
                    )
                  }
                />
              </div>
            ) : (
              <DashboardController dash={dash} day={day} onPickDay={onPickDay} onExpand={open} />
            )
          }
        />
      </div>
    </ArtifactOpenContext.Provider>
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
