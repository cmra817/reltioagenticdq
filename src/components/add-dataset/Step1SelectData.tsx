import { useMemo, useState } from "react";
import { ChevronDown, Search, Plus } from "lucide-react";
import { toast } from "sonner";
import { AssetRow } from "./AssetRow";
import {
  WAREHOUSES,
  assetKey,
  formatRows,
  type Connection,
  type WarehouseType,
} from "./mock-warehouses";

type ActiveSchema = { connId: string; schema: string } | null;

export function Step1SelectData({
  selected,
  onToggle,
}: {
  selected: Set<string>;
  onToggle: (key: string) => void;
}) {
  const [activeSchema, setActiveSchema] = useState<ActiveSchema>(null);
  const [query, setQuery] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [collapsedConns, setCollapsedConns] = useState<Set<string>>(new Set());

  const grouped = useMemo(() => {
    const map = new Map<WarehouseType, Connection[]>();
    for (const c of WAREHOUSES) {
      const arr = map.get(c.warehouse) ?? [];
      arr.push(c);
      map.set(c.warehouse, arr);
    }
    return Array.from(map.entries());
  }, []);

  const state: "idle" | "browse" | "search" =
    query.trim() === "" ? (activeSchema ? "browse" : "idle") : "search";

  const toggleGroup = (g: string) =>
    setCollapsedGroups((s) => {
      const n = new Set(s);
      n.has(g) ? n.delete(g) : n.add(g);
      return n;
    });

  const toggleConn = (id: string) =>
    setCollapsedConns((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  return (
    <div
      className="mx-10 my-8 flex min-h-[calc(100vh-280px)] flex-col overflow-hidden rounded-2xl border bg-white"
      style={{ borderColor: "var(--hairline)" }}
    >
      {/* Sub-header */}
      <div
        className="flex items-center justify-between border-b px-6 py-4"
        style={{ borderColor: "var(--hairline)" }}
      >
        <div className="text-[15px]" style={{ color: "var(--ink-700)" }}>
          Select tables to monitor
        </div>
        <button
          type="button"
          onClick={() => toast.info("Add connection coming soon")}
          className="flex h-9 items-center gap-1.5 rounded-lg border px-3 text-[13px] font-medium transition-colors hover:bg-[color:var(--surface-soft)]"
          style={{ borderColor: "var(--hairline)", color: "var(--ink-700)" }}
        >
          <Plus size={14} />
          Add connection
        </button>
      </div>

      {/* Two panels */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className="w-[280px] shrink-0 overflow-y-auto border-r py-3"
          style={{ borderColor: "var(--hairline)" }}
        >
          {grouped.map(([warehouse, conns]) => {
            const groupCollapsed = collapsedGroups.has(warehouse);
            return (
              <div key={warehouse} className="mb-2">
                <button
                  type="button"
                  onClick={() => toggleGroup(warehouse)}
                  className="flex w-full items-center gap-1.5 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide"
                  style={{ color: "var(--ink-300)" }}
                >
                  <ChevronDown
                    size={12}
                    style={{
                      transform: groupCollapsed ? "rotate(-90deg)" : "rotate(0)",
                      transition: "transform 150ms",
                    }}
                  />
                  {warehouse}
                </button>
                {!groupCollapsed &&
                  conns.map((conn) => {
                    const connCollapsed = collapsedConns.has(conn.id);
                    return (
                      <div key={conn.id} className="mb-1">
                        <button
                          type="button"
                          onClick={() => toggleConn(conn.id)}
                          className="flex w-full items-center gap-1.5 px-4 py-1.5 text-[13px] font-medium"
                          style={{ color: "var(--ink-700)" }}
                        >
                          <ChevronDown
                            size={12}
                            style={{
                              transform: connCollapsed ? "rotate(-90deg)" : "rotate(0)",
                              transition: "transform 150ms",
                              color: "var(--ink-300)",
                            }}
                          />
                          {conn.name}
                        </button>
                        {!connCollapsed &&
                          conn.schemas.map((sch) => {
                            const isActive =
                              activeSchema?.connId === conn.id &&
                              activeSchema.schema === sch.name;
                            return (
                              <button
                                key={sch.name}
                                type="button"
                                onClick={() =>
                                  setActiveSchema({ connId: conn.id, schema: sch.name })
                                }
                                className="flex w-full items-center justify-between py-1.5 pl-9 pr-4 text-[13px] transition-colors hover:bg-[color:var(--surface-soft)]"
                                style={{
                                  background: isActive
                                    ? "rgba(67,134,250,0.10)"
                                    : "transparent",
                                  color: isActive ? "var(--brand-blue)" : "var(--ink-700)",
                                  borderLeft: isActive
                                    ? "2px solid var(--brand-blue)"
                                    : "2px solid transparent",
                                }}
                              >
                                <span className="truncate font-mono text-[12px]">{sch.name}</span>
                                <span
                                  className="ml-2 text-[11px]"
                                  style={{ color: "var(--ink-300)" }}
                                >
                                  {sch.assets.length}
                                </span>
                              </button>
                            );
                          })}
                      </div>
                    );
                  })}
              </div>
            );
          })}
        </aside>

        {/* Right panel */}
        <section className="flex flex-1 flex-col overflow-hidden">
          {state === "idle" ? (
            <div className="flex flex-1 flex-col items-center justify-center px-6">
              <SearchInput value={query} onChange={setQuery} large />
              <p className="mt-4 text-[13px]" style={{ color: "var(--ink-500)" }}>
                Or select a schema on the left to browse its tables.
              </p>
            </div>
          ) : (
            <>
              <div className="px-8 pt-6 pb-4">
                <SearchInput value={query} onChange={setQuery} large={false} />
              </div>
              <div className="flex-1 overflow-y-auto px-8 pb-6">
                {state === "browse" ? (
                  <BrowseBody
                    activeSchema={activeSchema!}
                    selected={selected}
                    onToggle={onToggle}
                  />
                ) : (
                  <SearchBody
                    query={query}
                    activeSchema={activeSchema}
                    selected={selected}
                    onToggle={onToggle}
                  />
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function SearchInput({
  value,
  onChange,
  large,
}: {
  value: string;
  onChange: (v: string) => void;
  large: boolean;
}) {
  return (
    <div
      className="relative transition-all duration-200"
      style={{ width: large ? 520 : "100%", maxWidth: large ? 520 : 640 }}
    >
      <Search
        size={16}
        className="absolute left-4 top-1/2 -translate-y-1/2"
        style={{ color: "var(--ink-300)" }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search tables across all connections"
        className="w-full rounded-xl border bg-white pl-11 pr-4 text-[14px] outline-none transition-shadow focus:shadow-[0_0_0_3px_rgba(67,134,250,0.15)]"
        style={{
          borderColor: "var(--hairline)",
          color: "var(--ink-900)",
          height: large ? 48 : 40,
        }}
      />
    </div>
  );
}

function BrowseBody({
  activeSchema,
  selected,
  onToggle,
}: {
  activeSchema: { connId: string; schema: string };
  selected: Set<string>;
  onToggle: (key: string) => void;
}) {
  const conn = WAREHOUSES.find((c) => c.id === activeSchema.connId)!;
  const sch = conn.schemas.find((s) => s.name === activeSchema.schema)!;
  const totalRows = sch.assets.reduce((acc, a) => acc + a.rows, 0);
  const selectedInSchema = sch.assets.filter((a) =>
    selected.has(assetKey(conn.id, sch.name, a.name)),
  ).length;

  return (
    <div>
      <div className="text-[13px]" style={{ color: "var(--ink-500)" }}>
        {conn.name} ›{" "}
        <span className="font-semibold" style={{ color: "var(--ink-900)" }}>
          {sch.name}
        </span>
      </div>
      <div className="mt-1 text-[12px]" style={{ color: "var(--ink-500)" }}>
        {sch.assets.length} tables · {formatRows(totalRows)} rows · {selectedInSchema} selected
      </div>
      <div className="mt-4 flex flex-col gap-1">
        {sch.assets.map((a) => {
          const k = assetKey(conn.id, sch.name, a.name);
          return (
            <AssetRow
              key={k}
              asset={a}
              schema={sch.name}
              connection={conn.name}
              selected={selected.has(k)}
              onToggle={() => onToggle(k)}
            />
          );
        })}
      </div>
    </div>
  );
}

function SearchBody({
  query,
  activeSchema,
  selected,
  onToggle,
}: {
  query: string;
  activeSchema: ActiveSchema;
  selected: Set<string>;
  onToggle: (key: string) => void;
}) {
  const q = query.trim().toLowerCase();
  const groups = WAREHOUSES.map((conn) => {
    const matches: { schema: string; asset: (typeof conn.schemas)[number]["assets"][number] }[] =
      [];
    for (const sch of conn.schemas) {
      for (const a of sch.assets) {
        if (a.name.toLowerCase().includes(q)) matches.push({ schema: sch.name, asset: a });
      }
    }
    return { conn, matches };
  }).filter((g) => g.matches.length > 0);

  // Float active connection's group to top
  if (activeSchema) {
    groups.sort((a, b) =>
      a.conn.id === activeSchema.connId ? -1 : b.conn.id === activeSchema.connId ? 1 : 0,
    );
  }

  if (groups.length === 0) {
    return (
      <div className="py-12 text-center text-[13px]" style={{ color: "var(--ink-500)" }}>
        No tables match "{query}"
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {groups.map(({ conn, matches }) => (
        <div key={conn.id}>
          <div
            className="mb-2 text-[11px] font-semibold uppercase tracking-wide"
            style={{ color: "var(--ink-300)" }}
          >
            {conn.name} · {matches.length} {matches.length === 1 ? "match" : "matches"}
          </div>
          <div className="flex flex-col gap-1">
            {matches.map(({ schema, asset }) => {
              const k = assetKey(conn.id, schema, asset.name);
              return (
                <AssetRow
                  key={k}
                  asset={asset}
                  schema={schema}
                  connection={conn.name}
                  selected={selected.has(k)}
                  onToggle={() => onToggle(k)}
                  highlight={query}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
