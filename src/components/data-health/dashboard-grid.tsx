import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, GripVertical, MoreVertical, Plus } from "lucide-react";
import { WidgetCard } from "./WidgetCard";
import {
  type LayoutItem,
  type Section,
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

/* ---------- section chrome ---------- */
function AddCategoryDivider({
  onAdd,
  absoluteTop,
}: {
  onAdd: () => void;
  absoluteTop?: number;
}) {
  const positioned = absoluteTop !== undefined;
  return (
    <div
      className={
        positioned
          ? "group/div absolute inset-x-0 z-10 flex h-6 items-center"
          : "group/div relative -my-1 flex h-6 items-center"
      }
      style={positioned ? { top: absoluteTop - 12 } : undefined}
    >
      <span
        className="absolute inset-x-0 top-1/2 h-px opacity-0 transition-opacity group-hover/div:opacity-100"
        style={{ background: "var(--hairline)" }}
        aria-hidden="true"
      />
      <button
        type="button"
        onClick={onAdd}
        className="relative mx-auto inline-flex items-center gap-1 rounded-full border bg-white px-2.5 py-1 text-[11px] font-medium opacity-0 transition-opacity group-hover/div:opacity-100"
        style={{ borderColor: "var(--hairline)", color: "var(--brand-blue)" }}
      >
        <Plus size={12} />
        Add category
      </button>
    </div>
  );
}


function SectionMenu({
  onRename,
  onDelete,
  canDelete,
}: {
  onRename: () => void;
  onDelete: () => void;
  canDelete: boolean;
}) {
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
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Category actions"
        onClick={() => setOpen((v) => !v)}
        className="rounded-md p-1 hover:bg-black/5"
        style={{ color: "var(--ink-500)" }}
      >
        <MoreVertical size={15} />
      </button>
      {open && (
        <div
          className="absolute left-0 top-full z-20 mt-1 w-[200px] rounded-lg border bg-white p-1"
          style={{ borderColor: "var(--hairline)", boxShadow: "0 12px 28px rgba(15,23,42,0.12)" }}
        >
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onRename();
            }}
            className="w-full rounded-md px-3 py-2 text-left text-[13px] hover:bg-[color:var(--surface-soft)]"
            style={{ color: "var(--ink-900)" }}
          >
            Rename category
          </button>
          {canDelete && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onDelete();
              }}
              className="w-full rounded-md px-3 py-2 text-left text-[13px] hover:bg-[color:var(--surface-soft)]"
              style={{ color: "var(--ink-900)" }}
            >
              Delete category
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function SectionHeader({
  section,
  count,
  canDelete,
  onRename,
  onDelete,
  onToggle,
}: {
  section: Section;
  count: number;
  canDelete: boolean;
  onRename: (title: string) => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  const [editing, setEditing] = useState(!section.title);
  const [draft, setDraft] = useState(section.title);

  useEffect(() => {
    setDraft(section.title);
  }, [section.title]);

  function commit() {
    setEditing(false);
    const next = draft.trim();
    if (next !== section.title) onRename(next);
  }

  if (!section.title && !editing) {
    return (
      <div className="group/head mt-6 flex h-6 items-center">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-[12px] opacity-0 transition-opacity group-hover/head:opacity-100"
          style={{ color: "var(--brand-blue)" }}
        >
          Add a category title
        </button>
      </div>
    );
  }

  return (
    <div className="mt-6 mb-1 flex items-center gap-2">
      <button
        type="button"
        aria-label={section.collapsed ? "Expand category" : "Collapse category"}
        onClick={onToggle}
        className="rounded-md p-1 hover:bg-black/5"
        style={{ color: "var(--ink-500)" }}
      >
        <ChevronDown
          size={16}
          style={{
            transform: section.collapsed ? "rotate(-90deg)" : "none",
            transition: "transform 120ms",
          }}
        />
      </button>
      {editing ? (
        <input
          autoFocus
          value={draft}
          placeholder="Category name"
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") {
              setDraft(section.title);
              setEditing(false);
            }
          }}
          className="rounded-lg border bg-white px-2 py-1 text-[18px] font-semibold outline-none"
          style={{ borderColor: "var(--brand-blue)", color: "var(--ink-900)", minWidth: 220 }}
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-[18px] font-semibold"
          style={{ color: "var(--ink-900)" }}
        >
          {section.title}
        </button>
      )}
      <span className="text-[12px]" style={{ color: "var(--ink-300)" }}>
        {count} {count === 1 ? "widget" : "widgets"}
      </span>
      <SectionMenu onRename={() => setEditing(true)} onDelete={onDelete} canDelete={canDelete} />
    </div>
  );
}

/* ---------- one section's grid ---------- */
function SectionGrid({
  sectionId,
  items,
  widgets,
  interactive,
  drag,
  onDragStart,
  onDragEnd,
  onHoverItem,
  onHoverSection,
  onResize,
  onRemove,
  onDrill,
  onSplit,
}: {
  sectionId: string;
  items: LayoutItem[];
  widgets: Widget[];
  interactive: boolean;
  drag: DragState;
  onDragStart: (state: NonNullable<DragState>) => void;
  onDragEnd: () => void;
  onHoverItem: (targetId: string) => void;
  onHoverSection: (sectionId: string) => void;
  onResize: (id: string, w: WidgetWidth, h: WidgetHeight) => void;
  onRemove: (id: string) => void;
  onDrill: (widget: Widget, segment: string) => void;
  onSplit: (itemId: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { width, cols } = useContainerCols(ref);
  const [resizing, setResizing] = useState<{ id: string; w: number; h: number } | null>(null);
  const colWidth = cols > 0 ? (width - GAP * (cols - 1)) / cols : 0;

  // Measure where each rendered row starts so an "add category" strip can sit in every row gap.
  const tileRefs = useRef(new Map<string, HTMLDivElement>());
  const [rowStarts, setRowStarts] = useState<{ itemId: string; top: number }[]>([]);
  useEffect(() => {
    if (!interactive) return;
    const container = ref.current;
    if (!container) return;
    const measure = () => {
      const base = container.getBoundingClientRect().top;
      const seen: { itemId: string; top: number }[] = [];
      for (const item of items) {
        const el = tileRefs.current.get(item.id);
        if (!el) continue;
        const top = Math.round(el.getBoundingClientRect().top - base);
        if (!seen.some((s) => Math.abs(s.top - top) < 8)) seen.push({ itemId: item.id, top });
      }
      seen.sort((a, b) => a.top - b.top);
      setRowStarts(seen);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(container);
    return () => ro.disconnect();
  }, [items, interactive, width, cols, resizing]);


  const startResize = useCallback(
    (e: React.PointerEvent, item: LayoutItem) => {
      e.preventDefault();
      e.stopPropagation();
      const startX = e.clientX;
      const startY = e.clientY;
      let next = { w: item.w as number, h: item.h as number };
      setResizing({ id: item.id, ...next });

      function move(ev: PointerEvent) {
        const spanW = Math.min(
          colWidth * item.w + GAP * (item.w - 1) + (ev.clientX - startX),
          colWidth * 3 + GAP * 2,
        );
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
      className="relative mt-3 grid gap-4"
      style={{
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        gridAutoRows: `${ROW_HEIGHT}px`,
        minHeight: items.length === 0 ? 96 : undefined,
      }}
      onDragOver={(e) => {
        if (!drag) return;
        e.preventDefault();
        onHoverSection(sectionId);
      }}
    >
      {items.length === 0 && (
        <div
          className="col-span-full flex items-center justify-center rounded-xl border border-dashed text-[12px]"
          style={{ borderColor: "var(--hairline)", color: "var(--ink-500)", minHeight: 96 }}
        >
          Drag a widget here
        </div>
      )}
      {interactive &&
        !drag &&
        rowStarts.slice(1).map((row) => (
          <AddCategoryDivider
            key={`split-${row.itemId}`}
            absoluteTop={row.top}
            onAdd={() => onSplit(row.itemId)}
          />
        ))}
      {items.map((item) => {
        const widget = widgets.find((w) => w.id === item.id);
        if (!widget) return null;
        const live = resizing?.id === item.id ? resizing : item;
        const dragging = drag?.id === item.id;
        return (
          <div
            key={item.id}
            ref={(el) => {
              if (el) tileRefs.current.set(item.id, el);
              else tileRefs.current.delete(item.id);
            }}
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

/* ---------- widget canvas ---------- */
export function WidgetCanvas({
  items,
  sections,
  widgets,
  interactive,
  drag,
  onDragStart,
  onDragEnd,
  onHoverItem,
  onHoverSection,
  onResize,
  onRemove,
  onDrill,
  onAddSection,
  onSplitSection,
  onRenameSection,
  onDeleteSection,
  onToggleSection,
}: {
  items: LayoutItem[];
  sections: Section[];
  widgets: Widget[];
  interactive: boolean;
  drag: DragState;
  onDragStart: (state: NonNullable<DragState>) => void;
  onDragEnd: () => void;
  onHoverItem: (targetId: string) => void;
  onHoverSection: (sectionId: string) => void;
  onResize: (id: string, w: WidgetWidth, h: WidgetHeight) => void;
  onRemove: (id: string) => void;
  onDrill: (widget: Widget, segment: string) => void;
  onAddSection: (index: number) => void;
  onSplitSection: (sectionId: string, itemId: string) => void;
  onRenameSection: (id: string, title: string) => void;
  onDeleteSection: (id: string) => void;
  onToggleSection: (id: string) => void;
}) {
  const firstId = sections[0]?.id;
  return (
    <div>
      {sections.map((section, index) => {
        const sectionItems = items.filter(
          (i) => (i.sectionId ?? firstId) === section.id,
        );
        return (
          <div key={section.id}>
            {index > 0 && interactive && <AddCategoryDivider onAdd={() => onAddSection(index)} />}
            <SectionHeader
              section={section}
              count={sectionItems.length}
              canDelete={index > 0}
              onRename={(title) => onRenameSection(section.id, title)}
              onDelete={() => onDeleteSection(section.id)}
              onToggle={() => onToggleSection(section.id)}
            />
            {!section.collapsed && (
              <SectionGrid
                sectionId={section.id}
                items={sectionItems}
                widgets={widgets}
                interactive={interactive}
                drag={drag}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onHoverItem={onHoverItem}
                onHoverSection={onHoverSection}
                onResize={onResize}
                onRemove={onRemove}
                onDrill={onDrill}
                onSplit={(itemId) => onSplitSection(section.id, itemId)}
              />
            )}

          </div>
        );
      })}
      {interactive && <AddCategoryDivider onAdd={() => onAddSection(sections.length)} />}
    </div>
  );
}

