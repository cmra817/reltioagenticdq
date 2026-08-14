import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { LayoutGrid, Plus, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { WidgetLibraryModal } from "./WidgetLibraryModal";
import { CreateWidgetModal } from "./CreateWidgetModal";
import { KpiStrip, WidgetCanvas, type DragState } from "./dashboard-grid";
import {
  ALL_LIBRARY_WIDGETS,
  DEFAULT_APPLIED,
  OOTB_WIDGETS,
  ORG_DEFAULT_APPLIED,
  defaultLayoutFor,
  defaultSections,
  isOotbWidget,
  layoutItemFor,
  newSectionId,
  type LayoutItem,
  type Section,
  type Widget,
  type WidgetHeight,
  type WidgetWidth,
  type Zone,
} from "./widget-model";


type Mode = "mine" | "org";

export function DataHealthWidgets() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // mock: current user is an admin so the template toggle is visible
  const [isAdmin] = useState(true);
  const [mode, setMode] = useState<Mode>("mine");

  const [widgets, setWidgets] = useState<Widget[]>(ALL_LIBRARY_WIDGETS);
  const [myApplied, setMyApplied] = useState<string[]>(DEFAULT_APPLIED);
  const [orgApplied, setOrgApplied] = useState<string[]>(ORG_DEFAULT_APPLIED);
  const [publishedOrg, setPublishedOrg] = useState<string[]>(ORG_DEFAULT_APPLIED);

  const [myLayout, setMyLayout] = useState<LayoutItem[]>(() =>
    defaultLayoutFor(DEFAULT_APPLIED, ALL_LIBRARY_WIDGETS),
  );
  const [orgLayout, setOrgLayout] = useState<LayoutItem[]>(() =>
    defaultLayoutFor(ORG_DEFAULT_APPLIED, ALL_LIBRARY_WIDGETS),
  );
  const [publishedOrgLayout, setPublishedOrgLayout] = useState<LayoutItem[]>(() =>
    defaultLayoutFor(ORG_DEFAULT_APPLIED, ALL_LIBRARY_WIDGETS),
  );

  const [mySections, setMySections] = useState<Section[]>(defaultSections);
  const [orgSections, setOrgSections] = useState<Section[]>(defaultSections);
  const [publishedOrgSections, setPublishedOrgSections] = useState<Section[]>(defaultSections);


  const [customized, setCustomized] = useState(false);
  const [drag, setDrag] = useState<DragState>(null);

  const [libraryOpen, setLibraryOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [cloneSource, setCloneSource] = useState<Widget | null>(null);
  const [confirmPublish, setConfirmPublish] = useState(false);

  const applied = mode === "org" ? orgApplied : myApplied;
  const setApplied = mode === "org" ? setOrgApplied : setMyApplied;
  const layout = mode === "org" ? orgLayout : myLayout;
  const setLayout = mode === "org" ? setOrgLayout : setMyLayout;
  const sections = mode === "org" ? orgSections : mySections;
  const setSections = mode === "org" ? setOrgSections : setMySections;


  const allWidgets = [...OOTB_WIDGETS, ...widgets];

  function markCustomized() {
    if (mode === "mine") setCustomized(true);
  }

  function apply(w: Widget) {
    if (applied.includes(w.id)) return;
    setMyApplied((ids) => (ids.includes(w.id) ? ids : [...ids, w.id]));
    setMyLayout((l) => (l.some((i) => i.id === w.id) ? l : [...l, layoutItemFor(w)]));
    setCustomized(true);
    toast.success(`"${w.name}" added to your dashboard`);
  }

  function remove(id: string) {
    setApplied((ids) => ids.filter((x) => x !== id));
    setLayout((l) => l.filter((i) => i.id !== id));
    markCustomized();
    toast("Removed from dashboard — still available in the library");
  }

  function saveWidget(w: Widget, addToDashboard: boolean) {
    setWidgets((list) => [w, ...list]);
    if (addToDashboard) {
      setMyApplied((ids) => [...ids, w.id]);
      setMyLayout((l) => [...l, layoutItemFor(w)]);
      setCustomized(true);
      toast.success(`"${w.name}" saved and added to your dashboard`);
    } else {
      toast.success(`"${w.name}" saved to the library`);
    }
  }

  function publish() {
    setPublishedOrg(orgApplied);
    setPublishedOrgLayout(orgLayout);
    setConfirmPublish(false);
    if (!customized) {
      setMyApplied(orgApplied);
      setMyLayout(orgLayout);
    }
    toast.success("Org default dashboard published");
  }

  function resetToOrgDefault() {
    setMyApplied(publishedOrg);
    setMyLayout(publishedOrgLayout);
    setCustomized(false);
    toast.success("Your dashboard was reset to the org default");
  }

  function drill(widget: Widget, segment: string) {
    navigate({ to: "/incidents", search: { segment, widget: widget.name } });
  }

  /* ---------- layout mutations ---------- */
  function moveBefore(targetId: string) {
    if (!drag || drag.id === targetId) return;
    setLayout((l) => {
      const from = l.findIndex((i) => i.id === drag.id);
      const to = l.findIndex((i) => i.id === targetId);
      if (from < 0 || to < 0) return l;
      const target = l[to]!;
      const next = [...l];
      const [moved] = next.splice(from, 1);
      if (!moved) return l;
      const insertAt = next.findIndex((i) => i.id === targetId);
      next.splice(insertAt < 0 ? next.length : insertAt, 0, { ...moved, zone: target.zone });
      return next;
    });
    markCustomized();
  }

  function moveToZone(zone: Zone) {
    if (!drag) return;
    if (zone === "strip" && !drag.isNumber) return;
    setLayout((l) => {
      const item = l.find((i) => i.id === drag.id);
      if (!item || item.zone === zone) return l;
      const rest = l.filter((i) => i.id !== drag.id);
      const moved: LayoutItem =
        zone === "strip" ? { ...item, zone, w: 1, h: 1 } : { ...item, zone };
      const lastOfZone = rest.reduce((acc, i, idx) => (i.zone === zone ? idx : acc), -1);
      rest.splice(lastOfZone + 1, 0, moved);
      return rest;
    });
    markCustomized();
  }

  function resize(id: string, w: WidgetWidth, h: WidgetHeight) {
    setLayout((l) => l.map((i) => (i.id === id ? { ...i, w, h } : i)));
    markCustomized();
  }

  const visible = layout.filter((i) => {
    const exists = allWidgets.some((w) => w.id === i.id);
    return exists && (isOotbWidget(i.id) || applied.includes(i.id));
  });
  const stripItems = visible.filter((i) => i.zone === "strip");
  const canvasItems = visible.filter((i) => i.zone === "canvas");
  const interactive = !isMobile;

  const outlineBtn: React.CSSProperties = {
    borderColor: "var(--brand-blue)",
    color: "var(--brand-blue)",
    background: "rgba(67,134,250,0.08)",
  };

  return (
    <section>
      {/* top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {isAdmin ? (
          <div
            className="inline-flex items-center gap-1 rounded-xl border bg-white p-1"
            style={{ borderColor: "var(--hairline)" }}
          >
            {(
              [
                ["mine", "My dashboard"],
                ["org", "Org default template"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                aria-pressed={mode === key}
                onClick={() => setMode(key)}
                className="rounded-lg px-3 py-1.5 text-[13px] font-medium"
                style={{
                  background: mode === key ? "var(--surface-soft)" : "transparent",
                  color: mode === key ? "var(--brand-blue)" : "var(--ink-500)",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        ) : (
          <div className="text-[15px] font-semibold" style={{ color: "var(--ink-900)" }}>
            My dashboard
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {mode === "mine" && customized && (
            <button
              type="button"
              onClick={resetToOrgDefault}
              className="inline-flex items-center gap-1.5 rounded-xl border bg-white px-3.5 py-2 text-[13px] font-medium"
              style={{ borderColor: "var(--hairline)", color: "var(--ink-700)" }}
            >
              <RotateCcw size={14} />
              Reset to org default
            </button>
          )}
          <button
            type="button"
            onClick={() => setLibraryOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border bg-white px-3.5 py-2 text-[13px] font-medium"
            style={{ borderColor: "var(--hairline)", color: "var(--ink-700)" }}
          >
            <LayoutGrid size={14} />
            Browse widget library
          </button>
          <button
            type="button"
            onClick={() => {
              setCloneSource(null);
              setCreateOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-[13px] font-medium"
            style={outlineBtn}
          >
            <Plus size={14} />
            Create widget
          </button>
          {mode === "org" && (
            <button
              type="button"
              onClick={() => setConfirmPublish(true)}
              className="rounded-xl px-3.5 py-2 text-[13px] font-medium text-white"
              style={{ background: "var(--brand-blue)" }}
            >
              Publish changes
            </button>
          )}
        </div>
      </div>

      {mode === "org" && (
        <div
          className="mt-4 rounded-xl border px-4 py-3 text-[13px]"
          style={{
            borderColor: "var(--hairline)",
            background: "var(--surface-soft)",
            color: "var(--ink-700)",
          }}
        >
          Editing the org default template — changes only go live for other users after you publish.
        </div>
      )}

      {/* KPI strip — single-number tiles only */}
      <KpiStrip
        items={stripItems}
        widgets={allWidgets}
        interactive={interactive}
        drag={drag}
        onDragStart={setDrag}
        onDragEnd={() => setDrag(null)}
        onHoverItem={moveBefore}
        onHoverZone={moveToZone}
        onRemove={remove}
      />

      {/* widget canvas — 3-column resizable grid */}
      {canvasItems.length === 0 ? (
        <div
          className="mt-4 rounded-xl border bg-white px-6 py-12 text-center text-[14px]"
          style={{ borderColor: "var(--hairline)", color: "var(--ink-500)" }}
          onDragOver={(e) => {
            if (!drag) return;
            e.preventDefault();
            moveToZone("canvas");
          }}
        >
          No widgets on this dashboard yet — browse the library or create one.
        </div>
      ) : (
        <WidgetCanvas
          items={canvasItems}
          widgets={allWidgets}
          interactive={interactive}
          drag={drag}
          onDragStart={setDrag}
          onDragEnd={() => setDrag(null)}
          onHoverItem={moveBefore}
          onHoverZone={moveToZone}
          onResize={resize}
          onRemove={remove}
          onDrill={drill}
        />
      )}

      {interactive && (
        <div className="mt-3 text-[12px]" style={{ color: "var(--ink-300)" }}>
          Drag widgets to rearrange · drag the bottom-right corner to resize (1–3 columns wide) ·
          the top strip holds single-number tiles
        </div>
      )}

      <WidgetLibraryModal
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        widgets={widgets}
        appliedIds={myApplied}
        onApply={apply}
        onClone={(w) => {
          setCloneSource(w);
          setCreateOpen(true);
        }}
      />

      <CreateWidgetModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        source={cloneSource}
        onSave={saveWidget}
      />

      <AlertDialog open={confirmPublish} onOpenChange={setConfirmPublish}>
        <AlertDialogContent
          className="border bg-white sm:rounded-2xl"
          style={{ borderColor: "var(--hairline)" }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: "var(--ink-900)" }}>
              Publish this dashboard as the org default?
            </AlertDialogTitle>
            <AlertDialogDescription style={{ color: "var(--ink-500)" }}>
              Users who haven't customized their dashboard will see this update automatically —
              including widget positions and sizes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={publish}
              className="text-white"
              style={{ background: "var(--brand-blue)" }}
            >
              Confirm publish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
