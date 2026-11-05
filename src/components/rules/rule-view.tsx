import * as React from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Pencil } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  GhostButton,
  ScopedChat,
  SectionTitle,
  SplitWorkspace,
  Tag,
} from "@/components/workspace/primitives";
import { useRules } from "@/lib/ops-store";
import { useRulesNav } from "./nav";
import { RuleEditor } from "./rule-editor";
import { describeTest, testRule } from "./rule-test";

/** One rule: history and chat in the center, definition and usage on the right. */
export function RuleView({ ruleId }: { ruleId: string }) {
  const go = useRulesNav();
  const { rules, usedBy, writeRule } = useRules();
  const [editing, setEditing] = React.useState(false);

  const rule = rules.find((r) => r.id === ruleId);
  if (!rule) {
    return (
      <div className="p-8">
        <GhostButton onClick={() => go({})}>Back to rules</GhostButton>
        <p className="mt-4 text-[14px]" style={{ color: "var(--ink-500)" }}>
          This rule isn't available.
        </p>
      </div>
    );
  }

  const used = usedBy(rule.id);
  const editable = rule.scope !== "Template";

  function reply(q: string): string {
    if (/test|fail|rows|run/i.test(q)) return describeTest(testRule(rule!), rule!.threshold);
    if (/where|used|schedule|impact/i.test(q)) {
      return used.length === 0
        ? "No schedule applies this rule yet, so changing it affects nothing."
        : `It runs in ${used.map((s) => s.name).join(", ")}. When you edit it I'll ask whether to update all of them, some, or save a new rule.`;
    }
    if (/change|edit|loosen|tighten/i.test(q)) {
      return "Use Edit on the right. I'll test your change against the last run before you save, then show which schedules it touches.";
    }
    const r = rule!;
    return `${r.name} is a ${r.type.toLowerCase()} rule, ${r.severity.toLowerCase()} severity, currently ${r.status.toLowerCase()}. ${r.description}`;
  }

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
        panelLabel="Rule definition"
        panelWidth={380}
        center={
          <ScopedChat
            key={rule.id}
            scopeLabel="This rule"
            placeholder="Ask about this rule…"
            suggestions={["Test it on the last run", "Where is it used?", "What if I loosen it?"]}
            reply={reply}
            header={
              <section aria-label="Rule summary">
                <h1 className="text-[20px] font-semibold" style={{ color: "var(--ink-900)" }}>
                  {rule.name}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <Tag>{rule.type}</Tag>
                  <Tag>{rule.severity} severity</Tag>
                  <Tag>{rule.status}</Tag>
                  <Tag>{rule.scope === "Template" ? "Template" : `Owner: ${rule.owner}`}</Tag>
                </div>
                <p
                  className="mt-4 text-[14.5px] leading-relaxed"
                  style={{ color: "var(--ink-700)" }}
                >
                  {rule.description}
                </p>
                <h2
                  className="mb-2 mt-6 text-[13px] font-semibold"
                  style={{ color: "var(--ink-900)" }}
                >
                  Version history
                </h2>
                <ol
                  className="divide-y rounded-xl border bg-white"
                  style={{ borderColor: "var(--hairline)" }}
                >
                  {rule.versions.map((v) => (
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
              </section>
            }
          />
        }
        panel={
          <div className="space-y-6 p-5">
            <div className="flex items-center justify-between gap-3">
              <label
                className="flex items-center gap-2.5 text-[13.5px]"
                style={{ color: "var(--ink-900)" }}
              >
                <Switch
                  checked={rule.status === "Active"}
                  disabled={!editable}
                  onCheckedChange={(on) => writeRule({ ...rule, status: on ? "Active" : "Draft" })}
                  aria-label="Active"
                />
                {rule.status === "Active" ? "Active" : "Draft"}
              </label>
              {editable && (
                <GhostButton onClick={() => setEditing(true)} className="flex items-center gap-1.5">
                  <Pencil size={13} /> Edit
                </GhostButton>
              )}
            </div>

            <div>
              <SectionTitle>Definition</SectionTitle>
              <dl className="space-y-2 text-[13.5px]" style={{ color: "var(--ink-900)" }}>
                <Row k="Allowed to fail" v={`${rule.threshold}% of rows`} />
                <Row k="Applies when" v={rule.appliesWhen || "Always"} />
              </dl>
            </div>

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
          </div>
        }
      />
      {editing && (
        <RuleEditor
          rule={rule}
          onClose={() => setEditing(false)}
          onSaved={(id) => {
            setEditing(false);
            if (id !== rule.id) go({ rule: id });
          }}
        />
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt style={{ color: "var(--ink-500)" }}>{k}</dt>
      <dd className="text-right">{v}</dd>
    </div>
  );
}
