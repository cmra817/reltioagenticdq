import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Stepper } from "./Stepper";
import { Step1SelectData } from "./Step1SelectData";

const STEPS = [{ label: "Select data" }, { label: "Apply checks" }];

export function AddDatasetModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Reset when closed
  useEffect(() => {
    if (!open) {
      setStep(0);
      setSelected(new Set());
    }
  }, [open]);

  // Esc to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  if (!open) return null;

  const toggle = (key: string) =>
    setSelected((s) => {
      const n = new Set(s);
      n.has(key) ? n.delete(key) : n.add(key);
      return n;
    });

  const isLastStep = step === STEPS.length - 1;
  const continueLabel = isLastStep
    ? `Add ${selected.size} ${selected.size === 1 ? "asset" : "assets"}`
    : "Continue";
  const continueDisabled = selected.size === 0;

  const onContinue = () => {
    if (continueDisabled) return;
    if (isLastStep) {
      onOpenChange(false);
    } else {
      setStep((s) => s + 1);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col"
      style={{ background: "var(--canvas)" }}
      role="dialog"
      aria-modal="true"
      aria-label="Add data asset"
    >
      {/* Header */}
      <header
        className="shrink-0 border-b bg-white px-10 pt-8 pb-6"
        style={{ borderColor: "var(--hairline)" }}
      >
        <div className="flex items-center justify-between">
          <h1
            className="text-[28px] font-semibold leading-tight"
            style={{ color: "var(--ink-900)" }}
          >
            Add data asset
          </h1>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="h-10 rounded-full px-5 text-[14px] font-medium transition-colors hover:bg-[color:var(--surface-soft)]"
              style={{ color: "var(--ink-700)" }}
            >
              Cancel
            </button>
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                className="h-10 rounded-full border px-6 text-[14px] font-medium transition-colors hover:bg-[color:var(--surface-soft)]"
                style={{ borderColor: "var(--hairline)", color: "var(--ink-900)" }}
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={onContinue}
              disabled={continueDisabled}
              className="h-10 rounded-full px-7 text-[14px] font-medium text-white transition-[filter,opacity]"
              style={{
                background: "var(--brand-blue)",
                opacity: continueDisabled ? 0.5 : 1,
                cursor: continueDisabled ? "not-allowed" : "pointer",
              }}
              onMouseEnter={(e) => {
                if (!continueDisabled) e.currentTarget.style.filter = "brightness(0.95)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = "none";
              }}
            >
              {continueLabel}
            </button>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="ml-2 flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-[color:var(--surface-soft)]"
              style={{ color: "var(--ink-500)" }}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="mt-6">
          <Stepper steps={STEPS} current={step} />
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {step === 0 && (
          <Step1SelectData
            selected={selected}
            onToggle={toggle}
            onClear={() => setSelected(new Set())}
          />
        )}
        {step === 1 && <Step2Placeholder count={selected.size} />}
      </div>
    </div>
  );
}

function Step2Placeholder({ count }: { count: number }) {
  return (
    <div className="flex h-full items-center justify-center px-10 py-16">
      <div
        className="max-w-md rounded-2xl border bg-white px-10 py-12 text-center"
        style={{ borderColor: "var(--hairline)" }}
      >
        <div className="text-[20px] font-semibold" style={{ color: "var(--ink-900)" }}>
          Apply checks
        </div>
        <p className="mt-2 text-[14px]" style={{ color: "var(--ink-500)" }}>
          {count} {count === 1 ? "asset" : "assets"} selected. Configure data quality checks here
          — coming next.
        </p>
      </div>
    </div>
  );
}
