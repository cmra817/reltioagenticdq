import * as React from "react";
import { Plus, Users } from "lucide-react";
import { statusForScore, useDomainState } from "@/components/domain-context";
import { RecordQualityPanel } from "./record-quality-panel";
import {
  GhostButton,
  HealthPill,
  PrimaryButton,
  ScopedChat,
  SectionTitle,
  Sparkline,
  SplitWorkspace,
  FloatingPrompt,
  useChatThread,
  type ChatThread,
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

type CustomDashboard = { id: string; name: string; scope: string };
const CUSTOM_INIT: CustomDashboard[] = [];
const CUSTOM_KEY = "agentflow.dashboards.custom.v1";

/**
 * Data health: one page, a dashboard chosen from a dropdown. "My brief" is yours
 * and always first. Dashboards an admin shares appear in the same list marked
 * Shared, so there is no share link to hunt for. Each dashboard is the same
 * pair: summary in chat on the left, stats in the right panel.
 */
export function DataHealthPage() {
  const { selected } = useDomainState();
  const [custom, setCustom, ready] = useLocalStore<CustomDashboard[]>(CUSTOM_KEY, CUSTOM_INIT);
  const [active, setActive] = React.useState("mine");
  const [chatOpen, setChatOpen] = React.useState(true);
  const [creating, setCreating] = React.useState(false);
  const [draft, setDraft] = React.useState("");

  const dashboards = React.useMemo<DashboardDef[]>(
    () => [
      MY_BRIEF,
      ...SHARED_DASHBOARDS,
      ...custom.map((c) => ({
        id: c.id,
        name: c.name,
        scope: c.scope,
        briefing: [
          `A personal view of ${c.scope === ALL_DOMAINS ? "every domain" : c.scope}. Ask me to add or remove cards and I'll change it for you.`,
        ],
      })),
    ],
    [custom],
  );

  const current = dashboards.find((d) => d.id === active) ?? MY_BRIEF;

  function createDashboard() {
    const name = draft.trim();
    if (!name) return;
    const id = `dash-${Date.now()}`;
    setCustom((prev) => [...prev, { id, name, scope: selected }]);
    setActive(id);
    setDraft("");
    setCreating(false);
  }

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
              onChange={(e) => setActive(e.target.value)}
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
          {creating ? (
            <form
              className="flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                createDashboard();
              }}
            >
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setCreating(false);
                    setDraft("");
                  }
                }}
                aria-label="New dashboard name"
                placeholder={`Name, scoped to ${selected}`}
                className="w-52 rounded-md border px-2 py-1 text-[13px] outline-none focus:border-[color:var(--brand-blue)]"
                style={{ borderColor: "var(--hairline)", color: "var(--ink-900)" }}
              />
              <PrimaryButton type="submit" disabled={!draft.trim()}>
                Create
              </PrimaryButton>
            </form>
          ) : (
            <GhostButton onClick={() => setCreating(true)} className="flex items-center gap-1.5">
              <Plus size={14} /> New dashboard
            </GhostButton>
          )}
        </div>
        {!ready && <span className="sr-only">Loading dashboards</span>}
      </div>

      <DashboardSplit key={current.id} dash={current} chatOpen={chatOpen} setChatOpen={setChatOpen} />
    </div>
  );
}

function DashboardSplit({
  dash,
  chatOpen,
  setChatOpen,
}: {
  dash: DashboardDef;
  chatOpen: boolean;
  setChatOpen: (open: boolean) => void;
}) {
  const thread = useChatThread((q) => dashboardReply(dash, q));
  return (
    <SplitWorkspace
      panelLabel={`${dash.name} stats`}
      panelWidth="59vw"
      collapsed={!chatOpen}
      onToggle={() => setChatOpen(!chatOpen)}
      center={<DashboardChat dash={dash} thread={thread} />}
      panel={<DashboardPanel dash={dash} />}
      floating={
        <FloatingPrompt
          thread={thread}
          placeholder="Ask about this dashboard, or change it…"
          onOpen={() => setChatOpen(true)}
        />
      }
    />
  );
}

function dashboardReply(dash: DashboardDef, q: string): string {
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

function DashboardChat({ dash, thread }: { dash: DashboardDef; thread: ChatThread }) {
  return (
    <ScopedChat
      thread={thread}
      scopeLabel={dash.scope}
      placeholder="Ask about this dashboard, or change it…"
      suggestions={[
        "What changed since yesterday?",
        "Which domain needs me first?",
        "Add a card for freshness",
      ]}
      reply={(q) => dashboardReply(dash, q)}
      header={
        <section aria-label="Summary">
          <h2 className="text-[20px] font-semibold" style={{ color: "var(--ink-900)" }}>
            {dash.name}
          </h2>
          {dash.sharedBy && (
            <p
              className="mt-1 flex items-center gap-1.5 text-[12.5px]"
              style={{ color: "var(--ink-500)" }}
            >
              <Users size={13} /> Shared by {dash.sharedBy}. It appears here for everyone with
              access.
            </p>
          )}
          <ul className="mt-4 space-y-2.5">
            {dash.briefing.map((b) => (
              <li
                key={b}
                className="text-[14px] leading-relaxed"
                style={{ color: "var(--ink-700)" }}
              >
                {b}
              </li>
            ))}
          </ul>
        </section>
      }
    />
  );
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

function recordReply(q: string): string {
  if (/source|where|worst/i.test(q)) {
    return "partner_lists is the worst at 55% good, but it is small. web_forms is 71.4% good across 140,300 records, so it holds the most bad records (about 40,100).";
  }
  if (/fast|quick|90|win|fix/i.test(q)) {
    return "Fix Email first: about 14,200 records fail on email alone, worth +2.9 points. Phone adds +2.4 and Role +1.9. Those three together get you from 78.4% to about 85.7%.";
  }
  if (/email/i.test(q)) {
    return "Of the bad records, 41% fail on Email. Valid is the weakest check at 91.2%, ahead of Distinct at 94.8% and Complete at 96.4%.";
  }
  if (/trend|week|down|drop|change/i.test(q)) {
    return "Good records climbed from 74.1% to 80.4% over the month, then slipped to 78.4% over the last week, right after a partner_lists import.";
  }
  return "Of 482,300 contacts, 378,100 are good (78.4%) and 104,200 are bad. Email and Phone cause most of the failures. Ask me about a source, an attribute, or the quickest way to reach 90%.";
}

function DashboardPanel({ dash }: { dash: DashboardDef }) {
  return dash.id === "mine" ? <RecordQualityPanel /> : <GenericPanel dash={dash} />;
}

function GenericPanel({ dash }: { dash: DashboardDef }) {
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
        <div className="text-[15px] font-semibold" style={{ color: "var(--ink-900)" }}>
          {dash.name}
        </div>
        <div className="mt-0.5 text-[12.5px]" style={{ color: "var(--ink-500)" }}>
          {dash.sharedBy ? `Shared by ${dash.sharedBy}` : "Only you see this view"} · {dash.scope}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <StatTile key={s.label} label={s.label} value={s.value} note={s.note} />
        ))}
      </div>

      <div>
        <SectionTitle>Last 14 days</SectionTitle>
        <div className="rounded-xl border bg-white p-3" style={{ borderColor: "var(--hairline)" }}>
          <Sparkline values={trend} label={`${dash.name} health`} />
        </div>
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
            <li key={r.label} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
              <span className="truncate text-[13.5px]" style={{ color: "var(--ink-900)" }}>
                {r.label}
              </span>
              <HealthPill score={r.score} status={statusForScore(r.score)} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
