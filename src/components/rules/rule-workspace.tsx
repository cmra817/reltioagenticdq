import * as React from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import {
  GhostButton,
  PrimaryButton,
  ScopedChat,
  SectionTitle,
  SplitWorkspace,
  Tabs,
  Tag,
  useChatThread,
} from "@/components/workspace/primitives";
import {
  ME,
  RULE_TYPES,
  SEVERITIES,
  type Rule,
  type RuleType,
  type Severity,
} from "@/lib/mock-ops";
import { todayLabel, useRules, type ImpactMode } from "@/lib/ops-store";
import { useRulesNav } from "./nav";
import {
  FIELD_LABEL,
  START_PROMPT,
  START_QUESTION,
  applyChatEdit,
  changedKeys,
  draftFrom,
  type EditableKey,
} from "./rule-chat";
import { describeTest, testRule } from "./rule-test";

const inputStyle: React.CSSProperties = {
  border: "1px solid var(--hairline)",
  background: "#fff",
  color: "var(--ink-900)",
};

/**
 * One screen for creating and editing a rule. The chat is where you say what
 * you want; the right panel is the editor, always editable. Typing in either
 * keeps the other in step, and fields the chat just changed are highlighted.
 * With no ruleId it starts a new rule: the starter message is already sent.
 */
export function RuleWorkspace({ ruleId }: { ruleId?: string }) {
  const go = useRulesNav();
  const { rules, ready, usedBy, addRule, applyEdit } = useRules();
  const isNew = !ruleId;
  const saved = ruleId ? rules.find((r) => r.id === ruleId) : undefined;

  const [draft, setDraft] = React.useState<Rule | null>(null);
  const draftRef = React.useRef<Rule | null>(null);
  draftRef.current = draft;
  const [flash, setFlash] = React.useState<EditableKey[]>([]);
  const [tab, setTab] = React.useState<"editor" | "history">("editor");
  const [step, setStep] = React.useState<"edit" | "impact">("edit");
  const [mode, setMode] = React.useState<ImpactMode>("everywhere");
  const [updateIds, setUpdateIds] = React.useState<string[] | null>(null);

  // An existing rule loads into the editor once it is available.
  React.useEffect(() => {
    if (saved && !draftRef.current) setDraft(saved);
  }, [saved]);

  React.useEffect(() => {
    if (flash.length === 0) return;
    const id = window.setTimeout(() => setFlash([]), 1800);
    return () => window.clearTimeout(id);
  }, [flash]);

  const used = saved ? usedBy(saved.id) : [];
  const readOnly = saved?.scope === "Template";
  const dirty = isNew ? draft !== null : !!draft && !!saved && changedKeys(saved, draft).length > 0;
  const changes = draft && saved ? changedKeys(saved, draft) : [];

  function patch(p: Partial<Pick<Rule, EditableKey>>) {
    setDraft((d) => (d ? { ...d, ...p } : d));
  }

  function reply(q: string): string {
    const cur = draftRef.current;
    if (!cur) {
      if (!isNew) return "One moment while this rule loads.";
      const d = draftFrom(q);
      setDraft(d);
      setFlash(["name", "description", "type", "severity", "threshold"]);
      return `I drafted "${d.name}" as a ${d.type.toLowerCase()} rule. ${describeTest(testRule(d), d.threshold)}\n\nIt's on the right. Edit anything there, or tell me what to change, like "make it high severity" or "allow 2% to fail".`;
    }
    if (readOnly) {
      return "This is a template, so it can't be changed. Use Make my own copy on the right, then edit the copy.";
    }
    const edit = applyChatEdit(cur, q);
    if (edit) {
      setDraft(edit.draft);
      setFlash(edit.changed);
      return `${edit.message} ${describeTest(testRule(edit.draft), edit.draft.threshold)}`;
    }
    if (/test|fail|rows|run it/i.test(q)) return describeTest(testRule(cur), cur.threshold);
    if (/where|used|schedule|impact/i.test(q)) {
      return used.length === 0
        ? "No schedule applies this rule yet, so changing it affects nothing."
        : `It's used in ${used.map((s) => s.name).join(", ")}. When you save a change I'll ask whether to update all of them, some, or save a new rule.`;
    }
    return 'I didn\'t change anything. Try "make it high severity", "allow 2% to fail", "only check active customers", "call it …", or edit the fields on the right.';
  }

  const thread = useChatThread(
    reply,
    isNew
      ? [
          { id: 0, role: "user", text: START_PROMPT },
          { id: 1, role: "agent", text: START_QUESTION },
        ]
      : undefined,
  );

  function saveNew(status: Rule["status"]) {
    if (!draft) return;
    const rule: Rule = {
      ...draft,
      status,
      versions: [{ v: 1, author: ME, at: todayLabel(), note: "Created in chat" }],
    };
    addRule(rule);
    go({ rule: rule.id });
  }

  function save() {
    if (used.length > 0) {
      setUpdateIds(used.map((s) => s.id));
      setMode("everywhere");
      setStep("impact");
    } else commit("everywhere");
  }

  function commit(selected: ImpactMode) {
    if (!saved || !draft) return;
    const id = applyEdit({
      before: saved,
      after: draft,
      note:
        changes.length > 0 ? `Changed ${changes.map((k) => FIELD_LABEL[k]).join(", ")}` : "Saved",
      mode: selected,
      updateIds: selected === "some" ? (updateIds ?? []) : used.map((s) => s.id),
    });
    setStep("edit");
    if (id !== saved.id) go({ rule: id });
  }

  function makeCopy() {
    if (!saved) return;
    const copy: Rule = {
      ...saved,
      id: `r-${Date.now()}`,
      scope: "Yours",
      owner: ME,
      status: "Draft",
      versions: [
        { v: 1, author: ME, at: todayLabel(), note: `Started from the ${saved.name} template` },
      ],
    };
    addRule(copy);
    go({ rule: copy.id });
  }

  if (!isNew && ready && !saved) {
    return (
      <div className="p-8">
        <GhostButton onClick={() => go({})}>Back to rules</GhostButton>
        <p className="mt-4 text-[14px]" style={{ color: "var(--ink-500)" }}>
          This rule isn't available.
        </p>
      </div>
    );
  }

  const suggestions = !draft
    ? []
    : readOnly
      ? ["Where is it used?"]
      : [
          "Make it high severity",
          "Allow 2% to fail",
          "Only check active customers",
          "Where is it used?",
        ];

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 px-6 pt-4">
        <button
          type="button"
          onClick={() => go({})}
          className="flex items-center gap-1.5 text-[13px]"
          style={{ color: "var(--ink-500)" }}
        >
          <ArrowLeft size={14} /> Rules
        </button>
      </div>
      <SplitWorkspace
        panelLabel="Rule editor"
        panelWidth="50vw"
        center={
          <ScopedChat
            thread={thread}
            scopeLabel={isNew ? "New rule" : (saved?.name ?? "Rule")}
            placeholder={isNew ? "Describe what should be true…" : "Tell me what to change…"}
            suggestions={suggestions}
            reply={reply}
            header={
              isNew ? undefined : (
                <section aria-label="Rule">
                  <h1 className="text-[20px] font-semibold" style={{ color: "var(--ink-900)" }}>
                    {saved?.name}
                  </h1>
                  <p className="mt-1 text-[13px]" style={{ color: "var(--ink-500)" }}>
                    Edit on the right, or tell me what to change here. Both stay in step.
                  </p>
                </section>
              )
            }
          />
        }
        panel={
          <div className="flex min-h-full flex-col">
            <div className="flex-1 space-y-5 p-5">
              {!draft ? (
                <p className="text-[13.5px]" style={{ color: "var(--ink-500)" }}>
                  {isNew
                    ? "Your rule appears here once you describe it. You can then edit every field."
                    : "Loading…"}
                </p>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <Tabs
                      label="Rule sections"
                      value={tab}
                      onChange={setTab}
                      tabs={[
                        { id: "editor", label: "Editor" },
                        ...(isNew ? [] : [{ id: "history" as const, label: "History" }]),
                      ]}
                    />
                    <div className="flex items-center gap-1.5">
                      <Tag>{isNew ? "Not saved yet" : (saved?.status ?? draft.status)}</Tag>
                      {!isNew && saved && (
                        <Tag>{saved.scope === "Template" ? "Template" : saved.owner}</Tag>
                      )}
                    </div>
                  </div>

                  {tab === "history" && saved ? (
                    <ol
                      className="divide-y rounded-xl border bg-white"
                      style={{ borderColor: "var(--hairline)" }}
                    >
                      {saved.versions.map((v) => (
                        <li key={v.v} className="flex items-baseline gap-3 px-4 py-2.5 text-[13px]">
                          <span
                            className="w-8 shrink-0 font-medium tabular-nums"
                            style={{ color: "var(--ink-900)" }}
                          >
                            v{v.v}
                          </span>
                          <span className="min-w-0 flex-1" style={{ color: "var(--ink-700)" }}>
                            {v.note}
                          </span>
                          <span
                            className="shrink-0 text-[12px]"
                            style={{ color: "var(--ink-300)" }}
                          >
                            {v.author} · {v.at}
                          </span>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <Editor
                      draft={draft}
                      saved={isNew ? undefined : saved}
                      flash={flash}
                      readOnly={readOnly}
                      onPatch={patch}
                    />
                  )}

                  {tab === "editor" && (
                    <div>
                      <SectionTitle>Tested on real data</SectionTitle>
                      <div
                        className="rounded-xl border bg-white p-3.5 text-[13.5px]"
                        style={{ borderColor: "var(--hairline)", color: "var(--ink-700)" }}
                      >
                        {describeTest(testRule(draft), draft.threshold)}
                      </div>
                    </div>
                  )}

                  {tab === "editor" && !isNew && saved && (
                    <div>
                      <SectionTitle>Where it's used</SectionTitle>
                      {used.length === 0 ? (
                        <p className="text-[13.5px]" style={{ color: "var(--ink-500)" }}>
                          No schedule applies this rule yet.
                        </p>
                      ) : (
                        <ul className="space-y-2">
                          {used.map((s) => (
                            <li key={s.id} className="text-[13.5px]">
                              <Link
                                to="/scheduled"
                                search={{ schedule: s.id }}
                                className="underline"
                                style={{ color: "var(--brand-blue)" }}
                              >
                                {s.name}
                              </Link>
                              <div className="text-[12px]" style={{ color: "var(--ink-500)" }}>
                                {s.domain} · {s.tables.join(", ")}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {draft && tab === "editor" && (
              <div
                className="sticky bottom-0 border-t bg-white/95 p-4 backdrop-blur"
                style={{ borderColor: "var(--hairline)" }}
              >
                {readOnly ? (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[13px]" style={{ color: "var(--ink-500)" }}>
                      Templates can't be edited.
                    </span>
                    <PrimaryButton onClick={makeCopy}>Make my own copy</PrimaryButton>
                  </div>
                ) : isNew ? (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[13px]" style={{ color: "var(--ink-500)" }}>
                      Not saved yet
                    </span>
                    <div className="flex gap-2">
                      <GhostButton onClick={() => saveNew("Draft")} disabled={!draft.name.trim()}>
                        Save as draft
                      </GhostButton>
                      <PrimaryButton
                        onClick={() => saveNew("Active")}
                        disabled={!draft.name.trim()}
                      >
                        Save rule
                      </PrimaryButton>
                    </div>
                  </div>
                ) : step === "impact" ? (
                  <ImpactChoice
                    used={used.map((s) => ({ id: s.id, name: s.name }))}
                    changes={changes}
                    mode={mode}
                    onMode={setMode}
                    updateIds={updateIds ?? []}
                    onUpdateIds={setUpdateIds}
                    onBack={() => setStep("edit")}
                    onSave={() => commit(mode)}
                  />
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[13px]" style={{ color: "var(--ink-500)" }}>
                      {dirty
                        ? `Unsaved changes: ${changes.map((k) => FIELD_LABEL[k]).join(", ")}`
                        : "No changes"}
                    </span>
                    <div className="flex gap-2">
                      <GhostButton disabled={!dirty} onClick={() => saved && setDraft(saved)}>
                        Discard
                      </GhostButton>
                      <PrimaryButton onClick={save} disabled={!dirty || !draft.name.trim()}>
                        Save
                      </PrimaryButton>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        }
      />
    </div>
  );
}

function FieldBox({
  label,
  flashing,
  was,
  children,
}: {
  label: string;
  flashing: boolean;
  was?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-[13.5px]">
      <span className="mb-1 block font-medium" style={{ color: "var(--ink-900)" }}>
        {label}
      </span>
      <span
        className="block rounded-lg transition-shadow duration-500"
        style={{ boxShadow: flashing ? "0 0 0 3px rgba(67,134,250,0.35)" : "none" }}
      >
        {children}
      </span>
      {was !== undefined && (
        <span className="mt-1 block text-[12px]" style={{ color: "var(--ink-500)" }}>
          Was: {was || "empty"}
        </span>
      )}
    </label>
  );
}

function Editor({
  draft,
  saved,
  flash,
  readOnly,
  onPatch,
}: {
  draft: Rule;
  saved?: Rule;
  flash: EditableKey[];
  readOnly: boolean;
  onPatch: (p: Partial<Pick<Rule, EditableKey>>) => void;
}) {
  const was = (k: EditableKey): string | undefined =>
    saved && saved[k] !== draft[k] ? String(saved[k]) : undefined;
  return (
    <div className="space-y-4">
      <FieldBox label="Name" flashing={flash.includes("name")} was={was("name")}>
        <input
          value={draft.name}
          readOnly={readOnly}
          onChange={(e) => onPatch({ name: e.target.value })}
          className="w-full rounded-lg px-3 py-2 font-semibold"
          style={inputStyle}
        />
      </FieldBox>

      <FieldBox
        label="What should be true?"
        flashing={flash.includes("description")}
        was={was("description")}
      >
        <textarea
          value={draft.description}
          readOnly={readOnly}
          onChange={(e) => onPatch({ description: e.target.value })}
          rows={3}
          className="w-full rounded-lg px-3 py-2"
          style={inputStyle}
        />
      </FieldBox>

      <div className="grid grid-cols-2 gap-3">
        <FieldBox label="Type" flashing={flash.includes("type")} was={was("type")}>
          <select
            value={draft.type}
            disabled={readOnly}
            onChange={(e) => onPatch({ type: e.target.value as RuleType })}
            className="w-full rounded-lg px-3 py-2"
            style={inputStyle}
          >
            {RULE_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </FieldBox>
        <FieldBox label="Severity" flashing={flash.includes("severity")} was={was("severity")}>
          <select
            value={draft.severity}
            disabled={readOnly}
            onChange={(e) => onPatch({ severity: e.target.value as Severity })}
            className="w-full rounded-lg px-3 py-2"
            style={inputStyle}
          >
            {SEVERITIES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </FieldBox>
      </div>

      <FieldBox
        label="Rows allowed to fail (%)"
        flashing={flash.includes("threshold")}
        was={was("threshold")}
      >
        <input
          type="number"
          min={0}
          max={100}
          step={0.1}
          value={draft.threshold}
          readOnly={readOnly}
          onChange={(e) => onPatch({ threshold: Math.max(0, Number(e.target.value) || 0) })}
          className="w-32 rounded-lg px-3 py-2"
          style={inputStyle}
        />
      </FieldBox>

      <FieldBox
        label="Only check rows where"
        flashing={flash.includes("appliesWhen")}
        was={was("appliesWhen")}
      >
        <input
          value={draft.appliesWhen}
          readOnly={readOnly}
          onChange={(e) => onPatch({ appliesWhen: e.target.value })}
          placeholder="Leave empty to check every row"
          className="w-full rounded-lg px-3 py-2"
          style={inputStyle}
        />
      </FieldBox>

      <p className="text-[12px]" style={{ color: "var(--ink-500)" }}>
        Rules are generic. You choose the tables and columns when you add this rule to a schedule.
      </p>
    </div>
  );
}

function ImpactChoice({
  used,
  changes,
  mode,
  onMode,
  updateIds,
  onUpdateIds,
  onBack,
  onSave,
}: {
  used: { id: string; name: string }[];
  changes: EditableKey[];
  mode: ImpactMode;
  onMode: (m: ImpactMode) => void;
  updateIds: string[];
  onUpdateIds: (ids: string[]) => void;
  onBack: () => void;
  onSave: () => void;
}) {
  const choice = (value: ImpactMode, title: string, body: string) => (
    <label key={value} className="flex cursor-pointer items-start gap-3">
      <input
        type="radio"
        name="impact"
        checked={mode === value}
        onChange={() => onMode(value)}
        className="mt-1"
      />
      <span>
        <span className="block text-[13.5px] font-medium" style={{ color: "var(--ink-900)" }}>
          {title}
        </span>
        <span className="block text-[12.5px]" style={{ color: "var(--ink-500)" }}>
          {body}
        </span>
      </span>
    </label>
  );
  return (
    <div className="space-y-3">
      <div>
        <div className="text-[14px] font-semibold" style={{ color: "var(--ink-900)" }}>
          Used in {used.length} {used.length === 1 ? "schedule" : "schedules"}
        </div>
        <div className="text-[12.5px]" style={{ color: "var(--ink-500)" }}>
          You changed {changes.map((k) => FIELD_LABEL[k]).join(", ")}. How far should it reach?
        </div>
      </div>
      <fieldset className="space-y-2.5">
        <legend className="sr-only">How far the change reaches</legend>
        {choice(
          "everywhere",
          "Update it everywhere",
          "Every schedule that uses this rule gets the new version from its next run.",
        )}
        {choice(
          "new",
          "Save as a new rule",
          "This rule stays as it is. Your edit becomes a separate rule.",
        )}
        {choice(
          "some",
          "Update some schedules",
          "The rest keep the previous version as their own rule.",
        )}
        {mode === "some" && (
          <ul className="ml-7 space-y-1.5 text-[13px]">
            {used.map((s) => (
              <li key={s.id}>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={updateIds.includes(s.id)}
                    onChange={() =>
                      onUpdateIds(
                        updateIds.includes(s.id)
                          ? updateIds.filter((x) => x !== s.id)
                          : [...updateIds, s.id],
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
      <div className="flex justify-end gap-2">
        <GhostButton onClick={onBack}>Back</GhostButton>
        <PrimaryButton onClick={onSave} disabled={mode === "some" && updateIds.length === 0}>
          Save
        </PrimaryButton>
      </div>
    </div>
  );
}
