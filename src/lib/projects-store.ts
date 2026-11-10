import * as React from "react";
import { useLocalStore } from "./use-local-store";
import { useSchedules } from "./ops-store";
import {
  BASE_PROJECTS,
  NEEDS,
  type Need,
  type Project,
  type ProjectComment,
  type ProjectStatus,
} from "./mock-projects";

type ProjectStore = {
  status: Record<string, ProjectStatus>;
  owner: Record<string, string>;
  comments: Record<string, ProjectComment[]>;
  /** Projects created in the app, newest first. */
  created: Project[];
};
const INIT: ProjectStore = { status: {}, owner: {}, comments: {}, created: [] };

/** Older saved stores predate project creation; retain their other changes. */
export function createdProjects(store: { created?: Project[] }): Project[] {
  return Array.isArray(store.created) ? store.created : [];
}

export function useProjects() {
  const [store, setStore, ready] = useLocalStore<ProjectStore>("agentflow.projects.v1", INIT);

  const projects = React.useMemo<Project[]>(
    () =>
      [...createdProjects(store), ...BASE_PROJECTS].map((p) => {
        const status = store.status[p.id] ?? p.status;
        const owner = store.owner[p.id] ?? p.owner;
        return {
          ...p,
          status,
          owner,
          // Once someone picks it up, it is no longer just a suggestion.
          suggestedByAgent: p.suggestedByAgent && status === "Suggested",
          comments: [...p.comments, ...(store.comments[p.id] ?? [])],
        };
      }),
    [store],
  );

  const add = React.useCallback(
    (p: Project) => setStore((prev) => ({ ...prev, created: [p, ...createdProjects(prev)] })),
    [setStore],
  );

  /** Returns a reason when the move is not allowed. Done needs every criterion met. */
  const move = React.useCallback(
    (id: string, to: ProjectStatus): string | null => {
      const p = projects.find((x) => x.id === id);
      if (!p) return null;
      if (to === "Done") {
        const open = p.criteria.filter((c) => !c.met).length;
        if (open > 0) {
          return `Not done yet: ${open} ${open === 1 ? "criterion is" : "criteria are"} still unmet on “${p.title}”.`;
        }
      }
      setStore((prev) => ({
        ...prev,
        status: { ...prev.status, [id]: to },
        owner:
          p.owner === "Unassigned" && to !== "Suggested"
            ? { ...prev.owner, [id]: "You" }
            : prev.owner,
      }));
      return null;
    },
    [projects, setStore],
  );

  const addComment = React.useCallback(
    (id: string, text: string) =>
      setStore((prev) => ({
        ...prev,
        comments: {
          ...prev.comments,
          [id]: [...(prev.comments[id] ?? []), { who: "You", when: "Just now", text }],
        },
      })),
    [setStore],
  );

  return { projects, move, addComment, add, ready };
}

/* ---------- Needs you ---------- */

type NeedsStore = Record<string, "approved" | "rejected">;
const NEEDS_INIT: NeedsStore = {};

/**
 * What the agent has proposed and is waiting on you for. Nothing here happens
 * on its own: a proposal changes something only when you approve it.
 */
export function useNeeds() {
  const [resolved, setResolved] = useLocalStore<NeedsStore>("agentflow.needs.v1", NEEDS_INIT);
  const { schedules, update: updateSchedule } = useSchedules();
  const { move } = useProjects();

  const open = React.useMemo(() => NEEDS.filter((n) => !resolved[n.id]), [resolved]);

  const approve = React.useCallback(
    (n: Need) => {
      setResolved((prev) => ({ ...prev, [n.id]: "approved" }));
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
    },
    [setResolved, schedules, updateSchedule, move],
  );

  const reject = React.useCallback(
    (n: Need) => setResolved((prev) => ({ ...prev, [n.id]: "rejected" })),
    [setResolved],
  );

  return { open, approve, reject };
}
