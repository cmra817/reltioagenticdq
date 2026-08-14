import { useMemo, useState } from "react";
import { Check, Copy, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { WidgetCard } from "./WidgetCard";
import type { Widget } from "./widget-model";

type CreatorFilter = "all" | "me" | "team" | "reltio";
type AppliedFilter = "all" | "applied" | "not";

export function WidgetLibraryModal({
  open,
  onOpenChange,
  widgets,
  appliedIds,
  onApply,
  onClone,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  widgets: Widget[];
  appliedIds: string[];
  onApply: (w: Widget) => void;
  onClone: (w: Widget) => void;
}) {
  const [query, setQuery] = useState("");
  const [creator, setCreator] = useState<CreatorFilter>("all");
  const [applied, setApplied] = useState<AppliedFilter>("all");

  const selectStyle: React.CSSProperties = {
    borderColor: "var(--hairline)",
    color: "var(--ink-900)",
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return widgets.filter((w) => {
      if (q && !w.name.toLowerCase().includes(q)) return false;
      if (creator !== "all" && w.creator.kind !== creator) return false;
      const isApplied = appliedIds.includes(w.id);
      if (applied === "applied" && !isApplied) return false;
      if (applied === "not" && isApplied) return false;
      return true;
    });
  }, [widgets, query, creator, applied, appliedIds]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[88vh] max-w-[1080px] gap-0 overflow-y-auto border bg-white p-0 sm:rounded-2xl"
        style={{ borderColor: "var(--hairline)", boxShadow: "0 24px 60px rgba(15,23,42,0.18)" }}
      >
        <div className="px-8 pb-8 pt-8">
          <DialogHeader>
            <DialogTitle className="text-[20px] font-semibold" style={{ color: "var(--ink-900)" }}>
              Widget library
            </DialogTitle>
          </DialogHeader>
          <p className="mt-1 text-[13px]" style={{ color: "var(--ink-500)" }}>
            Apply existing widgets to your dashboard or clone one to make it your own.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px] flex-1">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--ink-500)" }}
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search widgets"
                className="w-full rounded-xl border bg-white py-2.5 pl-9 pr-3 text-[14px] outline-none focus:border-[color:var(--brand-blue)]"
                style={selectStyle}
              />
            </div>
            <select
              value={creator}
              onChange={(e) => setCreator(e.target.value as CreatorFilter)}
              aria-label="Filter by creator"
              className="rounded-xl border bg-white px-3 py-2.5 text-[14px] outline-none focus:border-[color:var(--brand-blue)]"
              style={selectStyle}
            >
              <option value="all">All creators</option>
              <option value="me">Created by me</option>
              <option value="team">Created by team</option>
              <option value="reltio">Reltio-managed</option>
            </select>
            <select
              value={applied}
              onChange={(e) => setApplied(e.target.value as AppliedFilter)}
              aria-label="Filter by applied status"
              className="rounded-xl border bg-white px-3 py-2.5 text-[14px] outline-none focus:border-[color:var(--brand-blue)]"
              style={selectStyle}
            >
              <option value="all">All widgets</option>
              <option value="applied">Applied to my dashboard</option>
              <option value="not">Not applied</option>
            </select>
          </div>

          {visible.length === 0 ? (
            <div
              className="mt-6 rounded-xl border bg-white px-6 py-12 text-center text-[14px]"
              style={{ borderColor: "var(--hairline)", color: "var(--ink-500)" }}
            >
              No widgets match these filters.
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((w) => {
                const isApplied = appliedIds.includes(w.id);
                return (
                  <WidgetCard
                    key={w.id}
                    widget={w}
                    footer={
                      <>
                        {isApplied ? (
                          <div className="flex flex-1 items-center gap-1.5 px-3 py-2 text-[13px] font-medium text-emerald-600">
                            <Check size={15} strokeWidth={2.5} />
                            <span>Applied</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onApply(w)}
                            className="flex-1 rounded-lg border px-3 py-2 text-[13px] font-medium"
                            style={{
                              borderColor: "var(--brand-blue)",
                              color: "var(--brand-blue)",
                              background: "rgba(67,134,250,0.08)",
                            }}
                          >
                            Apply
                          </button>
                        )}
                        <button
                          type="button"
                          aria-label="Clone widget"
                          title="Clone widget"
                          onClick={() => onClone(w)}
                          className="rounded-lg border p-2 hover:bg-[color:var(--surface-soft)]"
                          style={{ borderColor: "var(--hairline)", color: "var(--ink-500)" }}
                        >
                          <Copy size={15} />
                        </button>
                      </>
                    }
                  />
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
