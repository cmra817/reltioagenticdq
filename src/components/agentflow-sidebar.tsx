import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  AppsGridIcon,
  BarsIcon,
  ChevronDownIcon,
  CompassIcon,
  HealthIcon,
  PlusIcon,
  UserIcon,
  UsersGearIcon,
} from "./brand-icons";
import { useDomainState } from "./domain-context";
import { CreateDomainDialog } from "./create-domain-dialog";
import { AddDatasetModal } from "./add-dataset/AddDatasetModal";
import { useCreatedAssets } from "./created-assets-context";
import { useNotifications } from "./notification-context";

function NavItem({
  icon,
  label,
  active,
  to,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  to?: "/" | "/data-health" | "/explore" | "/dq-checks";
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
  return <div className="mx-3 my-2 h-px" style={{ background: "var(--hairline)" }} />;
}

function DomainPill() {
  const { domains, selected, selectDomain, addDomain, connections } = useDomainState();
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
    selectDomain(name);
    setOpen(false);
    setCreating(false);
    setDraft("");
  }

  function handleCreate() {
    const name = draft.trim();
    if (!name) return;
    addDomain(name);
    selectDomain(name);
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
        style={{ borderColor: "var(--hairline)" }}
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
              const conn = connections[d];
              return (
                <li key={d}>
                  <button
                    type="button"
                    onClick={() => handleSelect(d)}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[13px] hover:bg-[color:var(--surface-soft)]"
                    style={{ color: isSel ? "var(--brand-blue)" : "var(--ink-900)" }}
                  >
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate font-medium">{d}</span>
                      {conn && (
                        <span
                          className="truncate text-[11px] font-normal"
                          style={{ color: "var(--ink-500)" }}
                        >
                          {conn.tables.length} table{conn.tables.length === 1 ? "" : "s"} ·{" "}
                          {conn.checkCount} check{conn.checkCount === 1 ? "" : "s"}
                        </span>
                      )}
                    </span>
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

function NewMenu() {
  const { addDomain, selectDomain, completeConnection, selected } = useDomainState();
  const { runJob } = useNotifications();
  const { addAssets } = useCreatedAssets();
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
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-full items-center gap-1.5 rounded-full border px-3 text-[14px] font-medium transition-colors"
        style={{
          borderColor: "var(--brand-blue)",
          color: "var(--brand-blue)",
          background: open ? "rgba(67,134,250,0.14)" : "rgba(67,134,250,0.08)",
        }}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <PlusIcon size={14} />
        <span>New</span>
        <span
          className="ml-auto transition-transform"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          <ChevronDownIcon size={12} />
        </span>
      </button>

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
              setDatasetOpen(true);
            }}
            className={itemClass}
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
    </div>
  );
}

export function AgentflowSidebar({
  activeNav = "data-health",
}: {
  activeNav?: "data-health" | "explore" | "dq-checks";
}) {
  return (
    <aside
      className="flex h-full w-[260px] shrink-0 flex-col"
      style={{ background: "transparent" }}
    >
      {/* new menu */}
      <div className="mt-3 px-3">
        <NewMenu />
      </div>

      {/* primary actions */}
      <nav className="mt-3 px-3">
        <NavItem
          icon={<HealthIcon />}
          label="Data health"
          to="/"
          active={activeNav === "data-health"}
        />
      </nav>


      <SectionDivider />

      {/* domain selector pill */}
      <div className="px-3">
        <DomainPill />
      </div>

      {/* secondary nav — scoped to selected domain */}
      <nav className="mt-2 px-3 pl-6">
        <NavItem icon={<CompassIcon />} label="Explore" to="/explore" active={activeNav === "explore"} />
        <NavItem icon={<BarsIcon />} label="DQ checks" to="/dq-checks" active={activeNav === "dq-checks"} />
      </nav>

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
