import * as React from "react";
import { AgentflowSidebar } from "@/components/agentflow-sidebar";
import { AgentflowTopbar } from "@/components/agentflow-topbar";
import { SidebarProvider, useSidebarState } from "@/components/sidebar-context";
import { DomainProvider } from "@/components/domain-context";
import { DomainConnectedBanner } from "@/components/domain-connected-banner";
import { ChatProvider } from "@/components/chat/chat-context";
import { DockComposer } from "@/components/chat/dock-composer";

// A full-height slot on the far right of the page (above the topbar's row).
// Table pages portal their evidence panel into it so the panel spans the
// entire viewport height and the header only covers the left region.
export const RightPanelSlotContext = React.createContext<{
  node: HTMLElement | null;
  setGrows: (g: boolean) => void;
}>({ node: null, setGrows: () => {} });

export const RightPanelExpandedContext = React.createContext<boolean>(false);

function AppShellInner({
  children,
  activeNav,
  activeTab,
  hideDock,
  panelFullHeight,
}: {
  children: React.ReactNode;
  activeNav?: "data-health" | "explore" | "dq-checks";
  activeTab?: "Agents" | "Unstructured" | "Quality";
  hideDock?: boolean;
  panelFullHeight?: boolean;
}) {
  const { collapsed } = useSidebarState();
  const [slotNode, setSlotNode] = React.useState<HTMLElement | null>(null);
  const [slotGrows, setSlotGrows] = React.useState(false);

  const left = (
    <div
      className="flex min-h-0 min-w-0 flex-col transition-[width] duration-200"
      style={slotGrows ? { width: 260, flex: "0 0 260px" } : { flex: "1 1 0%" }}
    >
      <AgentflowTopbar />
      <DomainConnectedBanner />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {!collapsed && <AgentflowSidebar activeNav={activeNav ?? "data-health"} />}
        <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
          {children}
          {!hideDock && <DockComposer />}
        </main>
      </div>
    </div>
  );

  return (
    <div
      className="relative min-h-screen w-full overflow-clip"
      style={{ background: "var(--canvas)" }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: "var(--gradient-aurora)" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 right-0 h-[640px] w-[900px] rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, rgba(103,240,255,0.45), rgba(67,134,250,0.18) 55%, transparent 75%)",
          filter: "blur(40px)",
        }}
      />
      {panelFullHeight ? (
        <RightPanelSlotContext.Provider value={{ node: slotNode, setGrows: setSlotGrows }}>
          <RightPanelExpandedContext.Provider value={slotGrows}>
            <div className="relative z-10 flex h-screen">
              {left}
              <div
                ref={setSlotNode}
                className="flex h-full min-w-0"
                style={{ flex: slotGrows ? "1 1 0%" : "0 0 auto" }}
              />
            </div>
          </RightPanelExpandedContext.Provider>
        </RightPanelSlotContext.Provider>
      ) : (
        <div className="relative z-10 flex h-screen flex-col">{left}</div>
      )}
    </div>
  );
}

export function AppShell(props: {
  children: React.ReactNode;
  activeNav?: "data-health" | "explore" | "dq-checks";
  activeTab?: "Agents" | "Unstructured" | "Quality";
  hideDock?: boolean;
  panelFullHeight?: boolean;
}) {
  return (
    <SidebarProvider>
      <DomainProvider>
        <ChatProvider>
          <SetupSessionProvider>
            <AppShellInner {...props} />
          </SetupSessionProvider>
        </ChatProvider>
      </DomainProvider>
    </SidebarProvider>
  );
}
