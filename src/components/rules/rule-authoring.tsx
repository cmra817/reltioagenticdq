import * as React from "react";
import { ArrowLeft } from "lucide-react";
import {
  GhostButton,
  PrimaryButton,
  ScopedChat,
  SectionTitle,
  SplitWorkspace,
  Tag,
} from "@/components/workspace/primitives";
import { ME, SEVERITIES, type Rule, type RuleType, type Severity } from "@/lib/mock-ops";
import { useRules } from "@/lib/ops-store";
import { useRulesNav } from "./nav";
import { describeTest, testRule } from "./rule-test";

function detectType(t: string): RuleType {
  if (/duplicate|unique/i.test(t)) return "Uniqueness";
  if (/null|missing|empty|blank|required|filled/i.test(t)) return "Completeness";
  if (/late|fresh|stale|arriv|refresh|delay/i.test(t)) return "Freshness";
  if (/match|reconcil|consisten|same as|agree/i.test(t)) return "Consistency";
  return "Validity";
}

function nameFrom(text: string): string {
  const cleaned = text
    .replace(/^(please\s+)?(check|make sure|ensure|verify)( that)?\s+/i, "")
    .replace(/[.!?]+$/, "")
    .trim();
  const short = cleaned.length > 60 ? `${cleaned.slice(0, 57)}…` : cleaned;
  return short.charAt(0).toUpperCase() + short.slice(1);
}

function draftFrom(text: string): Rule {
  return {
    id: `r-${Date.now()}`,
    name: nameFrom(text),
    description: text.trim().replace(/^./, (c) => c.toUpperCase()),
    type: detectType(text),
    severity: "Medium",
    owner: ME,
    status: "Draft",
    scope: "Yours",
    threshold: 0,
    appliesWhen: "",
    versions: [],
  };
}

/**
 * Creating a rule happens in chat. The agent drafts it from a plain-language
 * description, tests it on real data from the last run, and the person saves
 * it. There is no approval step.
 */
export function RuleAuthoring() {
  const go = useRulesNav();
  const { addRule } = useRules();
  const [draft, setDraft] = React.useState<Rule | null>(null);

  function reply(q: string): string {
    if (draft && /severity|critical|high|low|medium/i.test(q) && q.length < 60) {
      const sev = (SEVERITIES.find((s) => new RegExp(s, "i").test(q)) ?? "Medium") as Severity;
      setDraft({ ...draft, severity: sev });
      return `Set severity to ${sev}.`;
    }
    if (draft && /allow|tolerat|percent|%|threshold/i.test(q)) {
      const n = Number.parseFloat(q.match(/(\d+(\.\d+)?)/)?.[1] ?? "");
      if (!Number.isNaN(n)) {
        const next = { ...draft, threshold: n };
        setDraft(next);
        return `Allowed ${n}% of rows to fail. ${describeTest(testRule(next), n)}`;
      }
    }
    const next = draftFrom(q);
    setDraft(next);
    return `I drafted "${next.name}" as a ${next.type.toLowerCase()} rule. ${describeTest(testRule(next), next.threshold)}\n\nTell me to change severity or how many rows may fail, or save it from the panel.`;
  }

  function save(status: Rule["status"]) {
    if (!draft) return;
    const rule: Rule = {
      ...draft,
      status,
      versions: [{ v: 1, author: ME, at: "Today", note: "Created in chat" }],
    };
    addRule(rule);
    go({ rule: rule.id });
  }

  const test = draft ? testRule(draft) : null;

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
        panelLabel="Rule draft"
        panelWidth={380}
        center={
          <ScopedChat
            scopeLabel="New rule"
            placeholder="Describe what should be true…"
            suggestions={[
              "Order totals are never negative",
              "No two customers share the same email",
              "Shipments arrive within 6 hours",
            ]}
            reply={reply}
            header={
              <section aria-label="New rule">
                <h1 className="text-[20px] font-semibold" style={{ color: "var(--ink-900)" }}>
                  New rule
                </h1>
                <p className="mt-2 text-[14px] leading-relaxed" style={{ color: "var(--ink-700)" }}>
                  Say what should be true about your data. I'll draft the rule, test it on rows from
                  the last run, and you decide whether to save it.
                </p>
              </section>
            }
          />
        }
        panel={
          <div className="space-y-6 p-5">
            {!draft || !test ? (
              <p className="text-[13.5px]" style={{ color: "var(--ink-500)" }}>
                Your draft appears here once you describe a rule.
              </p>
            ) : (
              <>
                <div>
                  <SectionTitle>Draft</SectionTitle>
                  <label className="block text-[13px]">
                    <span className="sr-only">Rule name</span>
                    <input
                      value={draft.name}
                      onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                      className="w-full rounded-lg px-3 py-2 text-[14px] font-semibold"
                      style={{
                        border: "1px solid var(--hairline)",
                        background: "#fff",
                        color: "var(--ink-900)",
                      }}
                    />
                  </label>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Tag>{draft.type}</Tag>
                    <Tag>{draft.severity} severity</Tag>
                    <Tag>Allows {draft.threshold}% to fail</Tag>
                  </div>
                  <p className="mt-3 text-[13.5px]" style={{ color: "var(--ink-700)" }}>
                    {draft.description}
                  </p>
                </div>

                <div>
                  <SectionTitle>Tested on real data</SectionTitle>
                  <div
                    className="rounded-xl border bg-white p-3.5 text-[13.5px]"
                    style={{ borderColor: "var(--hairline)", color: "var(--ink-700)" }}
                  >
                    {describeTest(test, draft.threshold)}
                  </div>
                </div>

                <div className="flex gap-2">
                  <PrimaryButton onClick={() => save("Active")} disabled={!draft.name.trim()}>
                    Save rule
                  </PrimaryButton>
                  <GhostButton onClick={() => save("Draft")} disabled={!draft.name.trim()}>
                    Save as draft
                  </GhostButton>
                </div>
              </>
            )}
          </div>
        }
      />
    </div>
  );
}
