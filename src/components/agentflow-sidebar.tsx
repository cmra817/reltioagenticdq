import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  AppsGridIcon,
  BarsIcon,
  ChevronDownIcon,
  CompassIcon,
  DollarIcon,
  FolderIcon,
  HealthIcon,
  PlusCircleIcon,
  PlusIcon,
  SearchIcon,
  SidebarToggleIcon,
  UserIcon,
  UsersGearIcon,
} from "./brand-icons";

function NavItem({
  icon,
  label,
  active,
  to,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  to?: "/" | "/data-health" | "/explore";
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
    </>
  );
  if (to) {
    return (
      <Link to={to} className={className} style={style}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" className={className} style={style}>
      {inner}
    </button>
  );
}

function SectionDivider() {
  return <div className="mx-3 my-3 h-px" style={{ background: "var(--hairline)" }} />;
}

const DEFAULT_DOMAINS = [
  "Finance",
  "Marketing",
  "Sales",
  "Human Resources",
  "Operations",
  "Customer Success",
  "Product",
  "Supply Chain",
];

function DomainPill() {
  const [domains, setDomains] = useState<string[]>(DEFAULT_DOMAINS);
  const [selected, setSelected] = useState<string>("Finance");
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setCreating(false);
        setDraft("");
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  function handleSelect(name: string) {
    setSelected(name);
    setOpen(false);
    setCreating(false);
    setDraft("");
  }

  function handleCreate() {
    const name = draft.trim();
    if (!name) return;
    if (!domains.includes(name)) setDomains((d) => [...d, name]);
    setSelected(name);
    setDraft("");
    setCreating(false);
    setOpen(false);
  }

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-full px-3 py-2 transition-colors hover:bg-[color:var(--surface-soft)] border-0 bg-black/0"
        style={{ borderColor: "var(--hairline)", background: "white" }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="text-[14px] font-medium" style={{ color: "var(--ink-900)" }}>
          {selected}
        </span>
        <span style={{ color: "var(--ink-500)" }}>
          <ChevronDownIcon
            size={14}
            className={`transition-transform ${open ? "rotate-180" : ""}`}
          />
        </span>
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute top-0 z-30 w-64 overflow-hidden rounded-xl border bg-white py-1"
          style={{
            left: "calc(100% + 8px)",
            borderColor: "var(--hairline)",
            boxShadow: "0 12px 32px rgba(15, 23, 42, 0.12)",
          }}
        >
          <ul className="max-h-64 overflow-y-auto py-1">
            {domains.map((d) => {
              const isSel = d === selected;
              return (
                <li key={d}>
                  <button
                    type="button"
                    onClick={() => handleSelect(d)}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-[13px] hover:bg-[color:var(--surface-soft)]"
                    style={{ color: isSel ? "var(--brand-blue)" : "var(--ink-900)" }}
                  >
                    <span className="font-medium">{d}</span>
                    {isSel && (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="my-1 h-px" style={{ background: "var(--hairline)" }} />
          {creating ? (
            <div className="flex items-center gap-2 px-2 py-2">
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
                className="flex-1 rounded-md border px-2 py-1 text-[13px] outline-none focus:border-[color:var(--brand-blue)]"
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
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] hover:bg-[color:var(--surface-soft)]"
              style={{ color: "var(--ink-700)" }}
            >
              <PlusIcon size={14} />
              <span className="font-medium">Create custom domain</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function AgentflowSidebar({
  activeNav = "new-chat",
}: {
  activeNav?: "new-chat" | "data-health" | "explore";
}) {
  return (
    <aside
      className="flex h-full w-[260px] shrink-0 flex-col"
      style={{ background: "transparent" }}
    >
      {/* top: collapse toggle */}
      <div className="px-4 pt-4">
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-[color:var(--surface-soft)]"
          style={{ color: "var(--ink-700)" }}
          aria-label="Collapse sidebar"
        >
          <SidebarToggleIcon size={20} />
        </button>
      </div>

      {/* primary actions */}
      <nav className="mt-4 px-3">
        <NavItem icon={<PlusCircleIcon />} label="New chat" to="/" active={activeNav === "new-chat"} />
        <NavItem
          icon={<HealthIcon />}
          label="Data health"
          to="/data-health"
          active={activeNav === "data-health"}
        />
      </nav>

      <SectionDivider />

      {/* domain selector pill */}
      <div className="px-3">
        <DomainPill />
      </div>

      {/* secondary nav */}
      <nav className="mt-2 px-3">
        <NavItem icon={<CompassIcon />} label="Explore" to="/explore" active={activeNav === "explore"} />
        <NavItem icon={<FolderIcon />} label="Projects" />
        <NavItem icon={<BarsIcon />} label="DQ checks" />
      </nav>

      <SectionDivider />

      {/* recent chats */}
      <div className="px-3">
        <div className="flex items-center justify-between px-3 pb-1">
          <span
            className="text-[11px] font-semibold uppercase tracking-[0.08em]"
            style={{ color: "var(--ink-300)" }}
          >
            Recent chats
          </span>
          <button
            type="button"
            className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-[color:var(--surface-soft)]"
            style={{ color: "var(--ink-500)" }}
            aria-label="Search chats"
          >
            <SearchIcon size={14} />
          </button>
        </div>
        <ul className="space-y-0.5">
          {["Resolve organization matches", "Search for individuals in Calif…"].map((t) => (
            <li key={t}>
              <button
                type="button"
                className="w-full truncate rounded-md px-3 py-1.5 text-left text-[13px] hover:bg-[color:var(--surface-soft)]"
                style={{ color: "var(--ink-700)" }}
              >
                {t}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* spacer */}
      <div className="flex-1" />

      {/* footer block */}
      <div className="border-t px-3 py-3" style={{ borderColor: "var(--hairline)" }}>
        <NavItem icon={<UsersGearIcon />} label="Agent Studio" />
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
    </aside>
  );
}
