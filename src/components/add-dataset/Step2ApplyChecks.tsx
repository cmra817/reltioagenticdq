import { DimensionBadge } from "@/components/dq-dimensions";
import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { WAREHOUSES } from "./mock-warehouses";
import { generateChecks, type Check } from "./mock-checks";
import { RuleModal } from "@/components/dq-checks/RuleModal";
import type { Rule } from "@/components/dq-checks/mock-rules";

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

function ruleToCheck(rule: Rule): Check {
  return {
    id: rule.id,
    rule: rule.name,
    description: rule.description,
    dimension: rule.dimension,
    field: "(custom)",
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
          <button
            type="button"
            onClick={() => setModalOpen(true)}
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
                    onChange={() => onToggleCheck(active.key, check.id)}
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
                <div>
                  <DimensionBadge label={check.dimension} size="sm" />
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
