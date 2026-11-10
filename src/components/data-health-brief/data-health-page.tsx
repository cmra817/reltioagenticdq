import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { newChatId, useChatThreads } from "@/components/chat/chat-context";
import { Plus } from "lucide-react";
import { STATUS_LABEL, statusForScore, useDomainState } from "@/components/domain-context";
import { RecordQualityPanel } from "./record-quality-panel";
import {
  GhostButton,
  PrimaryButton,
  HEALTH_COLOR,
  HealthPill,
  Tag,
  SectionTitle,
  Sparkline,
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
import type { ChatReply } from "@/components/workspace/chat-visuals";
import { AskItem, AskProvider, useAsk } from "./ask";
import { answerTopic, recordReply, topicFrom } from "./dashboard-topics";
import { DashboardThreadScreen } from "./dashboard-thread-screen";
import { dashboardViewId, dayKey } from "./dashboard-topics";
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
 * Every dashboard is the same screen: today's conversation on the left, the
 * dashboard on the right. The conversation starts each day with that day's
 * brief, so nothing is generated when the page loads except the brief, and
 * selecting a brief line, card or chart asks about it in the same chat.
 */
export function DataHealthPage() {
  const [custom, , ready] = useLocalStore<CustomDashboard[]>(CUSTOM_KEY, CUSTOM_INIT);
  // null shows the card grid; an id opens that dashboard (chat on the left, dashboard on the right).
  const [active, setActiveRaw] = React.useState<string | null>(null);
  const [day, setDay] = React.useState(() => dayKey());
  const setActive = (id: string | null) => {
    setActiveRaw(id);
    setDay(dayKey());
  };
  const navigate = useNavigate();
  const { createThread } = useChatThreads();

  const dashboards = React.useMemo<DashboardDef[]>(
    () => [MY_BRIEF, ...SHARED_DASHBOARDS, ...custom.map(customToDashboard)],
    [custom],
  );

  const current = dashboards.find((d) => d.id === active) ?? MY_BRIEF;

  if (active === null) {
    return (
      <DashboardCards
        dashboards={dashboards}
        onOpen={setActive}
        onNew={newDashboardChat}
        loading={!ready}
      />
    );
  }

  /** A new dashboard is a new chat thread: create it, open it, and the starter message is already sent. */
  function newDashboardChat() {
    const id = newChatId();
    createThread({ id, title: "New dashboard", kind: "dashboard" });
    void navigate({ to: "/dashboard/$threadId", params: { threadId: id } });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 px-6 pb-2 pt-4">
        <div className="flex flex-wrap items-center gap-3">
          <nav aria-label="Breadcrumb" className="flex min-w-0 flex-1 items-center gap-2 text-[14px]">
          <button
            type="button"
            onClick={() => setActive(null)}
            className="hover:underline"
            style={{ color: "var(--ink-500)" }}
          >
            Dashboards
          </button>
          <span aria-hidden style={{ color: "var(--ink-300)" }}>/</span>
          <label className="flex min-w-0 items-center gap-2">
            <span className="sr-only">Dashboard</span>
            <select
              value={current.id}
              onChange={(e) => {
                setActive(e.target.value);
              }}
              className="min-w-0 max-w-96 cursor-pointer rounded-lg bg-transparent px-1.5 py-1 text-[14px] font-medium outline-none hover:bg-[color:var(--surface-soft)]"
              style={{ border: "none", color: "var(--ink-900)" }}
            >
              {dashboards.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                  {d.sharedBy ? " — Shared" : ""}
                </option>
              ))}
            </select>
          </label>
          </nav>
          <PrimaryButton onClick={newDashboardChat} className="flex items-center gap-1.5">
            <Plus size={14} /> New dashboard
          </PrimaryButton>
        </div>
        {!ready && <span className="sr-only">Loading dashboards</span>}
      </div>

      <DashboardThreadScreen
        key={`${current.id}-${day}`}
        threadId={dashboardViewId(current.id, day)}
        onPickDay={setDay}
      />
    </div>
  );
}

/** A small summary of each dashboard: score, trend, and its lowest rows. */
function useCardSummary(dash: DashboardDef) {
  const { domains, healthFor } = useDomainState();
  const { schedules } = useSchedules();
  return React.useMemo(() => {
    const scored = domains.map((d) => healthFor(d)).filter((n): n is number => n !== null);
    const score =
      dash.id === "mine"
        ? 78
        : dash.scope === ALL_DOMAINS
          ? scored.length
            ? Math.round(scored.reduce((n, v) => n + v, 0) / scored.length)
            : 85
          : (healthFor(dash.scope) ?? 85);
    const rows =
      dash.breakdown ??
      (dash.scope === ALL_DOMAINS
        ? domains
            .map((d) => ({ label: d, score: healthFor(d) }))
            .filter((r): r is { label: string; score: number } => r.score !== null)
        : dash.id === "mine"
          ? []
          : tablesFor(dash.scope, healthFor(dash.scope), schedules).map((t) => ({
              label: t.name,
              score: t.score,
            })));
    return {
      score,
      trend: trendFor(score, dash.id),
      lowest: [...rows].sort((a, b) => a.score - b.score).slice(0, 3),
    };
  }, [dash, domains, healthFor, schedules]);
}

function DashboardCard({ dash, onOpen }: { dash: DashboardDef; onOpen: () => void }) {
  const { score, trend, lowest } = useCardSummary(dash);
  const status = statusForScore(score);
  const tag = dash.sharedBy ? "Shared" : dash.audience === "Shared with your team" ? "Shared" : "Private";
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full flex-col gap-3 rounded-xl border bg-white p-4 text-left transition-colors hover:bg-[color:var(--surface-soft)]"
      style={{ borderColor: "var(--hairline)" }}
    >
      <span className="flex items-start justify-between gap-2">
        <span>
          <span className="block text-[15px] font-semibold" style={{ color: "var(--ink-900)" }}>
            {dash.name}
          </span>
          <span className="block text-[12px]" style={{ color: "var(--ink-500)" }}>
            {dash.scope === ALL_DOMAINS ? "Every domain" : dash.scope}
          </span>
        </span>
        <Tag>{tag}</Tag>
      </span>
      <span className="block">
        <span className="flex items-baseline gap-2">
          <span className="text-[28px] font-semibold leading-none" style={{ color: "var(--ink-900)" }}>
            {score}
          </span>
          <span className="text-[12px]" style={{ color: "var(--ink-500)" }}>
            {STATUS_LABEL[status]}
          </span>
        </span>
        <span className="mt-2 block">
          <Sparkline values={trend} label={`${dash.name} health over 14 days`} />
        </span>
      </span>
      {lowest.length > 0 && (
        <span className="block space-y-1.5">
          {lowest.map((r) => (
            <span key={r.label} className="block">
              <span className="flex justify-between text-[12.5px]" style={{ color: "var(--ink-900)" }}>
                <span className="truncate">{r.label}</span>
                <span className="tabular-nums">{r.score}</span>
              </span>
              <span
                className="mt-1 block h-2 overflow-hidden rounded-full"
                style={{ background: "var(--surface-soft)" }}
              >
                <span
                  className="block h-2 rounded-full"
                  style={{
                    width: `${r.score}%`,
                    background:
                      HEALTH_COLOR[statusForScore(r.score)] ?? "var(--brand-blue)",
                  }}
                />
              </span>
            </span>
          ))}
        </span>
      )}
      <span
        className="block border-t pt-2.5 text-[12px]"
        style={{ borderColor: "var(--hairline)", color: "var(--ink-500)" }}
      >
        {dash.sharedBy ? `Shared by ${dash.sharedBy}` : "Owned by you"}
      </span>
    </button>
  );
}

/** Dashboards: a card per dashboard, each with a chart. Opening one starts today's chat about it. */
function DashboardCards({
  dashboards,
  onOpen,
  onNew,
  loading,
}: {
  dashboards: DashboardDef[];
  onOpen: (id: string) => void;
  onNew: () => void;
  loading: boolean;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pb-10 pt-5">
      <div className="mx-auto w-full max-w-[1100px]">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-[22px] font-semibold" style={{ color: "var(--ink-900)" }}>
            Dashboards
          </h1>
          <span className="text-[13px]" style={{ color: "var(--ink-500)" }}>
            Ask the agent to build one, then share it or open it any day.
          </span>
          <PrimaryButton onClick={onNew} className="ml-auto flex items-center gap-1.5">
            <Plus size={14} /> New dashboard
          </PrimaryButton>
        </div>
        {loading && <span className="sr-only">Loading dashboards</span>}
        {[
          { title: "Created by you", items: dashboards.filter((d) => !d.sharedBy) },
          { title: "Shared with you", items: dashboards.filter((d) => d.sharedBy) },
        ].map((g) =>
          g.items.length === 0 ? null : (
            <section key={g.title} className="mt-6">
              <h2 className="text-[13px] font-semibold" style={{ color: "var(--ink-700)" }}>
                {g.title}
              </h2>
              <ul
                className="mt-3 grid gap-4"
                style={{ gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))" }}
              >
                {g.items.map((d) => (
                  <li key={d.id}>
                    <DashboardCard dash={d} onOpen={() => onOpen(d.id)} />
                  </li>
                ))}
              </ul>
            </section>
          ),
        )}
      </div>
    </div>
  );
}

/**
 * The dashboard itself, as the right panel of its chat. `focus` marks the
 * card or chart being discussed.
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
      <DashboardPanel dash={dash} leading={leading} />
    </AskProvider>
  );
}

export function dashboardReply(dash: DashboardDef, q: string): ChatReply {
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
}: {
  dash: DashboardDef;
  leading?: React.ReactNode;
}) {
  return dash.id === "mine" ? (
    <RecordQualityPanel leading={leading} />
  ) : (
    <GenericPanel dash={dash} leading={leading} />
  );
}

function GenericPanel({ dash, leading }: { dash: DashboardDef; leading?: React.ReactNode }) {
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
