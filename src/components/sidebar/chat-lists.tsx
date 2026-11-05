import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertTriangle, DatabaseZap, Pin, PinOff } from "lucide-react";
import { useChatThreads, type ChatThread } from "../chat/chat-context";
import { useSetupSessions } from "../add-dataset-agentic/setup-sessions";
import { useUnreadRunAlerts } from "@/lib/ops-store";

const ROW_CLASS =
  "flex min-w-0 flex-1 items-center gap-2 truncate rounded-lg px-3 py-1.5 text-left text-[13px] transition-colors hover:bg-[color:var(--surface-soft)]";
const ROW_STYLE = { color: "var(--ink-700)" };

/** Threads and setup sessions live in localStorage, so render them only after hydration. */
function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide"
      style={{ color: "var(--ink-300)" }}
    >
      {children}
    </div>
  );
}

function ThreadLink({ thread, children }: { thread: ChatThread; children: React.ReactNode }) {
  if (thread.kind === "investigation") {
    return (
      <Link
        to="/investigate/consistency"
        search={{ q: thread.title, thread: thread.id }}
        className={ROW_CLASS}
        style={ROW_STYLE}
        title={thread.title}
      >
        {children}
      </Link>
    );
  }
  return (
    <Link
      to="/chat/$chatId"
      params={{ chatId: thread.id }}
      className={ROW_CLASS}
      style={ROW_STYLE}
      title={thread.title}
    >
      {children}
    </Link>
  );
}

/**
 * One chat row. A pin button appears on hover or keyboard focus, and the
 * domain tag (when shown) steps aside for it.
 */
function ThreadRow({ thread, showDomain }: { thread: ChatThread; showDomain?: boolean }) {
  const { togglePin } = useChatThreads();
  const pinned = !!thread.pinned;
  return (
    <li className="group relative flex items-center">
      <ThreadLink thread={thread}>
        {pinned && <Pin size={12} style={{ color: "var(--ink-300)", flexShrink: 0 }} />}
        <span className="truncate">{thread.title}</span>
        {showDomain && thread.domain && (
          <span
            className="ml-auto shrink-0 pl-2 text-[11px] group-hover:hidden group-focus-within:hidden"
            style={{ color: "var(--ink-300)" }}
          >
            {thread.domain}
          </span>
        )}
      </ThreadLink>
      <button
        type="button"
        onClick={() => togglePin(thread.id)}
        aria-label={pinned ? `Unpin chat: ${thread.title}` : `Pin chat: ${thread.title}`}
        title={pinned ? "Unpin" : "Pin"}
        className="absolute right-1 hidden h-6 w-6 items-center justify-center rounded-md transition-colors hover:bg-white group-hover:flex group-focus-within:flex focus-visible:flex"
        style={{ color: "var(--ink-500)", background: "var(--surface-soft)" }}
      >
        {pinned ? <PinOff size={13} /> : <Pin size={13} />}
      </button>
    </li>
  );
}

/** Pinned chats only — dashboards are not pinned here. */
export function PinnedChats() {
  const { threads } = useChatThreads();
  const mounted = useMounted();
  const pinned = threads.filter((t) => t.pinned);
  if (!mounted || pinned.length === 0) return null;
  return (
    <div className="mt-3 px-3">
      <SectionLabel>Pinned</SectionLabel>
      <ul>
        {pinned.map((t) => (
          <ThreadRow key={t.id} thread={t} showDomain />
        ))}
      </ul>
    </div>
  );
}

/** Everything that isn't pinned, newest first, across all domains. */
export function RecentChats() {
  const { threads } = useChatThreads();
  const { sessions, resume } = useSetupSessions();
  const { alerts, schedules } = useUnreadRunAlerts();
  const mounted = useMounted();
  const recent = threads.filter((t) => !t.pinned);
  if (!mounted || (recent.length === 0 && sessions.length === 0 && alerts.length === 0))
    return null;

  const items = [
    // Only runs that failed or need attention surface here, and only until opened.
    ...alerts.map((r) => ({
      kind: "run" as const,
      id: r.id,
      updatedAt: Date.now() - r.hoursAgo * 3_600_000,
      name: schedules.find((s) => s.id === r.scheduleId)?.name ?? "Schedule run",
    })),
    ...sessions.map((s) => ({
      kind: "setup" as const,
      id: s.id,
      updatedAt: s.updatedAt,
      session: s,
    })),
    ...recent.map((t) => ({
      kind: "thread" as const,
      id: t.id,
      updatedAt: t.updatedAt,
      thread: t,
    })),
  ].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="mt-3 px-3">
      <SectionLabel>Recents</SectionLabel>
      <ul>
        {items.slice(0, 8).map((item) =>
          item.kind === "run" ? (
            <li key={item.id} className="flex items-center">
              <Link
                to="/scheduled"
                search={{ run: item.id }}
                className={ROW_CLASS}
                style={ROW_STYLE}
                title={`Needs a look: ${item.name}`}
              >
                <AlertTriangle size={14} style={{ color: "var(--status-warn)", flexShrink: 0 }} />
                <span className="truncate">{item.name}</span>
                <span className="sr-only"> run needs attention</span>
              </Link>
            </li>
          ) : item.kind === "setup" ? (
            <li key={item.id} className="flex items-center">
              <button
                type="button"
                onClick={() => resume(item.id)}
                className={ROW_CLASS}
                style={ROW_STYLE}
                title={item.session.title}
              >
                <DatabaseZap size={14} style={{ color: "var(--brand-blue)", flexShrink: 0 }} />
                <span className="truncate">{item.session.title}</span>
              </button>
            </li>
          ) : (
            <ThreadRow key={item.id} thread={item.thread} showDomain />
          ),
        )}
      </ul>
    </div>
  );
}

const DOMAIN_CHAT_LIMIT = 5;

/** A domain's complete chat history, shown under the domain when it is selected. */
export function DomainChats({ domain }: { domain: string }) {
  const { threads } = useChatThreads();
  const mounted = useMounted();
  const [showAll, setShowAll] = useState(false);
  const mine = threads.filter((t) => t.domain === domain);
  if (!mounted || mine.length === 0) return null;
  const visible = showAll ? mine : mine.slice(0, DOMAIN_CHAT_LIMIT);
  const hidden = mine.length - visible.length;
  return (
    <div className="mt-1">
      <ul>
        {visible.map((t) => (
          <ThreadRow key={t.id} thread={t} />
        ))}
      </ul>
      {(hidden > 0 || showAll) && mine.length > DOMAIN_CHAT_LIMIT && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="px-3 py-1 text-[12px] hover:underline"
          style={{ color: "var(--ink-500)" }}
        >
          {showAll ? "Show fewer" : `Show ${hidden} more`}
        </button>
      )}
    </div>
  );
}
