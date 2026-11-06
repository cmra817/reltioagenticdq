import * as React from "react";
import { useChatThreads } from "@/components/chat/chat-context";
import { useLocalStore } from "@/lib/use-local-store";
import {
  FloatingPrompt,
  GhostButton,
  PanelToggle,
  PrimaryButton,
  ScopedChat,
  SectionTitle,
  SplitWorkspace,
  Tabs,
  Tag,
  useChatThread,
  type ChatTurn,
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
import { useOpenRule } from "./open-rule";
import {
  FIELD_LABEL,
  START_PROMPT,
  START_QUESTION,
  applyChatEdit,
  changedKeys,
  draftFrom,
  type EditableKey,
} from "./rule-chat";
import { buildInsights, coverageText, passRateText, whyFailing } from "./rule-insights";
import { RuleInsightsView } from "./rule-insights-view";
import { describeTest, testRule } from "./rule-test";

const inputStyle: React.CSSProperties = {
  border: "1px solid var(--hairline)",
  background: "#fff",
  color: "var(--ink-900)",
};

const STATUSES: Rule["status"][] = ["Draft", "Active", "Disabled"];

/** What a rule thread remembers, so it can be reopened from Recents. */
export type RuleThreadState = { turns: ChatTurn[]; draft: Rule | null; savedId?: string };
export const RULE_THREADS_KEY = "agentflow.rule-threads.v1";
export const RULE_THREADS_INIT: Record<string, RuleThreadState> = {};

type PanelTab = "insights" | "edit" | "history";

/**
 * A chat thread about one rule. The chat is where you say what you want; the
 * right panel holds the rule. It starts empty for a new rule (no panel until
 * the agent has drafted one) and opens straight onto Insights for an existing
 * rule, with Edit (always editable) and History beside it. Typing in either
 * the chat or the editor keeps the other in step, and fields the chat just
 * changed are highlighted.
 */
export function RuleWorkspace({
  threadId,
  ruleId,
  initial,
}: {
  threadId: string;
  /** Set when the thread was opened from an existing rule in the table. */
  ruleId?: string;
  initial?: RuleThreadState;
}) {
  const { renameThread } = useChatThreads();
  const openRule = useOpenRule();
  const { rules, ready, usedBy, addRule, applyEdit } = useRules();
  const [, setThreads] = useLocalStore(RULE_THREADS_KEY, RULE_THREADS_INIT);
  const [savedId, setSavedId] = React.useState<string | undefined>(initial?.savedId ?? ruleId);
  const isNew = !savedId;
  const saved = savedId ? rules.find((r) => r.id === savedId) : undefined;

  const [draft, setDraft] = React.useState<Rule | null>(initial?.draft ?? null);
  const draftRef = React.useRef<Rule | null>(null);
  draftRef.current = draft;
  const [flash, setFlash] = React.useState<EditableKey[]>([]);
  const [chatOpen, setChatOpen] = React.useState(true);
  const [tab, setTab] = React.useState<PanelTab>(ruleId ? "insights" : "edit");
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
  const insights = React.useMemo(() => (saved ? buildInsights(saved, used) : null), [saved, used]);
  const readOnly = saved?.scope === "Template";
  const dirty = isNew ? draft !== null : !!draft && !!saved && changedKeys(saved, draft).length > 0;
  const changes = draft && saved ? changedKeys(saved, draft) : [];
  const owners = React.useMemo(
    () => [...new Set([ME, ...rules.map((r) => r.owner), draft?.owner ?? ME])],
    [rules, draft?.owner],
  );

  function patch(p: Partial<Pick<Rule, EditableKey>>) {
    setDraft((d) => (d ? { ...d, ...p } : d));
  }

  /** Answers questions about how the rule is doing, and brings Insights forward. */
  function answerInsight(rule: Rule, ins: NonNullable<typeof insights>, q: string): string | null {
    let text: string | null = null;
    if (/\bwhy\b.*\bfail/i.test(q)) text = whyFailing(rule, ins);
    else if (/pass(es)? rate|how often|how (is|does) it (do|perform)|trend/i.test(q))
      text = passRateText(ins);
    else if (/where|cover|applied|used|schedule|impact|which tables?/i.test(q))
      text = coverageText(ins);
    if (text) setTab("insights");
    return text;
  }

  function reply(q: string): string {
    const cur = draftRef.current;
    if (!cur) {
      if (!isNew) return "One moment while this rule loads.";
      const d = draftFrom(q);
      setDraft(d);
      if (threadId) renameThread(threadId, d.name);
      setFlash(["name", "description", "type", "severity", "threshold"]);
      return `I drafted "${d.name}" as a ${d.type.toLowerCase()} rule. ${describeTest(testRule(d), d.threshold)}\n\nIt's on the right. Edit anything there, or tell me what to change, like "make it high severity" or "allow 2% to fail".`;
    }
    const insight = saved && insights ? answerInsight(saved, insights, q) : null;
    if (readOnly) {
      return (
        insight ??
        "This is a template, so it can't be changed. Use Make my own copy on the right, then edit the copy."
      );
    }
    const edit = applyChatEdit(cur, q);
    if (edit) {
      setDraft(edit.draft);
      setFlash(edit.changed);
      setTab("edit");
      return `${edit.message} ${describeTest(testRule(edit.draft), edit.draft.threshold)}`;
    }
    if (insight) return insight;
    if (/test|fail|rows|run it/i.test(q)) return describeTest(testRule(cur), cur.threshold);
    return 'I didn\'t change anything. Try "make it high severity", "allow 2% to fail", "only check active customers", "call it …", or edit the fields on the right.';
  }

  const thread = useChatThread(
    reply,
    initial?.turns ??
      (ruleId
        ? undefined
        : [
            { id: 0, role: "user", text: START_PROMPT },
            { id: 1, role: "agent", text: START_QUESTION },
          ]),
  );

  // Keep the thread so it can be reopened from Recents. An opened rule always
  // reloads from the saved rule, so only a new rule's draft is kept.
  React.useEffect(() => {
    setThreads((prev) => ({
      ...prev,
      [threadId]: { turns: thread.turns, draft: ruleId ? null : draft, savedId },
    }));
  }, [threadId, ruleId, thread.turns, draft, savedId, setThreads]);

  function saveNew(status: Rule["status"]) {
    if (!draft) return;
    const rule: Rule = {
      ...draft,
      status,
      versions: [{ v: 1, author: ME, at: todayLabel(), note: "Created in chat" }],
    };
    addRule(rule);
    setSavedId(rule.id);
    setDraft(rule);
    renameThread(threadId, rule.name);
    thread.say(
      `Saved "${rule.name}"${status === "Active" ? " and turned it on" : " as a draft"}. You can keep refining it here, and you'll find it in Rules.`,
    );
  }

  function save() {
    // Handing a rule to someone else changes nothing for the schedules that use it.
    const reaches = changes.some((k) => k !== "owner");
    if (used.length > 0 && reaches) {
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
    if (id !== saved.id) {
      // "Save as a new rule": the original stays as it was, and the copy opens in its own thread.
      const name = draft.name === saved.name ? `${draft.name} (copy)` : draft.name;
      setDraft(saved);
      openRule({ id, name });
      return;
    }
    if (draft.name !== saved.name) renameThread(threadId, draft.name);
    thread.say(
      selected === "some"
        ? "Saved. The schedules you ticked use the new version; the rest keep the previous one."
        : used.length > 0 && changes.some((k) => k !== "owner")
          ? `Saved. ${used.length === 1 ? "The schedule that uses it gets" : "Every schedule that uses it gets"} the new version from its next run.`
          : "Saved.",
    );
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
    openRule(copy);
  }

  if (!isNew && ready && !saved) {
    return (
      <div className="p-8">
        <p className="text-[14px]" style={{ color: "var(--ink-500)" }}>
          This rule isn't available. Choose another from Rules.
        </p>
      </div>
    );
  }

  const suggestions = !draft
    ? []
    : isNew
      ? []
      : readOnly
        ? ["Where is it used?", "How often does it pass?"]
        : [
            "Why does it fail?",
            "Where is it applied?",
            "Make it high severity",
            "Allow 2% to fail",
          ];

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <SplitWorkspace
        panelLabel="Rule"
        panelWidth="59vw"
        collapsed={!!draft && !chatOpen}
        onToggle={draft ? () => setChatOpen(!chatOpen) : undefined}
        floating={
          <FloatingPrompt
            thread={thread}
            placeholder="Ask about this rule, or tell me what to change…"
            onOpen={() => setChatOpen(true)}
          />
        }
        center={
          <ScopedChat
            thread={thread}
            scopeLabel={isNew ? "New rule" : (saved?.name ?? "Rule")}
            placeholder={
              isNew
                ? "Describe what should be true…"
                : "Ask about this rule, or tell me what to change…"
            }
            suggestions={suggestions}
            reply={reply}
          />
        }
        panel={
          !draft ? undefined : (
            <div className="flex min-h-full flex-col">
              <div className="mx-auto w-full max-w-[960px] flex-1 space-y-5 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    {!chatOpen && (
                      <PanelToggle label="Show chat" onClick={() => setChatOpen(true)} />
                    )}
                    <Tabs
                      label="Rule sections"
                      value={tab}
                      onChange={setTab}
                      tabs={
                        isNew
                          ? [{ id: "edit" as const, label: "Edit" }]
                          : [
                              { id: "insights" as const, label: "Insights" },
                              { id: "edit" as const, label: "Edit" },
                              { id: "history" as const, label: "History" },
                            ]
                      }
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Tag>{isNew ? "Not saved yet" : (saved?.status ?? draft.status)}</Tag>
                  </div>
                </div>

                {tab === "insights" && saved && insights ? (
                  <RuleInsightsView rule={saved} insights={insights} onAsk={thread.send} />
                ) : tab === "history" && saved ? (
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
                        <span className="shrink-0 text-[12px]" style={{ color: "var(--ink-300)" }}>
                          {v.author} · {v.at}
                        </span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <>
                    <Editor
                      draft={draft}
                      saved={isNew ? undefined : saved}
                      flash={flash}
                      readOnly={readOnly}
                      owners={owners}
                      onPatch={patch}
                    />
                    <div>
                      <SectionTitle>Tested on real data</SectionTitle>
                      <div
                        className="rounded-xl border bg-white p-3.5 text-[13.5px]"
                        style={{ borderColor: "var(--hairline)", color: "var(--ink-700)" }}
                      >
                        {describeTest(testRule(draft), draft.threshold)}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {tab === "edit" && (
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
          )
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
  owners,
  onPatch,
}: {
  draft: Rule;
  saved?: Rule;
  flash: EditableKey[];
  readOnly: boolean;
  owners: string[];
  onPatch: (p: Partial<Pick<Rule, EditableKey>>) => void;
}) {
  const was = (k: EditableKey): string | undefined =>
    saved && saved[k] !== draft[k] ? String(saved[k]) : undefined;
  const created = saved?.versions[saved.versions.length - 1];
  return (
    <div className="space-y-5">
      {saved && (
        <dl
          className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-xl border bg-white p-3.5 text-[13px]"
          style={{ borderColor: "var(--hairline)" }}
        >
          <div>
            <dt style={{ color: "var(--ink-500)" }}>Created by</dt>
            <dd className="font-medium" style={{ color: "var(--ink-900)" }}>
              {created ? created.author : saved.owner}
            </dd>
          </div>
          <div>
            <dt style={{ color: "var(--ink-500)" }}>Created</dt>
            <dd className="font-medium" style={{ color: "var(--ink-900)" }}>
              {created ? created.at : "Unknown"}
            </dd>
          </div>
          <div>
            <dt style={{ color: "var(--ink-500)" }}>Last changed</dt>
            <dd className="font-medium" style={{ color: "var(--ink-900)" }}>
              {saved.versions[0]
                ? `${saved.versions[0].at} by ${saved.versions[0].author}`
                : "Never"}
            </dd>
          </div>
          <div>
            <dt style={{ color: "var(--ink-500)" }}>Library</dt>
            <dd className="font-medium" style={{ color: "var(--ink-900)" }}>
              {saved.scope === "Template" ? "Template" : saved.scope === "Team" ? "Team" : "Yours"}
            </dd>
          </div>
        </dl>
      )}

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
          <FieldBox label="DQ dimension" flashing={flash.includes("type")} was={was("type")}>
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

        {saved && (
          <div className="grid grid-cols-2 gap-3">
            <FieldBox label="Status" flashing={flash.includes("status")} was={was("status")}>
              <select
                value={draft.status}
                disabled={readOnly}
                onChange={(e) => onPatch({ status: e.target.value as Rule["status"] })}
                className="w-full rounded-lg px-3 py-2"
                style={inputStyle}
              >
                {STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </FieldBox>
            <FieldBox label="Owner" flashing={flash.includes("owner")} was={was("owner")}>
              <select
                value={draft.owner}
                disabled={readOnly}
                onChange={(e) => onPatch({ owner: e.target.value })}
                className="w-full rounded-lg px-3 py-2"
                style={inputStyle}
              >
                {owners.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </FieldBox>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <SectionTitle>Parameters</SectionTitle>
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
