import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Search, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { AssetRow } from "./AssetRow";
import { NewConnectionModal } from "./NewConnectionModal";
import { BigQueryIcon, DatabricksIcon, SnowflakeIcon } from "@/components/brand-icons";
import {
  WAREHOUSES,
  assetKey,
  formatRows,
  type Asset,
  type Connection,
  type WarehouseType,
} from "./mock-warehouses";

function WarehouseLogo({ warehouse }: { warehouse: WarehouseType }) {
  const Icon =
    warehouse === "Databricks"
      ? DatabricksIcon
      : warehouse === "Snowflake"
        ? SnowflakeIcon
        : BigQueryIcon;
  return (
    <span className="inline-flex h-4 w-4 items-center justify-center [&>svg]:h-4 [&>svg]:w-4">
      <Icon />
    </span>
  );
}

type ActiveSchema = { connId: string; schema: string } | null;

export function Step1SelectData({
  selected,
  onToggle,
  onClear,
  flashKeys,
}: {
  selected: Set<string>;
  onToggle: (key: string) => void;
  onClear: () => void;
  /** Optional: rows to briefly tint; the view jumps to the first one's schema. */
  flashKeys?: Set<string>;
}) {
  const [activeSchema, setActiveSchema] = useState<ActiveSchema>(null);
  const [query, setQuery] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [newConnOpen, setNewConnOpen] = useState(false);
  const [pageSize, setPageSize] = useState<10 | 20 | 50>(10);
  const [page, setPage] = useState(1);

  // Any change to the list itself resets pagination.
  useEffect(() => setPage(1), [query, activeSchema, pageSize]);

  useEffect(() => {
    const first = flashKeys ? Array.from(flashKeys)[0] : undefined;
    if (!first) return;
    const [connId, schema] = first.split("::");
    if (connId && schema) {
      setQuery("");
      setActiveSchema({ connId, schema });
    }
  }, [flashKeys]);

  const grouped = useMemo(() => {
    const map = new Map<WarehouseType, Connection[]>();
    for (const c of WAREHOUSES) {
      const arr = map.get(c.warehouse) ?? [];
      arr.push(c);
      map.set(c.warehouse, arr);
    }
    return Array.from(map.entries());
  }, []);

  const browseTotal = useMemo(() => {
    if (!activeSchema) return 0;
    const conn = WAREHOUSES.find((c) => c.id === activeSchema.connId);
    return conn?.schemas.find((s) => s.name === activeSchema.schema)?.assets.length ?? 0;
  }, [activeSchema]);

  const searchTotal = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q === "") return 0;
    let n = 0;
    for (const conn of WAREHOUSES)
      for (const sch of conn.schemas)
        for (const a of sch.assets) if (a.name.toLowerCase().includes(q)) n += 1;
    return n;
  }, [query]);

  const state: "idle" | "browse" | "search" =
    query.trim() === "" ? (activeSchema ? "browse" : "idle") : "search";
  const total = state === "browse" ? browseTotal : searchTotal;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);

  const toggleGroup = (g: string) =>
    setCollapsedGroups((s) => {
      const n = new Set(s);
      n.has(g) ? n.delete(g) : n.add(g);
      return n;
    });

  return (
    <div
      className="@container mx-4 my-6 flex min-h-[calc(100vh-280px)] flex-col overflow-hidden rounded-2xl border bg-white @[900px]:mx-10 @[900px]:my-8"
      style={{ borderColor: "var(--hairline)" }}
    >
      {/* Sub-header / toolbar */}
      <div
        className="flex items-center gap-4 border-b px-4 py-3 @[820px]:px-6"
        style={{ borderColor: "var(--hairline)" }}
      >
        <div className="text-[15px]" style={{ color: "var(--ink-700)" }}>
          Select tables to monitor
        </div>
        {selected.size > 0 && (
          <>
            <div
              className="h-5 w-px"
              style={{ background: "var(--hairline)" }}
              aria-hidden="true"
            />
            <div className="flex min-w-0 flex-1 flex-nowrap items-center gap-2">
              <span
                className="shrink-0 text-[12px] font-medium"
                style={{ color: "var(--ink-700)" }}
              >
                {selected.size} selected
              </span>
              {Array.from(selected).slice(0, 3).map((k) => {
                const name = k.split("::")[2];
                return (
                  <span
                    key={k}
                    className="inline-flex min-w-0 items-center gap-1.5 rounded-full border bg-white px-2.5 py-1 text-[12px]"
                    style={{ borderColor: "var(--hairline)", color: "var(--ink-900)" }}
                  >
                    <span className="truncate font-mono">{name}</span>
                    <button
                      type="button"
                      onClick={() => onToggle(k)}
                      className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full hover:bg-[color:var(--surface-soft)]"
                      style={{ color: "var(--ink-500)" }}
                      aria-label={`Remove ${name}`}
                    >
                      <X size={12} />
                    </button>
                  </span>
                );
              })}
              {selected.size > 3 && (
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setMoreOpen((v) => !v)}
                    className="rounded-full bg-[color:var(--surface-soft)] px-2.5 py-1 text-[12px] font-medium hover:bg-[color:var(--hairline)]"
                    style={{ color: "var(--ink-700)" }}
                    aria-expanded={moreOpen}
                  >
                    +{selected.size - 3}
                  </button>
                  {moreOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setMoreOpen(false)}
                        aria-hidden="true"
                      />
                      <div
                        className="absolute left-0 top-full z-20 mt-1.5 max-h-64 w-64 overflow-y-auto rounded-xl border bg-white py-1 shadow-lg"
                        style={{ borderColor: "var(--hairline)" }}
                        role="menu"
                      >
                        {Array.from(selected).slice(3).map((k) => {
                          const name = k.split("::")[2];
                          const crumb = k.split("::").slice(0, 2).join(" · ");
                          return (
                            <div
                              key={k}
                              className="flex items-center gap-2 px-3 py-1.5 hover:bg-[color:var(--surface-soft)]"
                              role="menuitem"
                            >
                              <div className="min-w-0 flex-1">
                                <div
                                  className="truncate font-mono text-[12px]"
                                  style={{ color: "var(--ink-900)" }}
                                >
                                  {name}
                                </div>
                                <div
                                  className="truncate text-[11px]"
                                  style={{ color: "var(--ink-500)" }}
                                >
                                  {crumb}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => onToggle(k)}
                                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full hover:bg-[color:var(--hairline)]"
                                style={{ color: "var(--ink-500)" }}
                                aria-label={`Remove ${name}`}
                              >
                                <X size={12} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}
              <button
                type="button"
                onClick={onClear}
                className="ml-auto text-[12px] font-medium underline-offset-2 hover:underline"
                style={{ color: "var(--ink-500)" }}
              >
                Clear all
              </button>
            </div>
          </>
        )}
      </div>

      <NewConnectionModal
        open={newConnOpen}
        onOpenChange={setNewConnOpen}
        onSelect={(id) => {
          setNewConnOpen(false);
          toast.info(`Connect to ${id} — configuration coming next`);
        }}
      />

      {/* Two panels */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className="flex w-[190px] shrink-0 flex-col overflow-hidden border-r @[820px]:w-[280px]"
          style={{ borderColor: "var(--hairline)" }}
        >
          <div
            className="border-b px-4 py-3"
            style={{ borderColor: "var(--hairline)" }}
          >
            <button
              type="button"
              onClick={() => setNewConnOpen(true)}
              className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border px-3 text-[13px] font-medium transition-colors hover:bg-[color:var(--surface-soft)]"
              style={{ borderColor: "var(--hairline)", color: "var(--ink-700)" }}
            >
              <Plus size={14} />
              Add connection
            </button>
          </div>
          <div className="flex-1 overflow-y-auto py-3">
          {grouped.map(([warehouse, conns]) => {
            const groupCollapsed = collapsedGroups.has(warehouse);
            return (
              <div key={warehouse} className="mb-2">
                <button
                  type="button"
                  onClick={() => toggleGroup(warehouse)}
                  className="flex w-full items-center gap-2 px-4 py-1.5 text-[12px] font-semibold"
                  style={{ color: "var(--ink-700)" }}
                >
                  <ChevronDown
                    size={12}
                    style={{
                      transform: groupCollapsed ? "rotate(-90deg)" : "rotate(0)",
                      transition: "transform 150ms",
                      color: "var(--ink-300)",
                    }}
                  />
                  <WarehouseLogo warehouse={warehouse} />
                  {warehouse}
                </button>
                {!groupCollapsed &&
                  conns.map((conn) => {
                    return (
                      <div key={conn.id} className="mb-2">
                        <div
                          className="py-1.5 pl-[34px] pr-4 text-[13px] font-medium"
                          style={{ color: "var(--ink-700)" }}
                        >
                          {conn.name}
                        </div>
                        {conn.schemas.map((sch) => {
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
                              className="flex w-full items-center justify-between py-1.5 pl-[50px] pr-4 text-[13px] transition-colors hover:bg-[color:var(--surface-soft)]"
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
          </div>
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
              <div className="px-4 pt-6 pb-4 @[820px]:px-8">
                <SearchInput value={query} onChange={setQuery} large={false} />
              </div>
              <div className="flex-1 overflow-y-auto px-4 pb-6 @[820px]:px-8">
                {state === "browse" ? (
                  <BrowseBody
                    activeSchema={activeSchema!}
                    selected={selected}
                    flashKeys={flashKeys}
                    onToggle={onToggle}
                    pageSize={pageSize}
                    page={currentPage}
                  />
                ) : (
                  <SearchBody
                    query={query}
                    activeSchema={activeSchema}
                    selected={selected}
                    onToggle={onToggle}
                    pageSize={pageSize}
                    page={currentPage}
                  />
                )}
              </div>
              {total > 0 && (
                <PaginationFooter
                  total={total}
                  pageSize={pageSize}
                  page={currentPage}
                  totalPages={totalPages}
                  onPageChange={setPage}
                  onPageSizeChange={setPageSize}
                />
              )}
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
  pageSize,
  page,
  flashKeys,
}: {
  activeSchema: { connId: string; schema: string };
  flashKeys?: Set<string>;
  selected: Set<string>;
  onToggle: (key: string) => void;
  pageSize: number;
  page: number;
}) {
  const conn = WAREHOUSES.find((c) => c.id === activeSchema.connId)!;
  const sch = conn.schemas.find((s) => s.name === activeSchema.schema)!;
  const totalRows = sch.assets.reduce((acc, a) => acc + a.rows, 0);
  const selectedInSchema = sch.assets.filter((a) =>
    selected.has(assetKey(conn.id, sch.name, a.name)),
  ).length;
  const start = (page - 1) * pageSize;
  const visible = sch.assets.slice(start, start + pageSize);

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
        {visible.map((a) => {
          const k = assetKey(conn.id, sch.name, a.name);
          return (
            <AssetRow
              key={k}
              asset={a}
              schema={sch.name}
              connection={conn.name}
              warehouse={conn.warehouse}
              selected={selected.has(k)}
              onToggle={() => onToggle(k)}
              flash={flashKeys?.has(k)}
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
  pageSize,
  page,
}: {
  query: string;
  activeSchema: ActiveSchema;
  selected: Set<string>;
  onToggle: (key: string) => void;
  pageSize: number;
  page: number;
}) {
  const q = query.trim().toLowerCase();
  const flat: { conn: Connection; schema: string; asset: Asset }[] = [];
  for (const conn of WAREHOUSES) {
    for (const sch of conn.schemas) {
      for (const a of sch.assets) {
        if (a.name.toLowerCase().includes(q)) flat.push({ conn, schema: sch.name, asset: a });
      }
    }
  }
  // Float active connection's matches to top
  if (activeSchema) {
    flat.sort((a, b) =>
      a.conn.id === activeSchema.connId ? -1 : b.conn.id === activeSchema.connId ? 1 : 0,
    );
  }

  if (flat.length === 0) {
    return (
      <div className="py-12 text-center text-[13px]" style={{ color: "var(--ink-500)" }}>
        No tables match "{query}"
      </div>
    );
  }

  const start = (page - 1) * pageSize;
  const visible = flat.slice(start, start + pageSize);

  // Totals per connection, so group headers report all matches, not just the page's slice.
  const perConnTotal = new Map<string, number>();
  for (const item of flat)
    perConnTotal.set(item.conn.id, (perConnTotal.get(item.conn.id) ?? 0) + 1);

  // Regroup the current page's rows by connection for display.
  const groups = new Map<Connection, { schema: string; asset: Asset }[]>();
  for (const item of visible) {
    const arr = groups.get(item.conn) ?? [];
    arr.push({ schema: item.schema, asset: item.asset });
    groups.set(item.conn, arr);
  }

  return (
    <div className="flex flex-col gap-6">
      {Array.from(groups.entries()).map(([conn, matches]) => {
        const n = perConnTotal.get(conn.id) ?? 0;
        return (
          <div key={conn.id}>
            <div
              className="mb-2 text-[11px] font-semibold uppercase tracking-wide"
              style={{ color: "var(--ink-300)" }}
            >
              {conn.name} · {n} {n === 1 ? "match" : "matches"}
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
                    warehouse={conn.warehouse}
                    selected={selected.has(k)}
                    onToggle={() => onToggle(k)}
                    highlight={query}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PaginationFooter({
  total,
  pageSize,
  page,
  totalPages,
  onPageChange,
  onPageSizeChange,
}: {
  total: number;
  pageSize: number;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: 10 | 20 | 50) => void;
}) {
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);
  const arrow =
    "flex h-7 w-7 items-center justify-center rounded-lg border bg-white transition-colors disabled:cursor-not-allowed disabled:opacity-40 hover:bg-[color:var(--surface-soft)]";

  return (
    <div
      className="flex shrink-0 items-center justify-between border-t px-4 py-2.5 @[820px]:px-8"
      style={{ borderColor: "var(--hairline)" }}
    >
      <div className="text-[12px]" style={{ color: "var(--ink-500)" }}>
        Showing{" "}
        <span style={{ color: "var(--ink-900)" }}>
          {start}–{end}
        </span>{" "}
        of <span style={{ color: "var(--ink-900)" }}>{total}</span>{" "}
        {total === 1 ? "table" : "tables"}
      </div>
      <div className="flex items-center gap-5">
        <label
          className="flex items-center gap-2 text-[12px]"
          style={{ color: "var(--ink-500)" }}
        >
          Per page
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value) as 10 | 20 | 50)}
            className="h-7 rounded-lg border bg-white px-2 text-[12px] outline-none"
            style={{ borderColor: "var(--hairline)", color: "var(--ink-900)" }}
            aria-label="Tables per page"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className={arrow}
            style={{ borderColor: "var(--hairline)", color: "var(--ink-700)" }}
            aria-label="Previous page"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-[12px]" style={{ color: "var(--ink-500)" }}>
            Page <span style={{ color: "var(--ink-900)" }}>{page}</span> of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className={arrow}
            style={{ borderColor: "var(--hairline)", color: "var(--ink-700)" }}
            aria-label="Next page"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
