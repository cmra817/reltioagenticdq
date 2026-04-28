import { AgentflowSidebar } from "@/components/agentflow-sidebar";
import { AgentflowTopbar } from "@/components/agentflow-topbar";
import { SidebarProvider, useSidebarState } from "@/components/sidebar-context";
import { DomainProvider } from "@/components/domain-context";

function AppShellInner({
  children,
  activeNav,
  activeTab,
}: {
  children: React.ReactNode;
  activeNav?: "new-chat" | "data-health" | "explore";
  activeTab?: "Agents" | "Unstructured" | "Quality";
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
        <AgentflowTopbar active={activeTab ?? "Quality"} />
        <div className="flex flex-1 overflow-hidden">
          {!collapsed && <AgentflowSidebar activeNav={activeNav ?? "new-chat"} />}
          <main className="flex flex-1 flex-col overflow-hidden">{children}</main>
        </div>
      </div>
    </div>
  );
}

export function AppShell(props: {
  children: React.ReactNode;
  activeNav?: "new-chat" | "data-health" | "explore";
  activeTab?: "Agents" | "Unstructured" | "Quality";
}) {
  return (
    <SidebarProvider>
      <DomainProvider>
        <AppShellInner {...props} />
      </DomainProvider>
    </SidebarProvider>
  );
}
