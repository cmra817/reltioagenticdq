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
import { WidgetCard } from "./WidgetCard";
import { WidgetLibraryModal } from "./WidgetLibraryModal";
import { CreateWidgetModal } from "./CreateWidgetModal";
import {
  DEFAULT_APPLIED,
  MOCK_WIDGETS,
  OOTB_METRICS,
  ORG_DEFAULT_APPLIED,
  type Widget,
} from "./widget-model";

type Mode = "mine" | "org";

export function DataHealthWidgets() {
  const navigate = useNavigate();

  // mock: current user is an admin so the template toggle is visible
  const [isAdmin] = useState(true);
  const [mode, setMode] = useState<Mode>("mine");

  const [widgets, setWidgets] = useState<Widget[]>(MOCK_WIDGETS);
  const [myApplied, setMyApplied] = useState<string[]>(DEFAULT_APPLIED);
  const [orgApplied, setOrgApplied] = useState<string[]>(ORG_DEFAULT_APPLIED);
  const [publishedOrg, setPublishedOrg] = useState<string[]>(ORG_DEFAULT_APPLIED);
  const [customized, setCustomized] = useState(false);

  const [libraryOpen, setLibraryOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [cloneSource, setCloneSource] = useState<Widget | null>(null);
  const [confirmPublish, setConfirmPublish] = useState(false);

  const applied = mode === "org" ? orgApplied : myApplied;
  const setApplied = mode === "org" ? setOrgApplied : setMyApplied;

  function markCustomized() {
    if (mode === "mine") setCustomized(true);
  }

  function apply(w: Widget) {
    if (applied.includes(w.id)) return;
    setMyApplied((ids) => (ids.includes(w.id) ? ids : [...ids, w.id]));
    setCustomized(true);
    toast.success(`"${w.name}" added to your dashboard`);
  }

  function remove(id: string) {
    setApplied((ids) => ids.filter((x) => x !== id));
    markCustomized();
    toast("Removed from dashboard — still available in the library");
  }

  function saveWidget(w: Widget, addToDashboard: boolean) {
    setWidgets((list) => [w, ...list]);
    if (addToDashboard) {
      setMyApplied((ids) => [...ids, w.id]);
      setCustomized(true);
      toast.success(`"${w.name}" saved and added to your dashboard`);
    } else {
      toast.success(`"${w.name}" saved to the library`);
    }
  }

  function publish() {
    setPublishedOrg(orgApplied);
    setConfirmPublish(false);
    if (!customized) setMyApplied(orgApplied);
    toast.success("Org default dashboard published");
  }

  function resetToOrgDefault() {
    setMyApplied(publishedOrg);
    setCustomized(false);
    toast.success("Your dashboard was reset to the org default");
  }

  function drill(widget: Widget, segment: string) {
    navigate({ to: "/incidents", search: { segment, widget: widget.name } });
  }

  const appliedWidgets = applied
    .map((id) => widgets.find((w) => w.id === id))
    .filter((w): w is Widget => Boolean(w));

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

      {/* OOTB metrics */}
      <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {OOTB_METRICS.map((m) => (
          <div
            key={m.label}
            className="rounded-xl border bg-white px-4 py-3.5"
            style={{ borderColor: "var(--hairline)" }}
          >
            <div className="text-[12px]" style={{ color: "var(--ink-500)" }}>
              {m.label}
            </div>
            <div className="mt-1 text-[24px] font-semibold leading-none" style={{ color: "var(--ink-900)" }}>
              {m.value}
            </div>
          </div>
        ))}
      </div>

      {/* widget grid */}
      {appliedWidgets.length === 0 ? (
        <div
          className="mt-4 rounded-xl border bg-white px-6 py-12 text-center text-[14px]"
          style={{ borderColor: "var(--hairline)", color: "var(--ink-500)" }}
        >
          No widgets on this dashboard yet — browse the library or create one.
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {appliedWidgets.map((w) => (
            <WidgetCard
              key={w.id}
              widget={w}
              onDrill={(segment) => drill(w, segment)}
              onRemove={() => remove(w.id)}
            />
          ))}
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
              Users who haven't customized their dashboard will see this update automatically.
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
