import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  AppsGridIcon,
  ChevronDownIcon,
  PlusIcon,
  UserIcon,
} from "./brand-icons";
import { useDomainState } from "./domain-context";
import { CreateDomainDialog } from "./create-domain-dialog";
import { AddDatasetModal } from "./add-dataset/AddDatasetModal";
import { AgenticAddAssetModal } from "./add-dataset-agentic/AgenticAddAssetModal";
import { useCreatedAssets } from "./created-assets-context";
import { useNotifications } from "./notification-context";
import { newChatId, useChatThreads } from "./chat/chat-context";
import { useSetupSessions } from "./add-dataset-agentic/setup-sessions";
import { Clock, FolderKanban, LayoutDashboard, ListChecks, MessageSquarePlus } from "lucide-react";
import { DomainGroups } from "./sidebar/domain-groups";
import { PinnedChats } from "./sidebar/chat-lists";
import { useNeeds } from "@/lib/projects-store";
import { SearchDialog } from "./sidebar/search-dialog";

export type SidebarNav =
  | "today"
  | "projects"
  | "data-health"
  | "scheduled"
  | "rules"
  | "domain"
  | "explore"
  | "dq-checks"
  | "none";

function NavItem({
  icon,
  label,
  active,
  to,
  onClick,
  hint,
  badge,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  to?: "/" | "/today" | "/scheduled" | "/rules" | "/projects";
  /** Small count badge, e.g. what needs the person. */
  badge?: number;
  onClick?: () => void;
  /** Small trailing text, e.g. a keyboard shortcut. */
  hint?: string;
}) {
  const className =
    "group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[14px] leading-none transition-colors";
  const style: React.CSSProperties = {
    color: active ? "var(--brand-blue)" : "var(--ink-700)",
    background: active ? "var(--surface-soft)" : "transparent",
  };
  const inner = (
    <>
      <span style={{ color: active ? "var(--brand-blue)" : "var(--ink-500)" }}>{icon}</span>
      <span className="font-medium">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span
          className="ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold text-white"
          style={{ background: "var(--brand-blue)" }}
        >
          {badge}
          <span className="sr-only"> need you</span>
        </span>
      )}
      {hint && (
        <span className="ml-auto text-[11px] font-normal" style={{ color: "var(--ink-300)" }}>
          {hint}
        </span>
      )}
    </>
  );
  if (to) {
    return (
      <Link to={to} className={className} style={style} aria-current={active ? "page" : undefined}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" className={className} style={style} onClick={onClick}>
      {inner}
    </button>
  );
}

function SectionDivider() {
  return <div className="mx-3 my-2 h-px" style={{ background: "var(--hairline)" }} />;
}

function NewMenu() {
  const { addDomain, selectDomain, completeConnection, selected } = useDomainState();
  const { runJob } = useNotifications();
  const { addAssets } = useCreatedAssets();
  const { createThread } = useChatThreads();
  const setup = useSetupSessions();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [domainOpen, setDomainOpen] = useState(false);
  const [datasetOpen, setDatasetOpen] = useState(false);
  const [pendingDomain, setPendingDomain] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const itemClass =
    "flex w-full items-center gap-2 px-3 py-2 text-left text-[14px] transition-colors hover:bg-[color:var(--surface-soft)]";

  return (
    <div ref={ref} className="relative">
      <div
        className="inline-flex h-9 items-center rounded-full border text-[14px] font-medium"
        style={{
          borderColor: "var(--brand-blue)",
          color: "var(--brand-blue)",
          background: open ? "rgba(67,134,250,0.14)" : "rgba(67,134,250,0.08)",
        }}
      >
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            void navigate({ to: "/domain", search: { all: true, n: newChatId() } });
          }}
          className="inline-flex h-full items-center gap-1.5 rounded-l-full pl-3 pr-2"
        >
          <MessageSquarePlus size={14} />
          <span>New chat</span>
        </button>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="More ways to add"
          className="inline-flex h-full items-center rounded-r-full border-l pl-2 pr-2.5"
          style={{ borderColor: "var(--brand-blue)" }}
          aria-haspopup="menu"
          aria-expanded={open}
        >
          <span
            className="transition-transform"
            style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
          >
            <ChevronDownIcon size={12} />
          </span>
        </button>
      </div>

      {open && (
        <div
          role="menu"
          className="absolute left-0 top-[calc(100%+6px)] z-50 w-56 overflow-hidden rounded-xl border bg-white py-1"
          style={{ borderColor: "var(--hairline)", boxShadow: "0 12px 32px rgba(15,23,42,0.12)" }}
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              setPendingDomain(selected);
              // Any setup already in progress stays saved under Recent chats.
              setup.openNew(selected);
            }}
            className={itemClass}
            style={{ color: "var(--ink-900)" }}
          >
            <PlusIcon size={14} />
            <span>Add new data asset (agentic)</span>
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              setDomainOpen(true);
            }}
            className={itemClass}
            style={{ color: "var(--ink-900)" }}
          >
            <PlusIcon size={14} />
            <span>Create new domain</span>
          </button>
        </div>
      )}

      <CreateDomainDialog
        open={domainOpen}
        onOpenChange={setDomainOpen}
        onCreate={(name) => {
          addDomain(name);
          selectDomain(name);
          setPendingDomain(name);
          setDatasetOpen(true);
        }}
      />
      <AddDatasetModal
        open={datasetOpen}
        onOpenChange={(o) => {
          setDatasetOpen(o);
          if (!o) setPendingDomain(null);
        }}
        domainName={pendingDomain ?? selected}
        onComplete={({ tables, checkCount, assets }) => {
          completeConnection({ domain: pendingDomain ?? selected, tables, checkCount });
          // Register the new assets so they appear in Explore with their checks + schedule.
          addAssets(assets);
          // Newly added datasets kick off profiling + DQ checks; notify on completion.
          tables.forEach((table, i) => {
            runJob({ kind: "profiling", table, delayMs: 3500 + i * 1200 });
            runJob({ kind: "checks", table, delayMs: 7000 + i * 1200 });
          });
          setPendingDomain(null);
        }}
      />
      <AgenticAddAssetModal
        key={setup.active?.id ?? "none"}
        open={!!setup.active}
        onOpenChange={(o) => {
          if (!o) {
            setup.close();
            setPendingDomain(null);
          }
        }}
        domainName={setup.active?.domain || pendingDomain || selected}
        snapshot={setup.active ? setup.getSession(setup.active.id)?.snapshot ?? null : null}
        onPersist={(snapshot) => {
          const a = setup.active;
          if (!a) return;
          const domain = a.domain || selected;
          setup.saveSession({
            id: a.id,
            domain,
            title: `Add asset: ${domain}`,
            updatedAt: Date.now(),
            snapshot,
          });
        }}
        onComplete={({ tables, checkCount, assets }) => {
          const domain = setup.active?.domain || pendingDomain || selected;
          if (setup.active) setup.deleteSession(setup.active.id);
          completeConnection({ domain, tables, checkCount });
          // Register the new assets so they appear in Explore with their checks + schedule.
          addAssets(assets);
          // Newly added datasets kick off profiling + DQ checks; notify on completion.
          tables.forEach((table, i) => {
            runJob({ kind: "profiling", table, delayMs: 3500 + i * 1200 });
            runJob({ kind: "checks", table, delayMs: 7000 + i * 1200 });
          });
          setPendingDomain(null);
        }}
      />

    </div>
  );
}

export function AgentflowSidebar({ activeNav = "data-health" }: { activeNav?: SidebarNav }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const needsCount = useNeeds().open.length;
  const iconProps = { size: 20, strokeWidth: 1.6 };

  return (
    <aside
      className="flex h-full w-[273px] shrink-0 flex-col"
      style={{ background: "transparent" }}
    >
      {/* new menu */}
      <div className="mt-3 px-3">
        <NewMenu />
      </div>

      {/* global destinations */}
      <nav className="mt-3 px-3" aria-label="Primary">
        <NavItem
          icon={<LayoutDashboard {...iconProps} />}
          label="Dashboards"
          to="/"
          active={activeNav === "data-health"}
          badge={needsCount}
        />
        <NavItem
          icon={<Clock {...iconProps} />}
          label="Jobs"
          to="/scheduled"
          active={activeNav === "scheduled"}
        />
        <NavItem
          icon={<ListChecks {...iconProps} />}
          label="Rules"
          to="/rules"
          active={activeNav === "rules"}
        />
        <NavItem
          icon={<FolderKanban {...iconProps} />}
          label="Projects"
          to="/projects"
          active={activeNav === "projects"}
        />
      </nav>

      <SectionDivider />

      {/* Pinned chats, domains, and recents scroll together; the footer stays put. */}
      <div className="min-h-0 flex-1 overflow-y-auto pb-2">
        <PinnedChats />
        <DomainGroups activeNav={activeNav} onSearch={() => setSearchOpen(true)} />
      </div>

      {/* footer block */}
      <div className="border-t px-3 py-3" style={{ borderColor: "var(--hairline)" }}>
        
        <NavItem icon={<UserIcon />} label="Admin" />
        <NavItem icon={<AppsGridIcon />} label="Applications" />

        <div
          className="mt-3 flex items-center justify-between rounded-lg p-2"
          style={{ background: "transparent" }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-semibold text-white"
              style={{ background: "var(--ink-700)" }}
              aria-hidden="true"
            >
              MG
            </div>
            <div className="leading-tight">
              <div className="text-[13px] font-semibold" style={{ color: "var(--ink-900)" }}>
                Molly Gordon
              </div>
              <div className="text-[12px]" style={{ color: "var(--ink-300)" }}>
                Molly Gordon
              </div>
            </div>
          </div>
          <ChevronDownIcon size={16} className="text-[color:var(--ink-500)]" />
        </div>
      </div>
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </aside>
  );
}
