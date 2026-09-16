
import * as React from "react";
import reltioWordmark from "@/assets/reltio-wordmark.png";
import { SidebarToggleIcon } from "./brand-icons";
import { useSidebarState } from "./sidebar-context";
import { NotificationBell } from "./notification-bell";
import { RightPanelExpandedContext } from "./app-shell";

export function AgentflowTopbar() {
  const { toggle, collapsed } = useSidebarState();
  const rightExpanded = React.useContext(RightPanelExpandedContext);
  return (
    <header className="flex h-12 shrink-0 items-center gap-4 px-4">
      {/* Sidebar toggle */}
      <button
        type="button"
        onClick={toggle}
        className="flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-[color:var(--surface-soft)]"
        style={{ color: "var(--ink-700)" }}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-pressed={!collapsed}
      >
        <SidebarToggleIcon size={20} />
      </button>

      {/* Reltio | Data Quality */}
      <div className="flex items-center gap-3">
        <img
          src={reltioWordmark}
          alt="Reltio"
          className="block h-[22px] w-auto shrink-0 object-contain"
        />

        {!rightExpanded && (
          <>
            <span style={{ color: "var(--hairline)" }}>|</span>
            <span className="text-[16px] font-semibold" style={{ color: "var(--ink-900)" }}>
              Data Quality
            </span>
          </>
        )}
      </div>

      {/* Right side */}
      {!rightExpanded && (
        <div className="ml-auto flex items-center gap-2">
          <NotificationBell />
        </div>
      )}
    </header>

  );
}
