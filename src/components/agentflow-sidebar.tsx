import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppsGridIcon, ChevronDownIcon, UserIcon } from "./brand-icons";
import { useDomainState } from "./domain-context";
import { AgenticAddAssetModal } from "./add-dataset-agentic/AgenticAddAssetModal";
import { useCreatedAssets } from "./created-assets-context";
import { useNotifications } from "./notification-context";
import { newChatId } from "./chat/chat-context";
import { useSetupSessions } from "./add-dataset-agentic/setup-sessions";
import { useRules, useSchedules } from "@/lib/ops-store";
import { useOpenSchedule } from "./scheduled/open-schedule";
import { ME } from "@/lib/mock-ops";
import { dimensionsInUse, scheduleLabel } from "./add-dataset-agentic/plan-state";
import { tableName } from "./add-dataset-agentic/plan-state";
import { Clock, LayoutDashboard, ListChecks, MessageSquarePlus } from "lucide-react";
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
  const { completeConnection, selected } = useDomainState();
  const { runJob } = useNotifications();
  const { addAssets } = useCreatedAssets();
  const setup = useSetupSessions();
  const { add: addSchedule } = useSchedules();
  const { rules } = useRules();
  const openSchedule = useOpenSchedule();
  const isTaskSetup = setup.active?.purpose === "task" || setup.active?.purpose === "tables";
  const navigate = useNavigate();
  const [pendingDomain, setPendingDomain] = useState<string | null>(null);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => void navigate({ to: "/domain", search: { all: true, n: newChatId() } })}
        className="inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-[14px] font-medium"
        style={{
          borderColor: "var(--brand-blue)",
          color: "var(--brand-blue)",
          background: "rgba(67,134,250,0.08)",
        }}
      >
        <MessageSquarePlus size={14} />
        <span>New chat</span>
      </button>

      <AgenticAddAssetModal
        key={setup.active?.id ?? "none"}
        open={!!setup.active}
        onOpenChange={(o) => {
          if (!o) {
            setup.close();
            setPendingDomain(null);
          }
        }}
        domainName={isTaskSetup ? setup.active?.domain ?? "" : setup.active?.domain || pendingDomain || selected}
        purpose={setup.active?.purpose ?? "asset"}
        onTaskComplete={(plan, domain) => {
          const id = `task-${Date.now()}`;
          const dims = new Set(dimensionsInUse(plan).map((d) => d.toLowerCase()));
          const ruleIds = rules.filter((r) => r.scope !== "Template" && dims.has(r.type.toLowerCase())).map((r) => r.id);
          addSchedule({
            id,
            name: `${plan.profiling?.frequency === "weekly" ? "Weekly" : "Daily"} checks — ${domain}`,
            domain,
            kind: "Profiling + checks",
            tables: plan.selected.map(tableName),
            ruleIds,
            repeats: scheduleLabel(plan.profiling),
            nextRun: "Tomorrow",
            active: true,
            owner: ME,
            permissions: "Everyone in the domain",
            plan,
          });
          if (setup.active) setup.deleteSession(setup.active.id);
          window.setTimeout(() => openSchedule(id), 1300);
        }}
        snapshot={setup.active ? setup.getSession(setup.active.id)?.snapshot ?? null : null}
        onPersist={(snapshot) => {
          const a = setup.active;
          if (!a) return;
          const task = a.purpose === "task" || a.purpose === "tables";
          const label = a.purpose === "tables" ? "Add tables" : "New task";
          // A saved task is no longer a setup in progress.
          if (task && snapshot.done) return;
          const domain = task ? snapshot.taskDomain || a.domain : a.domain || selected;
          setup.saveSession({
            id: a.id,
            domain,
            purpose: a.purpose,
            title: task ? (domain ? `${label}: ${domain}` : label) : `Add asset: ${domain}`,
            updatedAt: Date.now(),
            snapshot,
          });
        }}
        onComplete={({ tables, checkCount, assets }) => {
          const domain = assets[0]?.domain || setup.active?.domain || pendingDomain || selected;
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
          label="Tasks"
          to="/scheduled"
          active={activeNav === "scheduled"}
        />
        <NavItem
          icon={<ListChecks {...iconProps} />}
          label="Rules"
          to="/rules"
          active={activeNav === "rules"}
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
