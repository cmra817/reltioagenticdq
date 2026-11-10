import * as React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "@tanstack/react-router";
import { useDomainState } from "@/components/domain-context";
import {
  GhostButton,
  PrimaryButton,
  ScopedChat,
  SectionTitle,
  SplitWorkspace,
  FloatingPrompt,
  Tag,
  useChatThread,
  type ChatTurn,
} from "@/components/workspace/primitives";
import { useChatThreads } from "@/components/chat/chat-context";
import { useLocalStore } from "@/lib/use-local-store";

const PROJECT_CHATS_KEY = "agentflow.project-chats.v1";
export const projectThreadId = (id: string) => `project-view-${id}`;
import type { ChatReply } from "@/components/workspace/chat-visuals";
import { BASE_PROJECTS, PROJECT_STATUSES, type Project, type ProjectStatus } from "@/lib/mock-projects";
import { useProjects } from "@/lib/projects-store";

const ALL = "All domains";
const ALL_OWNERS = "All owners";

function progress(p: Project) {
  const met = p.criteria.filter((c) => c.met).length;
  return { met, total: p.criteria.length, pct: Math.round((met / p.criteria.length) * 100) };
}

/** Projects: a kanban board of remediation efforts, one domain each. A card opens with a chat about it. */
export function ProjectsScreen({ projectId }: { projectId?: string }) {
  const navigate = useNavigate();
  const { projects, move, addComment, add } = useProjects();
  const { domains, selected } = useDomainState();
  const [filter, setFilter] = React.useState<string>(ALL);
  const [ownerFilter, setOwnerFilter] = React.useState<string>(ALL_OWNERS);
  const [creating, setCreating] = React.useState(false);
  const [notice, setNotice] = React.useState("");

  // Open the board on the domain the person was last looking at, when it has projects.
  React.useEffect(() => {
    if (projects.some((p) => p.domain === selected)) setFilter(selected);
    // Only on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const current = projectId ? projects.find((p) => p.id === projectId) : undefined;

  function doMove(id: string, to: ProjectStatus) {
    setNotice(move(id, to) ?? "");
  }

  if (current) {
    return (
      <ProjectDetail
        project={current}
        onBack={() => void navigate({ to: "/projects", search: {} })}
        onMove={(to) => doMove(current.id, to)}
        onComment={(t) => addComment(current.id, t)}
        notice={notice}
      />
    );
  }

  if (creating) {
    return (
      <NewProjectSetup
        domains={domains}
        initialDomain={filter === ALL ? selected : filter}
        onCancel={() => setCreating(false)}
        onSave={(p) => {
          add(p);
          setCreating(false);
          void navigate({ to: "/projects", search: { project: p.id } });
        }}
      />
    );
  }

  const shown = projects.filter(
    (p) =>
      (filter === ALL || p.domain === filter) &&
      (ownerFilter === ALL_OWNERS || p.owner === ownerFilter),
  );
  const withProjects = domains.filter((d) => projects.some((p) => p.domain === d));
  const owners = [...new Set(projects.map((p) => p.owner))].sort();

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pb-10 pt-5">
      <div className="mx-auto w-full max-w-[1100px]">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-[22px] font-semibold" style={{ color: "var(--ink-900)" }}>
            Projects
          </h1>
          <label className="flex items-center gap-2 text-[13px]" style={{ color: "var(--ink-500)" }}>
            Domain
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-lg px-2.5 py-1.5 text-[13px] outline-none focus:border-[color:var(--brand-blue)]"
              style={{ border: "1px solid var(--hairline)", background: "#fff", color: "var(--ink-900)" }}
            >
              <option value={ALL}>{ALL}</option>
              {withProjects.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-[13px]" style={{ color: "var(--ink-500)" }}>
            Owner
            <select
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
              className="rounded-lg px-2.5 py-1.5 text-[13px] outline-none focus:border-[color:var(--brand-blue)]"
              style={{ border: "1px solid var(--hairline)", background: "#fff", color: "var(--ink-900)" }}
            >
              <option value={ALL_OWNERS}>{ALL_OWNERS}</option>
              {owners.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </label>
          <span className="ml-auto text-[12.5px]" style={{ color: "var(--ink-500)" }}>
            {shown.length} {shown.length === 1 ? "project" : "projects"}
          </span>
          <PrimaryButton onClick={() => setCreating(true)}>+ New project</PrimaryButton>
        </div>
        <p className="mt-1 text-[13px]" style={{ color: "var(--ink-500)" }}>
          A project is a focused effort to fix a data problem in one domain, with a goal, an owner and criteria for done.
        </p>
        {notice && (
          <div
            role="status"
            className="mt-3 rounded-lg px-3 py-2 text-[13px]"
            style={{ background: "#fcefd4", color: "#5c3902" }}
          >
            {notice}
          </div>
        )}

        <div className="mt-4 grid gap-3 overflow-x-auto pb-2 md:grid-cols-4">
          {PROJECT_STATUSES.map((status) => {
            const col = shown.filter((p) => p.status === status);
            const idx = PROJECT_STATUSES.indexOf(status);
            return (
              <div
                key={status}
                className="min-h-[260px] min-w-[200px] rounded-xl p-2.5"
                style={{ background: "var(--surface-soft)" }}
                aria-label={status}
              >
                <div
                  className="flex justify-between px-1 pb-2.5 text-[12.5px] font-semibold"
                  style={{ color: "var(--ink-900)" }}
                >
                  <span>{status}</span>
                  <span>{col.length}</span>
                </div>
                <ul className="space-y-2">
                  {col.map((p) => {
                    const pr = progress(p);
                    return (
                      <li
                        key={p.id}
                        className="rounded-lg border bg-white p-2.5"
                        style={{ borderColor: "var(--hairline)" }}
                      >
                        {p.suggestedByAgent && (
                          <span
                            className="mb-1.5 inline-block rounded px-1.5 py-px text-[11px]"
                            style={{ background: "#fcefd4", color: "#855304" }}
                          >
                            Suggested by agent
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => void navigate({ to: "/projects", search: { project: p.id } })}
                          className="block w-full text-left"
                        >
                          <div className="text-[13px] font-medium leading-snug" style={{ color: "var(--ink-900)" }}>
                            {p.title}
                          </div>
                          <div className="mt-1 text-[12px]" style={{ color: "var(--ink-500)" }}>
                            {p.owner} · {filter === ALL ? `${p.domain} · ` : ""}
                            {p.tables.length} {p.tables.length === 1 ? "table" : "tables"} ·{" "}
                            {p.daysOpen === 0 ? "new" : `${p.daysOpen} days`}
                          </div>
                          <div className="mt-2 h-2 overflow-hidden rounded-full" style={{ background: "var(--surface-soft)" }}>
                            <div
                              className="h-2 rounded-full"
                              style={{ width: `${pr.pct}%`, background: "var(--status-good)" }}
                            />
                          </div>
                          <div className="mt-1 text-[12px]" style={{ color: "var(--ink-500)" }}>
                            {pr.met} of {pr.total} criteria met
                          </div>
                        </button>
                        <div className="mt-2 flex gap-1.5">
                          {idx > 0 && (
                            <button
                              type="button"
                              aria-label={`Move “${p.title}” to ${PROJECT_STATUSES[idx - 1]}`}
                              onClick={() => doMove(p.id, PROJECT_STATUSES[idx - 1])}
                              className="rounded-md border bg-white px-2 py-0.5 text-[12px] hover:bg-[color:var(--surface-soft)]"
                              style={{ borderColor: "var(--hairline)", color: "var(--ink-700)" }}
                            >
                              ‹
                            </button>
                          )}
                          {idx < PROJECT_STATUSES.length - 1 && (
                            <button
                              type="button"
                              aria-label={`Move “${p.title}” to ${PROJECT_STATUSES[idx + 1]}`}
                              onClick={() => doMove(p.id, PROJECT_STATUSES[idx + 1])}
                              className="rounded-md border bg-white px-2 py-0.5 text-[12px] hover:bg-[color:var(--surface-soft)]"
                              style={{ borderColor: "var(--hairline)", color: "var(--ink-700)" }}
                            >
                              {PROJECT_STATUSES[idx + 1]} ›
                            </button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-[12px]" style={{ color: "var(--ink-500)" }}>
          Select a card to open it with a chat about that project.
        </p>
      </div>
    </div>
  );
}

/** Goal-first project setup shares the app's chat and editable workspace. */
function NewProjectSetup({
  domains,
  initialDomain,
  onCancel,
  onSave,
}: {
  domains: string[];
  initialDomain: string;
  onCancel: () => void;
  onSave: (p: Project) => void;
}) {
  const [domain, setDomain] = React.useState(initialDomain);
  const [draft, setDraft] = React.useState<Project | null>(null);
  const [chatOpen, setChatOpen] = React.useState(true);
  const draftRef = React.useRef<Project | null>(null);
  draftRef.current = draft;

  const patch = (changes: Partial<Project>) =>
    setDraft((current) => current ? { ...current, ...changes } : current);
  const changeDomain = (value: string) => {
    setDomain(value);
    patch({ domain: value });
  };

  function reply(q: string): string {
    if (!draftRef.current) {
      const goal = q.trim();
      const projectDomain = domains.find((d) => goal.toLowerCase().includes(d.toLowerCase())) ?? domain;
      const tables = [...new Set(BASE_PROJECTS.filter((p) => p.domain === projectDomain).flatMap((p) => p.tables))];
      const mentioned = tables.filter((t) => goal.toLowerCase().includes(t.toLowerCase()));
      setDomain(projectDomain);
      setDraft({
        id: `proj-${Date.now()}`,
        domain: projectDomain,
        title: goal.length > 48 ? `${goal.slice(0, 48).trimEnd()}…` : goal,
        status: "Suggested",
        owner: "You",
        daysOpen: 0,
        suggestedByAgent: false,
        goal,
        tables: mentioned.length ? mentioned : tables.slice(0, 3),
        criteria: [{ text: goal, current: "Not started", target: "Met", met: false }],
        comments: [],
      });
      return "I've drafted your project on the right, with suggested tables and an acceptance criterion based on your goal. Review or edit it, then save when you're ready.";
    }
    const cur = draftRef.current;
    if (/domain/i.test(q)) {
      const hit = domains.find((d) => q.toLowerCase().includes(d.toLowerCase()));
      if (hit) {
        changeDomain(hit);
        return `Moved it to ${hit}.`;
      }
    }
    if (/^(name it|call it|title)\s+/i.test(q)) {
      const title = q.replace(/^(name it|call it|title)\s+/i, "").trim();
      patch({ title });
      return `Renamed to “${title}”.`;
    }
    if (/^(goal|change the goal to|update the goal to)\s*:?\s+/i.test(q)) {
      const goal = q.replace(/^(goal|change the goal to|update the goal to)\s*:?\s+/i, "").trim();
      patch({ goal });
      return "I've updated the project goal.";
    }
    if (/^(tables|data|criteria|acceptance criteria)\s*:/i.test(q)) {
      const [field, ...parts] = q.split(":");
      const value = parts.join(":").trim();
      if (/criteria/i.test(field)) {
        patch({ criteria: value.split(/;|\n/).map((text) => text.trim()).filter(Boolean).map((text) => ({ text, current: "Not started", target: "Met", met: false })) });
      } else {
        patch({ tables: value.split(/,|\n/).map((t) => t.trim()).filter(Boolean) });
      }
      return "I've updated the draft.";
    }
    return `“${cur.title}” is ready to review. You can edit the draft on the right or tell me a new title, goal, tables, or criteria.`;
  }

  const thread = useChatThread(reply, [
    { id: 0, role: "user", text: "Set up a new project" },
    { id: 1, role: "agent", text: "What's the goal of this project? Tell me what you want to achieve." },
  ]);
  const domainControl = { value: domain, onChange: changeDomain };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <SplitWorkspace
        panelLabel="New project"
        panelWidth="52%"
        collapsed={!chatOpen}
        onToggle={draft ? () => setChatOpen((open) => !open) : undefined}
        floating={<FloatingPrompt thread={thread} placeholder="Ask Reltio…" onOpen={() => setChatOpen(true)} domain={domainControl} />}
        center={
          <ScopedChat
            thread={thread}
            scopeLabel="New project"
            placeholder="Ask Reltio…"
            suggestions={[]}
            domain={domainControl}
            reply={reply}
            header={<GhostButton onClick={onCancel}>‹ Projects</GhostButton>}
          />
        }
        panel={draft ? (
          <div className="flex min-h-full flex-col">
            <div className="mx-auto w-full max-w-[720px] flex-1 space-y-5 p-5">
              <div className="flex items-center justify-between gap-3">
                <h1 className="text-xl font-semibold text-foreground">Project draft</h1>
                <Tag>Not saved yet</Tag>
              </div>
              <label className="block space-y-2 text-sm text-foreground">
                <span>Project name</span>
                <Input value={draft.title} onChange={(e) => patch({ title: e.target.value })} />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 text-sm text-foreground">
                  <span id="project-domain-label">Domain</span>
                  <Select value={draft.domain} onValueChange={changeDomain}>
                    <SelectTrigger aria-labelledby="project-domain-label"><SelectValue placeholder="Select domain" /></SelectTrigger>
                    <SelectContent>{domains.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <label className="block space-y-2 text-sm text-foreground">
                  <span>Owner</span>
                  <Input value={draft.owner} onChange={(e) => patch({ owner: e.target.value })} />
                </label>
              </div>
              <label className="block space-y-2 text-sm text-foreground">
                <span>Goal</span>
                <Textarea rows={3} value={draft.goal} onChange={(e) => patch({ goal: e.target.value })} />
              </label>
              <label className="block space-y-2 text-sm text-foreground">
                <span>Data</span>
                <Textarea rows={3} value={draft.tables.join("\n")} onChange={(e) => patch({ tables: e.target.value.split("\n") })} />
              </label>
              <label className="block space-y-2 text-sm text-foreground">
                <span>Acceptance criteria</span>
                <Textarea rows={3} value={draft.criteria.map((c) => c.text).join("\n")} onChange={(e) => patch({ criteria: e.target.value.split("\n").map((text) => ({ text, current: "Not started", target: "Met", met: false })) })} />
              </label>
            </div>
            <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-border bg-background p-4">
              <GhostButton onClick={onCancel}>Cancel</GhostButton>
              <PrimaryButton
                disabled={!domains.includes(draft.domain) || !draft.title.trim() || !draft.owner.trim() || !draft.goal.trim() || !draft.criteria.some((c) => c.text.trim())}
                onClick={() => onSave({ ...draft, title: draft.title.trim(), owner: draft.owner.trim(), goal: draft.goal.trim(), tables: draft.tables.map((t) => t.trim()).filter(Boolean), criteria: draft.criteria.filter((c) => c.text.trim()).map((c) => ({ ...c, text: c.text.trim() })) })}
              >Save project</PrimaryButton>
            </div>
          </div>
        ) : undefined}
      />
    </div>
  );
}

export function projectReply(p: Project, q: string): ChatReply {
  const text = q.toLowerCase();
  const unmet = p.criteria.filter((c) => !c.met);
  if (/block|left|unmet|missing/.test(text)) {
    return unmet.length
      ? `Still unmet: ${unmet.map((c) => `${c.text.toLowerCase()} (now ${c.current}, needs ${c.target})`).join("; ")}.`
      : "Nothing is blocking it. Every criterion is met.";
  }
  if (/next|step|suggest|what should/.test(text)) {
    if (p.status === "Suggested") return "Pick an owner and move it to In progress. I can draft the first rule for you.";
    return unmet.length
      ? `Work on “${unmet[0].text.toLowerCase()}” first. It is the furthest from its target.`
      : "Move it to Done. All criteria are met.";
  }
  return "I can summarise what is blocking this project or suggest next steps. Try “What is blocking this?”.";
}

/** A project with its chat on the left and the detail on the right. */
type ProjectDetailProps = {
  project: Project;
  onBack: () => void;
  onMove: (to: ProjectStatus) => void;
  onComment: (text: string) => void;
  notice: string;
};

/** One chat per project. It joins Recents, under the project's domain, with the first message. */
function ProjectDetail(props: ProjectDetailProps) {
  const threadId = projectThreadId(props.project.id);
  const [saved, setSaved, ready] = useLocalStore<Record<string, ChatTurn[]>>(PROJECT_CHATS_KEY, {});
  if (!ready) return <div className="flex-1" />;
  return (
    <ProjectDetailBody
      key={threadId}
      {...props}
      threadId={threadId}
      initialTurns={saved[threadId]}
      onTurns={(turns) => setSaved((prev) => ({ ...prev, [threadId]: turns }))}
    />
  );
}

function ProjectDetailBody({
  project: p,
  onBack,
  onMove,
  onComment,
  notice,
  threadId,
  initialTurns,
  onTurns,
}: ProjectDetailProps & {
  threadId: string;
  initialTurns?: ChatTurn[];
  onTurns: (turns: ChatTurn[]) => void;
}) {
  const [draft, setDraft] = React.useState("");
  const pr = progress(p);
  const reply = React.useCallback((q: string) => projectReply(p, q), [p]);
  const thread = useChatThread(reply, initialTurns);
  const [chatOpen, setChatOpen] = React.useState(true);
  const { getThread, createThread } = useChatThreads();
  React.useEffect(() => {
    if (thread.turns.length === 0) return;
    if (!getThread(threadId)) {
      createThread({ id: threadId, title: p.title, kind: "project", domain: p.domain });
    }
    onTurns(thread.turns);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thread.turns]);

  const panel = (
    <div className="space-y-5 p-5">
      <button
        type="button"
        onClick={onBack}
        className="text-[13px] hover:underline"
        style={{ color: "var(--brand-blue)" }}
      >
        ‹ Projects
      </button>
      {notice && (
        <div
          role="status"
          className="rounded-lg px-3 py-2 text-[13px]"
          style={{ background: "#fcefd4", color: "#5c3902" }}
        >
          {notice}
        </div>
      )}
      <div>
        <h1 className="text-[20px] font-semibold" style={{ color: "var(--ink-900)" }}>
          {p.title}
        </h1>
        <div className="mt-1 text-[13px]" style={{ color: "var(--ink-500)" }}>
          {p.domain} · Owner: {p.owner} · {p.daysOpen === 0 ? "New today" : `Open ${p.daysOpen} days`}
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Status">
          {PROJECT_STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={p.status === s}
              onClick={() => onMove(s)}
              className="rounded-full border px-3 py-1 text-[12.5px]"
              style={
                p.status === s
                  ? { background: "var(--ink-900)", color: "#fff", borderColor: "var(--ink-900)" }
                  : { background: "#fff", color: "var(--ink-700)", borderColor: "var(--hairline)" }
              }
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div>
        <SectionTitle>Goal</SectionTitle>
        <p className="text-[13.5px] leading-relaxed" style={{ color: "var(--ink-700)" }}>
          {p.goal}
        </p>
      </div>

      <div>
        <SectionTitle>
          Acceptance criteria · {pr.met} of {pr.total} met
        </SectionTitle>
        <ul className="divide-y rounded-xl border bg-white" style={{ borderColor: "var(--hairline)" }}>
          {p.criteria.map((c) => (
            <li key={c.text} className="flex items-start gap-3 px-3.5 py-2.5 text-[13px]">
              <span
                className="rounded-full px-2 py-0.5 text-[11.5px] font-semibold"
                style={
                  c.met
                    ? { background: "#e3f5ec", color: "#14663f" }
                    : { background: "#fbe3e0", color: "#a2271d" }
                }
              >
                {c.met ? "Met" : "Not met"}
              </span>
              <span className="min-w-0 flex-1">
                <span style={{ color: "var(--ink-900)" }}>{c.text}</span>
                <br />
                <span style={{ color: "var(--ink-500)" }}>
                  Now {c.current}, needs {c.target}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <SectionTitle>Data</SectionTitle>
        <div className="flex flex-wrap gap-1.5">
          {p.tables.map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
        </div>
      </div>

      <div>
        <SectionTitle>Activity and comments</SectionTitle>
        <ul className="divide-y rounded-xl border bg-white px-3.5" style={{ borderColor: "var(--hairline)" }}>
          {p.comments.map((c, i) => (
            <li key={i} className="py-2.5 text-[13px]">
              <span className="font-semibold" style={{ color: "var(--ink-900)" }}>
                {c.who}
              </span>
              <span className="ml-1.5 text-[12px]" style={{ color: "var(--ink-500)" }}>
                {c.when}
              </span>
              <div style={{ color: "var(--ink-700)" }}>{c.text}</div>
            </li>
          ))}
        </ul>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const t = draft.trim();
            if (!t) return;
            onComment(t);
            setDraft("");
          }}
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add a comment for the team"
            aria-label="Comment"
            className="min-w-0 flex-1 rounded-lg px-3 py-2 text-[13.5px] outline-none focus:border-[color:var(--brand-blue)]"
            style={{ border: "1px solid var(--hairline)", color: "var(--ink-900)" }}
          />
          <GhostButton type="submit">Post</GhostButton>
        </form>
      </div>
    </div>
  );

  return (
    <SplitWorkspace
      panelLabel="Project detail"
      panelWidth="52%"
      collapsed={!chatOpen}
      onToggle={() => setChatOpen(!chatOpen)}
      floating={<FloatingPrompt thread={thread} placeholder="Ask about this project" onOpen={() => setChatOpen(true)} />}
      center={
        <ScopedChat
          thread={thread}
          scopeLabel={p.title}
          placeholder="Ask about this project"
          suggestions={["What is blocking this?", "Suggest next steps"]}
          reply={reply}
          header={
            <p className="px-1 text-[13px]" style={{ color: "var(--ink-500)" }}>
              This chat is about “{p.title}”. {pr.total - pr.met === 0 ? "All criteria are met." : `${pr.total - pr.met} still unmet.`}
            </p>
          }
        />
      }
      panel={panel}
    />
  );
}
