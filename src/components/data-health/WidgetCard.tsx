import { Lock, MoreVertical } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { WidgetVisual } from "./WidgetVisual";
import { widgetCreatorLabel, type Widget } from "./widget-model";

export function CreatorBadge({ widget }: { widget: Widget }) {
  const managed = widget.creator.kind === "reltio";
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[12px]"
      style={{ color: "var(--ink-500)" }}
    >
      {managed && <Lock size={11} />}
      {widgetCreatorLabel(widget.creator)}
    </span>
  );
}

export function WidgetCard({
  widget,
  onDrill,
  onRemove,
  footer,
  className = "",
}: {
  widget: Widget;
  onDrill?: (segment: string) => void;
  onRemove?: () => void;
  footer?: React.ReactNode;
  className?: string;
}) {
  const [menu, setMenu] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const drillable =
    widget.drillable &&
    (widget.chartType === "bar" ||
      widget.chartType === "line" ||
      widget.chartType === "donut" ||
      widget.chartType === "metric");


  useEffect(() => {
    if (!menu) return;
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setMenu(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menu]);

  const clickable = drillable && !!onDrill;

  return (
    <div
      ref={wrapRef}
      className={`group relative flex flex-col overflow-hidden rounded-xl border bg-white p-4 ${className}`}
      style={{ borderColor: "var(--hairline)" }}
    >
      {onRemove && (
        <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            aria-label="Widget actions"
            onClick={() => setMenu((v) => !v)}
            className="rounded-md p-1.5 hover:bg-black/5"
            style={{ color: "var(--ink-500)" }}
          >
            <MoreVertical size={15} />
          </button>
          {menu && (
            <div
              className="absolute right-0 top-full z-20 mt-1 w-[220px] rounded-lg border bg-white p-1"
              style={{ borderColor: "var(--hairline)", boxShadow: "0 12px 28px rgba(15,23,42,0.12)" }}
            >
              <button
                type="button"
                onClick={() => {
                  setMenu(false);
                  onRemove();
                }}
                className="w-full rounded-md px-3 py-2 text-left text-[13px] hover:bg-[color:var(--surface-soft)]"
                style={{ color: "var(--ink-900)" }}
              >
                Remove from dashboard
              </button>
            </div>
          )}
        </div>
      )}

      <div
        role={clickable ? "button" : undefined}
        tabIndex={clickable ? 0 : undefined}
        onClick={clickable ? () => onDrill?.(widget.segments?.[0] ?? "All") : undefined}
        onKeyDown={
          clickable
            ? (e) => {
                if (e.key === "Enter") onDrill?.(widget.segments?.[0] ?? "All");
              }
            : undefined
        }
        className="flex min-h-0 flex-1 flex-col"
        style={{ cursor: clickable ? "pointer" : "default" }}
      >
        <div className="pl-4 pr-6 text-[14px] font-medium" style={{ color: "var(--ink-900)" }}>
          {widget.name}
        </div>
        <div className="mt-0.5 flex items-center gap-2 pl-4">
          <CreatorBadge widget={widget} />
          <span className="text-[12px]" style={{ color: "var(--ink-300)" }}>
            · {widget.timeframe}
          </span>
        </div>
        <div className="mt-3 min-h-0 flex-1">
          <WidgetVisual widget={widget} onSegment={clickable ? onDrill : undefined} />
        </div>
        {clickable && (
          <div className="mt-2 text-[11px]" style={{ color: "var(--brand-blue)" }}>
            Click to view incidents
          </div>
        )}
      </div>

      {footer && <div className="mt-3 flex items-center gap-2">{footer}</div>}
    </div>
  );
}
