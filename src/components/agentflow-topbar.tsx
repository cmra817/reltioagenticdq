import lockupUrl from "@/assets/reltio-agentflow-lockup.png";

const tabs = ["Agents", "Unstructured", "Quality"] as const;
type Tab = (typeof tabs)[number];

export function AgentflowTopbar({ active = "Quality" as Tab }: { active?: Tab }) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-6 px-6">
      {/* Logo lockup */}
      <img
        src={lockupUrl}
        alt="Reltio AgentFlow"
        style={{ height: 28, width: "auto", display: "block" }}
      />

      {/* Tab pill */}
      <nav
        className="ml-2 flex items-center gap-1 rounded-full border p-1"
        style={{ borderColor: "var(--hairline)", background: "white" }}
        aria-label="Sections"
      >
        {tabs.map((t) => {
          const isActive = t === active;
          return (
            <button
              key={t}
              type="button"
              className="rounded-full px-4 py-1.5 text-[14px] font-medium transition-colors"
              style={{
                color: isActive ? "var(--brand-blue)" : "var(--ink-700)",
                background: isActive ? "rgba(67,134,250,0.08)" : "transparent",
              }}
            >
              {t}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
