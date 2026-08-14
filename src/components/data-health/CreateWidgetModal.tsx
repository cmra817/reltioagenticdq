import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { WidgetVisual } from "./WidgetVisual";
import {
  interpretDescription,
  mockDataFor,
  type ChartType,
  type Widget,
} from "./widget-model";

const CHART_TYPES: { key: ChartType; label: string }[] = [
  { key: "line", label: "Line" },
  { key: "bar", label: "Bar" },
  { key: "number", label: "Number" },
  { key: "table", label: "Table" },
];

export function CreateWidgetModal({
  open,
  onOpenChange,
  source,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** when present, the modal opens in clone mode pre-filled from this widget */
  source: Widget | null;
  onSave: (widget: Widget, addToDashboard: boolean) => void;
}) {
  const [description, setDescription] = useState("");
  const [name, setName] = useState("");
  const [chartType, setChartType] = useState<ChartType>("line");
  const [interpretation, setInterpretation] = useState<{
    measure: string;
    scope: string;
    timeframe: string;
    chartType: ChartType;
  } | null>(null);

  useEffect(() => {
    if (!open) return;
    if (source) {
      setDescription(`${source.measure} for ${source.scope} over the last ${source.timeframe}`);
      setName(`${source.name} (copy)`);
      setChartType(source.chartType);
      setInterpretation({
        measure: source.measure,
        scope: source.scope,
        timeframe: source.timeframe,
        chartType: source.chartType,
      });
    } else {
      setDescription("");
      setName("");
      setChartType("line");
      setInterpretation(null);
    }
  }, [open, source]);

  function generate() {
    const result = interpretDescription(description);
    setInterpretation(result);
    setChartType(result.chartType);
    if (!name.trim()) {
      setName(`${result.measure} · ${result.scope}`);
    }
  }

  const preview: Widget | null = interpretation
    ? {
        id: "preview",
        name: name.trim() || "Untitled widget",
        chartType,
        creator: { kind: "me" },
        measure: interpretation.measure,
        scope: interpretation.scope,
        timeframe: interpretation.timeframe,
        drillable: chartType === "bar" || chartType === "line",
        ...mockDataFor(chartType),

      }
    : null;

  function save(addToDashboard: boolean) {
    if (!preview) return;
    onSave({ ...preview, id: `w-${Date.now()}` }, addToDashboard);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] max-w-[860px] gap-0 overflow-y-auto border bg-white p-0 sm:rounded-2xl"
        style={{ borderColor: "var(--hairline)", boxShadow: "0 24px 60px rgba(15,23,42,0.18)" }}
      >
        <div className="px-8 pb-6 pt-8">
          <DialogHeader>
            <DialogTitle className="text-[20px] font-semibold" style={{ color: "var(--ink-900)" }}>
              {source ? "Clone widget" : "Create widget"}
            </DialogTitle>
          </DialogHeader>

          <label className="mt-5 block text-[13px] font-medium" style={{ color: "var(--ink-700)" }}>
            Describe what you want to see
          </label>
          <div className="mt-2 flex gap-2">
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="show completeness trend for the customer domain over the last 30 days"
              className="flex-1 rounded-xl border bg-white px-3 py-2.5 text-[14px] outline-none focus:border-[color:var(--brand-blue)]"
              style={{ borderColor: "var(--hairline)", color: "var(--ink-900)" }}
            />
            <button
              type="button"
              onClick={generate}
              disabled={!description.trim()}
              className="inline-flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-[14px] font-medium disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                borderColor: "var(--brand-blue)",
                color: "var(--brand-blue)",
                background: "rgba(67,134,250,0.08)",
              }}
            >
              <Sparkles size={15} />
              Generate
            </button>
          </div>

          {interpretation && (
            <>
              <div
                className="mt-4 rounded-xl border px-4 py-3 text-[13px]"
                style={{
                  borderColor: "var(--hairline)",
                  background: "var(--surface-soft)",
                  color: "var(--ink-700)",
                }}
              >
                <span className="font-medium" style={{ color: "var(--ink-900)" }}>
                  Measuring:
                </span>{" "}
                {interpretation.measure} ·{" "}
                <span className="font-medium" style={{ color: "var(--ink-900)" }}>
                  Scope:
                </span>{" "}
                {interpretation.scope} ·{" "}
                <span className="font-medium" style={{ color: "var(--ink-900)" }}>
                  Timeframe:
                </span>{" "}
                {interpretation.timeframe} ·{" "}
                <span className="font-medium" style={{ color: "var(--ink-900)" }}>
                  Suggested chart:
                </span>{" "}
                {interpretation.chartType}
              </div>

              <label className="mt-5 block text-[13px] font-medium" style={{ color: "var(--ink-700)" }}>
                Widget name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Untitled widget"
                className="mt-2 w-full rounded-xl border bg-white px-3 py-2.5 text-[14px] outline-none focus:border-[color:var(--brand-blue)]"
                style={{ borderColor: "var(--hairline)", color: "var(--ink-900)" }}
              />

              <div className="mt-5 text-[13px] font-medium" style={{ color: "var(--ink-700)" }}>
                Chart type
              </div>
              <div
                className="mt-2 inline-flex items-center gap-1 rounded-xl border bg-white p-1"
                style={{ borderColor: "var(--hairline)" }}
              >
                {CHART_TYPES.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    aria-pressed={chartType === c.key}
                    onClick={() => setChartType(c.key)}
                    className="rounded-lg px-3 py-1.5 text-[13px] font-medium"
                    style={{
                      background: chartType === c.key ? "var(--surface-soft)" : "transparent",
                      color: chartType === c.key ? "var(--brand-blue)" : "var(--ink-500)",
                    }}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              <div className="mt-5 text-[13px] font-medium" style={{ color: "var(--ink-700)" }}>
                Preview
              </div>
              {preview && (
                <div className="mt-2 max-w-[340px]">
                  <div
                    className="rounded-xl border bg-white p-4"
                    style={{ borderColor: "var(--hairline)" }}
                  >
                    <WidgetVisual widget={preview} />
                    <div className="mt-3 text-[14px] font-medium" style={{ color: "var(--ink-900)" }}>
                      {preview.name}
                    </div>
                    <div className="mt-1 text-[12px]" style={{ color: "var(--ink-500)" }}>
                      You · {preview.timeframe}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div
          className="flex items-center justify-end gap-2 border-t px-8 py-4"
          style={{ borderColor: "var(--hairline)" }}
        >
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-xl border px-4 py-2.5 text-[14px] font-medium"
            style={{ borderColor: "var(--hairline)", color: "var(--ink-700)" }}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!preview}
            onClick={() => save(false)}
            className="rounded-xl border px-4 py-2.5 text-[14px] font-medium disabled:cursor-not-allowed disabled:opacity-50"
            style={{ borderColor: "var(--hairline)", color: "var(--ink-900)" }}
          >
            Save to library
          </button>
          <button
            type="button"
            disabled={!preview}
            onClick={() => save(true)}
            className="rounded-xl px-4 py-2.5 text-[14px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            style={{ background: "var(--brand-blue)" }}
          >
            Save and add to dashboard
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
