import * as React from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Minimize2 } from "lucide-react";
import { statusForScore, useDomainState } from "@/components/domain-context";
import {
  HealthPill,
  RunPill,
  ScopedChat,
  SectionTitle,
  Sparkline,
  SplitWorkspace,
  StatTile,
  Tabs,
} from "@/components/workspace/primitives";
import { ago } from "@/components/scheduled/format";
import {
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
import { DomainRail, type BriefLine } from "./domain-rail";

export type DomainSearch = { table?: string };

type PanelTab = "summary" | "tables" | "checks";
type TableTab = "summary" | "columns" | "checks" | "runs";

/**
 * Domain home. The briefing lives in chat; the right panel holds Summary,
 * Tables and Checks. Opening a table keeps the same chat going and swaps the
 * right panel to that table.
 */
export function DomainScreen({ search }: { search: DomainSearch }) {
  const navigate = useNavigate();
  const { selected: domain, healthFor } = useDomainState();
  const { schedules } = useSchedules();
  const { runs } = useRuns(schedules);
  const { rules } = useRules();
  const { projects } = useProjects();
  // The right panel starts minimized. Opening a table, or Tables on the rail, expands it.
  const [expanded, setExpanded] = React.useState(!!search.table);
  const [panelTab, setPanelTab] = React.useState<PanelTab>("summary");
  const [ask, setAsk] = React.useState<{ id: number; q: string } | null>(null);

  const score = healthFor(domain);
  const status = statusForScore(score);
  const tables = React.useMemo(
    () => tablesFor(domain, score, schedules),
    [domain, score, schedules],
  );
  const domainSchedules = schedules.filter((s) => s.domain === domain);
  const domainRuns = runs.filter((r) => domainSchedules.some((s) => s.id === r.scheduleId));
  const table = tables.find((t) => t.name === search.table);

  const latestProblems = domainSchedules
    .map((s) => domainRuns.find((r) => r.scheduleId === s.id))
    .filter((r): r is Run => !!r && (r.status === "failed" || r.status === "attention"));
  const findings = latestProblems.flatMap((r) => r.findings.map((f) => ({ f, run: r })));

  const openTable = (name?: string) => {
    if (name) setExpanded(true);
    void navigate({ to: "/domain", search: { table: name } });
  };

  // The domain brief: about this domain only, the same for everyone.
  const lowestTable = tables[0];
  const brief: BriefLine[] = [
    {
      text:
        score === null
          ? `${domain} has no health score yet.`
          : `${domain} health is ${score}${status === "good" ? ", in good shape" : status === "warn" ? ", and needs attention" : ", and is at risk"}.`,
      ask: "What should I look at first?",
    },
    ...findings.slice(0, 2).map(({ f }) => ({ text: `${f.title} on ${f.table}.`, ask: `Tell me about: ${f.title}` })),
    ...(findings.length === 0 && domainSchedules.length > 0
      ? [{ text: `Nothing needs attention. The latest runs on all ${domainSchedules.length} schedules passed.`, ask: "What should I look at first?" }]
      : []),
    ...(lowestTable
      ? [{ text: `${lowestTable.name} has the lowest score at ${lowestTable.score}.`, ask: "Which tables are lowest?" }]
      : []),
  ];
  const domainProjects = projects.filter((p) => p.domain === domain);
  const activeProjects = domainProjects.filter(
    (p) => p.status === "In progress" || p.status === "Validating",
  ).length;
  const suggestedProjects = domainProjects.filter((p) => p.status === "Suggested").length;
  const ruleName = (id: string) => rules.find((r) => r.id === id)?.name ?? "Deleted rule";

  function reply(q: string): string {
    if (table) {
      const open = findings.filter((x) => x.f.table === table.name);
      if (/why|low|score/i.test(q)) {
        return open.length > 0
          ? `${table.name} scores ${table.score} because of: ${open.map((x) => x.f.title.toLowerCase()).join("; ")}.`
          : `${table.name} scores ${table.score}. There are no open findings from the latest runs; the score reflects slightly high null rates in a couple of columns.`;
      }
      if (/check|rule|cover/i.test(q)) {
        const n = domainSchedules
          .filter((s) => s.tables.includes(table.name))
          .reduce((c, s) => c + s.ruleIds.length, 0);
        return `${n} checks cover ${table.name}. See the Checks tab on the right for which rules and schedules.`;
      }
      return `${table.name} has about ${table.rows} rows and was last checked ${table.lastChecked}. Ask why its score is what it is, or which checks cover it.`;
    }
    const asked = findings.find((x) => q.includes(x.f.title));
    if (asked) {
      return `${asked.f.title}. ${asked.f.detail} It is on ${asked.f.table}: open the Tables tab to see it, or see the run under Jobs.`;
    }
    if (/first|priorit|look|attention/i.test(q)) {
      return findings.length > 0
        ? `Start with "${findings[0].f.title}" on ${findings[0].f.table}. ${findings[0].f.detail}`
        : `Nothing urgent. ${tables[0]?.name ?? "No table"} has the lowest score at ${tables[0]?.score ?? "—"}, so watch that one.`;
    }
    if (/lowest|worst|tables/i.test(q)) {
      return tables.length === 0
        ? "No tables are monitored in this domain yet. Tell me which warehouse tables belong here and I'll set up a schedule."
        : `Lowest first: ${tables
            .slice(0, 3)
            .map((t) => `${t.name} (${t.score})`)
            .join(", ")}.`;
    }
    return `${domain} health is ${score ?? "not measured yet"}. ${findings.length} open ${findings.length === 1 ? "finding" : "findings"} from the latest runs across ${domainSchedules.length} schedules.`;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <SplitWorkspace
        panelLabel={table ? `${table.name} details` : `${domain} workspace`}
        panelWidth={expanded ? "59vw" : 320}
        center={
          <ScopedChat
            key={domain}
            scopeLabel={table ? `${domain} › ${table.name}` : domain}
            placeholder={table ? `Ask about ${table.name}…` : `Ask about ${domain}…`}
            suggestions={
              table
                ? ["Why is its score what it is?", "Which checks cover it?"]
                : ["What should I look at first?", "Which tables are lowest?"]
            }
            reply={reply}
            ask={ask}
            header={
              <section aria-label={`${domain} briefing`}>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-[22px] font-semibold" style={{ color: "var(--ink-900)" }}>
                    {domain}
                  </h1>
                  <HealthPill score={score} status={status} />
                </div>
                <p className="mt-4 text-[14px]" style={{ color: "var(--ink-700)" }}>
                  {domainSchedules.length === 0
                    ? "Nothing is monitored in this domain yet. Tell me which tables belong here and how often to check them, and I'll set up the first schedule."
                    : `Ask about ${domain}, or pick something from the brief on the right.`}
                </p>
              </section>
            }
          />
        }
        panel={
          !expanded ? (
            <DomainRail
              domain={domain}
              score={score}
              tables={tables}
              brief={brief}
              activeProjects={activeProjects}
              suggestedProjects={suggestedProjects}
              onAsk={(q) => setAsk({ id: (ask?.id ?? 0) + 1, q })}
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
                  schedules={domainSchedules}
                  runs={domainRuns}
                  findings={findings.filter((x) => x.f.table === table.name).map((x) => x.f)}
                  ruleName={ruleName}
                  onBack={() => openTable(undefined)}
                />
              ) : (
                <DomainPanel
                  domain={domain}
                  score={score}
                  tables={tables}
                  schedules={domainSchedules}
                  runs={domainRuns}
                  ruleName={ruleName}
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
  domain,
  score,
  tables,
  schedules,
  runs,
  ruleName,
  onOpenTable,
  tab,
  onTab,
}: {
  tab: PanelTab;
  onTab: (tab: PanelTab) => void;
  domain: string;
  score: number | null;
  tables: TableInfo[];
  schedules: Schedule[];
  runs: Run[];
  ruleName: (id: string) => string;
  onOpenTable: (name: string) => void;
}) {
  const week = runs.filter((r) => r.hoursAgo <= 168);
  const lastRun = (s: Schedule) => runs.find((r) => r.scheduleId === s.id);

  return (
    <div className="space-y-5 p-5">
      <Tabs
        label="Domain workspace"
        value={tab}
        onChange={onTab}
        tabs={[
          { id: "summary", label: "Summary" },
          { id: "tables", label: "Tables", hint: String(tables.length) },
          { id: "checks", label: "Checks" },
        ]}
      />

      {tab === "summary" && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <StatTile label="Health" value={score === null ? "—" : String(score)} />
            <StatTile label="Tables" value={String(tables.length)} />
            <StatTile label="Schedules" value={String(schedules.length)} />
            <StatTile
              label="Failed runs, 7 days"
              value={String(week.filter((r) => r.status === "failed").length)}
            />
          </div>
          {score !== null && (
            <div>
              <SectionTitle>Last 14 days</SectionTitle>
              <div
                className="rounded-xl border bg-white p-3"
                style={{ borderColor: "var(--hairline)" }}
              >
                <Sparkline values={trendFor(score, domain)} label={`${domain} health`} />
              </div>
            </div>
          )}
          <div>
            <SectionTitle>Recent runs</SectionTitle>
            {runs.length === 0 ? (
              <p className="text-[13.5px]" style={{ color: "var(--ink-500)" }}>
                No runs yet.
              </p>
            ) : (
              <ul
                className="divide-y rounded-xl border bg-white"
                style={{ borderColor: "var(--hairline)" }}
              >
                {runs.slice(0, 5).map((r) => (
                  <li key={r.id}>
                    <Link
                      to="/scheduled"
                      search={{ run: r.id }}
                      className="flex items-center gap-3 px-3.5 py-2.5 text-[13px] hover:bg-[color:var(--surface-soft)]"
                    >
                      <RunPill status={r.status} />
                      <span className="min-w-0 flex-1 truncate" style={{ color: "var(--ink-900)" }}>
                        {schedules.find((s) => s.id === r.scheduleId)?.name}
                      </span>
                      <span style={{ color: "var(--ink-300)" }}>{ago(r.hoursAgo)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      {tab === "tables" &&
        (tables.length === 0 ? (
          <p className="text-[13.5px]" style={{ color: "var(--ink-500)" }}>
            No tables yet. Ask the agent to add some.
          </p>
        ) : (
          <ul
            className="divide-y rounded-xl border bg-white"
            style={{ borderColor: "var(--hairline)" }}
          >
            {tables.map((t) => (
              <li key={t.name}>
                <button
                  type="button"
                  onClick={() => onOpenTable(t.name)}
                  className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left hover:bg-[color:var(--surface-soft)]"
                >
                  <span className="min-w-0 flex-1">
                    <span
                      className="block truncate text-[13.5px] font-medium"
                      style={{ color: "var(--ink-900)" }}
                    >
                      {t.name}
                    </span>
                    <span className="block text-[12px]" style={{ color: "var(--ink-500)" }}>
                      {t.rows} rows · {t.openFindings} open{" "}
                      {t.openFindings === 1 ? "finding" : "findings"}
                    </span>
                  </span>
                  <HealthPill score={t.score} status={statusForScore(t.score)} />
                </button>
              </li>
            ))}
          </ul>
        ))}

      {tab === "checks" && (
        <>
          {schedules.every((s) => s.ruleIds.length === 0) ? (
            <p className="text-[13.5px]" style={{ color: "var(--ink-500)" }}>
              No checks in this domain yet.
            </p>
          ) : (
            <ul
              className="divide-y rounded-xl border bg-white"
              style={{ borderColor: "var(--hairline)" }}
            >
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
  onBack,
}: {
  table: TableInfo;
  schedules: Schedule[];
  runs: Run[];
  findings: Finding[];
  ruleName: (id: string) => string;
  onBack: () => void;
}) {
  const [tab, setTab] = React.useState<TableTab>("summary");
  const covering = schedules.filter((s) => s.tables.includes(table.name));
  const tableRuns = runs.filter((r) => covering.some((s) => s.id === r.scheduleId));
  const columns = columnsFor(table.name);

  return (
    <div className="space-y-5 p-5">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-[13px]"
        style={{ color: "var(--ink-500)" }}
      >
        <ArrowLeft size={14} /> {table.domain}
      </button>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[17px] font-semibold" style={{ color: "var(--ink-900)" }}>
          {table.name}
        </h2>
        <HealthPill score={table.score} status={statusForScore(table.score)} />
      </div>

      <Tabs
        label="Table details"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "summary", label: "Summary" },
          { id: "columns", label: "Columns" },
          { id: "checks", label: "Checks" },
          { id: "runs", label: "Runs" },
        ]}
      />

      {tab === "summary" && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <StatTile label="Rows" value={table.rows} />
            <StatTile label="Open findings" value={String(findings.length || table.openFindings)} />
            <StatTile label="Last checked" value={table.lastChecked} />
            <StatTile label="Schedules" value={String(covering.length)} />
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
                  <li
                    key={f.title}
                    className="rounded-xl border bg-white p-3"
                    style={{ borderColor: "var(--hairline)" }}
                  >
                    <div
                      className="text-[13.5px] font-semibold"
                      style={{ color: "var(--ink-900)" }}
                    >
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
        </>
      )}

      {tab === "columns" && (
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="text-[11px] uppercase tracking-wide" style={{ color: "var(--ink-300)" }}>
              <th className="py-1.5 font-semibold">Column</th>
              <th className="py-1.5 font-semibold">Type</th>
              <th className="py-1.5 text-right font-semibold">Empty</th>
              <th className="py-1.5 text-right font-semibold">Distinct</th>
            </tr>
          </thead>
          <tbody>
            {columns.map((c) => (
              <tr key={c.name} className="border-t" style={{ borderColor: "var(--hairline)" }}>
                <td className="py-2 font-medium" style={{ color: "var(--ink-900)" }}>
                  {c.name}
                </td>
                <td className="py-2" style={{ color: "var(--ink-500)" }}>
                  {c.type}
                </td>
                <td className="py-2 text-right tabular-nums">{c.nullPct}%</td>
                <td className="py-2 text-right tabular-nums">{c.distinct}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === "checks" &&
        (covering.every((s) => s.ruleIds.length === 0) ? (
          <p className="text-[13.5px]" style={{ color: "var(--ink-500)" }}>
            No checks cover this table yet.
          </p>
        ) : (
          <ul
            className="divide-y rounded-xl border bg-white"
            style={{ borderColor: "var(--hairline)" }}
          >
            {covering.flatMap((s) =>
              s.ruleIds.map((id) => (
                <li key={`${s.id}-${id}`} className="px-3.5 py-2.5">
                  <Link
                    to="/rules"
                    search={{ rule: id }}
                    className="text-[13.5px] font-medium underline"
                    style={{ color: "var(--ink-900)" }}
                  >
                    {ruleName(id)}
                  </Link>
                  <div className="text-[12px]" style={{ color: "var(--ink-500)" }}>
                    in {s.name}
                  </div>
                </li>
              )),
            )}
          </ul>
        ))}

      {tab === "runs" &&
        (tableRuns.length === 0 ? (
          <p className="text-[13.5px]" style={{ color: "var(--ink-500)" }}>
            No runs cover this table yet.
          </p>
        ) : (
          <ul
            className="divide-y rounded-xl border bg-white"
            style={{ borderColor: "var(--hairline)" }}
          >
            {tableRuns.slice(0, 8).map((r) => (
              <li key={r.id}>
                <Link
                  to="/scheduled"
                  search={{ run: r.id }}
                  className="flex items-center gap-3 px-3.5 py-2.5 text-[13px] hover:bg-[color:var(--surface-soft)]"
                >
                  <RunPill status={r.status} />
                  <span className="min-w-0 flex-1 truncate" style={{ color: "var(--ink-900)" }}>
                    {schedules.find((s) => s.id === r.scheduleId)?.name}
                  </span>
                  <span style={{ color: "var(--ink-300)" }}>{ago(r.hoursAgo)}</span>
                </Link>
              </li>
            ))}
          </ul>
        ))}
    </div>
  );
}
