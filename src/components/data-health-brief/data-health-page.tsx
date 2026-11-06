import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { newChatId, useChatThreads } from "@/components/chat/chat-context";
import { Plus } from "lucide-react";
import { statusForScore, useDomainState } from "@/components/domain-context";
import { RecordQualityPanel } from "./record-quality-panel";
import {
  GhostButton,
  HealthPill,
  SectionTitle,
  Sparkline,
  FloatingPrompt,
  type ChatThread,
  type ChatTurn,
  StatTile,
} from "@/components/workspace/primitives";
import {
  ALL_DOMAINS,
  MY_BRIEF,
  SHARED_DASHBOARDS,
  tablesFor,
  trendFor,
  type DashboardDef,
  type DashboardStat,
} from "@/lib/mock-ops";
import { useSchedules, useRuns } from "@/lib/ops-store";
import { useLocalStore } from "@/lib/use-local-store";
import { AskItem, AskProvider, useAsk } from "./ask";
import { answerTopic, discussPrompt, recordReply, topicFrom } from "./dashboard-topics";
import { useOpenDashboard } from "./open-dashboard";
import { assetsLabel, type SetupAnswers } from "./dashboard-setup";

export type CustomDashboard = {
  id: string;
  name: string;
  scope: string;
  answers?: SetupAnswers;
  turns?: ChatTurn[];
};
export const CUSTOM_INIT: CustomDashboard[] = [];
export const CUSTOM_KEY = "agentflow.dashboards.custom.v1";

/** A dashboard built in a "New dashboard" chat, as the shape the panels draw. */
export function customToDashboard(c: CustomDashboard): DashboardDef {
  return {
    id: c.id,
    name: c.name,
    scope: c.scope,
    turns: c.turns,
    audience: c.answers?.audience ?? undefined,
    briefing: c.answers
      ? [
          `Watches ${assetsLabel(c.answers)}. Goal: ${c.answers.goal}.`,
          `${c.answers.audience}. Refreshes ${c.answers.refresh?.toLowerCase()}.`,
        ]
      : [
          `A personal view of ${c.scope === ALL_DOMAINS ? "every domain" : c.scope}. Ask me to add or remove cards and I'll change it for you.`,
        ],
  };
}

/**
 * Data health: one page, a dashboard chosen from a dropdown. "My brief" is yours
 * and always first. Dashboards an admin shares appear in the same list marked
 * Shared, so there is no share link to hunt for.
 *
 * The page is fixed: nothing is generated when it loads except the daily brief
 * at the top, which was written this morning. Selecting a brief line, card or
 * chart opens that dashboard's chat for the day with a question about it
 * already sent. Typing in the floating prompt opens the same chat.
 */
export function DataHealthPage() {
  const [custom, , ready] = useLocalStore<CustomDashboard[]>(CUSTOM_KEY, CUSTOM_INIT);
  const [active, setActive] = React.useState("mine");
  const navigate = useNavigate();
  const { createThread } = useChatThreads();
  const openDashboard = useOpenDashboard();

  const dashboards = React.useMemo<DashboardDef[]>(
    () => [MY_BRIEF, ...SHARED_DASHBOARDS, ...custom.map(customToDashboard)],
    [custom],
  );

  const current = dashboards.find((d) => d.id === active) ?? MY_BRIEF;

  /** A new dashboard is a new chat thread: create it, open it, and the starter message is already sent. */
  function newDashboardChat() {
    const id = newChatId();
    createThread({ id, title: "New dashboard", kind: "dashboard" });
    void navigate({ to: "/dashboard/$threadId", params: { threadId: id }, search: {} });
  }

  // The floating prompt on a page has no conversation yet: sending opens today's chat.
  const prompt = React.useMemo<ChatThread>(
    () => ({
      turns: [],
      send: (q: string) => openDashboard(current, q),
      say: () => undefined,
    }),
    [openDashboard, current],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 px-6 pb-2 pt-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-[17px] font-semibold" style={{ color: "var(--ink-900)" }}>
            Data health
          </h1>
          <label className="flex min-w-0 flex-1 items-center gap-2">
            <span className="sr-only">Dashboard</span>
            <select
              value={current.id}
              onChange={(e) => {
                setActive(e.target.value);
              }}
              className="min-w-0 max-w-96 flex-1 rounded-lg px-2.5 py-1.5 text-[13px] outline-none focus:border-[color:var(--brand-blue)]"
              style={{
                border: "1px solid var(--hairline)",
                background: "#fff",
                color: "var(--ink-900)",
              }}
            >
              {dashboards.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                  {d.sharedBy ? " — Shared" : ""}
                </option>
              ))}
            </select>
          </label>
          <GhostButton onClick={newDashboardChat} className="flex items-center gap-1.5">
            <Plus size={14} /> New dashboard
          </GhostButton>
        </div>
        {!ready && <span className="sr-only">Loading dashboards</span>}
      </div>

      <div className="relative min-h-0 flex-1">
        <div className="h-full overflow-y-auto pb-24">
          <div className="mx-auto w-full max-w-[960px]">
            <DashboardBody
              key={current.id}
              dash={current}
              onAsk={(topic) => openDashboard(current, discussPrompt(topic))}
            />
          </div>
        </div>
        <FloatingPrompt
          thread={prompt}
          placeholder="Ask about this dashboard, or change it…"
          onOpen={() => openDashboard(current)}
        />
      </div>
    </div>
  );
}

/**
 * The dashboard itself: today's brief at the top, then the stats. The same
 * body is the page and the right panel of its chat, so what you select is what
 * the chat is about. `focus` marks the item being discussed.
 */
export function DashboardBody({
  dash,
  onAsk,
  focus,
  leading,
}: {
  dash: DashboardDef;
  onAsk?: (topic: string) => void;
  focus?: string | null;
  leading?: React.ReactNode;
}) {
  return (
    <AskProvider value={{ onAsk, focus }}>
      <DashboardPanel dash={dash} leading={leading} top={<DailyBrief dash={dash} />} />
    </AskProvider>
  );
}

/** Three to five lines written each morning. Each line is selectable like any card. */
function DailyBrief({ dash }: { dash: DashboardDef }) {
  const { onAsk } = useAsk();
  return (
    <section aria-label="Today's brief">
      <div className="flex items-baseline justify-between gap-3">
        <SectionTitle>Today's brief</SectionTitle>
        <span className="text-[12px]" style={{ color: "var(--ink-500)" }}>
          Generated today, 6:00am
        </span>
      </div>
      <ul
        className="space-y-0.5 rounded-xl border bg-white p-1.5"
        style={{ borderColor: "var(--hairline)" }}
      >
        {dash.briefing.map((line) => (
          <li key={line}>
            <AskItem
              topic={line}
              className="rounded-lg px-2.5 py-2 text-[14px] leading-relaxed"
              style={{ color: "var(--ink-700)" }}
            >
              {line}
            </AskItem>
          </li>
        ))}
      </ul>
      {onAsk && (
        <p className="mt-1.5 text-[12px]" style={{ color: "var(--ink-300)" }}>
          Select a line, card or chart to discuss it in chat.
        </p>
      )}
    </section>
  );
}

export function dashboardReply(dash: DashboardDef, q: string): string {
  const topic = topicFrom(q);
  if (topic) return answerTopic(dash, topic);
  if (dash.id === "mine") return recordReply(q);
  if (/add|remove|change|hide|show/i.test(q)) {
    return "Done. I've changed your copy of this view. The shared version stays as the admin set it, so nobody else's changes.";
  }
  if (/first|worst|priority|attention/i.test(q)) {
    return dash.scope === ALL_DOMAINS
      ? "Supply Chain, then Finance. Supply Chain has two stale feeds; Finance has three failed checks since last night."
      : "Start with the table at the top of the right panel. It has the most open findings and the lowest score.";
  }
  return "Compared with yesterday, one more check failed and two recovered. Nothing new broke outside the findings listed in the summary.";
}

function useScopeStats(dash: DashboardDef): DashboardStat[] {
  const { domains, healthFor } = useDomainState();
  const { schedules } = useSchedules();
  const { runs } = useRuns(schedules);
  return React.useMemo(() => {
    if (dash.stats) return dash.stats;
    const inScope = schedules.filter((s) => dash.scope === ALL_DOMAINS || s.domain === dash.scope);
    const week = runs.filter(
      (r) => r.hoursAgo <= 168 && inScope.some((s) => s.id === r.scheduleId),
    );
    const checks = week.reduce((n, r) => n + r.checksRun, 0);
    const failed = week.reduce((n, r) => n + r.checksFailed, 0);
    const scored = domains.map((d) => healthFor(d)).filter((n): n is number => n !== null);
    const health =
      dash.scope === ALL_DOMAINS
        ? scored.length === 0
          ? null
          : Math.round(scored.reduce((n, v) => n + v, 0) / scored.length)
        : healthFor(dash.scope);
    return [
      {
        label: dash.scope === ALL_DOMAINS ? "Overall health" : `${dash.scope} health`,
        value: health === null ? "—" : String(health),
      },
      {
        label: "Failed runs, 7 days",
        value: String(week.filter((r) => r.status === "failed").length),
      },
      {
        label: "Checks passing",
        value: checks === 0 ? "—" : `${Math.round((100 * (checks - failed)) / checks)}%`,
      },
      {
        label: "Schedules",
        value: String(inScope.length),
        note: `${inScope.filter((s) => !s.active).length} paused`,
      },
    ];
  }, [dash, schedules, runs, domains, healthFor]);
}

export function DashboardPanel({
  dash,
  leading,
  top,
}: {
  dash: DashboardDef;
  leading?: React.ReactNode;
  top?: React.ReactNode;
}) {
  return dash.id === "mine" ? (
    <RecordQualityPanel leading={leading} top={top} />
  ) : (
    <GenericPanel dash={dash} leading={leading} top={top} />
  );
}

function GenericPanel({
  dash,
  leading,
  top,
}: {
  dash: DashboardDef;
  leading?: React.ReactNode;
  top?: React.ReactNode;
}) {
  const { onAsk, focus } = useAsk();
  const { domains, healthFor } = useDomainState();
  const { schedules } = useSchedules();
  const stats = useScopeStats(dash);

  const breakdown = React.useMemo(() => {
    if (dash.breakdown) return dash.breakdown;
    if (dash.scope === ALL_DOMAINS) {
      return domains
        .map((d) => ({ label: d, score: healthFor(d) }))
        .filter((r): r is { label: string; score: number } => r.score !== null)
        .sort((a, b) => a.score - b.score);
    }
    return tablesFor(dash.scope, healthFor(dash.scope), schedules).map((t) => ({
      label: t.name,
      score: t.score,
    }));
  }, [dash, domains, healthFor, schedules]);

  const trendScore = Number.parseInt(stats[0]?.value ?? "85", 10);
  const trend = trendFor(Number.isNaN(trendScore) ? 85 : trendScore, dash.id);

  return (
    <div className="space-y-6 p-5">
      <div>
        <div className="flex items-center gap-2">
          {leading}
          <div className="text-[15px] font-semibold" style={{ color: "var(--ink-900)" }}>
            {dash.name}
          </div>
        </div>
        <div className="mt-0.5 text-[12.5px]" style={{ color: "var(--ink-500)" }}>
          {dash.sharedBy
            ? `Shared by ${dash.sharedBy}`
            : dash.audience === "Shared with your team"
              ? "Shared with your team"
              : "Only you see this view"}{" "}
          · {dash.scope}
        </div>
      </div>

      {top}

      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <StatTile
            key={s.label}
            label={s.label}
            value={s.value}
            note={s.note}
            onClick={onAsk ? () => onAsk(s.label) : undefined}
            pressed={onAsk ? focus === s.label : undefined}
          />
        ))}
      </div>

      <div>
        <SectionTitle>Last 14 days</SectionTitle>
        <AskItem topic="Last 14 days" className="rounded-xl">
          <div
            className="rounded-xl border bg-white p-3"
            style={{ borderColor: "var(--hairline)" }}
          >
            <Sparkline values={trend} label={`${dash.name} health`} />
          </div>
        </AskItem>
      </div>

      <div>
        <SectionTitle>
          {dash.scope === ALL_DOMAINS ? "By domain, lowest first" : "Lowest first"}
        </SectionTitle>
        <ul
          className="divide-y rounded-xl border bg-white"
          style={{ borderColor: "var(--hairline)" }}
        >
          {breakdown.map((r) => (
            <li key={r.label}>
              <AskItem
                topic={r.label}
                className="flex items-center justify-between gap-3 px-3.5 py-2.5"
              >
                <span className="truncate text-[13.5px]" style={{ color: "var(--ink-900)" }}>
                  {r.label}
                </span>
                <HealthPill score={r.score} status={statusForScore(r.score)} />
              </AskItem>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
