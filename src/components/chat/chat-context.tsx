import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { UIMessage } from "ai";

export type ChatThread = {
  id: string;
  title: string;
  updatedAt: number;
  messages: UIMessage[];
  /** Scripted surfaces (e.g. the consistency investigation) reopen on their own route. */
  kind?: "chat" | "investigation" | "rule" | "dashboard" | "schedule" | "domain";
  /** Pinned chats sit in their own sidebar section and are never trimmed from history. */
  pinned?: boolean;
  /** The domain the chat started in. It stays put even if the chat later moves focus. */
  domain?: string;
};

const STORAGE_KEY = "agentflow.chat.threads.v1";

function readThreads(): ChatThread[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatThread[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((t) => t && typeof t.id === "string");
  } catch {
    return [];
  }
}

const MAX_UNPINNED_THREADS = 40;

function writeThreads(threads: ChatThread[]) {
  if (typeof window === "undefined") return;
  try {
    // Threads arrive newest-first. Keep every pinned chat; trim only the rest.
    let unpinned = 0;
    const kept = threads.filter((t) => t.pinned || ++unpinned <= MAX_UNPINNED_THREADS);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(kept));
  } catch {
    /* storage full or unavailable — history is best-effort */
  }
}

export function newChatId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function titleFromText(text: string) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return "New chat";
  return clean.length > 52 ? `${clean.slice(0, 52)}…` : clean;
}

type ChatContextValue = {
  threads: ChatThread[];
  getThread: (id: string) => ChatThread | undefined;
  createThread: (opts?: {
    id?: string;
    title?: string;
    kind?: ChatThread["kind"];
    domain?: string;
  }) => ChatThread;
  saveMessages: (id: string, messages: UIMessage[], kind?: ChatThread["kind"]) => void;
  renameThread: (id: string, title: string) => void;
  /** Changes a chat's scope. Only meant for chats that have no messages yet. */
  setThreadDomain: (id: string, domain: string | undefined) => void;
  deleteThread: (id: string) => void;
  togglePin: (id: string) => void;
};

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [threads, setThreads] = useState<ChatThread[]>(() => readThreads());

  const update = useCallback((next: (prev: ChatThread[]) => ChatThread[]) => {
    setThreads((prev) => {
      const value = next(prev).sort((a, b) => b.updatedAt - a.updatedAt);
      writeThreads(value);
      return value;
    });
  }, []);

  const createThread = useCallback(
    (opts?: { id?: string; title?: string; kind?: ChatThread["kind"]; domain?: string }) => {
      const thread: ChatThread = {
        id: opts?.id ?? newChatId(),
        title: opts?.title ?? "New chat",
        updatedAt: Date.now(),
        messages: [],
        kind: opts?.kind ?? "chat",
        domain: opts?.domain,
      };
      update((prev) => [thread, ...prev.filter((t) => t.id !== thread.id)]);
      return thread;
    },
    [update],
  );

  const saveMessages = useCallback(
    (id: string, messages: UIMessage[], kind?: ChatThread["kind"]) => {
      update((prev) => {
        const existing = prev.find((t) => t.id === id);
        const firstUser = messages.find((m) => m.role === "user");
        const derived = firstUser
          ? titleFromText(firstUser.parts.map((p) => (p.type === "text" ? p.text : "")).join(" "))
          : undefined;
        const title =
          existing && existing.title !== "New chat" ? existing.title : (derived ?? "New chat");
        const thread: ChatThread = {
          id,
          title,
          updatedAt: Date.now(),
          messages,
          kind: existing?.kind ?? kind ?? "chat",
          pinned: existing?.pinned,
          domain: existing?.domain,
        };
        return [thread, ...prev.filter((t) => t.id !== id)];
      });
    },
    [update],
  );

  const renameThread = useCallback(
    (id: string, title: string) => {
      update((prev) => prev.map((t) => (t.id === id ? { ...t, title } : t)));
    },
    [update],
  );

  const setThreadDomain = useCallback(
    (id: string, domain: string | undefined) => {
      // Scope is not a recent activity, so updatedAt is left alone.
      update((prev) => prev.map((t) => (t.id === id ? { ...t, domain } : t)));
    },
    [update],
  );

  const deleteThread = useCallback(
    (id: string) => {
      update((prev) => prev.filter((t) => t.id !== id));
    },
    [update],
  );

  const togglePin = useCallback(
    (id: string) => {
      // Pinning must not bump a chat to the top of Recents, so updatedAt is left alone.
      update((prev) => prev.map((t) => (t.id === id ? { ...t, pinned: !t.pinned } : t)));
    },
    [update],
  );

  const getThread = useCallback((id: string) => threads.find((t) => t.id === id), [threads]);

  const value = useMemo(
    () => ({
      threads,
      getThread,
      createThread,
      saveMessages,
      renameThread,
      setThreadDomain,
      deleteThread,
      togglePin,
    }),
    [
      threads,
      getThread,
      createThread,
      saveMessages,
      renameThread,
      setThreadDomain,
      deleteThread,
      togglePin,
    ],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChatThreads() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChatThreads must be used inside ChatProvider");
  return ctx;
}
