import { AgentflowSidebar } from "@/components/agentflow-sidebar";
import { AgentflowTopbar } from "@/components/agentflow-topbar";
import { SidebarProvider, useSidebarState } from "@/components/sidebar-context";
import { DomainProvider } from "@/components/domain-context";
import { DomainConnectedBanner } from "@/components/domain-connected-banner";
import { ChatProvider } from "@/components/chat/chat-context";
import { DockComposer } from "@/components/chat/dock-composer";

function AppShellInner({
  children,
  activeNav,
  activeTab,
  hideDock,
}: {
  children: React.ReactNode;
  activeNav?: "data-health" | "explore" | "dq-checks";
  activeTab?: "Agents" | "Unstructured" | "Quality";
  hideDock?: boolean;
}) {
  const { collapsed } = useSidebarState();
  return (
    <div
      className="relative min-h-screen w-full overflow-hidden"
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
      <div className="relative z-10 flex h-screen flex-col">
        <AgentflowTopbar />
        <DomainConnectedBanner />
        <div className="flex flex-1 overflow-hidden">
          {!collapsed && <AgentflowSidebar activeNav={activeNav ?? "data-health"} />}
          <main className="relative flex flex-1 flex-col overflow-hidden">
            {children}
            {!hideDock && <DockComposer />}
          </main>
        </div>
      </div>
    </div>
  );
}

export function AppShell(props: {
  children: React.ReactNode;
  activeNav?: "data-health" | "explore" | "dq-checks";
  activeTab?: "Agents" | "Unstructured" | "Quality";
  hideDock?: boolean;
}) {
  return (
    <SidebarProvider>
      <DomainProvider>
        <ChatProvider>
          <AppShellInner {...props} />
        </ChatProvider>
      </DomainProvider>
    </SidebarProvider>
  );
}
