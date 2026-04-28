import { SourceLogo, TableIcon, DatasetIcon } from "@/components/explore-screen";
import { Eye } from "lucide-react";
import type { Asset, WarehouseType } from "./mock-warehouses";
import { formatRows, relativeTime } from "./mock-warehouses";

function CheckSquare({ checked }: { checked: boolean }) {
  return (
    <span
      className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border"
      style={{
        background: checked ? "var(--brand-blue)" : "white",
        borderColor: checked ? "var(--brand-blue)" : "var(--hairline)",
      }}
    >
      {checked && (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </span>
  );
}

export function AssetRow({
  asset,
  schema,
  connection,
  warehouse,
  selected,
  onToggle,
  highlight,
}: {
  asset: Asset;
  schema: string;
  connection: string;
  warehouse: WarehouseType;
  selected: boolean;
  onToggle: () => void;
  highlight?: string;
}) {
  const isTable = asset.type === "table";
  return (
    <button
      type="button"
      onClick={onToggle}
      className="group flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-[color:var(--surface-soft)]"
      style={{ background: selected ? "rgba(67,134,250,0.06)" : undefined }}
    >
      <CheckSquare checked={selected} />
      <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center">
        <SourceLogo source={warehouse} />
      </span>
      <div className="min-w-0 flex-1">
        <div
          className="text-[14px] font-semibold leading-tight"
          style={{ color: "var(--ink-900)" }}
        >
          {highlight ? <Highlighted text={asset.name} q={highlight} /> : asset.name}
        </div>
        <div
          className="mt-0.5 flex items-center gap-1.5 text-[12px]"
          style={{ color: "var(--ink-500)" }}
        >
          <span style={{ color: "var(--ink-300)" }}>
            {isTable ? <TableIcon size={13} /> : <Eye size={13} strokeWidth={1.8} />}
          </span>
          <span>{isTable ? "Table" : "View"}</span>
          <span style={{ color: "var(--ink-300)" }}>›</span>
          <span style={{ color: "var(--brand-blue)" }}>
            <DatasetIcon size={13} />
          </span>
          <span style={{ color: "var(--ink-700)" }}>{schema}</span>
        </div>
        <p className="mt-2 text-[13px]" style={{ color: "var(--ink-700)" }}>
          {asset.description}
        </p>
      </div>
      <div
        className="flex shrink-0 items-center gap-6 pt-1 text-[12px]"
        style={{ color: "var(--ink-500)" }}
      >
        <span className="tabular-nums">{formatRows(asset.rows)} rows</span>
        <span>{relativeTime(asset.lastSyncedISO)}</span>
        <span className="w-10 text-right capitalize">{asset.type}</span>
      </div>
    </button>
  );
}

function Highlighted({ text, q }: { text: string; q: string }) {
  if (!q) return <>{text}</>;
  const lower = text.toLowerCase();
  const lq = q.toLowerCase();
  const i = lower.indexOf(lq);
  if (i === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark
        className="rounded-sm px-0.5"
        style={{ background: "rgba(67,134,250,0.18)", color: "var(--ink-900)" }}
      >
        {text.slice(i, i + q.length)}
      </mark>
      {text.slice(i + q.length)}
    </>
  );
}
