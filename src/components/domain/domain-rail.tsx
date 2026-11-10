import { Link } from "@tanstack/react-router";
import { Maximize2 } from "lucide-react";
import { HealthPill, HEALTH_COLOR, Sparkline } from "@/components/workspace/primitives";
import { statusForScore, STATUS_LABEL } from "@/components/domain-context";
import { trendFor, type TableInfo } from "@/lib/mock-ops";

export type BriefLine = { text: string; ask: string };

const label = "text-[11px] font-semibold uppercase tracking-wide";

/**
 * The minimized right panel of a domain. The brief here is about the domain
 * itself: it is the same for everyone and is not customizable (a dashboard's
 * "My brief" is the customizable one). Selecting a line asks about it in the chat.
 */
export function DomainRail({
  domain,
  score,
  tables,
  brief,
  activeProjects,
  suggestedProjects,
  onAsk,
  onExpand,
  onOpenTables,
}: {
  domain: string;
  score: number | null;
  tables: TableInfo[];
  brief: BriefLine[];
  activeProjects: number;
  suggestedProjects: number;
  onAsk: (question: string) => void;
  onExpand: () => void;
  onOpenTables: () => void;
}) {
  const status = statusForScore(score);
  const lowest = [...tables].sort((a, b) => a.score - b.score).slice(0, 3);
  const attention = tables.filter((t) => t.score < 80).length;
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-white px-4 py-4">
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate text-[14px] font-semibold" style={{ color: "var(--ink-900)" }}>
            {domain}
          </span>
          <HealthPill score={score} status={status} />
        </span>
        <button
          type="button"
          onClick={onExpand}
          aria-label="Open the full panel"
          title="Open the full panel"
          className="grid h-7 w-7 shrink-0 place-items-center rounded-md hover:bg-[color:var(--surface-soft)]"
          style={{ color: "var(--ink-500)" }}
        >
          <Maximize2 size={15} />
        </button>
      </div>

      <section
        className="mt-4 rounded-xl border bg-white p-1.5"
        style={{ borderColor: "var(--hairline)" }}
        aria-label={`${domain} brief`}
      >
        <div className="flex items-baseline justify-between px-2.5 pb-1 pt-2">
          <h2 className="text-[12.5px] font-semibold" style={{ color: "var(--ink-900)" }}>
            {domain} brief
          </h2>
          <span className="text-[11.5px]" style={{ color: "var(--ink-500)" }}>
            Same for everyone · 6:00am
          </span>
        </div>
        <ul>
          {brief.map((b) => (
            <li key={b.text}>
              <button
                type="button"
                onClick={() => onAsk(b.ask)}
                className="block w-full rounded-lg px-2.5 py-2 text-left text-[13px] leading-relaxed hover:bg-[color:var(--surface-soft)]"
                style={{ color: "var(--ink-700)" }}
              >
                {b.text}
              </button>
            </li>
          ))}
        </ul>
        <p className="px-2.5 pb-2 pt-1 text-[12px]" style={{ color: "var(--ink-500)" }}>
          Select a line to talk about it in the chat.
        </p>
      </section>

      {score !== null && (
        <section className="mt-5">
          <h2 className={label} style={{ color: "var(--ink-500)" }}>
            Health score
          </h2>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-[28px] font-semibold leading-none" style={{ color: "var(--ink-900)" }}>
              {score}
            </span>
            <span className="text-[12px]" style={{ color: HEALTH_COLOR[status] }}>
              {STATUS_LABEL[status]}
            </span>
          </div>
          <div className="mt-2">
            <Sparkline values={trendFor(score, domain)} label={`${domain} health over 14 days`} />
          </div>
        </section>
      )}

      {lowest.length > 0 && (
        <section className="mt-5">
          <h2 className={label} style={{ color: "var(--ink-500)" }}>
            Lowest tables
          </h2>
          <ul className="mt-2 space-y-2">
            {lowest.map((t) => (
              <li key={t.name}>
                <div className="flex justify-between text-[12.5px]" style={{ color: "var(--ink-900)" }}>
                  <span className="truncate">{t.name}</span>
                  <span className="tabular-nums">{t.score}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full" style={{ background: "var(--surface-soft)" }}>
                  <div
                    className="h-2 rounded-full"
                    style={{ width: `${t.score}%`, background: HEALTH_COLOR[statusForScore(t.score)] }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-6 space-y-2 border-t pt-4" style={{ borderColor: "var(--hairline)" }}>
        <button
          type="button"
          onClick={onOpenTables}
          className="flex w-full items-center justify-between rounded-lg border bg-white px-3 py-2.5 text-left text-[13px] hover:bg-[color:var(--surface-soft)]"
          style={{ borderColor: "var(--hairline)", color: "var(--ink-900)" }}
        >
          <span>Tables</span>
          <span style={{ color: "var(--ink-500)" }}>
            {tables.length} · {attention} need attention ›
          </span>
        </button>
        <Link
          to="/projects"
          className="flex w-full items-center justify-between rounded-lg border bg-white px-3 py-2.5 text-left text-[13px] hover:bg-[color:var(--surface-soft)]"
          style={{ borderColor: "var(--hairline)", color: "var(--ink-900)" }}
        >
          <span>Projects</span>
          <span style={{ color: "var(--ink-500)" }}>
            {activeProjects} active · {suggestedProjects} suggested ›
          </span>
        </Link>
      </section>
    </div>
  );
}
