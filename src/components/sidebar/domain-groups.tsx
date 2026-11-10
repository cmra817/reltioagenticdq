import { Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertTriangle, ChevronDown, ChevronRight, DatabaseZap, Plus } from "lucide-react";
import { SearchIcon } from "../brand-icons";
import { STATUS_LABEL, statusForScore, useDomainState, type HealthStatus } from "../domain-context";
import { newChatId, useChatThreads } from "../chat/chat-context";
import { useSetupSessions } from "../add-dataset-agentic/setup-sessions";
import { useUnreadRunAlerts } from "@/lib/ops-store";
import { scheduleThreadId } from "../scheduled/open-schedule";
import { ROW_CLASS, ROW_STYLE, SectionLabel, ThreadRow, useMounted } from "./chat-lists";

/** Chats shown under each domain before the rest are left to search. */
const PER_GROUP = 5;
/** Collapse key for chats that are not about one domain. */
const ALL_KEY = "__all__";

const STATUS_COLOR: Record<HealthStatus, string> = {
  good: "var(--status-good)",
  warn: "var(--status-warn)",
  bad: "var(--status-bad)",
  unknown: "var(--ink-100)",
};

/**
 * Recents, grouped by domain. A domain row opens that domain's home; the arrow
 * folds its chats away; the plus starts a new chat in that domain. Domains are
 * sorted lowest health first so the ones that need attention are on top.
 * Pinned chats stay in their own section above.
 */
export function DomainGroups({
  activeNav,
  onSearch,
}: {
  activeNav: string;
  onSearch: () => void;
}) {
  const navigate = useNavigate();
  const { domains, selected, selectDomain, healthFor } = useDomainState();
  const { threads, createThread } = useChatThreads();
  const { sessions, resume } = useSetupSessions();
  const { alerts, schedules } = useUnreadRunAlerts();
  const mounted = useMounted();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const sorted = useMemo(
    () =>
      [...domains].sort((a, b) => {
        const sa = healthFor(a);
        const sb = healthFor(b);
        if (sa === null && sb === null) return a.localeCompare(b);
        if (sa === null) return 1;
        if (sb === null) return -1;
        return sa - sb || a.localeCompare(b);
      }),
    [domains, healthFor],
  );

  // Rules and dashboards are about no single domain; jobs always have one.
  const domainOf = (t: (typeof threads)[number]): string | undefined => {
    if (t.kind === "rule" || t.kind === "dashboard") return undefined;
    if (t.kind === "schedule") {
      const id = t.id.replace(/^schedule-view-/, "");
      return schedules.find((s) => s.id === id)?.domain ?? t.domain;
    }
    return t.domain;
  };
  const unpinned = threads.filter((t) => !t.pinned);
  const untagged = unpinned.filter((t) => {
    const d = domainOf(t);
    return !d || !domains.includes(d);
  });

  function newChatIn(domain: string) {
    selectDomain(domain);
    void navigate({ to: "/domain", search: { n: newChatId() } });
  }


  return (
    <div className="mt-3 px-3">
      <div className="flex items-center justify-between pr-1">
        <SectionLabel>Recents</SectionLabel>
        <button
          type="button"
          onClick={onSearch}
          aria-label="Search chats"
          title="Search (⌘K)"
          className="mb-1 flex h-6 w-6 items-center justify-center rounded-md transition-colors hover:bg-[color:var(--surface-soft)]"
          style={{ color: "var(--ink-500)" }}
        >
          <SearchIcon />
        </button>
      </div>

      <ul>
        {sorted.map((name) => {
          const score = healthFor(name);
          const status = statusForScore(score);
          const isSel = name === selected;
          const current = isSel && activeNav === "domain";
          const domAlerts = mounted
            ? alerts.filter((r) => schedules.find((s) => s.id === r.scheduleId)?.domain === name)
            : [];
          const domSessions = mounted ? sessions.filter((x) => x.domain === name) : [];
          // A domain with an unread alert stays open so the alert is seen.
          const open = domAlerts.length > 0 || !collapsed[name];
          const chats = mounted ? unpinned.filter((t) => domainOf(t) === name) : [];
          return (
            <li key={name}>
              <div className="group/dom flex items-center">
                <button
                  type="button"
                  onClick={() => setCollapsed((c) => ({ ...c, [name]: open }))}
                  aria-label={`${open ? "Collapse" : "Expand"} ${name}`}
                  aria-expanded={open}
                  className="flex h-8 w-6 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-[color:var(--surface-soft)]"
                  style={{ color: "var(--ink-500)" }}
                >
                  {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    selectDomain(name);
                    void navigate({ to: "/domain" });
                  }}
                  aria-current={current ? "page" : undefined}
                  className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13.5px] transition-colors hover:bg-[color:var(--surface-soft)]"
                  style={{
                    color: isSel ? "var(--ink-900)" : "var(--ink-700)",
                    background: current ? "var(--surface-soft)" : "transparent",
                  }}
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ background: STATUS_COLOR[status] }}
                    aria-hidden="true"
                  />
                  <span className={`min-w-0 flex-1 truncate ${isSel ? "font-semibold" : "font-medium"}`}>
                    {name}
                  </span>
                  <span className="sr-only">{STATUS_LABEL[status]}</span>
                  {score !== null && (
                    <span className="shrink-0 text-[12px] tabular-nums" style={{ color: "var(--ink-500)" }}>
                      {score}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => newChatIn(name)}
                  aria-label={`New chat in ${name}`}
                  title={`New chat in ${name}`}
                  className="ml-0.5 hidden h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-[color:var(--surface-soft)] group-hover/dom:flex focus-visible:flex"
                  style={{ color: "var(--ink-500)" }}
                >
                  <Plus size={14} />
                </button>
              </div>
              {open && chats.length + domAlerts.length + domSessions.length > 0 && (
                <ul className="ml-4">
                  {domAlerts.map((r) => {
                    const sName =
                      schedules.find((s) => s.id === r.scheduleId)?.name ?? "Task run";
                    return (
                      <li key={r.id} className="flex items-center">
                        <Link
                          to="/schedule/$threadId"
                          params={{ threadId: scheduleThreadId(r.scheduleId) }}
                          search={{ run: r.id }}
                          className={ROW_CLASS}
                          style={ROW_STYLE}
                          title={`Needs a look: ${sName}`}
                        >
                          <AlertTriangle
                            size={14}
                            style={{ color: "var(--status-warn)", flexShrink: 0 }}
                          />
                          <span className="truncate">{sName}</span>
                          <span className="sr-only"> run needs attention</span>
                        </Link>
                      </li>
                    );
                  })}
                  {domSessions.map((x) => (
                    <li key={x.id} className="flex items-center">
                      <button
                        type="button"
                        onClick={() => resume(x.id)}
                        className={ROW_CLASS}
                        style={ROW_STYLE}
                        title={x.title}
                      >
                        <DatabaseZap size={14} style={{ color: "var(--brand-blue)", flexShrink: 0 }} />
                        <span className="truncate">{x.title}</span>
                      </button>
                    </li>
                  ))}
                  {chats.slice(0, PER_GROUP).map((t) => (
                    <ThreadRow key={t.id} thread={t} />
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>

      {mounted && untagged.length > 0 && (
        <div className="mt-1">
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setCollapsed((c) => ({ ...c, [ALL_KEY]: !c[ALL_KEY] }))}
              aria-label={`${collapsed[ALL_KEY] ? "Expand" : "Collapse"} All domains`}
              aria-expanded={!collapsed[ALL_KEY]}
              className="flex h-8 w-6 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-[color:var(--surface-soft)]"
              style={{ color: "var(--ink-500)" }}
            >
              {collapsed[ALL_KEY] ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
            </button>
            <span
              className="flex-1 px-2 py-1.5 text-[13.5px] font-medium"
              style={{ color: "var(--ink-700)" }}
            >
              All domains
            </span>
          </div>
          {!collapsed[ALL_KEY] && (
            <ul className="ml-4">
              {untagged.slice(0, PER_GROUP).map((t) => (
                <ThreadRow key={t.id} thread={t} />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
