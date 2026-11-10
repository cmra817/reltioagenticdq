import * as React from "react";
import { Copy, CopyPlus, Pause, Play, Plus, Search } from "lucide-react";
import { GhostButton, PrimaryButton, Tabs, Tag } from "@/components/workspace/primitives";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ME, RULE_TYPES, type Rule, type RuleScope, type RuleType } from "@/lib/mock-ops";
import { todayLabel, useRules } from "@/lib/ops-store";
import { useNavigate } from "@tanstack/react-router";
import { newChatId, useChatThreads } from "@/components/chat/chat-context";
import { useOpenRule } from "./open-rule";
import type { RulesSearch } from "./nav";

export function RulesScreen({ search }: { search: RulesSearch }) {
  return <RulesHome legacyRuleId={search.rule} />;
}

/** A small icon-only button. The tooltip names the action, and so does the accessible label. */
function IconAction({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-[color:var(--surface-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-blue)]"
          style={{ color: "var(--ink-700)" }}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

const TAB_SCOPE: Record<"yours" | "team" | "templates", RuleScope> = {
  yours: "Yours",
  team: "Team",
  templates: "Template",
};

function RulesHome({ legacyRuleId }: { legacyRuleId?: string }) {
  const openRule = useOpenRule();
  const navigate = useNavigate();
  const { createThread } = useChatThreads();
  const { rules, usedBy, addRule, writeRule } = useRules();
  const [confirmId, setConfirmId] = React.useState<string | null>(null);
  const [tab, setTab] = React.useState<"yours" | "team" | "templates">("yours");
  const [type, setType] = React.useState<"all" | RuleType>("all");
  const [query, setQuery] = React.useState("");

  // Old links to /rules?rule=… open that rule's thread.
  React.useEffect(() => {
    const target = legacyRuleId ? rules.find((r) => r.id === legacyRuleId) : undefined;
    if (target) openRule(target);
  }, [legacyRuleId, rules, openRule]);

  const visible = rules
    .filter((r) => r.scope === TAB_SCOPE[tab])
    .filter((r) => type === "all" || r.type === type)
    .filter(
      (r) => !query || `${r.name} ${r.description}`.toLowerCase().includes(query.toLowerCase()),
    );

  const count = (scope: RuleScope) => rules.filter((r) => r.scope === scope).length;

  /** A new rule is a new chat thread: create it, open it, and the starter message is already sent. */
  function newRule() {
    const id = newChatId();
    createThread({ id, title: "New rule", kind: "rule" });
    void navigate({ to: "/rule/$threadId", params: { threadId: id } });
  }

  function duplicate(r: Rule) {
    const copy: Rule = {
      ...r,
      id: `r-${Date.now()}`,
      name: `${r.name} (copy)`,
      scope: "Yours",
      owner: ME,
      status: "Draft",
      versions: [{ v: 1, author: ME, at: todayLabel(), note: `Duplicated from ${r.name}` }],
    };
    addRule(copy);
    openRule(copy);
  }

  function setStatus(r: Rule, status: Rule["status"]) {
    writeRule({ ...r, status });
    setConfirmId(null);
  }

  function startFromTemplate(t: Rule) {
    const copy: Rule = {
      ...t,
      id: `r-${Date.now()}`,
      scope: "Yours",
      owner: ME,
      status: "Draft",
      versions: [{ v: 1, author: ME, at: "Today", note: `Started from the ${t.name} template` }],
    };
    addRule(copy);
    openRule(copy);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pb-10 pt-5">
      <div className="mx-auto w-full max-w-[1040px]">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-[22px] font-semibold" style={{ color: "var(--ink-900)" }}>
            Rules
          </h1>
          <PrimaryButton onClick={newRule} className="ml-auto flex items-center gap-1.5">
            <Plus size={14} /> New rule
          </PrimaryButton>
        </div>
        <p className="mt-1 text-[13.5px]" style={{ color: "var(--ink-500)" }}>
          One shared library. A rule becomes a check when a task applies it to a table. Select a
          rule to see how it's doing and edit it, or describe a new one in chat.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Tabs
            label="Rule groups"
            value={tab}
            onChange={setTab}
            tabs={[
              { id: "yours", label: "Yours", hint: String(count("Yours")) },
              { id: "team", label: "Team", hint: String(count("Team")) },
              { id: "templates", label: "Templates", hint: String(count("Template")) },
            ]}
          />
          <label
            className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px]"
            style={{
              border: "1px solid var(--hairline)",
              background: "#fff",
              color: "var(--ink-700)",
            }}
          >
            <Search size={14} aria-hidden="true" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search rules"
              placeholder="Search rules"
              className="w-44 bg-transparent outline-none"
            />
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as "all" | RuleType)}
            aria-label="Filter by DQ dimension"
            className="rounded-lg px-2.5 py-1.5 text-[13px]"
            style={{
              border: "1px solid var(--hairline)",
              background: "#fff",
              color: "var(--ink-700)",
            }}
          >
            <option value="all">Any dimension</option>
            {RULE_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>

        {visible.length === 0 ? (
          <p className="mt-8 text-[14px]" style={{ color: "var(--ink-500)" }}>
            {tab === "yours"
              ? "You haven't written any rules yet. Use New rule and describe what should be true."
              : "No rules match."}
          </p>
        ) : (
          <div
            className="mt-4 overflow-x-auto rounded-xl border bg-white"
            style={{ borderColor: "var(--hairline)" }}
          >
            <TooltipProvider delayDuration={200}>
              <table className="w-full min-w-[900px] text-left text-[13.5px]">
                <thead>
                  <tr
                    style={{ color: "var(--ink-300)" }}
                    className="text-[11px] uppercase tracking-wide"
                  >
                    <th className="px-4 py-2.5 font-semibold">Rule</th>
                    <th className="px-3 py-2.5 font-semibold">DQ dimension</th>
                    <th className="px-3 py-2.5 font-semibold">Severity</th>
                    <th className="px-3 py-2.5 font-semibold">Owner</th>
                    <th className="px-3 py-2.5 font-semibold">Status</th>
                    <th className="px-3 py-2.5 font-semibold">Used in</th>
                    <th className="px-3 py-2.5 text-right font-semibold">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "var(--hairline)" }}>
                  {visible.map((r) => {
                    const used = usedBy(r.id).length;
                    const usedText = `${used} ${used === 1 ? "schedule" : "schedules"}`;
                    return (
                      <tr
                        key={r.id}
                        onClick={() => openRule(r)}
                        className="cursor-pointer hover:bg-[color:var(--surface-soft)]"
                      >
                        <td className="px-4 py-2.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openRule(r);
                            }}
                            className="text-left font-medium underline-offset-2 hover:underline"
                            style={{ color: "var(--ink-900)" }}
                          >
                            {r.name}
                          </button>
                        </td>
                        <td className="px-3 py-2.5">{r.type}</td>
                        <td className="px-3 py-2.5">{r.severity}</td>
                        <td className="px-3 py-2.5">{r.owner}</td>
                        <td className="px-3 py-2.5">
                          <Tag>{r.status}</Tag>
                        </td>
                        <td className="px-3 py-2.5" style={{ color: "var(--ink-500)" }}>
                          {used === 0 ? "Not used yet" : usedText}
                        </td>
                        <td className="px-3 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                          {tab === "templates" ? (
                            <IconAction label="Use template" onClick={() => startFromTemplate(r)}>
                              <CopyPlus size={16} aria-hidden="true" />
                            </IconAction>
                          ) : (
                            <Popover
                              open={confirmId === r.id}
                              onOpenChange={(open) => {
                                if (!open) setConfirmId(null);
                              }}
                            >
                              <PopoverAnchor asChild>
                                <span className="inline-flex gap-0.5">
                                  <IconAction label="Duplicate" onClick={() => duplicate(r)}>
                                    <Copy size={16} aria-hidden="true" />
                                  </IconAction>
                                  {r.status === "Active" ? (
                                    <IconAction
                                      label="Disable"
                                      onClick={() =>
                                        used > 0 ? setConfirmId(r.id) : setStatus(r, "Disabled")
                                      }
                                    >
                                      <Pause size={16} aria-hidden="true" />
                                    </IconAction>
                                  ) : (
                                    <IconAction
                                      label={r.status === "Draft" ? "Activate" : "Enable"}
                                      onClick={() => setStatus(r, "Active")}
                                    >
                                      <Play size={16} aria-hidden="true" />
                                    </IconAction>
                                  )}
                                </span>
                              </PopoverAnchor>
                              <PopoverContent
                                align="end"
                                className="w-64 p-3 text-left"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <p className="text-[13px]" style={{ color: "var(--ink-900)" }}>
                                  Used in {usedText}. Disable it?
                                </p>
                                <div className="mt-3 flex justify-end gap-2">
                                  <GhostButton onClick={() => setConfirmId(null)}>
                                    Cancel
                                  </GhostButton>
                                  <PrimaryButton onClick={() => setStatus(r, "Disabled")}>
                                    Disable
                                  </PrimaryButton>
                                </div>
                              </PopoverContent>
                            </Popover>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </TooltipProvider>
          </div>
        )}
      </div>
    </div>
  );
}
