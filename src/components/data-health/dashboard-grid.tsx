import { useCallback, useEffect, useRef, useState } from "react";
import { GripVertical, MoreVertical } from "lucide-react";
import { WidgetCard } from "./WidgetCard";
import {
  type LayoutItem,
  type Widget,
  type WidgetHeight,
  type WidgetWidth,
  type Zone,
} from "./widget-model";

export const ROW_HEIGHT = 220;
const GAP = 16;

/* ---------- drag state shared by both zones ---------- */
export type DragState = { id: string; zone: Zone; isNumber: boolean } | null;

function useContainerCols(ref: React.RefObject<HTMLDivElement | null>, maxCols = 3) {
  const [size, setSize] = useState({ width: 0, cols: maxCols });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const width = el.clientWidth;
      const cols = width < 560 ? 1 : width < 900 ? 2 : maxCols;
      setSize({ width, cols });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, maxCols]);
  return size;
}

/* ---------- mini sparkline for KPI tiles ---------- */
function MiniSpark({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const w = 120;
  const h = 28;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = w / (values.length - 1);
  const path = values
    .map((v, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)} ${(h - ((v - min) / range) * h).toFixed(1)}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="28" aria-hidden="true" className="mt-2">
      <path d={path} fill="none" stroke="#14a6a6" strokeWidth="1.75" strokeLinejoin="round" />
    </svg>
  );
}

function deltaText(values: number[]) {
  if (values.length < 2) return null;
  const last = values[values.length - 1]!;
  const prev = values[values.length - 2]!;
  const diff = last - prev;
  if (!diff) return "No change since last run";
  const up = diff > 0;
  return `${up ? "↑" : "↓"} ${Math.abs(diff).toFixed(Math.abs(diff) < 10 ? 1 : 0)} since last run`;
}

function TileMenu({ onRemove }: { onRemove: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);
  return (
    <div ref={ref} className="absolute right-1.5 top-1.5 opacity-0 transition-opacity group-hover:opacity-100">
      <button
        type="button"
        aria-label="Widget actions"
        onClick={() => setOpen((v) => !v)}
        className="rounded-md p-1 hover:bg-black/5"
        style={{ color: "var(--ink-500)" }}
      >
        <MoreVertical size={14} />
      </button>
      {open && (
        <div
          className="absolute right-0 top-full z-20 mt-1 w-[220px] rounded-lg border bg-white p-1"
          style={{ borderColor: "var(--hairline)", boxShadow: "0 12px 28px rgba(15,23,42,0.12)" }}
        >
          <button
            type="button"
            onClick={() => {
              setOpen(false);
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
  );
}

function DragGrip({ enabled }: { enabled: boolean }) {
  if (!enabled) return null;
  return (
    <span
      className="absolute left-1.5 top-2 cursor-grab opacity-0 transition-opacity group-hover:opacity-100"
      style={{ color: "var(--ink-300)" }}
      aria-hidden="true"
    >
      <GripVertical size={14} />
    </span>
  );
}

/* ---------- KPI strip ---------- */
export function KpiStrip({
  items,
  widgets,
  interactive,
  drag,
  onDragStart,
  onDragEnd,
  onHoverItem,
  onHoverZone,
  onRemove,
}: {
  items: LayoutItem[];
  widgets: Widget[];
  interactive: boolean;
  drag: DragState;
  onDragStart: (state: NonNullable<DragState>) => void;
  onDragEnd: () => void;
  onHoverItem: (targetId: string) => void;
  onHoverZone: (zone: Zone) => void;
  onRemove: (id: string) => void;
}) {
  const rejects = !!drag && !drag.isNumber;
  return (
    <div
      className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      onDragOver={(e) => {
        if (!drag) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = rejects ? "none" : "move";
        if (!rejects) onHoverZone("strip");
      }}
      style={
        rejects
          ? { outline: "1px dashed rgba(239,68,68,0.5)", outlineOffset: 6, borderRadius: 12 }
          : undefined
      }
    >
      {items.map((item) => {
        const widget = widgets.find((w) => w.id === item.id);
        if (!widget) return null;
        const dragging = drag?.id === item.id;
        const delta = deltaText(widget.data);
        return (
          <div
            key={item.id}
            draggable={interactive}
            onDragStart={(e) => {
              e.dataTransfer.effectAllowed = "move";
              onDragStart({ id: item.id, zone: "strip", isNumber: widget.chartType === "number" });
            }}
            onDragEnd={onDragEnd}
            onDragOver={(e) => {
              if (!drag || drag.isNumber === false) return;
              e.preventDefault();
              e.stopPropagation();
              onHoverItem(item.id);
            }}
            className="group relative rounded-xl border bg-white px-4 py-3.5"
            style={{
              borderColor: dragging ? "var(--brand-blue)" : "var(--hairline)",
              opacity: dragging ? 0.45 : 1,
              borderStyle: dragging ? "dashed" : "solid",
              cursor: interactive ? "grab" : "default",
            }}
          >
            <DragGrip enabled={interactive} />
            <TileMenu onRemove={() => onRemove(item.id)} />
            <div className="pl-4 text-[12px]" style={{ color: "var(--ink-500)" }}>
              {widget.name}
            </div>
            <div
              className="mt-1 pl-4 text-[24px] font-semibold leading-none"
              style={{ color: "var(--ink-900)" }}
            >
              {widget.value ?? "—"}
            </div>
            <MiniSpark values={widget.data} />
            {delta && (
              <div className="text-[11px]" style={{ color: "var(--ink-500)" }}>
                {delta}
              </div>
            )}
          </div>
        );
      })}
      {items.length === 0 && (
        <div
          className="rounded-xl border border-dashed px-4 py-6 text-center text-[12px]"
          style={{ borderColor: "var(--hairline)", color: "var(--ink-500)" }}
        >
          Drag a number widget here
        </div>
      )}
    </div>
  );
}

/* ---------- widget canvas ---------- */
export function WidgetCanvas({
  items,
  widgets,
  interactive,
  drag,
  onDragStart,
  onDragEnd,
  onHoverItem,
  onHoverZone,
  onResize,
  onRemove,
  onDrill,
}: {
  items: LayoutItem[];
  widgets: Widget[];
  interactive: boolean;
  drag: DragState;
  onDragStart: (state: NonNullable<DragState>) => void;
  onDragEnd: () => void;
  onHoverItem: (targetId: string) => void;
  onHoverZone: (zone: Zone) => void;
  onResize: (id: string, w: WidgetWidth, h: WidgetHeight) => void;
  onRemove: (id: string) => void;
  onDrill: (widget: Widget, segment: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { width, cols } = useContainerCols(ref);
  const [resizing, setResizing] = useState<{ id: string; w: number; h: number } | null>(null);
  const colWidth = cols > 0 ? (width - GAP * (cols - 1)) / cols : 0;

  const startResize = useCallback(
    (e: React.PointerEvent, item: LayoutItem) => {
      e.preventDefault();
      e.stopPropagation();
      const startX = e.clientX;
      const startY = e.clientY;
      let next = { w: item.w as number, h: item.h as number };
      setResizing({ id: item.id, ...next });

      function move(ev: PointerEvent) {
        const spanW = Math.min(colWidth * item.w + GAP * (item.w - 1) + (ev.clientX - startX), colWidth * 3 + GAP * 2);
        const w = Math.min(Math.max(Math.round((spanW + GAP) / (colWidth + GAP)), 1), 3);
        const spanH = ROW_HEIGHT * item.h + GAP * (item.h - 1) + (ev.clientY - startY);
        const h = Math.min(Math.max(Math.round((spanH + GAP) / (ROW_HEIGHT + GAP)), 1), 2);
        next = { w, h };
        setResizing({ id: item.id, w, h });
      }
      function up() {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        setResizing(null);
        onResize(item.id, next.w as WidgetWidth, next.h as WidgetHeight);
      }
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    },
    [colWidth, onResize],
  );

  return (
    <div
      ref={ref}
      className="mt-4 grid gap-4"
      style={{
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        gridAutoRows: `${ROW_HEIGHT}px`,
      }}
      onDragOver={(e) => {
        if (!drag) return;
        e.preventDefault();
        onHoverZone("canvas");
      }}
    >
      {items.map((item) => {
        const widget = widgets.find((w) => w.id === item.id);
        if (!widget) return null;
        const live = resizing?.id === item.id ? resizing : item;
        const dragging = drag?.id === item.id;
        return (
          <div
            key={item.id}
            draggable={interactive}
            onDragStart={(e) => {
              e.dataTransfer.effectAllowed = "move";
              onDragStart({ id: item.id, zone: "canvas", isNumber: widget.chartType === "number" });
            }}
            onDragEnd={onDragEnd}
            onDragOver={(e) => {
              if (!drag) return;
              e.preventDefault();
              e.stopPropagation();
              onHoverItem(item.id);
            }}
            className="group/tile relative"
            style={{
              gridColumn: `span ${Math.min(live.w, cols)}`,
              gridRow: `span ${live.h}`,
              opacity: dragging ? 0.45 : 1,
            }}
          >
            <WidgetCard
              widget={widget}
              className={`h-full ${dragging ? "border-dashed" : ""}`}
              onDrill={(segment) => onDrill(widget, segment)}
              onRemove={() => onRemove(item.id)}
            />
            {interactive && (
              <>
                <span
                  className="absolute left-1.5 top-2 cursor-grab opacity-0 transition-opacity group-hover/tile:opacity-100"
                  style={{ color: "var(--ink-300)" }}
                  aria-hidden="true"
                >
                  <GripVertical size={14} />
                </span>
                <span
                  role="separator"
                  aria-label={`Resize ${widget.name}`}
                  onPointerDown={(e) => startResize(e, item)}
                  className="absolute bottom-1 right-1 h-4 w-4 cursor-nwse-resize opacity-0 transition-opacity group-hover/tile:opacity-100"
                  style={{
                    borderRight: "2px solid var(--ink-300)",
                    borderBottom: "2px solid var(--ink-300)",
                    borderBottomRightRadius: 4,
                  }}
                />
                {resizing?.id === item.id && (
                  <span
                    className="absolute bottom-2 right-6 rounded-md px-2 py-0.5 text-[11px] font-medium text-white"
                    style={{ background: "var(--ink-900)" }}
                  >
                    {resizing.w} x {resizing.h}
                  </span>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
