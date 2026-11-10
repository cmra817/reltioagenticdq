import * as React from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Lock, Minimize2 } from "lucide-react";
import { statusForScore, useDomainState } from "@/components/domain-context";
import {
  HealthPill,
  HEALTH_COLOR,
  RunPill,
  ScopedChat,
  SectionTitle,
  Sparkline,
  SplitWorkspace,
  StatTile,
  Tabs,
  Tag,
  useChatThread,
} from "@/components/workspace/primitives";
import type { ChatReply, ChatVisual } from "@/components/workspace/chat-visuals";
import { ago } from "@/components/scheduled/format";
import {
  ALL_DOMAINS,
  columnsFor,
  tablesFor,
  trendFor,
  type Finding,
  type Run,
  type Schedule,
  type TableInfo,
} from "@/lib/mock-ops";
import { useRules, useRuns, useSchedules } from "@/lib/ops-store";
import { useProjects } from "@/lib/projects-store";
import { useLocalStore } from "@/lib/use-local-store";
import { newChatId, useChatThreads } from "@/components/chat/chat-context";
import type { ChatTurn } from "@/components/workspace/primitives";
import type { Project } from "@/lib/mock-projects";
import { projectReply } from "@/components/projects/projects-screen";
import { DomainRail, type BriefLine } from "./domain-rail";

export type DomainSearch = {
  table?: string;
  all?: boolean;
  thread?: string;
  /** A fresh "New chat": a new value always starts a new chat. */
  n?: string;
  /** A prompt to send as soon as the chat opens. */
  q?: string;
};

/** What a saved domain chat needs to come back as it was. */
export type SavedDomainChat = { turns: ChatTurn[]; domain?: string; project?: string };
export const DOMAIN_CHATS_KEY = "agentflow.domain-chats.v1";

type PanelTab = "overview" | "tables" | "checks";
type TableTab = "overview" | "columns" | "sample" | "events" | "checks";

const DISCUSS = "Let's discuss: ";
const card = { borderColor: "var(--hairline)" } as const;

/** Small deterministic number from a string, so sample data stays put between renders. */
function seed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** A few made-up rows that fit the table's columns. */
function sampleFor(table: string) {
  const cols = columnsFor(table);
  const h = seed(table);
  const statuses = ["active", "pending", "closed"];
  const rows = Array.from({ length: 4 }, (_, i) => {
    const n = (h % 900) + 100 + i * 7;
    return cols.map((c) => {
      if (c.name === "id") return `${table.slice(0, 3)}_${n}`;
      if (c.name === "created_at") return `2026-11-0${(i % 7) + 1} 0${i + 3}:1${i}:00`;
      if (c.name === "status") return statuses[(h + i) % statuses.length];
      if (c.name === "amount") return (((n * 13) % 5000) + (i % 2 ? 0.5 : 0.25)).toFixed(2);
      // Leave the odd value empty where the column has gaps.
      return c.nullPct > 3 && i === 2 ? "—" : `user${n}@example.com`;
    });
  });
  return { head: cols.map((c) => c.name), rows };
}

/**
 * Domain home. The chat is on the left. The right panel starts minimized (the
 * domain brief, score and lowest tables) and expands to Overview, Tables and
 * Checks. Opening a table keeps the same chat going and swaps the panel to it.
 * A chat is about one scope (a domain, or All domains) chosen before the first
 * message, and can be focused on one project.
 */
export function DomainScreen({ search }: { search: DomainSearch }) {
  const { selected, selectDomain } = useDomainState();
  const [saved, , ready] = useLocalStore<Record<string, SavedDomainChat>>(DOMAIN_CHATS_KEY, {});
  const rec = search.thread ? saved[search.thread] : undefined;
  const all = search.thread ? !!rec && !rec.domain : !!search.all;
  const domain = rec?.domain ?? selected;

  // Opening a saved chat from Recents also moves the sidebar to its domain.
  React.useEffect(() => {
    if (rec?.domain && rec.domain !== selected) selectDomain(rec.domain);
    // Only when a different saved chat is opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.thread, rec?.domain]);

  if (search.thread && !ready) return <div className="flex-1" />;
  // A new scope is a new chat: everything below starts over.
  return (
    <DomainWorkspace
      key={`${search.thread ?? ""}|${search.n ?? ""}|${all ? ALL_DOMAINS : domain}`}
      search={{ ...search, all: all || undefined }}
      domainName={domain}
      saved={rec}
    />
  );
}

function DomainWorkspace({
  search,
  domainName: selected,
  saved,
}: {
  search: DomainSearch;
  domainName: string;
  saved?: SavedDomainChat;
}) {
  const navigate = useNavigate();
  const { domains, selectDomain, healthFor } = useDomainState();
  const { getThread, createThread } = useChatThreads();
  const [, setSaved] = useLocalStore<Record<string, SavedDomainChat>>(DOMAIN_CHATS_KEY, {});
  const threadId = React.useRef(search.thread ?? newChatId()).current;
  const { schedules } = useSchedules();
  const { runs } = useRuns(schedules);
  const { rules } = useRules();
  const { projects } = useProjects();

  const all = !!search.all;
  const scopeName = all ? ALL_DOMAINS : selected;

  const [expanded, setExpanded] = React.useState(!!search.table);
  const [panelTab, setPanelTab] = React.useState<PanelTab>("overview");
  const [ask, setAsk] = React.useState<{ id: number; q: string } | null>(null);
  const [chatProject, setChatProject] = React.useState(saved?.project ?? "");

  const scores = domains.map((d) => healthFor(d)).filter((x): x is number => x !== null);
  const score = all
    ? scores.length
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null
    : healthFor(selected);
  const status = statusForScore(score);
  const tables = React.useMemo<TableInfo[]>(
    () =>
      all
        ? domains
            .flatMap((d) => tablesFor(d, healthFor(d), schedules))
            .sort((a, b) => a.score - b.score)
        : tablesFor(selected, score, schedules),
    // healthFor is a mock keyed by domain; these inputs are what change the result.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [all, selected, score, schedules, domains],
  );
  const scopeSchedules = schedules.filter((s) => all || s.domain === selected);
  const scopeRuns = runs.filter((r) => scopeSchedules.some((s) => s.id === r.scheduleId));
  const table = tables.find((t) => t.name === search.table);
  const scopeProjects = projects.filter((p) => all || p.domain === selected);
  const project = scopeProjects.find((p) => p.id === chatProject);

  const latestProblems = scopeSchedules
    .map((s) => scopeRuns.find((r) => r.scheduleId === s.id))
    .filter((r): r is Run => !!r && (r.status === "failed" || r.status === "attention"));
  const findings = latestProblems.flatMap((r) => r.findings.map((f) => ({ f, run: r })));
  const attention = tables.filter((t) => t.score < 80);
  const live = scopeProjects.filter((p) => p.status === "In progress" || p.status === "Validating");
  const suggested = scopeProjects.filter((p) => p.status === "Suggested");
  const ruleName = (id: string) => rules.find((r) => r.id === id)?.name ?? "Deleted rule";
  const projectOf = (t: TableInfo): Project | undefined =>
    projects.find((p) => p.domain === t.domain && p.tables.includes(t.name));

  const trend = score === null ? [] : trendFor(score, scopeName);

  const openTable = (name?: string) => {
    if (name) setExpanded(true);
    void navigate({ to: "/domain", search: { table: name, all: all || undefined } });
  };
  const discuss = (q: string, tableName?: string) => {
    setAsk({ id: (ask?.id ?? 0) + 1, q });
    if (tableName) openTable(tableName);
  };

  // ---- Charts the agent can put in a reply -------------------------------
  const tableBars = (list: TableInfo[], title: string): ChatVisual => ({
    kind: "bars",
    title,
    max: 100,
    rows: list.map((t) => ({
      label: t.name,
      value: t.score,
      display: String(t.score),
      ask: `${DISCUSS}${t.name}`,
    })),
  });
  const trendVisual: ChatVisual = {
    kind: "trend",
    title: `${scopeName} health, last 14 days`,
    values: trend.length ? trend : [0, 0],
    startLabel: "14 days ago",
    endLabel: "Today",
  };

  // ---- The domain brief: about this scope only, the same for everyone -----
  const lowest = tables[0];
  const brief: BriefLine[] = [
    {
      text:
        score === null
          ? `${scopeName} has no health score yet.`
          : `${scopeName} health is ${score}${status === "good" ? ", in good shape" : status === "warn" ? ", and needs attention" : ", and is at risk"}.`,
      ask: `${DISCUSS}Health score`,
    },
    ...findings.slice(0, 2).map(({ f }) => ({
      text: `${f.title} on ${f.table}.`,
      ask: `${DISCUSS}${f.title}`,
    })),
    ...(findings.length === 0 && scopeSchedules.length > 0
      ? [
          {
            text: `Nothing needs attention. The latest runs on all ${scopeSchedules.length} schedules passed.`,
            ask: `${DISCUSS}Open issues`,
          },
        ]
      : []),
    ...(lowest
      ? [
          {
            text: `${lowest.name} has the lowest score at ${lowest.score}.`,
            ask: `${DISCUSS}${lowest.name}`,
          },
        ]
      : []),
  ];

  // ---- What the agent says ------------------------------------------------
  function reply(q: string): ChatReply {
    if (project) return projectReply(project, q);

    if (q.startsWith(DISCUSS)) {
      const what = q.slice(DISCUSS.length);
      const t = tables.find((x) => x.name === what);
      if (t) {
        const p = projectOf(t);
        const open = findings.filter((x) => x.f.table === t.name);
        return {
          text: `${t.name} (${t.domain}) scores ${t.score} and was checked ${t.lastChecked}. ${
            open.length > 0
              ? `Open: ${open.map((x) => x.f.title.toLowerCase()).join("; ")}.`
              : "No open findings from the latest runs."
          } ${p ? `It is part of “${p.title}”.` : "It is not part of a project."}`,
        };
      }
      const hit = findings.find((x) => x.f.title === what);
      if (hit) {
        return {
          text: `${hit.f.title}. ${hit.f.detail} It is on ${hit.f.table}.`,
          visual: tableBars(
            tables.filter((x) => x.name === hit.f.table),
            "Table score",
          ),
        };
      }
      if (what === "Health score") {
        return {
          text: `${scopeName} scores ${score ?? "—"}. ${lowest ? `${lowest.name} is the weakest at ${lowest.score}.` : ""}`,
          visual: tables.length ? tableBars(tables.slice(0, 5), "Health score by table") : undefined,
        };
      }
      if (what === "Tables") {
        return {
          text: attention.length
            ? `${attention.map((x) => x.name).join(", ")} score below 80.`
            : "No table scores below 80.",
        };
      }
      if (what === "Open issues") {
        return {
          text: findings.length
            ? `${findings.length} open ${findings.length === 1 ? "finding" : "findings"}, mostly on ${findings[0].f.table}.`
            : "No open issues from the latest runs.",
        };
      }
      if (what === "Active projects") {
        return {
          text: `${live.length} in progress or validating, and ${suggested.length} suggested by the agent ${suggested.length === 1 ? "is" : "are"} waiting for an owner.`,
          visual: { kind: "link", label: "Open the board", to: "/projects" },
        };
      }
      if (what.startsWith("Health, last 14 days")) {
        const first = trend[0];
        return {
          text:
            first === undefined || score === null
              ? "There is no history yet."
              : `${scopeName} went from ${first} to ${score} over two weeks${Math.abs(score - first) > 2 ? "." : ", with no real change."}`,
          visual: trendVisual,
        };
      }
    }

    if (table) {
      const open = findings.filter((x) => x.f.table === table.name);
      if (/why|low|score/i.test(q)) {
        return open.length > 0
          ? `${table.name} scores ${table.score} because of: ${open.map((x) => x.f.title.toLowerCase()).join("; ")}.`
          : `${table.name} scores ${table.score}. There are no open findings from the latest runs; the score reflects slightly high null rates in a couple of columns.`;
      }
      if (/check|rule|cover/i.test(q)) {
        const n = scopeSchedules
          .filter((s) => s.tables.includes(table.name))
          .reduce((c, s) => c + s.ruleIds.length, 0);
        return `${n} checks cover ${table.name}. See the Checks tab on the right for which rules and schedules.`;
      }
      return `${table.name} has about ${table.rows} rows and was last checked ${table.lastChecked}. Ask why its score is what it is, or which checks cover it.`;
    }
    if (/project|board/i.test(q)) {
      return {
        text: `${live.length} active and ${suggested.length} suggested in ${scopeName}.`,
        visual: { kind: "link", label: "Open the board", to: "/projects" },
      };
    }
    if (/late|stale|fresh|updated/i.test(q)) {
      const few = tables.slice(0, 3);
      return few.length
        ? `Last checked: ${few.map((t) => `${t.name} (${t.lastChecked})`).join(", ")}. Nothing is overdue against its schedule.`
        : "No tables are monitored yet.";
    }
    if (/first|priorit|look|attention/i.test(q)) {
      return findings.length > 0
        ? `Start with "${findings[0].f.title}" on ${findings[0].f.table}. ${findings[0].f.detail}`
        : `Nothing urgent. ${tables[0]?.name ?? "No table"} has the lowest score at ${tables[0]?.score ?? "—"}, so watch that one.`;
    }
    if (/lowest|worst|tables/i.test(q)) {
      return tables.length === 0
        ? "No tables are monitored here yet. Tell me which warehouse tables belong here and I'll set up a schedule."
        : { text: "Lowest first.", visual: tableBars(tables.slice(0, 5), "Health score by table") };
    }
    return `${scopeName} health is ${score ?? "not measured yet"}. ${findings.length} open ${findings.length === 1 ? "finding" : "findings"} from the latest runs across ${scopeSchedules.length} schedules.`;
  }

  const thread = useChatThread(reply, saved?.turns);

  // A seed prompt (from other pages) is sent once, then dropped from the URL.
  const seeded = React.useRef(false);
  React.useEffect(() => {
    if (!search.q || seeded.current) return;
    seeded.current = true;
    thread.send(search.q);
    void navigate({
      to: "/domain",
      search: { all: search.all, thread: threadId },
      replace: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The first message puts this chat in Recents, nested under its domain
  // (chats about All domains have no domain and sit in the last group).
  React.useEffect(() => {
    if (thread.turns.length === 0) return;
    if (!getThread(threadId)) {
      const first = thread.turns.find((t) => t.role === "user")?.text ?? "New chat";
      createThread({
        id: threadId,
        title: first.replace(DISCUSS, "").slice(0, 48),
        kind: "domain",
        domain: all ? undefined : selected,
      });
    }
    setSaved((prev) => ({
      ...prev,
      [threadId]: { turns: thread.turns, domain: all ? undefined : selected, project: chatProject },
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thread.turns, chatProject]);
  const locked = thread.turns.length > 0;

  const chooseScope = (value: string) => {
    if (locked || value === scopeName) return;
    if (value === ALL_DOMAINS) {
      void navigate({ to: "/domain", search: { all: true } });
    } else {
      selectDomain(value);
      void navigate({ to: "/domain", search: {} });
    }
  };
  const chooseProject = (id: string) => {
    setChatProject(id);
    const p = scopeProjects.find((x) => x.id === id);
    if (p) {
      thread.say(`Now focused on “${p.title}”. What I say from here is about this project.`, {
        kind: "link",
        label: "Open the project",
        to: "/projects",
        search: { project: p.id },
      });
    } else {
      thread.say(`Back to all of ${scopeName}.`);
    }
  };

  const selectCls =
    "rounded-full border bg-white px-2.5 py-1 text-[12.5px] outline-none focus:border-[color:var(--brand-blue)]";
  const composerTop = (
    <div
      className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12.5px]"
      style={{ color: "var(--ink-500)" }}
    >
      {locked ? (
        <span
          className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1"
          style={{ ...card, background: "var(--surface-soft)", color: "var(--ink-900)" }}
          title="The domain is set for this chat. Start a new chat to look at another domain."
        >
          <Lock size={12} aria-hidden="true" />
          Domain: {scopeName} · locked
        </span>
      ) : (
        <label className="flex items-center gap-2">
          Domain
          <select
            value={scopeName}
            onChange={(e) => chooseScope(e.target.value)}
            className={selectCls}
            style={{ ...card, color: "var(--ink-900)" }}
          >
            {domains.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
            <option value={ALL_DOMAINS}>{ALL_DOMAINS}</option>
          </select>
        </label>
      )}
      {!all && (
        <label className="flex items-center gap-2">
          Project
          <select
            value={chatProject}
            onChange={(e) => chooseProject(e.target.value)}
            className={selectCls}
            style={{ ...card, color: "var(--ink-900)" }}
          >
            <option value="">None</option>
            {scopeProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <SplitWorkspace
        panelLabel={table ? `${table.name} details` : `${scopeName} workspace`}
        panelWidth={expanded ? "59vw" : 320}
        center={
          <ScopedChat
            thread={thread}
            scopeLabel={table ? `${scopeName} › ${table.name}` : scopeName}
            placeholder="Ask Reltio…"
            suggestions={[]}
            ask={ask}
            composerTop={composerTop}
            centerWhenEmpty
            header={
              <section aria-label={`${scopeName} chat`}>
                <h1 className="text-[22px] font-semibold" style={{ color: "var(--ink-900)" }}>
                  {all
                    ? "What do you want to know about your data?"
                    : `What do you want to know about ${scopeName} data?`}
                </h1>
                <p className="mt-4 text-[14px]" style={{ color: "var(--ink-700)" }}>
                  {scopeSchedules.length === 0
                    ? "Nothing is monitored here yet. Tell me which tables belong here and how often to check them, and I'll set up the first schedule."
                    : "Ask a question, or pick something from the brief on the right."}
                </p>
              </section>
            }
            reply={reply}
          />
        }
        panel={
          !expanded ? (
            <DomainRail
              domain={scopeName}
              score={score}
              tables={tables}
              brief={brief}
              activeProjects={live.length}
              suggestedProjects={suggested.length}
              onAsk={(q) => discuss(q)}
              onOpenTable={(name) => discuss(`${DISCUSS}${name}`, name)}
              onExpand={() => setExpanded(true)}
              onOpenTables={() => {
                setPanelTab("tables");
                setExpanded(true);
              }}
            />
          ) : (
            <div className="relative flex min-h-0 flex-1 flex-col">
              <button
                type="button"
                onClick={() => {
                  setExpanded(false);
                  if (table) openTable(undefined);
                }}
                aria-label="Minimize the panel"
                title="Minimize the panel"
                className="absolute right-3 top-3 z-10 grid h-7 w-7 place-items-center rounded-md bg-white hover:bg-[color:var(--surface-soft)]"
                style={{ color: "var(--ink-500)" }}
              >
                <Minimize2 size={15} />
              </button>
              {table ? (
                <TableContext
                  table={table}
                  schedules={scopeSchedules}
                  runs={scopeRuns}
                  findings={findings.filter((x) => x.f.table === table.name).map((x) => x.f)}
                  ruleName={ruleName}
                  project={projectOf(table)}
                  onBack={() => {
                    setPanelTab("tables");
                    openTable(undefined);
                  }}
                />
              ) : (
                <DomainPanel
                  scopeName={scopeName}
                  showDomain={all}
                  score={score}
                  trend={trend}
                  tables={tables}
                  brief={brief}
                  attention={attention.length}
                  openIssues={findings.length}
                  live={live.length}
                  suggested={suggested.length}
                  schedules={scopeSchedules}
                  runs={scopeRuns}
                  ruleName={ruleName}
                  projectOf={projectOf}
                  onAsk={(q) => discuss(q)}
                  onOpenTable={openTable}
                  tab={panelTab}
                  onTab={setPanelTab}
                />
              )}
            </div>
          )
        }
      />
    </div>
  );
}

function DomainPanel({
  scopeName,
  showDomain,
  score,
  trend,
  tables,
  brief,
  attention,
  openIssues,
  live,
  suggested,
  schedules,
  runs,
  ruleName,
  projectOf,
  onAsk,
  onOpenTable,
  tab,
  onTab,
}: {
  tab: PanelTab;
  onTab: (tab: PanelTab) => void;
  scopeName: string;
  showDomain: boolean;
  score: number | null;
  trend: number[];
  tables: TableInfo[];
  brief: BriefLine[];
  attention: number;
  openIssues: number;
  live: number;
  suggested: number;
  schedules: Schedule[];
  runs: Run[];
  ruleName: (id: string) => string;
  projectOf: (t: TableInfo) => Project | undefined;
  onAsk: (question: string) => void;
  onOpenTable: (name: string) => void;
}) {
  const [query, setQuery] = React.useState("");
  const lastRun = (s: Schedule) => runs.find((r) => r.scheduleId === s.id);
  const qy = query.trim().toLowerCase();
  const shown = tables.filter(
    (t) => !qy || t.name.toLowerCase().includes(qy) || t.domain.toLowerCase().includes(qy),
  );
  const drift = trend.length > 7 && score !== null ? score - trend[trend.length - 8] : 0;

  return (
    <div className="space-y-5 p-5">
      <div className="flex items-center gap-2 pr-9">
        <Tabs
          label="Domain workspace"
          value={tab}
          onChange={onTab}
          tabs={[
            { id: "overview", label: "Overview" },
            { id: "tables", label: "Tables", hint: String(tables.length) },
            { id: "checks", label: "Checks" },
          ]}
        />
        <Link
          to="/projects"
          className="ml-1 shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-[13px] font-medium hover:bg-[color:var(--surface-soft)]"
          style={{ color: "var(--ink-500)" }}
        >
          Projects ↗
        </Link>
      </div>

      {tab === "overview" && (
        <>
          <section
            className="rounded-xl border bg-white p-1.5"
            style={card}
            aria-label={`${scopeName} brief`}
          >
            <div className="flex items-baseline justify-between gap-3 px-2.5 pb-1 pt-2">
              <h2 className="text-[12.5px] font-semibold" style={{ color: "var(--ink-900)" }}>
                {scopeName} brief
              </h2>
              <span className="text-[11.5px]" style={{ color: "var(--ink-500)" }}>
                About this domain · same for everyone · 6:00am
              </span>
            </div>
            <ul>
              {brief.map((b) => (
                <li key={b.text}>
                  <button
                    type="button"
                    onClick={() => onAsk(b.ask)}
                    className="block w-full rounded-lg px-2.5 py-2 text-left text-[13.5px] leading-relaxed hover:bg-[color:var(--surface-soft)]"
                    style={{ color: "var(--ink-700)" }}
                  >
                    {b.text}
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <div className="grid grid-cols-2 gap-3">
            <StatTile
              label="Health score"
              value={score === null ? "—" : String(score)}
              note={drift < -1 ? `Down ${Math.abs(drift)} this week` : "Steady this week"}
              onClick={() => onAsk(`${DISCUSS}Health score`)}
            />
            <StatTile
              label="Tables"
              value={String(tables.length)}
              note={`${attention} need attention`}
              onClick={() => onAsk(`${DISCUSS}Tables`)}
            />
            <StatTile
              label="Open issues"
              value={String(openIssues)}
              note={openIssues === 0 ? "None from the latest runs" : "From the latest runs"}
              onClick={() => onAsk(`${DISCUSS}Open issues`)}
            />
            <StatTile
              label="Active projects"
              value={String(live)}
              note={`${suggested} suggested`}
              onClick={() => onAsk(`${DISCUSS}Active projects`)}
            />
          </div>

          {score !== null && (
            <div>
              <SectionTitle>Health, last 14 days</SectionTitle>
              <button
                type="button"
                onClick={() => onAsk(`${DISCUSS}Health, last 14 days`)}
                className="block w-full rounded-xl border bg-white p-3 text-left hover:bg-[color:var(--surface-soft)]"
                style={card}
              >
                <Sparkline values={trend} label={`${scopeName} health`} />
                <div
                  className="mt-1 flex justify-between text-[12px]"
                  style={{ color: "var(--ink-500)" }}
                >
                  <span>{trend[0]}</span>
                  <span>{trend[trend.length - 1]}</span>
                </div>
              </button>
            </div>
          )}

          {tables.length > 0 && (
            <div>
              <SectionTitle>Health by table</SectionTitle>
              <ul className="rounded-xl border bg-white p-1.5" style={card}>
                {tables.map((t) => (
                  <li key={`${t.domain}-${t.name}`}>
                    <button
                      type="button"
                      onClick={() => onAsk(`${DISCUSS}${t.name}`)}
                      className="block w-full rounded-lg px-2.5 py-1.5 text-left hover:bg-[color:var(--surface-soft)]"
                    >
                      <span
                        className="flex justify-between text-[12.5px]"
                        style={{ color: "var(--ink-900)" }}
                      >
                        <span>
                          {t.name}
                          {showDomain && (
                            <span
                              className="ml-1.5 text-[11.5px]"
                              style={{ color: "var(--ink-500)" }}
                            >
                              {t.domain}
                            </span>
                          )}
                        </span>
                        <span className="tabular-nums">{t.score}</span>
                      </span>
                      <span
                        className="mt-1 block h-2 overflow-hidden rounded-full"
                        style={{ background: "var(--surface-soft)" }}
                      >
                        <span
                          className="block h-2 rounded-full"
                          style={{
                            width: `${t.score}%`,
                            background: HEALTH_COLOR[statusForScore(t.score)],
                          }}
                        />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="text-[12px]" style={{ color: "var(--ink-500)" }}>
            Select a line, card, chart or bar to discuss it in the chat.
          </p>
        </>
      )}

      {tab === "tables" && (
        <div>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search or filter tables"
            aria-label="Search tables"
            className="w-full rounded-lg border bg-white px-3 py-2 text-[13.5px] outline-none focus:border-[color:var(--brand-blue)]"
            style={{ ...card, color: "var(--ink-900)" }}
          />
          <div className="mt-3">
            <div
              className="grid grid-cols-[1.6fr_.7fr_.9fr_1.2fr] gap-2 px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide"
              style={{ color: "var(--ink-300)" }}
            >
              <span>Table</span>
              <span>Health</span>
              <span>Updated</span>
              <span>Project</span>
            </div>
            <ul className="divide-y rounded-xl border bg-white" style={card}>
              {shown.map((t) => {
                const p = projectOf(t);
                return (
                  <li key={`${t.domain}-${t.name}`}>
                    <button
                      type="button"
                      onClick={() => onOpenTable(t.name)}
                      className="grid w-full grid-cols-[1.6fr_.7fr_.9fr_1.2fr] items-center gap-2 px-2 py-2.5 text-left text-[13px] hover:bg-[color:var(--surface-soft)]"
                    >
                      <span
                        className="min-w-0 truncate font-medium"
                        style={{ color: "var(--ink-900)" }}
                      >
                        {t.name}
                        {showDomain && (
                          <span
                            className="ml-1.5 text-[11.5px] font-normal"
                            style={{ color: "var(--ink-500)" }}
                          >
                            {t.domain}
                          </span>
                        )}
                      </span>
                      <span>
                        <HealthPill score={t.score} status={statusForScore(t.score)} />
                      </span>
                      <span style={{ color: "var(--ink-500)" }}>{t.lastChecked}</span>
                      <span className="min-w-0 truncate">{p && <Tag>{p.title}</Tag>}</span>
                    </button>
                  </li>
                );
              })}
              {shown.length === 0 && (
                <li className="px-3 py-4 text-[13px]" style={{ color: "var(--ink-500)" }}>
                  {tables.length === 0
                    ? "No tables yet. Ask the agent to add some."
                    : "No tables match."}
                </li>
              )}
            </ul>
          </div>
        </div>
      )}

      {tab === "checks" && (
        <>
          {schedules.every((s) => s.ruleIds.length === 0) ? (
            <p className="text-[13.5px]" style={{ color: "var(--ink-500)" }}>
              No checks here yet.
            </p>
          ) : (
            <ul className="divide-y rounded-xl border bg-white" style={card}>
              {schedules.flatMap((s) =>
                s.ruleIds.map((id) => {
                  const r = lastRun(s);
                  return (
                    <li key={`${s.id}-${id}`} className="px-3.5 py-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <Link
                          to="/rules"
                          search={{ rule: id }}
                          className="text-[13.5px] font-medium underline"
                          style={{ color: "var(--ink-900)" }}
                        >
                          {ruleName(id)}
                        </Link>
                        {r && <RunPill status={r.status} />}
                      </div>
                      <div className="mt-0.5 text-[12px]" style={{ color: "var(--ink-500)" }}>
                        {s.name} · {s.tables.join(", ")}
                      </div>
                    </li>
                  );
                }),
              )}
            </ul>
          )}
          <p className="text-[12.5px]" style={{ color: "var(--ink-500)" }}>
            To add a check, tell the agent which table and what should be true.
          </p>
        </>
      )}
    </div>
  );
}

function TableContext({
  table,
  schedules,
  runs,
  findings,
  ruleName,
  project,
  onBack,
}: {
  table: TableInfo;
  schedules: Schedule[];
  runs: Run[];
  findings: Finding[];
  ruleName: (id: string) => string;
  project?: Project;
  onBack: () => void;
}) {
  const [tab, setTab] = React.useState<TableTab>("overview");
  const covering = schedules.filter((s) => s.tables.includes(table.name));
  const tableRuns = runs.filter((r) => covering.some((s) => s.id === r.scheduleId));
  const columns = columnsFor(table.name);
  const sample = React.useMemo(() => sampleFor(table.name), [table.name]);
  const checksRun = tableRuns[0]?.checksRun ?? 0;
  const checksFailed = tableRuns[0]?.checksFailed ?? 0;
  const failingRules = new Set(findings.map((f) => f.ruleId));

  return (
    <div className="space-y-5 p-5">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-[13px]"
        style={{ color: "var(--ink-500)" }}
      >
        <ArrowLeft size={14} /> Tables
      </button>
      <div>
        <div className="flex items-center gap-3 pr-9">
          <h2 className="text-[17px] font-semibold" style={{ color: "var(--ink-900)" }}>
            {table.name}
          </h2>
          <HealthPill score={table.score} status={statusForScore(table.score)} />
        </div>
        <div className="mt-1 text-[12.5px]" style={{ color: "var(--ink-500)" }}>
          {table.domain} · {table.rows} rows · updated {table.lastChecked}
        </div>
      </div>

      <Tabs
        label="Table details"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "overview", label: "Overview" },
          { id: "columns", label: "Columns" },
          { id: "sample", label: "Sample data" },
          { id: "events", label: "Events" },
          { id: "checks", label: "Checks" },
        ]}
      />

      {tab === "overview" && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <StatTile
              label="Health score"
              value={String(table.score)}
              note={table.score >= 90 ? "Healthy" : "Needs attention"}
            />
            <StatTile label="Rows" value={table.rows} note={`Updated ${table.lastChecked}`} />
            <StatTile
              label="Checks passing"
              value={checksRun ? `${checksRun - checksFailed} of ${checksRun}` : "—"}
              note={checksRun ? "Latest run" : "No runs yet"}
            />
          </div>
          <div>
            <SectionTitle>Open findings</SectionTitle>
            {findings.length === 0 ? (
              <p className="text-[13.5px]" style={{ color: "var(--ink-500)" }}>
                None from the latest runs.
              </p>
            ) : (
              <ul className="space-y-2">
                {findings.map((f) => (
                  <li key={f.title} className="rounded-xl border bg-white p-3" style={card}>
                    <div className="text-[13.5px] font-semibold" style={{ color: "var(--ink-900)" }}>
                      {f.title}
                    </div>
                    <p className="mt-1 text-[12.5px]" style={{ color: "var(--ink-700)" }}>
                      {f.detail}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <SectionTitle>Project</SectionTitle>
            {project ? (
              <Link
                to="/projects"
                search={{ project: project.id }}
                className="text-[13.5px] font-medium underline"
                style={{ color: "var(--brand-blue)" }}
              >
                {project.title}
              </Link>
            ) : (
              <p className="text-[13.5px]" style={{ color: "var(--ink-500)" }}>
                This table isn't part of a project.
              </p>
            )}
          </div>
        </>
      )}

      {tab === "columns" && (
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="text-[11px] uppercase tracking-wide" style={{ color: "var(--ink-300)" }}>
              <th className="py-1.5 font-semibold">Column</th>
              <th className="py-1.5 font-semibold">Type</th>
              <th className="py-1.5 text-right font-semibold">Filled</th>
              <th className="py-1.5 text-right font-semibold">Distinct</th>
            </tr>
          </thead>
          <tbody>
            {columns.map((c) => (
              <tr key={c.name} className="border-t" style={{ borderColor: "var(--hairline)" }}>
                <td className="py-2 font-mono font-medium" style={{ color: "var(--ink-900)" }}>
                  {c.name}
                </td>
                <td className="py-2" style={{ color: "var(--ink-500)" }}>
                  {c.type}
                </td>
                <td className="py-2 text-right tabular-nums">{+(100 - c.nullPct).toFixed(1)}%</td>
                <td className="py-2 text-right tabular-nums">{c.distinct}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === "sample" && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12.5px]">
            <thead>
              <tr
                className="text-[11px] uppercase tracking-wide"
                style={{ color: "var(--ink-300)" }}
              >
                {sample.head.map((h) => (
                  <th key={h} className="whitespace-nowrap py-1.5 pr-3 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sample.rows.map((row, i) => (
                <tr key={i} className="border-t" style={{ borderColor: "var(--hairline)" }}>
                  {row.map((cell, j) => (
                    <td
                      key={j}
                      className="whitespace-nowrap py-2 pr-3 font-mono"
                      style={{ color: cell === "—" ? "var(--ink-300)" : "var(--ink-700)" }}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-[12px]" style={{ color: "var(--ink-500)" }}>
            A few example rows. Values are illustrative.
          </p>
        </div>
      )}

      {tab === "events" && (
        <ul className="divide-y rounded-xl border bg-white" style={card}>
          {tableRuns.slice(0, 4).map((r) => (
            <li key={r.id}>
              <Link
                to="/scheduled"
                search={{ run: r.id }}
                className="flex items-center gap-3 px-3.5 py-2.5 text-[13px] hover:bg-[color:var(--surface-soft)]"
              >
                <RunPill status={r.status} />
                <span className="min-w-0 flex-1 truncate" style={{ color: "var(--ink-900)" }}>
                  {r.status === "passed" ? "Daily checks passed" : "Daily checks found failures"} ·{" "}
                  {schedules.find((s) => s.id === r.scheduleId)?.name}
                </span>
                <span style={{ color: "var(--ink-300)" }}>{ago(r.hoursAgo)}</span>
              </Link>
            </li>
          ))}
          {[
            ["Schema unchanged", "This week"],
            ["Profiling refreshed", "Yesterday"],
          ].map(([what, when]) => (
            <li key={what} className="flex items-center justify-between px-3.5 py-2.5 text-[13px]">
              <span style={{ color: "var(--ink-900)" }}>{what}</span>
              <span style={{ color: "var(--ink-300)" }}>{when}</span>
            </li>
          ))}
        </ul>
      )}

      {tab === "checks" &&
        (covering.every((s) => s.ruleIds.length === 0) ? (
          <p className="text-[13.5px]" style={{ color: "var(--ink-500)" }}>
            No checks cover this table yet.
          </p>
        ) : (
          <ul className="divide-y rounded-xl border bg-white" style={card}>
            {covering.flatMap((s) =>
              s.ruleIds.map((id) => {
                const failing = failingRules.has(id);
                return (
                  <li key={`${s.id}-${id}`} className="flex items-start gap-3 px-3.5 py-2.5">
                    <span
                      className="mt-0.5 rounded-full px-2 py-0.5 text-[11px] font-medium"
                      style={{
                        background: "var(--surface-soft)",
                        color: failing ? "var(--status-bad)" : "var(--status-good)",
                      }}
                    >
                      {failing ? "Failing" : "Passing"}
                    </span>
                    <span className="min-w-0 flex-1">
                      <Link
                        to="/rules"
                        search={{ rule: id }}
                        className="text-[13.5px] font-medium underline"
                        style={{ color: "var(--ink-900)" }}
                      >
                        {ruleName(id)}
                      </Link>
                      <span className="block text-[12px]" style={{ color: "var(--ink-500)" }}>
                        in {s.name}
                      </span>
                    </span>
                  </li>
                );
              }),
            )}
          </ul>
        ))}
    </div>
  );
}
