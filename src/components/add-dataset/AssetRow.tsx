import { SourceLogo, TableIcon, DatasetIcon } from "@/components/explore-screen";
import { Eye } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Asset, WarehouseType } from "./mock-warehouses";
import { formatRows, relativeTime } from "./mock-warehouses";

function CheckSquare({ checked, muted, label }: { checked: boolean; muted?: boolean; label?: string }) {
  const box = (
    <span
      className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border"
      style={{
        background: checked ? (muted ? "var(--ink-300)" : "var(--brand-blue)") : "white",
        borderColor: checked ? (muted ? "var(--ink-300)" : "var(--brand-blue)") : "var(--hairline)",
      }}
    >
      {checked && (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </span>
  );
  if (!label) return box;
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span tabIndex={-1} className="inline-flex">{box}</span>
        </TooltipTrigger>
        <TooltipContent side="top">{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
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
  flash,
  locked,
}: {
  asset: Asset;
  schema: string;
  connection: string;
  warehouse: WarehouseType;
  selected: boolean;
  onToggle: () => void;
  highlight?: string;
  flash?: boolean;
  /** Already part of the job: shown as checked, not clickable here. */
  locked?: boolean;
}) {
  const isTable = asset.type === "table";
  return (
    <button
      type="button"
      onClick={locked ? undefined : onToggle}
      disabled={locked}
      aria-disabled={locked || undefined}
      className={`group flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition-colors ${locked ? "cursor-default" : "hover:bg-[color:var(--surface-soft)]"}`}
      style={{
        background: flash ? "rgba(67,134,250,0.18)" : locked ? "var(--surface-soft)" : selected ? "rgba(67,134,250,0.06)" : undefined,
        opacity: locked ? 0.7 : undefined,
        transition: "background-color 600ms",
      }}
    >
      <CheckSquare checked={locked || selected} muted={locked} label={locked ? "Selected" : undefined} />
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
        <p className="mt-2 line-clamp-2 text-[13px]" style={{ color: "var(--ink-700)" }}>
          {asset.description}
        </p>
      </div>
      <div
        className="flex shrink-0 items-center gap-6 pt-1 text-[12px]"
        style={{ color: "var(--ink-500)" }}
      >
        <span className="tabular-nums whitespace-nowrap">{formatRows(asset.rows)} rows</span>
        <span className="hidden whitespace-nowrap @[640px]:inline">{relativeTime(asset.lastSyncedISO)}</span>
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
