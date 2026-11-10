import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { Maximize2, Minimize2 } from "lucide-react";
import { HEALTH_COLOR, SectionTitle, Sparkline } from "@/components/workspace/primitives";
import { statusForScore, useDomainState } from "@/components/domain-context";
import { ALL_DOMAINS, tablesFor, trendFor } from "@/lib/mock-ops";
import { useSchedules } from "@/lib/ops-store";
import { useProjects } from "@/lib/projects-store";

type Row = { label: string; score: number };

/** Everything the rail and the panel show about a scope, in one place. */
function useScopeSummary(scope: string) {
  const { domains, healthFor } = useDomainState();
  const { schedules } = useSchedules();
  const { projects } = useProjects();
  return React.useMemo(() => {
    const isAll = scope === ALL_DOMAINS;
    const scored = domains
      .map((d) => ({ label: d, score: healthFor(d) }))
      .filter((r): r is Row => r.score !== null);
    const score = isAll
      ? scored.length
        ? Math.round(scored.reduce((n, r) => n + r.score, 0) / scored.length)
        : 85
      : (healthFor(scope) ?? 85);
    const rows: Row[] = isAll
      ? scored
      : tablesFor(scope, healthFor(scope), schedules).map((t) => ({ label: t.name, score: t.score }));
    const sorted = [...rows].sort((a, b) => a.score - b.score);
    const scoped = isAll ? projects : projects.filter((p) => p.domain === scope);
    return {
      isAll,
      score,
      trend: trendFor(score, scope),
      rows: sorted,
      lowest: sorted.slice(0, 3),
      needAttention: sorted.filter((r) => r.score < 80).length,
      active: scoped.filter((p) => p.status === "In progress" || p.status === "Validating").length,
      suggested: scoped.filter((p) => p.status === "Suggested").length,
    };
  }, [scope, domains, healthFor, schedules, projects]);
}

function Bars({ rows }: { rows: Row[] }) {
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="flex justify-between text-[12.5px]" style={{ color: "var(--ink-900)" }}>
            <span className="truncate">{r.label}</span>
            <span className="tabular-nums">{r.score}</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full" style={{ background: "var(--surface-soft)" }}>
            <div
              className="h-2 rounded-full"
              style={{ width: `${r.score}%`, background: HEALTH_COLOR[statusForScore(r.score)] }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function useOpenProjects(scope: string) {
  const navigate = useNavigate();
  const { selectDomain } = useDomainState();
  return React.useCallback(() => {
    if (scope !== ALL_DOMAINS) selectDomain(scope);
    void navigate({ to: "/projects", search: {} });
  }, [scope, selectDomain, navigate]);
}

const labelCls = "text-[11px] font-semibold uppercase tracking-wide";

/**
 * The minimized right panel for a domain chat: the score and trend, the
 * lowest rows, and doors into Tables and Projects. It has no brief; the brief
 * belongs to dashboards. Expanding opens the full panel.
 */
export function ScopeRail({
  scope,
  onExpand,
  onOpenTables,
}: {
  scope: string;
  onExpand: () => void;
  onOpenTables: () => void;
}) {
  const s = useScopeSummary(scope);
  const openProjects = useOpenProjects(scope);
  const status = statusForScore(s.score);
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-white px-4 py-4">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[14px] font-semibold" style={{ color: "var(--ink-900)" }}>
          {scope}
        </span>
        <button
          type="button"
          onClick={onExpand}
          aria-label="Open the full panel"
          title="Open the full panel"
          className="grid h-7 w-7 place-items-center rounded-md hover:bg-[color:var(--surface-soft)]"
          style={{ color: "var(--ink-500)" }}
        >
          <Maximize2 size={15} />
        </button>
      </div>

      <section className="mt-5">
        <h2 className={labelCls} style={{ color: "var(--ink-500)" }}>
          Health score
        </h2>
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="text-[28px] font-semibold leading-none" style={{ color: "var(--ink-900)" }}>
            {s.score}
          </span>
          <span className="text-[12px]" style={{ color: HEALTH_COLOR[status] }}>
            {s.needAttention} of {s.rows.length} {s.isAll ? "domains" : "tables"} need attention
          </span>
        </div>
        <div className="mt-2">
          <Sparkline values={s.trend} label={`${scope} health over 14 days`} />
        </div>
      </section>

      <section className="mt-5">
        <h2 className={labelCls} style={{ color: "var(--ink-500)" }}>
          {s.isAll ? "Lowest domains" : "Lowest tables"}
        </h2>
        <div className="mt-2">
          <Bars rows={s.lowest} />
        </div>
      </section>

      <section className="mt-6 space-y-2 border-t pt-4" style={{ borderColor: "var(--hairline)" }}>
        {!s.isAll && (
          <button
            type="button"
            onClick={onOpenTables}
            className="flex w-full items-center justify-between rounded-lg border bg-white px-3 py-2.5 text-left text-[13px] hover:bg-[color:var(--surface-soft)]"
            style={{ borderColor: "var(--hairline)", color: "var(--ink-900)" }}
          >
            <span>Tables</span>
            <span style={{ color: "var(--ink-500)" }}>
              {s.rows.length} · {s.needAttention} need attention ›
            </span>
          </button>
        )}
        <button
          type="button"
          onClick={openProjects}
          className="flex w-full items-center justify-between rounded-lg border bg-white px-3 py-2.5 text-left text-[13px] hover:bg-[color:var(--surface-soft)]"
          style={{ borderColor: "var(--hairline)", color: "var(--ink-900)" }}
        >
          <span>Projects</span>
          <span style={{ color: "var(--ink-500)" }}>
            {s.active} active · {s.suggested} suggested ›
          </span>
        </button>
      </section>
    </div>
  );
}

/** The expanded panel: Overview and Tables for the scope. */
export function ScopePanel({
  scope,
  tab,
  onTab,
  onMinimize,
}: {
  scope: string;
  tab: "overview" | "tables";
  onTab: (tab: "overview" | "tables") => void;
  onMinimize: () => void;
}) {
  const s = useScopeSummary(scope);
  const openProjects = useOpenProjects(scope);
  const tabs: { id: "overview" | "tables"; label: string }[] = [
    { id: "overview", label: "Overview" },
    ...(s.isAll ? [] : [{ id: "tables" as const, label: "Tables" }]),
  ];
  const current = s.isAll ? "overview" : tab;
  const stats = [
    { label: "Health score", value: String(s.score) },
    { label: s.isAll ? "Domains" : "Tables", value: String(s.rows.length) },
    { label: "Need attention", value: String(s.needAttention) },
    { label: "Active projects", value: String(s.active), note: `${s.suggested} suggested` },
  ];
  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-white">
      <div className="flex items-center gap-3 border-b px-5 py-3" style={{ borderColor: "var(--hairline)" }}>
        <h2 className="truncate text-[15px] font-semibold" style={{ color: "var(--ink-900)" }}>
          {scope}
        </h2>
        <div role="tablist" className="ml-2 flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={current === t.id}
              onClick={() => onTab(t.id)}
              className="rounded-md px-2.5 py-1 text-[13px]"
              style={
                current === t.id
                  ? { background: "var(--surface-soft)", color: "var(--ink-900)", fontWeight: 600 }
                  : { color: "var(--ink-500)" }
              }
            >
              {t.label}
            </button>
          ))}
          <button
            type="button"
            onClick={openProjects}
            className="rounded-md px-2.5 py-1 text-[13px] hover:bg-[color:var(--surface-soft)]"
            style={{ color: "var(--ink-500)" }}
          >
            Projects ↗
          </button>
        </div>
        <button
          type="button"
          onClick={onMinimize}
          aria-label="Minimize the panel"
          title="Minimize the panel"
          className="ml-auto grid h-7 w-7 place-items-center rounded-md hover:bg-[color:var(--surface-soft)]"
          style={{ color: "var(--ink-500)" }}
        >
          <Minimize2 size={15} />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        {current === "overview" ? (
          <div className="space-y-6">
            <ul className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              {stats.map((st) => (
                <li
                  key={st.label}
                  className="rounded-xl border bg-white px-3.5 py-3"
                  style={{ borderColor: "var(--hairline)" }}
                >
                  <div className="text-[12px]" style={{ color: "var(--ink-500)" }}>
                    {st.label}
                  </div>
                  <div className="text-[24px] font-semibold leading-tight" style={{ color: "var(--ink-900)" }}>
                    {st.value}
                  </div>
                  {st.note && (
                    <div className="text-[12px]" style={{ color: "var(--ink-500)" }}>
                      {st.note}
                    </div>
                  )}
                </li>
              ))}
            </ul>
            <div>
              <SectionTitle>Health, last 14 days</SectionTitle>
              <div className="rounded-xl border bg-white p-3" style={{ borderColor: "var(--hairline)" }}>
                <Sparkline values={s.trend} label={`${scope} health over 14 days`} />
              </div>
            </div>
            <div>
              <SectionTitle>{s.isAll ? "Health by domain" : "Health by table"}</SectionTitle>
              <div className="rounded-xl border bg-white p-3.5" style={{ borderColor: "var(--hairline)" }}>
                <Bars rows={s.rows} />
              </div>
            </div>
          </div>
        ) : (
          <ul className="divide-y rounded-xl border bg-white" style={{ borderColor: "var(--hairline)" }}>
            {s.rows.map((r) => (
              <li key={r.label} className="flex items-center justify-between px-4 py-2.5 text-[13.5px]">
                <span className="truncate font-medium" style={{ color: "var(--ink-900)" }}>
                  {r.label}
                </span>
                <span className="flex items-center gap-2 tabular-nums" style={{ color: "var(--ink-700)" }}>
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: HEALTH_COLOR[statusForScore(r.score)] }}
                    aria-hidden="true"
                  />
                  {r.score}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
