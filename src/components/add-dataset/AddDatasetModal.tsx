import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Stepper } from "./Stepper";
import { Step1SelectData } from "./Step1SelectData";
import { Step2ApplyChecks } from "./Step2ApplyChecks";
import { Step3Schedule, DEFAULT_SCHEDULE, type ScheduleConfig } from "./Step3Schedule";
import { AgentChatPanel } from "./AgentChatPanel";
import { generateChecks } from "./mock-checks";

const STEPS = [{ label: "Select data" }, { label: "Apply checks" }, { label: "Schedule" }];

export type AddDatasetCompletion = {
  tables: string[];
  checkCount: number;
};

export function AddDatasetModal({
  open,
  onOpenChange,
  domainName,
  onComplete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domainName?: string;
  onComplete?: (result: AddDatasetCompletion) => void;
}) {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [profilingSchedule, setProfilingSchedule] = useState<ScheduleConfig>(DEFAULT_SCHEDULE);
  const [checksSchedule, setChecksSchedule] = useState<ScheduleConfig>(DEFAULT_SCHEDULE);

  // Reset when closed
  useEffect(() => {
    if (!open) {
      setStep(0);
      setSelected(new Set());
      setProfilingSchedule(DEFAULT_SCHEDULE);
      setChecksSchedule(DEFAULT_SCHEDULE);
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

  const totalChecks = Array.from(selected).reduce((sum, key) => {
    const parts = key.split("::");
    const name = parts[2] ?? parts[parts.length - 1];
    return sum + generateChecks(name).length;
  }, 0);

  const isLastStep = step === STEPS.length - 1;
  const continueLabel = isLastStep ? "Finish setup" : "Continue";
  const continueDisabled = selected.size === 0;

  const onContinue = () => {
    if (continueDisabled) return;
    if (isLastStep) {
      // Derive table names + total recommended checks from the selection.
      const tables: string[] = [];
      let checkCount = 0;
      for (const key of selected) {
        const parts = key.split("::");
        const name = parts[2] ?? parts[parts.length - 1];
        tables.push(name);
        checkCount += generateChecks(name).length;
      }
      onComplete?.({ tables, checkCount });
      onOpenChange(false);
    } else {
      setStep((s) => s + 1);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex"
      style={{ background: "var(--canvas)" }}
      role="dialog"
      aria-modal="true"
      aria-label="Add data asset"
    >
      <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <header
        className="shrink-0 border-b bg-white px-10 pt-8 pb-6"
        style={{ borderColor: "var(--hairline)" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            {domainName && (
              <div
                className="flex items-center gap-1.5 text-[12px] font-medium"
                style={{ color: "var(--ink-500)" }}
              >
                <span>Domain</span>
                <span aria-hidden="true">/</span>
                <span style={{ color: "var(--brand-blue)" }}>{domainName}</span>
              </div>
            )}
            <h1
              className="text-[28px] font-semibold leading-tight"
              style={{ color: "var(--ink-900)" }}
            >
              Add data asset
            </h1>
          </div>
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
        {step === 1 && <Step2ApplyChecks selected={selected} />}
        {step === 2 && (
          <Step3Schedule
            checkCount={totalChecks}
            profiling={profilingSchedule}
            checks={checksSchedule}
            onChangeProfiling={setProfilingSchedule}
            onChangeChecks={setChecksSchedule}
          />
        )}
      </div>
      </div>
      <AgentChatPanel
        step={step}
        selected={selected}
        profilingSchedule={profilingSchedule}
        checksSchedule={checksSchedule}
        onSetProfilingSchedule={setProfilingSchedule}
        onSetChecksSchedule={setChecksSchedule}
        onAddMany={(keys) =>
          setSelected((s) => {
            const n = new Set(s);
            for (const k of keys) n.add(k);
            return n;
          })
        }
      />
    </div>
  );
}
