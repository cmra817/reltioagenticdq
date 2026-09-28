import { DimensionBadge } from "@/components/dq-dimensions";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check as CheckIcon, ChevronDown, ChevronRight, Copy, Lock, Plus, Search, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { WAREHOUSES, type WarehouseType } from "./mock-warehouses";
import { BigQueryIcon, DatabricksIcon, SnowflakeIcon } from "@/components/brand-icons";
import { checkLogic, generateChecks, type Check } from "./mock-checks";
import { RuleModal } from "@/components/dq-checks/RuleModal";
import { MOCK_RULES, type Rule } from "@/components/dq-checks/mock-rules";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type AssetEntry = {
  key: string;
  name: string;
  checks: Check[];
};

export function parseSelectedAssets(
  selected: Set<string>,
  customChecks: Record<string, Check[]>,
): AssetEntry[] {
  const entries: AssetEntry[] = [];
  for (const key of selected) {
    const [connId, schemaName, assetName] = key.split("::");
    const conn = WAREHOUSES.find((c) => c.id === connId);
    const sch = conn?.schemas.find((s) => s.name === schemaName);
    const asset = sch?.assets.find((a) => a.name === assetName);
    if (!asset) continue;
    entries.push({
      key,
      name: asset.name,
      checks: [...generateChecks(asset.name), ...(customChecks[key] ?? [])],
    });
  }
  return entries;
}

function ruleToCheck(rule: Rule, idPrefix = ""): Check {
  return {
    id: `${idPrefix}${rule.id}`,
    rule: rule.name,
    description: rule.description,
    dimension: rule.dimension,
    field: "(custom)",
    creator: rule.creator,
    expectation: rule.expectation,
    pattern: rule.pattern,
    threshold: rule.threshold,
  };
}

function summaryFor(dimension: string, pattern: string, threshold: number) {
  return `Flags ${dimension.toLowerCase()} issues by checking values against ${pattern}, and fails the rule when more than ${threshold}% of values don't match.`;
}

function CheckRow({
  check,
  expanded,
  threshold,
  onToggleExpand,
  onThresholdChange,
  onRemove,
}: {
  check: Check;
  expanded: boolean;
  threshold: number;
  onToggleExpand: () => void;
  onThresholdChange: (value: number) => void;
  onRemove: () => void;
}) {
  const logic = checkLogic(check);
  const managed = (check.creator ?? { kind: "reltio" }).kind === "reltio";

  return (
    <div className="group border-b" style={{ borderColor: "var(--hairline)" }}>
      <div className="flex items-center gap-3 px-6 py-3.5 transition-colors hover:bg-[color:var(--surface-soft)]">
        <button
          type="button"
          onClick={onToggleExpand}
          aria-expanded={expanded}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <span className="shrink-0" style={{ color: "var(--ink-500)" }}>
            {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          </span>
          <span
            className="flex shrink-0 items-center gap-1.5 text-[13px] font-semibold"
            style={{ color: "var(--ink-900)" }}
          >
            {managed && <Lock size={11} style={{ color: "var(--ink-500)" }} />}
            {check.rule}
          </span>
          <span className="min-w-0 flex-1 truncate text-[12px]" style={{ color: "var(--ink-500)" }}>
            {check.description}
          </span>
          <span className="shrink-0">
            <DimensionBadge label={check.dimension} size="sm" />
          </span>
          <span className="shrink-0 font-mono text-[12px]" style={{ color: "var(--ink-700)" }}>
            {check.field}
          </span>
        </button>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onRemove}
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full opacity-0 transition-opacity hover:bg-white group-hover:opacity-100 focus-visible:opacity-100"
              style={{ color: "var(--ink-500)" }}
              aria-label="Remove check"
            >
              <X size={14} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">remove</TooltipContent>
        </Tooltip>
      </div>

      {expanded && (
        <div className="px-6 pb-5 pl-[54px]">
          <div
            className="rounded-xl border p-3"
            style={{ borderColor: "var(--hairline)", background: "var(--surface-soft)" }}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="truncate text-[12px]" style={{ color: "var(--ink-500)" }}>
                Expectation: <span className="font-mono">{logic.expectation}</span>
              </div>
              <button
                type="button"
                aria-label="Copy expectation"
                onClick={() => {
                  navigator.clipboard?.writeText(`${logic.expectation}(${logic.pattern})`);
                  toast.success("Copied expectation");
                }}
                style={{ color: "var(--ink-500)" }}
              >
                <Copy size={14} />
              </button>
            </div>
            <div
              className="mt-2 w-full rounded-lg border bg-white px-3 py-2 font-mono text-[13px]"
              style={{ borderColor: "var(--hairline)", color: "var(--ink-700)" }}
            >
              {logic.pattern}
            </div>
          </div>

          <div
            className="mt-4 flex flex-wrap items-center gap-2 text-[14px]"
            style={{ color: "var(--ink-900)" }}
          >
            <span>Fail rule if more than</span>
            <input
              type="number"
              min={0}
              max={100}
              value={threshold}
              onChange={(e) => onThresholdChange(Number(e.target.value))}
              className="w-16 rounded-lg border bg-white px-2 py-1.5 text-[14px] outline-none focus:border-[color:var(--brand-blue)]"
              style={{ borderColor: "var(--hairline)", color: "var(--ink-900)" }}
            />
            <span>% of values don't match</span>
          </div>

          <div
            className="mt-4 flex items-start gap-2 rounded-xl border p-3 text-[13px]"
            style={{ borderColor: "var(--hairline)", color: "var(--ink-700)" }}
          >
            <CheckIcon size={14} className="mt-0.5 shrink-0" style={{ color: "var(--brand-blue)" }} />
            <div>
              <div className="font-medium" style={{ color: "var(--ink-900)" }}>
                What this rule does
              </div>
              <div className="mt-0.5">{summaryFor(check.dimension, logic.pattern, threshold)}</div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={onRemove}
              className="text-[13px] font-medium"
              style={{ color: "#dc2626" }}
            >
              Remove
            </button>
            <button
              type="button"
              onClick={() => {
                toast.success("Threshold saved for this table");
                onToggleExpand();
              }}
              className="rounded-lg px-4 py-2 text-[13px] font-medium text-white"
              style={{ background: "var(--ink-900)" }}
            >
              Save changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


export function Step2ApplyChecks({
  selected,
  checked,
  customChecks,
  onToggleCheck,
  onAddCheck,
}: {
  selected: Set<string>;
  /** checked[assetKey] = Set<checkId> currently kept */
  checked: Record<string, Set<string>>;
  customChecks: Record<string, Check[]>;
  onToggleCheck: (assetKey: string, checkId: string) => void;
  onAddCheck: (assetKey: string, check: Check) => void;
}) {
  const assets = useMemo(() => parseSelectedAssets(selected, customChecks), [selected, customChecks]);
  const [activeKey, setActiveKey] = useState<string>(assets[0]?.key ?? "");
  const [modalOpen, setModalOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [thresholds, setThresholds] = useState<Record<string, number>>({});
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    if (assets.length > 0 && !assets.some((a) => a.key === activeKey)) {
      setActiveKey(assets[0].key);
    }
  }, [assets, activeKey]);

  if (assets.length === 0) {
    return (
      <div className="flex h-full items-center justify-center px-10 py-16">
        <div
          className="max-w-md rounded-2xl border bg-white px-10 py-12 text-center"
          style={{ borderColor: "var(--hairline)" }}
        >
          <div className="text-[20px] font-semibold" style={{ color: "var(--ink-900)" }}>
            No tables selected
          </div>
          <p className="mt-2 text-[14px]" style={{ color: "var(--ink-500)" }}>
            Go back to step 1 and select at least one table to apply quality checks.
          </p>
        </div>
      </div>
    );
  }

  const active = assets.find((a) => a.key === activeKey) ?? assets[0];
  const activeChecked = checked[active.key] ?? new Set<string>();

  const existingIds = new Set(active.checks.map((c) => c.id));
  const q = query.trim().toLowerCase();
  const libraryResults = MOCK_RULES.filter(
    (r) =>
      !existingIds.has(`lib-${r.id}`) &&
      (q === "" ||
        r.name.toLowerCase().includes(q) ||
        r.dimension.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q)),
  ).slice(0, 6);

  const visibleChecks = active.checks.filter((c) => activeChecked.has(c.id));

  const groupedAssets = useMemo(() => {
    const byWarehouse = new Map<WarehouseType, Map<string, AssetEntry[]>>();
    for (const conn of WAREHOUSES) {
      const list = assets.filter((a) => a.key.split("::")[0] === conn.id);
      if (list.length === 0) continue;
      const inner = byWarehouse.get(conn.warehouse) ?? new Map<string, AssetEntry[]>();
      inner.set(conn.name, [...(inner.get(conn.name) ?? []), ...list]);
      byWarehouse.set(conn.warehouse, inner);
    }
    return Array.from(byWarehouse.entries()).map(([warehouse, conns]) => ({
      warehouse,
      connections: Array.from(conns.entries()).map(([name, list]) => ({ name, assets: list })),
    }));
  }, [assets]);

  return (
    <TooltipProvider delayDuration={200}>
      <div
        className="mx-10 my-8 flex min-h-[calc(100vh-280px)] flex-col overflow-hidden rounded-2xl border bg-white"
        style={{ borderColor: "var(--hairline)" }}
      >
        {/* Sub-header */}
        <div
          className="flex shrink-0 items-center gap-4 border-b px-6 py-3"
          style={{ borderColor: "var(--hairline)" }}
        >
          <div className="text-[15px]" style={{ color: "var(--ink-700)" }}>
            Apply data quality checks
          </div>
          <div className="h-5 w-px" style={{ background: "var(--hairline)" }} aria-hidden="true" />
          <span className="text-[12px] font-medium" style={{ color: "var(--ink-700)" }}>
            {assets.length} {assets.length === 1 ? "table" : "tables"} ·{" "}
            {Object.values(checked).reduce((sum, s) => sum + s.size, 0)} checks
          </span>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar: selected tables, grouped like step 1 */}
          <aside
            className="flex w-[280px] shrink-0 flex-col overflow-hidden border-r"
            style={{ borderColor: "var(--hairline)" }}
          >
            <div className="flex-1 overflow-y-auto py-3">
              {groupedAssets.map(({ warehouse, connections }) => {
                const collapsed = collapsedWarehouses.has(warehouse);
                return (
                  <div key={warehouse} className="mb-2">
                    <button
                      type="button"
                      onClick={() =>
                        setCollapsedWarehouses((s) => {
                          const n = new Set(s);
                          n.has(warehouse) ? n.delete(warehouse) : n.add(warehouse);
                          return n;
                        })
                      }
                      className="flex w-full items-center gap-2 px-4 py-1.5 text-[12px] font-semibold"
                      style={{ color: "var(--ink-700)" }}
                    >
                      <ChevronDown
                        size={12}
                        style={{
                          transform: collapsed ? "rotate(-90deg)" : "rotate(0)",
                          transition: "transform 150ms",
                          color: "var(--ink-300)",
                        }}
                      />
                      <WarehouseLogo warehouse={warehouse} />
                      {warehouse}
                    </button>
                    {!collapsed &&
                      connections.map(({ name, list }) => (
                        <div key={name} className="mb-2">
                          <div
                            className="py-1.5 pl-[34px] pr-4 text-[13px] font-medium"
                            style={{ color: "var(--ink-700)" }}
                          >
                            {name}
                          </div>
                          {list.map((a) => {
                            const isActive = a.key === active.key;
                            const count = (checked[a.key] ?? new Set()).size;
                            return (
                              <button
                                key={a.key}
                                type="button"
                                onClick={() => setActiveKey(a.key)}
                                className="flex w-full items-center justify-between gap-2 py-1.5 pl-[50px] pr-4 text-[13px] transition-colors hover:bg-[color:var(--surface-soft)]"
                                style={{
                                  background: isActive ? "rgba(67,134,250,0.10)" : "transparent",
                                  color: isActive ? "var(--brand-blue)" : "var(--ink-700)",
                                  borderLeft: isActive
                                    ? "2px solid var(--brand-blue)"
                                    : "2px solid transparent",
                                }}
                              >
                                <span className="min-w-0 truncate font-mono text-[12px]">
                                  {a.name}
                                </span>
                                <span
                                  className="shrink-0 text-[11px]"
                                  style={{ color: "var(--ink-300)" }}
                                >
                                  {count}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      ))}
                  </div>
                );
              })}
            </div>
          </aside>

          {/* Right panel: checks for the active table */}
          <section className="flex min-w-0 flex-1 flex-col overflow-hidden">
            {/* Toolbar */}
            <div
              className="flex shrink-0 items-center justify-between gap-4 border-b px-6 py-3"
              style={{ borderColor: "var(--hairline)" }}
            >
              <div className="min-w-0 truncate text-[13px]" style={{ color: "var(--ink-500)" }}>
                <span className="font-mono font-semibold" style={{ color: "var(--ink-900)" }}>
                  {active.name}
                </span>
                <span> · {activeChecked.size} checks</span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {/* Library search */}
                <div className="relative" ref={searchRef}>
                  <Search
                    size={13}
                    className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--ink-500)" }}
                  />
                  <input
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setSearchOpen(true);
                    }}
                    onFocus={() => setSearchOpen(true)}
                    placeholder="Search checks library…"
                    className="w-[220px] rounded-full border bg-white py-1.5 pl-7 pr-3 text-[12px] outline-none focus:border-[color:var(--brand-blue)]"
                    style={{ borderColor: "var(--hairline)", color: "var(--ink-900)" }}
                  />
                  {searchOpen && (
                    <div
                      className="absolute right-0 top-[calc(100%+6px)] z-30 w-[380px] overflow-hidden rounded-xl border bg-white shadow-lg"
                      style={{ borderColor: "var(--hairline)" }}
                    >
                      {libraryResults.length === 0 ? (
                        <div className="px-4 py-3 text-[12px]" style={{ color: "var(--ink-500)" }}>
                          No other checks found in your library.
                        </div>
                      ) : (
                        libraryResults.map((rule) => (
                          <button
                            key={rule.id}
                            type="button"
                            onClick={() => {
                              onAddCheck(active.key, ruleToCheck(rule, "lib-"));
                              setQuery("");
                              setSearchOpen(false);
                            }}
                            className="flex w-full items-start gap-3 border-b px-4 py-2.5 text-left transition-colors last:border-b-0 hover:bg-[color:var(--surface-soft)]"
                            style={{ borderColor: "var(--hairline)" }}
                          >
                            <div className="min-w-0 flex-1">
                              <div
                                className="truncate text-[13px] font-medium"
                                style={{ color: "var(--ink-900)" }}
                              >
                                {rule.name}
                              </div>
                              <div
                                className="mt-0.5 line-clamp-1 text-[12px]"
                                style={{ color: "var(--ink-500)" }}
                              >
                                {rule.description}
                              </div>
                              <div className="mt-1.5">
                                <DimensionBadge label={rule.dimension} size="sm" />
                              </div>
                            </div>
                            <Plus size={14} className="mt-1 shrink-0" style={{ color: "var(--brand-blue)" }} />
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors"
                  style={{
                    background: "rgba(67,134,250,0.10)",
                    color: "var(--brand-blue)",
                  }}
                >
                  <Plus size={12} />
                  Checks
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-6">
              {/* Recommended-checks note */}
              <div
                className="mt-4 flex items-start gap-2.5 rounded-xl border px-4 py-3"
                style={{ borderColor: "var(--hairline)", background: "rgba(67,134,250,0.06)" }}
              >
                <Sparkles size={15} className="mt-0.5 shrink-0" style={{ color: "var(--brand-blue)" }} />
                <div className="text-[13px]" style={{ color: "var(--ink-700)" }}>
                  These are checks recommended for the {assets.length === 1 ? "table" : "tables"} you
                  selected, based on their columns and profiles. Remove any you don't need, or search
                  your checks library to add more.
                </div>
              </div>

              {/* Rows */}
              <div
                className="mt-4 rounded-2xl border bg-white"
                style={{ borderColor: "var(--hairline)" }}
              >
                {visibleChecks.length === 0 ? (
                  <div
                    className="px-6 py-10 text-center text-[13px]"
                    style={{ color: "var(--ink-500)" }}
                  >
                    No checks selected for {active.name}. Search your library or add a new check.
                  </div>
                ) : (
                  visibleChecks.map((check) => {
                    const rowKey = `${active.key}::${check.id}`;
                    return (
                      <CheckRow
                        key={check.id}
                        check={check}
                        expanded={expandedKey === rowKey}
                        threshold={thresholds[rowKey] ?? checkLogic(check).threshold}
                        onToggleExpand={() =>
                          setExpandedKey((prev) => (prev === rowKey ? null : rowKey))
                        }
                        onThresholdChange={(value) =>
                          setThresholds((prev) => ({ ...prev, [rowKey]: value }))
                        }
                        onRemove={() => onToggleCheck(active.key, check.id)}
                      />
                    );
                  })
                )}
              </div>
            </div>
          </section>
        </div>
      </div>

      <RuleModal
        open={modalOpen}
        mode="create"
        source={null}
        onClose={() => setModalOpen(false)}
        onSave={(rule) => {
          onAddCheck(active.key, ruleToCheck(rule));
          setModalOpen(false);
        }}
      />
    </TooltipProvider>
  );
}
