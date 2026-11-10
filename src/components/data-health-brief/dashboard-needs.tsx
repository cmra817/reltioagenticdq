import { useNavigate } from "@tanstack/react-router";
import { GhostButton, PrimaryButton, Tag } from "@/components/workspace/primitives";
import { useOpenSchedule } from "@/components/scheduled/open-schedule";
import { ALL_DOMAINS } from "@/lib/mock-ops";
import type { Need } from "@/lib/mock-projects";
import { useNeeds } from "@/lib/projects-store";

const KIND: Record<Need["kind"], string> = { project: "Project", rule: "Rule", job: "Task" };

/**
 * What the agent suggests for the domains this dashboard covers, waiting on
 * you. It proposes; nothing changes until you approve.
 */
export function DashboardNeeds({ scope }: { scope: string }) {
  const navigate = useNavigate();
  const openSchedule = useOpenSchedule();
  const { open, approve, reject } = useNeeds();
  const mine = open.filter((n) => scope === ALL_DOMAINS || n.domain === scope);
  if (mine.length === 0) return null;

  function edit(n: Need) {
    if (n.kind === "project") void navigate({ to: "/projects", search: { project: n.projectId } });
    else if (n.kind === "rule") void navigate({ to: "/rules", search: { rule: n.ruleId } });
    else if (n.scheduleId) openSchedule(n.scheduleId);
  }

  return (
    <section className="mt-5" aria-labelledby="dash-needs">
      <h2
        id="dash-needs"
        className="text-[11px] font-semibold uppercase tracking-wide"
        style={{ color: "var(--ink-500)" }}
      >
        Needs you · {mine.length}
      </h2>
      <ul className="mt-2 space-y-2.5">
        {mine.map((n) => (
          <li key={n.id} className="rounded-xl border bg-white p-3" style={{ borderColor: "var(--hairline)" }}>
            <div className="flex flex-wrap items-center gap-2">
              <Tag>{n.domain}</Tag>
              <span className="text-[11.5px]" style={{ color: "var(--ink-500)" }}>
                {KIND[n.kind]}
              </span>
              <span
                className="ml-auto text-[11.5px] font-semibold"
                style={{ color: n.confidence === "High" ? "var(--status-good)" : "var(--status-warn)" }}
              >
                {n.confidence} confidence
              </span>
            </div>
            <div className="mt-1.5 text-[13.5px] font-semibold" style={{ color: "var(--ink-900)" }}>
              {n.title}
            </div>
            <p className="mt-1 text-[12.5px] leading-relaxed" style={{ color: "var(--ink-700)" }}>
              {n.why}
            </p>
            <p className="mt-1 text-[11.5px]" style={{ color: "var(--ink-500)" }}>
              Evidence: {n.evidence}
            </p>
            <p className="text-[11.5px]" style={{ color: "var(--ink-500)" }}>
              If approved: {n.effect}
            </p>
            <div className="mt-2.5 flex gap-2">
              <PrimaryButton onClick={() => approve(n)}>Approve</PrimaryButton>
              <GhostButton onClick={() => edit(n)}>Edit</GhostButton>
              <GhostButton onClick={() => reject(n)}>Reject</GhostButton>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
