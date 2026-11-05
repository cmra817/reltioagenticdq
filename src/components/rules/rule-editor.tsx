import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GhostButton, PrimaryButton, Tabs } from "@/components/workspace/primitives";
import { RULE_TYPES, SEVERITIES, type Rule, type RuleType, type Severity } from "@/lib/mock-ops";
import { useRules, type ImpactMode } from "@/lib/ops-store";
import { describeTest, testRule } from "./rule-test";

const inputStyle: React.CSSProperties = {
  border: "1px solid var(--hairline)",
  background: "#fff",
  color: "var(--ink-900)",
};

type EditorTab = "definition" | "advanced" | "test";

function changedFields(a: Rule, b: Rule): string[] {
  const out: string[] = [];
  if (a.name !== b.name) out.push("name");
  if (a.description !== b.description) out.push("definition");
  if (a.type !== b.type) out.push("type");
  if (a.severity !== b.severity) out.push("severity");
  if (a.threshold !== b.threshold) out.push("allowed failures");
  if (a.appliesWhen !== b.appliesWhen) out.push("conditions");
  return out;
}

/**
 * Edit a rule: a plain-language definition up front, advanced settings behind
 * a tab, and a test against the last run. Saving a rule that schedules use
 * first asks how far the change should reach.
 */
export function RuleEditor({
  rule,
  onClose,
  onSaved,
}: {
  rule: Rule;
  onClose: () => void;
  onSaved: (ruleId: string) => void;
}) {
  const { usedBy, applyEdit } = useRules();
  const used = usedBy(rule.id);

  const [tab, setTab] = React.useState<EditorTab>("definition");
  const [draft, setDraft] = React.useState<Rule>(rule);
  const [tested, setTested] = React.useState(false);
  const [step, setStep] = React.useState<"edit" | "impact">("edit");
  const [mode, setMode] = React.useState<ImpactMode>("everywhere");
  const [updateIds, setUpdateIds] = React.useState<string[]>(used.map((s) => s.id));

  const changes = changedFields(rule, draft);
  const patch = (p: Partial<Rule>) => {
    setDraft((d) => ({ ...d, ...p }));
    setTested(false);
  };

  function commit(selected: ImpactMode) {
    const id = applyEdit({
      before: rule,
      after: draft,
      note: changes.length > 0 ? `Changed ${changes.join(", ")}` : "Saved without changes",
      mode: selected,
      updateIds: selected === "some" ? updateIds : used.map((s) => s.id),
    });
    onSaved(id);
  }

  function save() {
    if (used.length > 0) setStep("impact");
    else commit("everywhere");
  }

  const result = testRule(draft);
  const before = testRule(rule);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-xl">
        {step === "edit" ? (
          <>
            <DialogHeader>
              <DialogTitle>Edit rule</DialogTitle>
              <DialogDescription>
                Describe what should be true in plain words. Test it before you save.
              </DialogDescription>
            </DialogHeader>

            <Tabs
              label="Editor sections"
              value={tab}
              onChange={setTab}
              tabs={[
                { id: "definition", label: "Definition" },
                { id: "advanced", label: "Advanced" },
                { id: "test", label: "Test" },
              ]}
            />

            <div className="space-y-4 text-[13.5px]">
              {tab === "definition" && (
                <>
                  <label className="block">
                    <span className="mb-1 block font-medium">Name</span>
                    <input
                      value={draft.name}
                      onChange={(e) => patch({ name: e.target.value })}
                      className="w-full rounded-lg px-3 py-2"
                      style={inputStyle}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block font-medium">What should be true?</span>
                    <textarea
                      value={draft.description}
                      onChange={(e) => patch({ description: e.target.value })}
                      rows={4}
                      className="w-full rounded-lg px-3 py-2"
                      style={inputStyle}
                    />
                  </label>
                </>
              )}

              {tab === "advanced" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="mb-1 block font-medium">Type</span>
                      <select
                        value={draft.type}
                        onChange={(e) => patch({ type: e.target.value as RuleType })}
                        className="w-full rounded-lg px-3 py-2"
                        style={inputStyle}
                      >
                        {RULE_TYPES.map((t) => (
                          <option key={t}>{t}</option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="mb-1 block font-medium">Severity</span>
                      <select
                        value={draft.severity}
                        onChange={(e) => patch({ severity: e.target.value as Severity })}
                        className="w-full rounded-lg px-3 py-2"
                        style={inputStyle}
                      >
                        {SEVERITIES.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <label className="block">
                    <span className="mb-1 block font-medium">Rows allowed to fail (%)</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.1}
                      value={draft.threshold}
                      onChange={(e) =>
                        patch({ threshold: Math.max(0, Number(e.target.value) || 0) })
                      }
                      className="w-32 rounded-lg px-3 py-2"
                      style={inputStyle}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block font-medium">Only check rows where</span>
                    <input
                      value={draft.appliesWhen}
                      onChange={(e) => patch({ appliesWhen: e.target.value })}
                      placeholder="Leave empty to check every row"
                      className="w-full rounded-lg px-3 py-2"
                      style={inputStyle}
                    />
                  </label>
                </>
              )}

              {tab === "test" && (
                <div className="space-y-3">
                  <GhostButton onClick={() => setTested(true)}>Test on last run</GhostButton>
                  {tested && (
                    <div
                      className="rounded-xl border bg-white p-3.5"
                      style={{ borderColor: "var(--hairline)" }}
                    >
                      <p style={{ color: "var(--ink-900)" }}>
                        {describeTest(result, draft.threshold)}
                      </p>
                      {changes.length > 0 && (
                        <p className="mt-2 text-[12.5px]" style={{ color: "var(--ink-500)" }}>
                          Before your edit: {before.failing.toLocaleString()} rows failed. Now:{" "}
                          {result.failing.toLocaleString()}.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <DialogFooter>
              <GhostButton onClick={onClose}>Cancel</GhostButton>
              <PrimaryButton onClick={save} disabled={changes.length === 0 || !draft.name.trim()}>
                Save
              </PrimaryButton>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>
                This rule is used in {used.length} {used.length === 1 ? "schedule" : "schedules"}
              </DialogTitle>
              <DialogDescription>
                You changed: {changes.join(", ")}. Choose how far the change should reach.
              </DialogDescription>
            </DialogHeader>

            <fieldset className="space-y-3 text-[13.5px]">
              <legend className="sr-only">How far the change reaches</legend>
              <Choice
                checked={mode === "everywhere"}
                onChange={() => setMode("everywhere")}
                title="Update it everywhere"
                body="Every schedule that uses this rule gets the new version from its next run."
              />
              <Choice
                checked={mode === "new"}
                onChange={() => setMode("new")}
                title="Save as a new rule"
                body="This rule stays as it is. Your edit becomes a separate rule you can add where you want."
              />
              <Choice
                checked={mode === "some"}
                onChange={() => setMode("some")}
                title="Update some schedules"
                body="The rest keep the previous version as their own rule."
              />
              {mode === "some" && (
                <ul className="ml-7 space-y-1.5">
                  {used.map((s) => (
                    <li key={s.id}>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={updateIds.includes(s.id)}
                          onChange={() =>
                            setUpdateIds((l) =>
                              l.includes(s.id) ? l.filter((x) => x !== s.id) : [...l, s.id],
                            )
                          }
                        />
                        {s.name}
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </fieldset>

            <DialogFooter>
              <GhostButton onClick={() => setStep("edit")}>Back</GhostButton>
              <PrimaryButton
                onClick={() => commit(mode)}
                disabled={mode === "some" && updateIds.length === 0}
              >
                Save
              </PrimaryButton>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Choice({
  checked,
  onChange,
  title,
  body,
}: {
  checked: boolean;
  onChange: () => void;
  title: string;
  body: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input type="radio" name="impact" checked={checked} onChange={onChange} className="mt-1" />
      <span>
        <span className="block font-medium" style={{ color: "var(--ink-900)" }}>
          {title}
        </span>
        <span className="block text-[12.5px]" style={{ color: "var(--ink-500)" }}>
          {body}
        </span>
      </span>
    </label>
  );
}
