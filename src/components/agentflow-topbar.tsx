import { useEffect, useRef, useState } from "react";
import lockupUrl from "@/assets/reltio-agentflow-lockup.png";
import { ChevronDownIcon, PlusIcon, SidebarToggleIcon } from "./brand-icons";
import { useSidebarState } from "./sidebar-context";
import { useDomainState } from "./domain-context";
import { CreateDomainDialog } from "./create-domain-dialog";
import { AddDatasetModal } from "./add-dataset/AddDatasetModal";

const tabs = ["Agents", "Unstructured", "Quality"] as const;
type Tab = (typeof tabs)[number];

function NewMenu() {
  const { addDomain, selectDomain, completeConnection, selected } = useDomainState();
  const [open, setOpen] = useState(false);
  const [domainOpen, setDomainOpen] = useState(false);
  const [datasetOpen, setDatasetOpen] = useState(false);
  // Domain that the dataset wizard should attach to once finished.
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

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-7 items-center gap-1.5 rounded-full border px-3 text-[14px] font-medium transition-colors"
        style={{
          borderColor: "var(--brand-blue)",
          color: "var(--brand-blue)",
          background: open ? "rgba(67,134,250,0.14)" : "rgba(67,134,250,0.08)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(67,134,250,0.14)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = open
            ? "rgba(67,134,250,0.14)"
            : "rgba(67,134,250,0.08)";
        }}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <PlusIcon size={14} />
        <span>New</span>
        <span
          className="transition-transform"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          <ChevronDownIcon size={12} />
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+6px)] z-50 w-56 overflow-hidden rounded-xl border bg-white py-1"
          style={{
            borderColor: "var(--hairline)",
            boxShadow: "0 12px 32px rgba(15,23,42,0.12)",
          }}
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              // "Add new dataset" attaches to the currently selected domain.
              setPendingDomain(selected);
              setDatasetOpen(true);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-[14px] transition-colors hover:bg-[color:var(--surface-soft)]"
            style={{ color: "var(--ink-900)" }}
          >
            <PlusIcon size={14} />
            <span>Add new dataset</span>
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              setDomainOpen(true);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-[14px] transition-colors hover:bg-[color:var(--surface-soft)]"
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
          // Create the domain immediately so it appears in the selector,
          // then open the dataset wizard scoped to this new domain.
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
        onComplete={({ tables, checkCount }) => {
          completeConnection({
            domain: pendingDomain ?? selected,
            tables,
            checkCount,
          });
          setPendingDomain(null);
        }}
      />
    </div>
  );
}

export function AgentflowTopbar({ active = "Quality" as Tab }: { active?: Tab }) {
  const { toggle, collapsed } = useSidebarState();
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

      {/* Logo lockup */}
      <img
        src={lockupUrl}
        alt="Reltio AgentFlow"
        style={{ height: 26, width: "auto", display: "block" }}
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

      <div className="ml-auto pr-2">
        <NewMenu />
      </div>
    </header>
  );
}
