import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { useDomainState } from "@/components/domain-context";
import {
  GhostButton,
  ScopedChat,
  SectionTitle,
  SplitWorkspace,
  Tag,
  useChatThread,
  type ChatTurn,
} from "@/components/workspace/primitives";
import { useChatThreads } from "@/components/chat/chat-context";
import { useLocalStore } from "@/lib/use-local-store";

const PROJECT_CHATS_KEY = "agentflow.project-chats.v1";
export const projectThreadId = (id: string) => `project-view-${id}`;
import type { ChatReply } from "@/components/workspace/chat-visuals";
import { PROJECT_STATUSES, type Project, type ProjectStatus } from "@/lib/mock-projects";
import { useProjects } from "@/lib/projects-store";

const ALL = "All domains";

function progress(p: Project) {
  const met = p.criteria.filter((c) => c.met).length;
  return { met, total: p.criteria.length, pct: Math.round((met / p.criteria.length) * 100) };
}

/** Projects: a kanban board of remediation efforts, one domain each. A card opens with a chat about it. */
export function ProjectsScreen({ projectId }: { projectId?: string }) {
  const navigate = useNavigate();
  const { projects, move, addComment } = useProjects();
  const { domains, selected } = useDomainState();
  const [filter, setFilter] = React.useState<string>(ALL);
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

  const shown = filter === ALL ? projects : projects.filter((p) => p.domain === filter);
  const withProjects = domains.filter((d) => projects.some((p) => p.domain === d));

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
          <span className="ml-auto text-[12.5px]" style={{ color: "var(--ink-500)" }}>
            {shown.length} {shown.length === 1 ? "project" : "projects"}
          </span>
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
