import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouterState } from "@tanstack/react-router";

/**
 * In-progress "add data asset (agentic)" sessions survive navigation: they are
 * listed under Recent chats and reopen exactly where the user left them.
 */
export type SetupSnapshot = {
  mode: "chat" | "plan" | "manual";
  plan: unknown;
  msgs: unknown[];
  queue: unknown[];
  proposal: unknown;
  filled: number;
  done: string | null;
  /** New-task setups: which question the agent is waiting on, and the chosen domain. */
  taskStage?: "domain" | "details" | null;
  taskDomain?: string;
};

/** What the setup produces: data assets, or a task (which always belongs to one domain). */
export type SetupPurpose = "asset" | "task";

export type SetupSession = {
  id: string;
  title: string;
  domain: string;
  purpose?: SetupPurpose;
  updatedAt: number;
  snapshot: SetupSnapshot;
};

const STORAGE_KEY = "agentflow.asset-setup.sessions.v1";

function read(): SetupSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SetupSession[];
    return Array.isArray(parsed) ? parsed.filter((s) => s && typeof s.id === "string") : [];
  } catch {
    return [];
  }
}

function write(sessions: SetupSession[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions.slice(0, 20)));
  } catch {
    /* best effort */
  }
}

export function newSetupId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `setup-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

type Value = {
  sessions: SetupSession[];
  active: { id: string; domain: string; purpose: SetupPurpose } | null;
  getSession: (id: string) => SetupSession | undefined;
  saveSession: (s: SetupSession) => void;
  deleteSession: (id: string) => void;
  openNew: (domain: string, purpose?: SetupPurpose) => void;
  resume: (id: string) => void;
  close: () => void;
};

const Ctx = createContext<Value | null>(null);

export function SetupSessionProvider({ children }: { children: React.ReactNode }) {
  const [sessions, setSessions] = useState<SetupSession[]>([]);
  const [active, setActive] = useState<{ id: string; domain: string; purpose: SetupPurpose } | null>(null);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // localStorage is client-only; hydrate after mount to avoid an SSR mismatch.
  useEffect(() => setSessions(read()), []);

  // Leaving for another page puts the setup away; the session stays saved.
  useEffect(() => {
    setActive(null);
  }, [pathname]);

  const saveSession = useCallback((s: SetupSession) => {
    setSessions((prev) => {
      const next = [s, ...prev.filter((x) => x.id !== s.id)].sort((a, b) => b.updatedAt - a.updatedAt);
      write(next);
      return next;
    });
  }, []);

  const deleteSession = useCallback((id: string) => {
    setSessions((prev) => {
      const next = prev.filter((x) => x.id !== id);
      write(next);
      return next;
    });
  }, []);

  const getSession = useCallback((id: string) => sessions.find((s) => s.id === id), [sessions]);

  const openNew = useCallback(
    (domain: string, purpose: SetupPurpose = "asset") => setActive({ id: newSetupId(), domain, purpose }),
    [],
  );

  const resume = useCallback(
    (id: string) => {
      const s = read().find((x) => x.id === id);
      setActive({ id, domain: s?.domain ?? "", purpose: s?.purpose ?? "asset" });
    },
    [],
  );

  const close = useCallback(() => setActive(null), []);

  const value = useMemo(
    () => ({ sessions, active, getSession, saveSession, deleteSession, openNew, resume, close }),
    [sessions, active, getSession, saveSession, deleteSession, openNew, resume, close],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSetupSessions() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSetupSessions must be used inside SetupSessionProvider");
  return ctx;
}
