import * as React from "react";
import type { Project } from "@/lib/mock-projects";
import { ProjectBoard } from "@/components/projects/projects-screen";
import { useProjects } from "@/lib/projects-store";

const ALL_OWNERS = "All owners";
const card = { borderColor: "var(--hairline)" } as const;

/** Projects for the domain, shown inside the domain chat's right panel: a kanban, then a project's details. */
export function DomainProjects({
  projects,
  onAsk,
  showDomain = false,
}: {
  showDomain?: boolean;
  projects: Project[];
  onAsk: (question: string) => void;
}) {
  const [openId, setOpenId] = React.useState<string | null>(null);
  const open = projects.find((p) => p.id === openId);
  const { move } = useProjects();
  const [owner, setOwner] = React.useState(ALL_OWNERS);
  const [notice, setNotice] = React.useState("");
  const owners = [...new Set(projects.map((p) => p.owner))].sort();
  const shown = projects.filter((p) => owner === ALL_OWNERS || p.owner === owner);

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
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-[13px]" style={{ color: "var(--ink-500)" }}>
          Owner
          <select
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            className="rounded-lg px-2.5 py-1.5 text-[13px] outline-none focus:border-[color:var(--brand-blue)]"
            style={{ border: "1px solid var(--hairline)", background: "var(--surface)", color: "var(--ink-900)" }}
          >
            <option value={ALL_OWNERS}>{ALL_OWNERS}</option>
            {owners.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </label>
        <span className="ml-auto text-[12.5px]" style={{ color: "var(--ink-500)" }}>
          {shown.length} {shown.length === 1 ? "project" : "projects"}
        </span>
      </div>
      {notice && (
        <div role="status" className="mt-3 rounded-lg px-3 py-2 text-[13px]" style={{ background: "#fcefd4", color: "#5c3902" }}>
          {notice}
        </div>
      )}
      <ProjectBoard
        projects={shown}
        showDomain={showDomain}
        onOpen={(p) => {
          setOpenId(p.id);
          onAsk(`Tell me about the "${p.title}" project`);
        }}
        onMove={(id, to) => setNotice(move(id, to) ?? "")}
      />
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
