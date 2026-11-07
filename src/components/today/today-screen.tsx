import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { newChatId, useChatThreads } from "@/components/chat/chat-context";
import { GhostButton, PrimaryButton, SectionTitle, Tag } from "@/components/workspace/primitives";
import { CHANGED, LOG, NEEDS, type Need } from "@/lib/mock-today";
import { useSchedules } from "@/lib/ops-store";
import { useProjects, useToday } from "@/lib/projects-store";
import { useOpenSchedule } from "@/components/scheduled/open-schedule";

const KIND_LABEL: Record<Need["kind"], string> = {
  project: "Project",
  rule: "Rule",
  job: "Job",
};

/** How many things are waiting on the person. Drives the badge on the Today nav item. */
export function useNeedsCount(): number {
  const { needs, ready } = useToday();
  if (!ready) return 0;
  return NEEDS.filter((n) => !needs[n.id]).length;
}

/**
 * Today: what needs the person, what changed, and what the agent did.
 * The brief is generated once a day; nothing is generated when the page loads.
 */
export function TodayScreen() {
  const navigate = useNavigate();
  const { createThread } = useChatThreads();
  const openSchedule = useOpenSchedule();
  const { schedules, update: updateSchedule } = useSchedules();
  const { move } = useProjects();
  const { needs, undone, resolve, undo } = useToday();

  const open = NEEDS.filter((n) => !needs[n.id]);

  function approve(n: Need) {
    resolve(n.id, "approved");
    if (n.kind === "project" && n.projectId) move(n.projectId, "In progress");
    if (n.kind === "rule" && n.scheduleId && n.ruleId) {
      const s = schedules.find((x) => x.id === n.scheduleId);
      if (s && !s.ruleIds.includes(n.ruleId)) {
        updateSchedule(s.id, { ruleIds: [...s.ruleIds, n.ruleId] });
      }
    }
    if (n.kind === "job" && n.scheduleId && n.newRepeats) {
      updateSchedule(n.scheduleId, { repeats: n.newRepeats, nextRun: "Tomorrow, 6:00am" });
    }
  }

  function edit(n: Need) {
    if (n.kind === "project") void navigate({ to: "/projects", search: { project: n.projectId } });
    else if (n.kind === "rule") void navigate({ to: "/rules", search: { rule: n.ruleId } });
    else if (n.scheduleId) openSchedule(n.scheduleId);
  }

  function discuss(text: string, domain?: string) {
    const id = newChatId();
    createThread({ id, title: text.slice(0, 40), domain });
    void navigate({ to: "/chat/$chatId", params: { chatId: id }, search: { q: text } });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pb-10 pt-5">
      <div className="mx-auto w-full max-w-[860px]">
        <div className="flex flex-wrap items-baseline gap-3">
          <h1 className="text-[22px] font-semibold" style={{ color: "var(--ink-900)" }}>
            Today
          </h1>
          <span className="text-[12.5px]" style={{ color: "var(--ink-500)" }}>
            Generated today, 6:00am
          </span>
        </div>

        <section className="mt-6" aria-labelledby="needs-you">
          <h2 id="needs-you">
            <SectionTitle>Needs you · {open.length}</SectionTitle>
          </h2>
          {open.length === 0 && (
            <p className="text-[13.5px]" style={{ color: "var(--ink-500)" }}>
              Nothing is waiting on you.
            </p>
          )}
          <ul className="space-y-3">
            {NEEDS.map((n) => {
              const status = needs[n.id];
              return (
                <li
                  key={n.id}
                  className="rounded-xl border bg-white p-4"
                  style={{ borderColor: "var(--hairline)" }}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Tag>{n.domain}</Tag>
                    <span className="text-[12px]" style={{ color: "var(--ink-500)" }}>
                      {KIND_LABEL[n.kind]}
                    </span>
                    {status && (
                      <span
                        className="rounded px-1.5 py-0.5 text-[11px] font-medium"
                        style={{ background: "#fcefd4", color: "#855304" }}
                      >
                        {status === "approved" ? "Approved" : "Rejected"}
                      </span>
                    )}
                    <span
                      className="ml-auto text-[12px] font-semibold"
                      style={{
                        color: n.confidence === "High" ? "var(--status-good)" : "var(--status-warn)",
                      }}
                    >
                      {n.confidence} confidence
                    </span>
                  </div>
                  <div className="mt-2 text-[15px] font-semibold" style={{ color: "var(--ink-900)" }}>
                    {n.title}
                  </div>
                  <p className="mt-1 text-[13.5px] leading-relaxed" style={{ color: "var(--ink-700)" }}>
                    {n.why}
                  </p>
                  <p className="mt-1 text-[12px]" style={{ color: "var(--ink-500)" }}>
                    Evidence: {n.evidence}
                  </p>
                  <p className="text-[12px]" style={{ color: "var(--ink-500)" }}>
                    If approved: {n.effect}
                  </p>
                  {!status && (
                    <div className="mt-3 flex gap-2">
                      <PrimaryButton onClick={() => approve(n)}>Approve</PrimaryButton>
                      <GhostButton onClick={() => edit(n)}>Edit</GhostButton>
                      <GhostButton onClick={() => resolve(n.id, "rejected")}>Reject</GhostButton>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        <section className="mt-8" aria-labelledby="what-changed">
          <h2 id="what-changed">
            <SectionTitle>What changed</SectionTitle>
          </h2>
          <ul
            className="divide-y rounded-xl border bg-white"
            style={{ borderColor: "var(--hairline)" }}
          >
            {CHANGED.map((c) => (
              <li key={c.text}>
                <button
                  type="button"
                  onClick={() => discuss(c.question)}
                  className="w-full px-4 py-3 text-left text-[13.5px] leading-relaxed transition-colors hover:bg-[color:var(--surface-soft)]"
                  style={{ color: "var(--ink-700)" }}
                >
                  {c.text}
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-1.5 text-[12px]" style={{ color: "var(--ink-500)" }}>
            Select a line to talk about it in a new chat.
          </p>
        </section>

        <section className="mt-8" aria-labelledby="agent-did">
          <h2 id="agent-did">
            <SectionTitle>What the agent did</SectionTitle>
          </h2>
          <ul
            className="divide-y rounded-xl border bg-white px-4"
            style={{ borderColor: "var(--hairline)" }}
          >
            {LOG.map((l) => {
              const isUndone = !!undone[l.id];
              return (
                <li key={l.id} className="flex items-center gap-3 py-3 text-[13.5px]">
                  <span
                    className="min-w-0 flex-1"
                    style={{
                      color: isUndone ? "var(--ink-500)" : "var(--ink-900)",
                      textDecoration: isUndone ? "line-through" : undefined,
                    }}
                  >
                    {l.text}
                  </span>
                  <span className="text-[12px]" style={{ color: "var(--ink-500)" }}>
                    {l.when}
                  </span>
                  {l.canUndo && !isUndone && <GhostButton onClick={() => undo(l.id)}>Undo</GhostButton>}
                  {isUndone && <Tag>Undone</Tag>}
                </li>
              );
            })}
          </ul>
          <div className="mt-2">
            <GhostButton disabled title="Not built yet">
              See all activity
            </GhostButton>
          </div>
        </section>
      </div>
    </div>
  );
}
