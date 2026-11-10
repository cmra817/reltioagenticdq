import * as React from "react";
import { useLocalStore } from "./use-local-store";
import {
  BASE_RULES,
  BASE_RUNS,
  BASE_SCHEDULES,
  ME,
  type Rule,
  type Run,
  type Schedule,
} from "./mock-ops";

/* ---------- schedules ---------- */

type ScheduleStore = { patches: Record<string, Partial<Schedule>>; added: Schedule[] };
const SCHEDULES_INIT: ScheduleStore = { patches: {}, added: [] };

export function useSchedules() {
  const [store, setStore, ready] = useLocalStore<ScheduleStore>(
    "agentflow.schedules.v1",
    SCHEDULES_INIT,
  );

  const schedules = React.useMemo<Schedule[]>(
    () => [...BASE_SCHEDULES.map((s) => ({ ...s, ...store.patches[s.id] })), ...store.added],
    [store],
  );

  const update = React.useCallback(
    (id: string, patch: Partial<Schedule>) =>
      setStore((prev) => {
        if (prev.added.some((a) => a.id === id)) {
          return { ...prev, added: prev.added.map((a) => (a.id === id ? { ...a, ...patch } : a)) };
        }
        return { ...prev, patches: { ...prev.patches, [id]: { ...prev.patches[id], ...patch } } };
      }),
    [setStore],
  );

  return { schedules, update, ready };
}

/* ---------- runs ---------- */

type ExtraRun = Run & { createdAt: number };
type RunStore = { extra: ExtraRun[]; viewed: string[] };
const RUNS_INIT: RunStore = { extra: [], viewed: [] };

export function useRuns(schedules: Schedule[]) {
  const [store, setStore, ready] = useLocalStore<RunStore>("agentflow.runs.v1", RUNS_INIT);

  const runs = React.useMemo<Run[]>(() => {
    const now = Date.now();
    const extra = store.extra.map((r) => ({ ...r, hoursAgo: (now - r.createdAt) / 3_600_000 }));
    return [...extra, ...BASE_RUNS].sort((a, b) => a.hoursAgo - b.hoursAgo);
  }, [store]);

  /** Starts a manual run. It shows as running, then finishes a moment later. */
  const startRun = React.useCallback(
    (scheduleId: string) => {
      const schedule = schedules.find((s) => s.id === scheduleId);
      if (!schedule) return;
      const id = `run-${Date.now()}`;
      const checks = schedule.ruleIds.length * schedule.tables.length * 4;
      const base: ExtraRun = {
        id,
        scheduleId,
        hoursAgo: 0,
        createdAt: Date.now(),
        status: "running",
        durationSec: 0,
        checksRun: 0,
        checksFailed: 0,
        findings: [],
      };
      setStore((prev) => ({ ...prev, extra: [base, ...prev.extra] }));
      window.setTimeout(() => {
        setStore((prev) => ({
          ...prev,
          extra: prev.extra.map((r) =>
            r.id === id
              ? { ...r, status: "passed", checksRun: checks, durationSec: 41 + checks }
              : r,
          ),
        }));
      }, 1800);
    },
    [schedules, setStore],
  );

  const markViewed = React.useCallback(
    (id: string) =>
      setStore((prev) =>
        prev.viewed.includes(id) ? prev : { ...prev, viewed: [...prev.viewed, id] },
      ),
    [setStore],
  );

  return { runs, startRun, viewed: store.viewed, markViewed, ready };
}

/** Failed or needs-attention runs from the last day that you haven't opened. Only these reach Recents. */
export function useUnreadRunAlerts() {
  const { schedules } = useSchedules();
  const { runs, viewed, ready } = useRuns(schedules);
  const alerts = React.useMemo(
    () =>
      runs.filter(
        (r) =>
          (r.status === "failed" || r.status === "attention") &&
          r.hoursAgo <= 24 &&
          !viewed.includes(r.id),
      ),
    [runs, viewed],
  );
  return { alerts, schedules, ready };
}

/* ---------- rules ---------- */

type RuleStore = { patches: Record<string, Rule>; added: Rule[] };
const RULES_INIT: RuleStore = { patches: {}, added: [] };

export function todayLabel() {
  return new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export type ImpactMode = "everywhere" | "new" | "some";

export function useRules() {
  const [store, setStore, ready] = useLocalStore<RuleStore>("agentflow.rules.v1", RULES_INIT);
  const { schedules, update: updateSchedule } = useSchedules();

  const rules = React.useMemo<Rule[]>(
    () => [...BASE_RULES.map((r) => store.patches[r.id] ?? r), ...store.added],
    [store],
  );

  const addRule = React.useCallback(
    (rule: Rule) => setStore((prev) => ({ ...prev, added: [...prev.added, rule] })),
    [setStore],
  );

  const writeRule = React.useCallback(
    (rule: Rule) =>
      setStore((prev) => {
        if (prev.added.some((a) => a.id === rule.id)) {
          return { ...prev, added: prev.added.map((a) => (a.id === rule.id ? rule : a)) };
        }
        return { ...prev, patches: { ...prev.patches, [rule.id]: rule } };
      }),
    [setStore],
  );

  /** Schedules that apply a rule right now. */
  const usedBy = React.useCallback(
    (ruleId: string) => schedules.filter((s) => s.ruleIds.includes(ruleId)),
    [schedules],
  );

  /**
   * Applies an edit with the choice made in the impact check:
   * everywhere, as a brand-new rule, or only on the schedules ticked
   * (the rest keep the previous version as their own rule).
   */
  const applyEdit = React.useCallback(
    (input: { before: Rule; after: Rule; note: string; mode: ImpactMode; updateIds: string[] }) => {
      const { before, after, note, mode, updateIds } = input;
      if (mode === "new") {
        const copy: Rule = {
          ...after,
          id: `r-${Date.now()}`,
          name: after.name === before.name ? `${after.name} (copy)` : after.name,
          scope: "Yours",
          owner: ME,
          versions: [{ v: 1, author: ME, at: todayLabel(), note: `Saved from ${before.name}` }],
        };
        addRule(copy);
        return copy.id;
      }
      const next: Rule = {
        ...after,
        versions: [
          { v: (before.versions[0]?.v ?? 0) + 1, author: ME, at: todayLabel(), note },
          ...before.versions,
        ],
      };
      writeRule(next);
      if (mode === "some") {
        const keep = usedBy(before.id).filter((s) => !updateIds.includes(s.id));
        if (keep.length > 0) {
          const legacyId = `${before.id}-prev-${Date.now()}`;
          addRule({
            ...before,
            id: legacyId,
            name: `${before.name} (previous version)`,
            scope: "Yours",
            owner: ME,
            versions: [
              { v: 1, author: ME, at: todayLabel(), note: "Kept for tasks not updated" },
            ],
          });
          keep.forEach((s) =>
            updateSchedule(s.id, {
              ruleIds: s.ruleIds.map((id) => (id === before.id ? legacyId : id)),
            }),
          );
        }
      }
      return next.id;
    },
    [addRule, writeRule, usedBy, updateSchedule],
  );

  return { rules, addRule, writeRule, applyEdit, usedBy, ready };
}
