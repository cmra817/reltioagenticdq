import * as React from "react";
import { Pause, Play, RotateCw } from "lucide-react";
import { useChatThreads } from "@/components/chat/chat-context";
import { PlanView } from "@/components/add-dataset-agentic/PlanView";
import { parseSchedule } from "@/components/add-dataset-agentic/agent-script";
import { planToSchedule, scheduleToPlan } from "@/components/add-dataset-agentic/plan-state";
import { useOpenRule } from "@/components/rules/open-rule";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  FloatingPrompt,
  PanelToggle,
  ScopedChat,
  SplitWorkspace,
  Tabs,
  Tag,
  useChatThread,
  type ChatTurn,
} from "@/components/workspace/primitives";
import type { Rule } from "@/lib/mock-ops";
import { useRules, useRuns, useSchedules } from "@/lib/ops-store";
import { useLocalStore } from "@/lib/use-local-store";
import { ago } from "./format";
import { RunDetail, RunsList, ScheduleInsightsView } from "./schedule-panels";
import { buildScheduleInsights, matchRule, runNarrative, runPrompt } from "./schedule-insights";

/** What a schedule thread remembers, so it can be reopened from Recents. */
export type ScheduleThreadState = { turns: ChatTurn[] };
export const SCHEDULE_THREADS_KEY = "agentflow.schedule-threads.v2";
export const SCHEDULE_THREADS_INIT: Record<string, ScheduleThreadState> = {};

type PanelTab = "insights" | "plan" | "runs";

const jobPrompt = (name: string) => `Tell me about the "${name}" job`;

function IconAction({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          disabled={disabled}
          onClick={onClick}
          className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-[color:var(--surface-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-blue)] disabled:opacity-40"
          style={{ color: "var(--ink-700)" }}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

/**
 * A chat thread about one schedule. The chat is where you ask and change
 * things; the right panel holds Insights (how it is doing), the Plan (tables,
 * rules, and timing, always editable) and every Run. Opening a run shows its
 * results in the panel and the agent's account of it in the chat.
 */
export function ScheduleWorkspace({
  threadId,
  scheduleId,
  initialRun,
  initial,
}: {
  threadId: string;
  scheduleId: string;
  /** A run to bring into focus, e.g. from a failed-run alert. */
  initialRun?: string;
  initial?: ScheduleThreadState;
}) {
  const { getThread, createThread } = useChatThreads();
  const openRule = useOpenRule();
  const { schedules, update, ready } = useSchedules();
  const { runs, startRun, markViewed } = useRuns(schedules);
  const { rules } = useRules();
  const [, setThreads] = useLocalStore(SCHEDULE_THREADS_KEY, SCHEDULE_THREADS_INIT);

  const schedule = schedules.find((s) => s.id === scheduleId);
  const history = React.useMemo(
    () => runs.filter((r) => r.scheduleId === scheduleId),
    [runs, scheduleId],
  );
  const ruleName = React.useCallback(
    (id: string) => rules.find((r) => r.id === id)?.name ?? "Deleted rule",
    [rules],
  );
  const insights = React.useMemo(
    () => buildScheduleInsights(history, ruleName),
    [history, ruleName],
  );
  const plan = React.useMemo(() => (schedule ? scheduleToPlan(schedule) : null), [schedule]);
  const scheduleRules = (schedule?.ruleIds ?? [])
    .map((id) => rules.find((r) => r.id === id))
    .filter((r): r is Rule => !!r);
  const running = history.some((r) => r.status === "running");

  const [chatOpen, setChatOpen] = React.useState(true);
  const [tab, setTab] = React.useState<PanelTab>(initialRun ? "runs" : "insights");
  const [runId, setRunId] = React.useState<string | undefined>(initialRun);
  const openRunRecord = runId ? history.find((r) => r.id === runId) : undefined;

  function applyCadence(q: string): string | null {
    if (!schedule || !/\b(move|change|set|make|switch|reschedule|schedule)\b/i.test(q)) return null;
    const cfg = parseSchedule(q);
    if (!cfg) return null;
    const next = { ...scheduleToPlan(schedule), profiling: cfg, checks: cfg };
    const patch = planToSchedule(next, schedule.kind);
    update(schedule.id, patch);
    setTab("plan");
    return `Done. It now runs ${patch.repeats.toLowerCase()}. The Plan on the right shows the new timing.`;
  }

  /** The run whose opening question is being sent, so the answer is about that run. */
  const askedRun = React.useRef<string | undefined>(undefined);

  function reply(q: string): string {
    if (!schedule) return "One moment while this schedule loads.";
    const asked = askedRun.current ? history.find((r) => r.id === askedRun.current) : undefined;
    if (asked && q === runPrompt(asked)) return runNarrative(asked, schedule);
    const lastFailed = insights.history.find(
      (r) => r.status === "failed" || r.status === "attention",
    );
    const focus = openRunRecord ?? lastFailed ?? insights.lastRun;
    const top = focus?.findings[0];

    if (q === jobPrompt(schedule.name)) {
      setTab("insights");
      return `${schedule.name} checks ${schedule.tables.length} table${schedule.tables.length === 1 ? "" : "s"} (${schedule.tables.join(", ")})${
        scheduleRules.length ? ` with ${scheduleRules.length} rule${scheduleRules.length === 1 ? "" : "s"}` : ", profiling only"
      }. It runs ${schedule.repeats.toLowerCase()}${schedule.active ? `; next run ${schedule.nextRun}` : ", but it's paused"}. ${insights.successRate}% of its ${insights.history.length} runs passed.\n\nAsk what happened in the last run, or tell me to change it.`;
    }
    if (/\b(resume|unpause|turn (it )?on)\b/i.test(q)) {
      update(schedule.id, { active: true, nextRun: "Next scheduled time" });
      return "Resumed. It will run at its next scheduled time.";
    }
    if (/\b(pause|stop it|turn (it )?off)\b/i.test(q)) {
      update(schedule.id, { active: false, nextRun: "Paused" });
      return "Paused. It won't run until you resume it.";
    }
    if (/\b(run (it )?(now|again)|rerun|re-run|start a run|kick off)\b/i.test(q)) {
      if (running) return "It's already running. Results will show under Runs in a moment.";
      startRun(schedule.id);
      setTab("runs");
      setRunId(undefined);
      return "Started a run. It shows under Runs and finishes in a moment.";
    }

    const cadence = applyCadence(q);
    if (cadence) return cadence;

    if (/\b(add|include|apply)\b/i.test(q)) {
      const pool = rules.filter((r) => !schedule.ruleIds.includes(r.id) && r.scope !== "Template");
      const found = matchRule(q, pool);
      if (!found) {
        return "I couldn't find a rule like that in your library that this schedule isn't already using. Rules lists them, or start a new rule there.";
      }
      update(schedule.id, { ruleIds: [...schedule.ruleIds, found.id] });
      setTab("insights");
      return `Added "${found.name}". It checks all ${schedule.tables.length} tables from the next run.`;
    }
    if (/\b(remove|drop|take off)\b/i.test(q)) {
      const found = matchRule(q, scheduleRules);
      if (!found)
        return "I couldn't tell which rule you mean. Rules this schedule uses are listed under Insights.";
      update(schedule.id, { ruleIds: schedule.ruleIds.filter((id) => id !== found.id) });
      setTab("insights");
      return `Removed "${found.name}" from this schedule. The rule itself stays in your library.`;
    }

    const why = q.match(/why does (.+?) fail/i);
    if (why) {
      const item = insights.failing.find((f) => f.label.toLowerCase() === why[1].toLowerCase());
      if (item) {
        setTab("insights");
        return `${item.label} has failed on ${item.failingRows.toLocaleString()} rows across ${insights.history.length} runs. The failures line up with the latest loads to ${item.table}. I can open the run where it failed, or you can tell me to loosen or drop the rule.`;
      }
    }
    if (/\b(what happened|last run|latest run|what failed|went wrong|broke|why)\b/i.test(q)) {
      if (!focus) return "It hasn't run yet, so there is nothing to explain.";
      setRunId(focus.id);
      setTab("runs");
      markViewed(focus.id);
      return runNarrative(focus, schedule);
    }
    if (/downstream|affect|impact|report/i.test(q)) {
      return top
        ? `${top.table} feeds the weekly revenue report and the customer 360 view. Both would show the issue until it's fixed. I can post a heads-up to the owners if you'd like.`
        : "Nothing failed, so nothing downstream is affected.";
    }
    if (/\bfix|resolve|how do i\b/i.test(q)) {
      return top
        ? `Start with "${top.title}". ${top.detail} Quarantine the affected ${top.failingRows.toLocaleString()} rows, correct them at the source, and run this schedule again to confirm.`
        : "Nothing is failing, so there is nothing to fix.";
    }
    if (/change|since|compare|previous/i.test(q)) {
      return top
        ? `The previous run passed this check. The failure started in the window between the two runs, which is when the latest load to ${top.table} landed.`
        : "Nothing has changed. Row counts and value ranges match the last few runs.";
    }
    if (/when|next run|how often does/i.test(q)) {
      return schedule.active
        ? `It runs ${schedule.repeats.toLowerCase()}. Next run: ${schedule.nextRun}.`
        : `It runs ${schedule.repeats.toLowerCase()}, but it's paused right now.`;
    }
    if (/pass|health|doing|success/i.test(q)) {
      setTab("insights");
      return `${insights.successRate}% of its ${insights.history.length} runs passed.${
        insights.lastRun ? ` The last one was ${ago(insights.lastRun.hoursAgo)}.` : ""
      }`;
    }
    if (/which|what does it check|cover|tables|rules/i.test(q)) {
      setTab("insights");
      return `It covers ${schedule.tables.join(", ")}${
        scheduleRules.length > 0
          ? `, with ${scheduleRules.map((r) => r.name).join(", ")}`
          : ", and has no rules, so it only profiles"
      }.`;
    }
    return 'I didn\'t change anything. Try "run it now", "pause it", "move it to 6am", "add the email rule", or "what happened in the last run?"';
  }

  const thread = useChatThread(reply, initial?.turns);

  /**
   * Opening a run, from anywhere, sends the question for the person and the agent
   * answers it; the run's results open in the panel at the same time.
   */
  function openRun(id: string) {
    setRunId(id);
    setTab("runs");
    markViewed(id);
    const run = history.find((r) => r.id === id);
    if (!run) return;
    const prompt = runPrompt(run);
    const lastUser = [...thread.turns].reverse().find((t) => t.role === "user");
    // The latest question is already about this run (or the thread opened with it): don't repeat it.
    if (lastUser?.text === prompt) return;
    askedRun.current = id;
    thread.send(prompt);
  }

  // Opening a job asks about it, unless the link already opens a run.
  const autoAsked = React.useRef(false);
  React.useEffect(() => {
    if (autoAsked.current || !schedule || initialRun || thread.turns.length > 0) return;
    autoAsked.current = true;
    thread.send(jobPrompt(schedule.name));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schedule]);

  // A run asked for in the link (from a failed-run alert) comes into focus once.
  const handledRun = React.useRef<string | undefined>(undefined);
  React.useEffect(() => {
    if (!initialRun || handledRun.current === initialRun) return;
    if (!history.some((r) => r.id === initialRun)) return;
    handledRun.current = initialRun;
    openRun(initialRun);
    // openRun reads the latest thread on purpose; only react to the requested run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialRun, history]);

  // The page is just a page until a conversation starts: the first question
  // (a run or item selected, or typed) opens the chat and puts the thread in Recents.
  const turnCount = thread.turns.length;
  const prevTurns = React.useRef(turnCount);
  React.useEffect(() => {
    if (prevTurns.current === 0 && turnCount > 0) setChatOpen(true);
    prevTurns.current = turnCount;
  }, [turnCount]);

  React.useEffect(() => {
    if (turnCount === 0) return;
    if (schedule && !getThread(threadId)) {
      createThread({
        id: threadId,
        title: schedule.name,
        kind: "schedule",
        domain: schedule.domain,
      });
    }
    setThreads((prev) => ({ ...prev, [threadId]: { turns: thread.turns } }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schedule?.id, threadId, thread.turns, setThreads]);

  if (ready && !schedule) {
    return (
      <div className="p-8">
        <p className="text-[14px]" style={{ color: "var(--ink-500)" }}>
          This schedule isn't available. Choose another from Jobs.
        </p>
      </div>
    );
  }
  if (!schedule || !plan) return <div className="flex-1" />;

  const suggestions = [
    "What happened in the last run?",
    "Run it now",
    schedule.active ? "Pause it" : "Resume it",
    "Move it to 6am",
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <SplitWorkspace
        panelLabel="Schedule"
        panelWidth="59vw"
        collapsed={!chatOpen}
        ownShowToggle
        onToggle={() => setChatOpen(!chatOpen)}
        floating={
          <FloatingPrompt
            thread={thread}
            placeholder="Ask about this schedule, or tell me what to change…"
            onOpen={() => setChatOpen(true)}
          />
        }
        center={
          <ScopedChat
            thread={thread}
            scopeLabel={schedule.name}
            placeholder="Ask about this schedule, or tell me what to change…"
            suggestions={suggestions}
            reply={reply}
          />
        }
        panel={
          <div className="flex min-h-full flex-col">
            <div className="mx-auto w-full max-w-[960px] flex-1 space-y-5 p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  {!chatOpen && (
                    <PanelToggle label="Show chat" onClick={() => setChatOpen(true)} />
                  )}
                  <Tabs
                    label="Schedule sections"
                    value={tab}
                    onChange={(t) => {
                      setTab(t);
                      if (t !== "runs") setRunId(undefined);
                    }}
                    tabs={[
                      { id: "insights" as const, label: "Insights" },
                      { id: "plan" as const, label: "Plan" },
                      { id: "runs" as const, label: "Runs", hint: String(history.length) },
                    ]}
                  />
                </div>
                <TooltipProvider delayDuration={200}>
                  <div className="flex items-center gap-1">
                    <IconAction
                      label={running ? "Running…" : "Run now"}
                      disabled={running}
                      onClick={() => {
                        startRun(schedule.id);
                        setTab("runs");
                        setRunId(undefined);
                      }}
                    >
                      <RotateCw size={16} aria-hidden="true" />
                    </IconAction>
                    <IconAction
                      label={schedule.active ? "Pause" : "Resume"}
                      onClick={() =>
                        update(
                          schedule.id,
                          schedule.active
                            ? { active: false, nextRun: "Paused" }
                            : { active: true, nextRun: "Next scheduled time" },
                        )
                      }
                    >
                      {schedule.active ? (
                        <Pause size={16} aria-hidden="true" />
                      ) : (
                        <Play size={16} aria-hidden="true" />
                      )}
                    </IconAction>
                    <Tag>{schedule.active ? "Active" : "Paused"}</Tag>
                  </div>
                </TooltipProvider>
              </div>

              {tab === "insights" ? (
                <ScheduleInsightsView
                  schedule={schedule}
                  insights={insights}
                  rules={scheduleRules}
                  onAsk={thread.send}
                  onOpenRule={openRule}
                  onOpenRun={openRun}
                />
              ) : tab === "plan" ? (
                <section aria-label="Schedule plan">
                  <PlanView
                    bare
                    plan={plan}
                    stage={3}
                    onChange={(next) => update(schedule.id, planToSchedule(next, schedule.kind))}
                    reveal={null}
                    ruleRequest={null}
                    filter={null}
                    onClearFilter={() => {}}
                    onDialogChange={() => {}}
                  />
                </section>
              ) : openRunRecord ? (
                <RunDetail
                  run={openRunRecord}
                  ruleName={ruleName}
                  onBack={() => setRunId(undefined)}
                  onAsk={thread.send}
                />
              ) : (
                <RunsList runs={history} onOpen={openRun} />
              )}
            </div>
          </div>
        }
      />
    </div>
  );
}
