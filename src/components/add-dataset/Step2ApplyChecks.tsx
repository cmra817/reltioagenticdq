import { DimensionBadge } from "@/components/dq-dimensions";
import { useEffect, useMemo, useRef, useState } from "react";
import { Lock, Plus, Search, Sparkles } from "lucide-react";
import { WAREHOUSES } from "./mock-warehouses";
import { generateChecks, type Check } from "./mock-checks";
import { RuleModal } from "@/components/dq-checks/RuleModal";
import { MOCK_RULES, creatorLabel, type Creator, type Rule } from "@/components/dq-checks/mock-rules";

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

function CreatorBadge({ creator }: { creator: Creator }) {
  const managed = creator.kind === "reltio";
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px]" style={{ color: "var(--ink-700)" }}>
      {managed && <Lock size={12} style={{ color: "var(--ink-500)" }} />}
      {creatorLabel(creator)}
    </span>
  );
}

function ruleToCheck(rule: Rule, idPrefix = ""): Check {
  return {
    id: `${idPrefix}${rule.id}`,
    rule: rule.name,
    description: rule.description,
    dimension: rule.dimension,
    field: "(custom)",
    creator: rule.creator,
  };
}

export function Step2ApplyChecks({
  selected,
  checked,
  customChecks,
  onToggleCheck,
  onAddCheck,
}: {
  selected: Set<string>;
  /** checked[assetKey] = Set<checkId> currently enabled */
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


  return (
    <div className="px-10 py-8">
      {/* Sub-header */}
      <div
        className="flex items-center gap-4 border-b pb-4"
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

      {/* Recommended-checks note */}
      <div
        className="mt-5 flex items-start gap-2.5 rounded-xl border px-4 py-3"
        style={{ borderColor: "var(--hairline)", background: "rgba(67,134,250,0.06)" }}
      >
        <Sparkles size={15} className="mt-0.5 shrink-0" style={{ color: "var(--brand-blue)" }} />
        <div className="text-[13px]" style={{ color: "var(--ink-700)" }}>
          These are checks recommended for the {assets.length === 1 ? "table" : "tables"} you
          selected, based on their columns and profiles. Uncheck anything you don't need, or search
          your checks library to add more.
        </div>
      </div>

      {/* Card */}
      <div
        className="mt-6 rounded-2xl border bg-white"
        style={{ borderColor: "var(--hairline)" }}
      >
        {/* Tabs */}
        <div
          className="flex items-center justify-between border-b px-6"
          style={{ borderColor: "var(--hairline)" }}
        >
          <div className="flex items-center gap-1 overflow-x-auto">
            {assets.map((a) => {
              const isActive = a.key === active.key;
              const count = (checked[a.key] ?? new Set()).size;
              return (
                <button
                  key={a.key}
                  type="button"
                  onClick={() => setActiveKey(a.key)}
                  className="relative whitespace-nowrap px-3 py-3 text-[13px] font-medium transition-colors"
                  style={{
                    color: isActive ? "var(--ink-900)" : "var(--ink-500)",
                  }}
                >
                  <span className="font-mono">{a.name}</span>{" "}
                  <span style={{ color: isActive ? "var(--ink-500)" : "var(--ink-300)" }}>
                    ({count})
                  </span>
                  {isActive && (
                    <span
                      className="absolute inset-x-2 -bottom-px h-0.5"
                      style={{ background: "var(--brand-blue)" }}
                    />
                  )}
                </button>
              );
            })}
          </div>
          <div className="my-2 flex shrink-0 items-center gap-2">
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

        {/* Column headers */}
        <div
          className="grid grid-cols-[minmax(300px,2fr)_minmax(140px,0.8fr)_minmax(140px,0.8fr)_minmax(140px,0.8fr)] gap-4 border-b px-6 py-3 text-[11px] font-medium uppercase tracking-wide"
          style={{ borderColor: "var(--hairline)", color: "var(--ink-500)" }}
        >
          <div>Name</div>
          <div>Dimension</div>
          <div>Creator</div>
          <div>Field applied</div>
        </div>

        {/* Rows */}
        <div>
          {active.checks.map((check) => {
            const isOn = activeChecked.has(check.id);
            const creator = check.creator ?? { kind: "reltio" } as Creator;
            return (
              <label
                key={check.id}
                className="grid cursor-pointer grid-cols-[minmax(300px,2fr)_minmax(140px,0.8fr)_minmax(140px,0.8fr)_minmax(140px,0.8fr)] items-start gap-4 border-b px-6 py-4 transition-colors hover:bg-[color:var(--surface-soft)]"
                style={{ borderColor: "var(--hairline)" }}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={isOn}
                    onChange={() => onToggleCheck(active.key, check.id)}
                    className="mt-0.5 h-4 w-4 shrink-0"
                    style={{ accentColor: "var(--brand-blue)" }}
                  />
                  <div className="min-w-0">
                    <div
                      className="truncate text-[13px] font-medium"
                      style={{ color: isOn ? "var(--ink-900)" : "var(--ink-500)" }}
                    >
                      {check.rule}
                    </div>
                    {check.description && (
                      <div
                        className="mt-0.5 line-clamp-1 text-[12px]"
                        style={{ color: "var(--ink-500)" }}
                      >
                        {check.description}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <DimensionBadge label={check.dimension} size="sm" />
                </div>
                <div>
                  <CreatorBadge creator={creator} />
                </div>
                <div
                  className="font-mono text-[12px]"
                  style={{ color: "var(--ink-700)" }}
                >
                  {check.field}
                </div>
              </label>
            );
          })}
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
    </div>
  );
}
