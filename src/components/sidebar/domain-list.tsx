import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BarsIcon, ChevronDownIcon, CompassIcon, PlusIcon } from "../brand-icons";
import { STATUS_LABEL, statusForScore, useDomainState, type HealthStatus } from "../domain-context";
import { DomainChats, SectionLabel } from "./chat-lists";

/** Domains shown before "Show all". The selected domain is always shown. */
const VISIBLE_LIMIT = 6;

const STATUS_COLOR: Record<HealthStatus, string> = {
  good: "var(--status-good)",
  warn: "var(--status-warn)",
  bad: "var(--status-bad)",
  unknown: "var(--ink-100)",
};

function HealthDot({ status }: { status: HealthStatus }) {
  return (
    <span
      className="h-2 w-2 shrink-0 rounded-full"
      style={{ background: STATUS_COLOR[status] }}
      aria-hidden="true"
    />
  );
}

function ScopedLink({
  to,
  icon,
  label,
  active,
}: {
  to: "/explore" | "/dq-checks";
  icon: React.ReactNode;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-1.5 text-[13px] transition-colors hover:bg-[color:var(--surface-soft)]"
      style={{
        color: active ? "var(--brand-blue)" : "var(--ink-700)",
        background: active ? "var(--surface-soft)" : "transparent",
      }}
    >
      <span style={{ color: active ? "var(--brand-blue)" : "var(--ink-500)" }}>{icon}</span>
      <span className="font-medium">{label}</span>
    </Link>
  );
}

export function DomainList({ activeNav }: { activeNav: string }) {
  const { domains, selected, selectDomain, addDomain, healthFor } = useDomainState();
  const [showAll, setShowAll] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState("");

  // Lowest health first, so the domains that need attention are always at the top.
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

  const head = sorted.slice(0, VISIBLE_LIMIT);
  const visible = showAll ? sorted : head.includes(selected) ? head : [...head, selected];
  const hiddenCount = sorted.length - visible.length;

  function onRowClick(name: string) {
    if (name === selected) {
      setCollapsed((c) => !c);
      return;
    }
    selectDomain(name);
    setCollapsed(false);
  }

  function handleCreate() {
    const name = draft.trim();
    if (!name) return;
    addDomain(name);
    selectDomain(name);
    setCollapsed(false);
    setDraft("");
    setCreating(false);
  }

  return (
    <div className="mt-3 px-3">
      <SectionLabel>Domains</SectionLabel>
      <ul>
        {visible.map((name) => {
          const score = healthFor(name);
          const status = statusForScore(score);
          const isSel = name === selected;
          const expanded = isSel && !collapsed;
          return (
            <li key={name}>
              <button
                type="button"
                onClick={() => onRowClick(name)}
                aria-expanded={isSel ? expanded : undefined}
                aria-current={isSel ? "true" : undefined}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[14px] transition-colors hover:bg-[color:var(--surface-soft)]"
                style={{
                  color: isSel ? "var(--ink-900)" : "var(--ink-700)",
                  background: isSel ? "var(--surface-soft)" : "transparent",
                }}
              >
                <HealthDot status={status} />
                <span
                  className={`min-w-0 flex-1 truncate ${isSel ? "font-semibold" : "font-medium"}`}
                >
                  {name}
                </span>
                <span className="sr-only">{STATUS_LABEL[status]}</span>
                {score !== null && (
                  <span
                    className="shrink-0 text-[12px] tabular-nums"
                    style={{ color: "var(--ink-500)" }}
                  >
                    {score}
                  </span>
                )}
                {isSel && (
                  <span
                    className="shrink-0 transition-transform"
                    style={{
                      color: "var(--ink-500)",
                      transform: expanded ? "rotate(0deg)" : "rotate(-90deg)",
                    }}
                  >
                    <ChevronDownIcon size={14} />
                  </span>
                )}
              </button>

              {expanded && (
                <div className="mb-1 mt-0.5 pl-4">
                  <ScopedLink
                    to="/explore"
                    icon={<CompassIcon size={16} />}
                    label="Explore"
                    active={activeNav === "explore"}
                  />
                  <ScopedLink
                    to="/dq-checks"
                    icon={<BarsIcon size={16} />}
                    label="DQ checks"
                    active={activeNav === "dq-checks"}
                  />
                  <DomainChats domain={name} />
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {(hiddenCount > 0 || showAll) && sorted.length > VISIBLE_LIMIT && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="px-3 py-1 text-[12px] hover:underline"
          style={{ color: "var(--ink-500)" }}
        >
          {showAll ? "Show fewer" : `Show all (${sorted.length})`}
        </button>
      )}

      {creating ? (
        <div className="flex items-center gap-2 px-1 py-1.5">
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
              if (e.key === "Escape") {
                setCreating(false);
                setDraft("");
              }
            }}
            placeholder="Domain name"
            aria-label="New domain name"
            className="min-w-0 flex-1 rounded-md border px-2 py-1 text-[13px] outline-none focus:border-[color:var(--brand-blue)]"
            style={{ borderColor: "var(--hairline)", color: "var(--ink-900)" }}
          />
          <button
            type="button"
            onClick={handleCreate}
            className="rounded-md px-2 py-1 text-[12px] font-medium text-white"
            style={{ background: "var(--brand-blue)" }}
          >
            Add
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-1.5 text-left text-[13px] transition-colors hover:bg-[color:var(--surface-soft)]"
          style={{ color: "var(--ink-500)" }}
        >
          <PlusIcon size={14} />
          <span className="font-medium">Add domain</span>
        </button>
      )}
    </div>
  );
}
