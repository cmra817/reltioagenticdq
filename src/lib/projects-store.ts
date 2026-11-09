import * as React from "react";
import { useLocalStore } from "./use-local-store";
import {
  BASE_PROJECTS,
  type Project,
  type ProjectComment,
  type ProjectStatus,
} from "./mock-today";

type ProjectStore = {
  status: Record<string, ProjectStatus>;
  owner: Record<string, string>;
  comments: Record<string, ProjectComment[]>;
};
const INIT: ProjectStore = { status: {}, owner: {}, comments: {} };

export function useProjects() {
  const [store, setStore, ready] = useLocalStore<ProjectStore>("agentflow.projects.v1", INIT);

  const projects = React.useMemo<Project[]>(
    () =>
      BASE_PROJECTS.map((p) => {
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

  return { projects, move, addComment, ready };
}

/* ---------- Today ---------- */

type TodayStore = {
  needs: Record<string, "approved" | "rejected">;
  undone: Record<string, boolean>;
};
const TODAY_INIT: TodayStore = { needs: {}, undone: {} };

export function useToday() {
  const [store, setStore, ready] = useLocalStore<TodayStore>("agentflow.today.v1", TODAY_INIT);
  const resolve = React.useCallback(
    (id: string, status: "approved" | "rejected") =>
      setStore((prev) => ({ ...prev, needs: { ...prev.needs, [id]: status } })),
    [setStore],
  );
  const undo = React.useCallback(
    (id: string) => setStore((prev) => ({ ...prev, undone: { ...prev.undone, [id]: true } })),
    [setStore],
  );
  return { needs: store.needs, undone: store.undone, resolve, undo, ready };
}
