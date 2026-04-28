import { useMemo, useState } from "react";
import { Zap, Plus } from "lucide-react";
import { WAREHOUSES } from "./mock-warehouses";
import { generateChecks, type Check } from "./mock-checks";

type AssetEntry = {
  key: string;
  name: string;
  checks: Check[];
};

function parseSelected(selected: Set<string>): AssetEntry[] {
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
      checks: generateChecks(asset.name),
    });
  }
  return entries;
}

export function Step2ApplyChecks({ selected }: { selected: Set<string> }) {
  const assets = useMemo(() => parseSelected(selected), [selected]);
  const [activeKey, setActiveKey] = useState<string>(assets[0]?.key ?? "");
  // checked[assetKey] = Set<checkId> currently enabled
  const [checked, setChecked] = useState<Record<string, Set<string>>>(() => {
    const init: Record<string, Set<string>> = {};
    for (const a of assets) init[a.key] = new Set(a.checks.map((c) => c.id));
    return init;
  });

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
  const activeChecked = checked[active.key] ?? new Set();

  const toggle = (assetKey: string, checkId: string) => {
    setChecked((prev) => {
      const next = { ...prev };
      const set = new Set(next[assetKey] ?? []);
      if (set.has(checkId)) set.delete(checkId);
      else set.add(checkId);
      next[assetKey] = set;
      return next;
    });
  };

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

      {/* Card */}
      <div
        className="relative mt-6 rounded-2xl border bg-white"
        style={{ borderColor: "var(--hairline)" }}
      >
        {/* Lightning accent */}
        <div
          className="absolute -top-2 right-6 flex h-7 w-7 items-center justify-center rounded-md"
          style={{ background: "#FFE36A", color: "#7A5A00" }}
          aria-hidden="true"
        >
          <Zap size={14} fill="currentColor" />
        </div>

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
          <button
            type="button"
            className="my-2 flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors"
            style={{
              background: "rgba(67,134,250,0.10)",
              color: "var(--brand-blue)",
            }}
          >
            <Plus size={12} />
            Add checks
          </button>
        </div>

        {/* Column headers */}
        <div
          className="grid grid-cols-[minmax(220px,1.2fr)_minmax(280px,2fr)_minmax(140px,0.8fr)_minmax(140px,0.8fr)] gap-4 border-b px-6 py-3 text-[11px] font-medium uppercase tracking-wide"
          style={{ borderColor: "var(--hairline)", color: "var(--ink-500)" }}
        >
          <div>Rule</div>
          <div>Description</div>
          <div>DQ dimension</div>
          <div>Field applied</div>
        </div>

        {/* Rows */}
        <div>
          {active.checks.map((check) => {
            const isOn = activeChecked.has(check.id);
            return (
              <label
                key={check.id}
                className="grid cursor-pointer grid-cols-[minmax(220px,1.2fr)_minmax(280px,2fr)_minmax(140px,0.8fr)_minmax(140px,0.8fr)] items-start gap-4 border-b px-6 py-4 transition-colors hover:bg-[color:var(--surface-soft)]"
                style={{ borderColor: "var(--hairline)" }}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={isOn}
                    onChange={() => toggle(active.key, check.id)}
                    className="mt-0.5 h-4 w-4 shrink-0"
                    style={{ accentColor: "var(--brand-blue)" }}
                  />
                  <span
                    className="text-[13px] font-medium"
                    style={{ color: isOn ? "var(--ink-900)" : "var(--ink-500)" }}
                  >
                    {check.rule}
                  </span>
                </div>
                <div className="text-[13px]" style={{ color: "var(--ink-700)" }}>
                  {check.description}
                </div>
                <div className="text-[13px]" style={{ color: "var(--ink-700)" }}>
                  {check.dimension}
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
    </div>
  );
}
