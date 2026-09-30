import { useEffect, useState } from "react";
import { Stepper } from "./Stepper";
import { Step1SelectData } from "./Step1SelectData";
import { Step2ApplyChecks } from "./Step2ApplyChecks";
import { Step3Schedule, DEFAULT_SCHEDULE, type ScheduleConfig } from "./Step3Schedule";
import { WizardChatPanel } from "@/components/chat/wizard-chat-panel";
import { generateChecks, type Check } from "./mock-checks";
import { WAREHOUSES } from "./mock-warehouses";
import type { CreatedAssetInput } from "../created-assets-context";

function tableNameFromKey(key: string) {
  const parts = key.split("::");
  return parts[2] ?? parts[parts.length - 1];
}

const STEPS = [{ label: "Select data" }, { label: "Apply checks" }, { label: "Schedule" }];

export type AddDatasetCompletion = {
  tables: string[];
  checkCount: number;
  /** Fully resolved assets (with kept checks + schedules) to register in Explore. */
  assets: CreatedAssetInput[];
};

export function AddDatasetModal({
  open,
  onOpenChange,
  domainName,
  onComplete,
  presentation = "fullscreen",
  showChat = true,
  onCancel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domainName?: string;
  onComplete?: (result: AddDatasetCompletion) => void;
  /** Shell mode keeps the application navigation and top bar visible. */
  presentation?: "fullscreen" | "shell";
  /** The agentic manual path uses the workflow without a second chat panel. */
  showChat?: boolean;
  /** Overrides closing the flow entirely — e.g. back to the agentic chat home. */
  onCancel?: () => void;
}) {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [profilingSchedule, setProfilingSchedule] = useState<ScheduleConfig>(DEFAULT_SCHEDULE);
  const [checksSchedule, setChecksSchedule] = useState<ScheduleConfig>(DEFAULT_SCHEDULE);
  // checked[selectionKey] = Set<checkId> the user kept enabled in step 2
  const [checked, setChecked] = useState<Record<string, Set<string>>>({});
  // Custom checks created via the DQ rule modal, keyed by selectionKey.
  const [customChecks, setCustomChecks] = useState<Record<string, Check[]>>({});

  // Keep the check map in sync with the table selection: new tables default to all checks on.
  useEffect(() => {
    setChecked((prev) => {
      const next: Record<string, Set<string>> = {};
      let changed = false;
      for (const key of selected) {
        if (prev[key]) {
          next[key] = prev[key];
        } else {
          next[key] = new Set(generateChecks(tableNameFromKey(key)).map((c) => c.id));
          changed = true;
        }
      }
      if (Object.keys(prev).length !== Object.keys(next).length) changed = true;
      return changed ? next : prev;
    });
  }, [selected]);

  const toggleCheck = (assetKey: string, checkId: string) =>
    setChecked((prev) => {
      const set = new Set(prev[assetKey] ?? []);
      if (set.has(checkId)) set.delete(checkId);
      else set.add(checkId);
      return { ...prev, [assetKey]: set };
    });

  const addCustomCheck = (assetKey: string, check: Check) => {
    setCustomChecks((prev) => ({ ...prev, [assetKey]: [...(prev[assetKey] ?? []), check] }));
    setChecked((prev) => {
      const set = new Set(prev[assetKey] ?? []);
      set.add(check.id);
      return { ...prev, [assetKey]: set };
    });
  };

  // Reset when closed
  useEffect(() => {
    if (!open) {
      setStep(0);
      setSelected(new Set());
      setProfilingSchedule(DEFAULT_SCHEDULE);
      setChecksSchedule(DEFAULT_SCHEDULE);
      setChecked({});
      setCustomChecks({});
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

  const totalChecks = Array.from(selected).reduce(
    (sum, key) => sum + (checked[key]?.size ?? generateChecks(tableNameFromKey(key)).length),
    0,
  );

  const isLastStep = step === STEPS.length - 1;
  const continueLabel = isLastStep ? "Finish setup" : "Continue";
  const continueDisabled = selected.size === 0;

  const onContinue = () => {
    if (continueDisabled) return;
    if (isLastStep) {
      // Derive tables, kept checks and source metadata from the wizard state.
      const tables: string[] = [];
      const assets: CreatedAssetInput[] = [];
      let checkCount = 0;
      for (const key of selected) {
        const [connId, schemaName, assetName] = key.split("::");
        const name = assetName ?? tableNameFromKey(key);
        const keptIds = checked[key];
        const allChecks = [...generateChecks(name), ...(customChecks[key] ?? [])];
        const keptChecks = keptIds ? allChecks.filter((c) => keptIds.has(c.id)) : allChecks;
        tables.push(name);
        checkCount += keptChecks.length;

        const conn = WAREHOUSES.find((c) => c.id === connId);
        const schema = conn?.schemas.find((s) => s.name === schemaName);
        const asset = schema?.assets.find((a) => a.name === assetName);
        assets.push({
          name,
          type: asset?.type ?? "table",
          source: conn?.warehouse ?? "Databricks",
          connection: conn?.name ?? "New connection",
          schema: schemaName ?? "default",
          description: asset?.description ?? "Newly added data asset.",
          rows: asset?.rows ?? 0,
          checks: keptChecks,
          profilingSchedule,
          checksSchedule,
          domain: domainName ?? "",
        });
      }
      onComplete?.({ tables, checkCount, assets });
      onOpenChange(false);
    } else {
      setStep((s) => s + 1);
    }
  };

  return (
    <div
      className={
        presentation === "shell"
          ? "fixed bottom-0 left-[260px] right-0 top-12 z-[60] flex border-l"
          : "fixed inset-0 z-[60] flex"
      }
      style={{ background: "var(--canvas)" }}
      role="dialog"
      aria-modal={presentation === "fullscreen" ? "true" : undefined}
      aria-label="Add data asset"
    >
      <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <header
        className={`shrink-0 border-b bg-white ${presentation === "shell" ? "px-8 pb-4 pt-5" : "px-10 pb-6 pt-8"}`}
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
          </div>
        </div>
        <div className={presentation === "shell" ? "mt-4" : "mt-6"}>
          <Stepper steps={STEPS} current={step} />
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          {step === 0 && (
            <Step1SelectData
              selected={selected}
              onToggle={toggle}
              onClear={() => setSelected(new Set())}
            />
          )}
          {step === 1 && (
            <Step2ApplyChecks
              selected={selected}
              checked={checked}
              customChecks={customChecks}
              onToggleCheck={toggleCheck}
              onAddCheck={addCustomCheck}
            />
          )}
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
      </div>
      {showChat && step === 0 && (
        <WizardChatPanel
          context="select"
          onSelectAssets={(keys) =>
            setSelected((prev) => {
              const next = new Set(prev);
              for (const k of keys) next.add(k);
              return next;
            })
          }
        />
      )}
      {showChat && step === 1 && (
        <WizardChatPanel
          context="checks"
          assetSummary={Array.from(selected).map((key) => {
            const name = tableNameFromKey(key);
            return {
              key,
              name,
              count: checked[key]?.size ?? generateChecks(name).length,
            };
          })}
          onAddCheck={addCustomCheck}
        />
      )}
      {showChat && step === 2 && <WizardChatPanel context="schedule" />}
    </div>
  );
}
