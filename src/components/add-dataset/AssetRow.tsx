import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Asset } from "./mock-warehouses";
import { formatRows, relativeTime } from "./mock-warehouses";

export function AssetRow({
  asset,
  schema,
  connection,
  selected,
  onToggle,
  highlight,
}: {
  asset: Asset;
  schema: string;
  connection: string;
  selected: boolean;
  onToggle: () => void;
  highlight?: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-[color:var(--surface-soft)]"
      style={{ background: selected ? "rgba(67,134,250,0.06)" : undefined }}
    >
      <Checkbox checked={selected} onCheckedChange={onToggle} className="pointer-events-none" />
      <span
        className="inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-semibold"
        style={
          asset.type === "table"
            ? { background: "rgba(67,134,250,0.12)", color: "var(--brand-blue)" }
            : { background: "rgba(120,80,220,0.12)", color: "#7850dc" }
        }
        aria-hidden
      >
        {asset.type === "table" ? "T" : "V"}
      </span>
      <div className="min-w-0 flex-1">
        <div className="font-mono text-[13px] leading-tight" style={{ color: "var(--ink-900)" }}>
          {highlight ? <Highlighted text={asset.name} q={highlight} /> : asset.name}
        </div>
        <div className="mt-0.5 text-[11px]" style={{ color: "var(--ink-300)" }}>
          {schema} · {connection}
        </div>
      </div>
      <div
        className="flex shrink-0 items-center gap-6 text-[12px]"
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
