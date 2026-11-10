import * as React from "react";
import { PROJECT_STATUSES, type Project } from "@/lib/mock-projects";

const card = { borderColor: "var(--hairline)" } as const;

/** Projects for the domain, shown inside the domain chat's right panel: a kanban, then a project's details. */
export function DomainProjects({
  projects,
  onAsk,
}: {
  projects: Project[];
  onAsk: (question: string) => void;
}) {
  const [openId, setOpenId] = React.useState<string | null>(null);
  const open = projects.find((p) => p.id === openId);

  if (open) {
    return (
      <div className="space-y-4">
        <button type="button" onClick={() => setOpenId(null)} className="text-[13px]" style={{ color: "var(--brand-blue)" }}>
          ‹ All projects
        </button>
        <div>
          <h2 className="text-[18px] font-semibold" style={{ color: "var(--ink-900)" }}>{open.title}</h2>
          <div className="mt-1.5 flex flex-wrap gap-2 text-[12.5px]" style={{ color: "var(--ink-500)" }}>
            <span className="rounded-md border px-2 py-0.5" style={{ ...card, color: "var(--ink-700)" }}>{open.status}</span>
            <span>Owner: {open.owner}</span>
          </div>
        </div>
        <Section title="Goal">
          <button type="button" onClick={() => onAsk(`Let's discuss the goal of ${open.title}`)} className="block w-full rounded-lg px-2.5 py-2 text-left text-[13.5px] hover:bg-[color:var(--surface-soft)]" style={{ color: "var(--ink-700)" }}>
            {open.goal}
          </button>
        </Section>
        <Section title="Acceptance criteria">
          <ul>
            {open.criteria.map((c) => (
              <li key={c.text}>
                <button type="button" onClick={() => onAsk(`Let's discuss: ${c.text}`)} className="flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left text-[13px] hover:bg-[color:var(--surface-soft)]">
                  <span style={{ color: "var(--ink-900)" }}>{c.met ? "✓ " : "○ "}{c.text}</span>
                  <span className="shrink-0 text-[12px]" style={{ color: "var(--ink-500)" }}>{c.current} → {c.target}</span>
                </button>
              </li>
            ))}
          </ul>
        </Section>
        <Section title="Comments">
          {open.comments.length === 0 ? (
            <p className="px-2.5 py-2 text-[13px]" style={{ color: "var(--ink-500)" }}>No comments yet.</p>
          ) : (
            <ul className="space-y-1">
              {open.comments.map((c, i) => (
                <li key={i} className="px-2.5 py-2 text-[13px]">
                  <div className="text-[12px]" style={{ color: "var(--ink-500)" }}>{c.who} · {c.when}</div>
                  <div style={{ color: "var(--ink-700)" }}>{c.text}</div>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
      {PROJECT_STATUSES.map((status) => {
        const col = projects.filter((p) => p.status === status);
        return (
          <div key={status} className="min-h-[200px] rounded-xl p-2" style={{ background: "var(--surface-soft)" }} aria-label={status}>
            <div className="mb-2 flex justify-between px-1 text-[12px] font-semibold" style={{ color: "var(--ink-700)" }}>
              <span>{status}</span><span style={{ color: "var(--ink-500)" }}>{col.length}</span>
            </div>
            <ul className="space-y-2">
              {col.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenId(p.id);
                      onAsk(`Tell me about the "${p.title}" project`);
                    }}
                    className="block w-full rounded-lg border bg-white p-2.5 text-left hover:border-[color:var(--brand-blue)]"
                    style={card}
                  >
                    <div className="text-[13px] font-medium" style={{ color: "var(--ink-900)" }}>{p.title}</div>
                    <div className="mt-1 text-[11.5px]" style={{ color: "var(--ink-500)" }}>
                      {p.owner} · {p.criteria.filter((c) => c.met).length}/{p.criteria.length} criteria
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-white p-1.5" style={card}>
      <h3 className="px-2.5 pb-1 pt-2 text-[12.5px] font-semibold" style={{ color: "var(--ink-900)" }}>{title}</h3>
      {children}
    </section>
  );
}
