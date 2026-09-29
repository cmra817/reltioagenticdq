import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp, Check as CheckIcon, ChevronDown, Loader2, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { DimensionBadge } from "../dq-dimensions";
import { SourceLogo } from "@/components/explore-screen";
import { Stepper } from "../add-dataset/Stepper";
import { Step1SelectData } from "../add-dataset/Step1SelectData";
import { Step2ApplyChecks } from "../add-dataset/Step2ApplyChecks";
import { Step3Schedule } from "../add-dataset/Step3Schedule";
import { generateChecks, type Check } from "../add-dataset/mock-checks";
import type { AddDatasetCompletion } from "../add-dataset/AddDatasetModal";
import {
  ALL_ASSETS,
  EMPTY_PLAN,
  RECOMMENDED_SCHEDULE,
  RECOMMENDED_TZ,
  TIME_ZONES,
  buildAssets,
  checkTotal,
  checkRationale,
  assetOf,
  keptChecks,
  dimensionsInUse,
  formatRowCount,
  observations,
  totalRows,
  finalize,
  scheduleLabel,
  tableName,
  withTables,
  withoutTables,
  type Plan,
} from "./plan-state";
import {
  CONFIRM_WORDS,
  EXAMPLES,
  PROPOSAL_CHIPS,
  PROPOSAL_YES,
  Q_TABLES,
  UNSUPPORTED_WAREHOUSES,
  APPLY_CHIPS,
  WANTS_NEW_CHECK,
  draftRule,
  findSchema,
  findTables,
  parseSchedule,
  parseTimeZone,
  type Question,
} from "./agent-script";


type Section = "select" | "checks" | "schedule";
type Msg = {
  id: number;
  role: "user" | "agent" | "note";
  text: string;
  question?: Question;
  undo?: boolean;
  showMe?: Section;
  showKeys?: string[];
  chips?: string[];
};
type Flash = { keys?: Set<string>; ids?: Set<string>; focusKey?: string } | null;
type CreateFlow = { stage: "describe" | "target" | "choose"; rule?: Check } | null;

let MID = 0;
const mid = () => ++MID;

function useNarrow() {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const f = () => setNarrow(window.innerWidth < 900);
    f();
    window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, []);
  return narrow;
}

export function AgenticAddAssetModal({
  open,
  onOpenChange,
  domainName,
  onComplete,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  domainName?: string;
  onComplete?: (r: AddDatasetCompletion) => void;
}) {
  const [mode, setMode] = useState<"chat" | "plan" | "manual">("chat");
  const [openSection, setOpenSection] = useState<Section | null>(null);
  const [rowFlash, setRowFlash] = useState<Flash>(null);
  const [cc, setCc] = useState<CreateFlow>(null);
  const [manualStep, setManualStep] = useState(0);
  const [plan, setPlanRaw] = useState<Plan>(EMPTY_PLAN);
  const [history, setHistory] = useState<Plan[]>([]);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [queue, setQueue] = useState<Question[]>([]);
  const [proposal, setProposal] = useState<Plan | null>(null);

  const [thinking, setThinking] = useState(false);
  const [filled, setFilled] = useState(3);
  const [flash, setFlash] = useState<Section | "confirm" | null>(null);
  const [railOpen, setRailOpen] = useState(true);
  const [tab, setTab] = useState<"chat" | "plan">("chat");
  const [input, setInput] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const narrow = useNarrow();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) {
      setMode("chat");
      setOpenSection(null);
      setRowFlash(null);
      setCc(null);
      setManualStep(0);
      setPlanRaw(EMPTY_PLAN);
      setHistory([]);
      setMsgs([]);
      setQueue([]);
      setProposal(null);

      setThinking(false);
      setFilled(3);
      setDone(null);
      setInput("");
    }
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, thinking]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onOpenChange(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const selectedSet = useMemo(() => new Set(plan.selected), [plan.selected]);
  const checkedSets = useMemo(() => {
    const r: Record<string, Set<string>> = {};
    for (const k of plan.selected) r[k] = new Set(plan.checked[k] ?? []);
    return r;
  }, [plan.selected, plan.checked]);

  if (!open) return null;

  const push = (...m: Omit<Msg, "id">[]) => setMsgs((prev) => [...prev, ...m.map((x) => ({ ...x, id: mid() }))]);
  const pulse = (s: Section | "confirm") => {
    setFlash(s);
    window.setTimeout(() => setFlash(null), 1400);
  };
  /** Change the plan from chat (undoable). */
  const flashRows = (f: Flash) => {
    setRowFlash(f);
    window.setTimeout(() => setRowFlash((cur) => (cur === f ? null : cur)), 2000);
  };
  const chatChange = (next: Plan, line: string, section: Section, f?: Flash) => {
    setHistory((h) => [...h, plan]);
    setPlanRaw(next);
    if (mode !== "manual") setOpenSection(section);
    else setManualStep(section === "select" ? 0 : section === "checks" ? 1 : 2);
    pulse(section);
    if (f) flashRows(f);
    push({ role: "agent", text: line, undo: true });
  };
  const undo = () => {
    const prev = history[history.length - 1];
    if (!prev) return push({ role: "agent", text: "There's nothing to undo." });
    setHistory((h) => h.slice(0, -1));
    setPlanRaw(prev);
    push({ role: "note", text: "Undone." });
  };
  /** Change the plan from the workspace; tell the chat neutrally. */
  const workspaceChange = (next: Plan, line?: string) => {
    setHistory((h) => [...h, plan]);
    setPlanRaw(next);
    if (line) push({ role: "note", text: line });
  };

  const agentSay = (fn: () => void, ms = 700) => {
    setThinking(true);
    window.setTimeout(() => {
      setThinking(false);
      fn();
    }, ms);
  };

  const startDrafting = (p: Plan, given: { schedule: boolean; tz: boolean } = { schedule: false, tz: false }) => {
    const final = { ...p, timeZone: p.timeZone ?? RECOMMENDED_TZ, profiling: p.profiling ?? RECOMMENDED_SCHEDULE, checks: p.checks ?? p.profiling ?? RECOMMENDED_SCHEDULE };
    setPlanRaw(final);
    setMode("plan");
    setTab("plan");
    setFilled(0);
    const order: Section[] = ["select", "checks", "schedule"];
    order.forEach((sec, i) => {
      window.setTimeout(() => setOpenSection(sec), 800 * i);
      window.setTimeout(() => setFilled(i + 1), 800 * i + 650);
    });
    window.setTimeout(() => {
      setOpenSection(null);
      const whs = Array.from(new Set(final.selected.map((k) => assetOf(k).conn?.warehouse ?? ""))).filter(Boolean);
      const dims = dimensionsInUse(final).map((d) => d.toLowerCase());
      const dimText = dims.length > 1 ? `${dims.slice(0, -1).join(", ")} and ${dims[dims.length - 1]}` : dims[0] ?? "the recommended checks";
      const n = final.selected.length;
      const defaulted = [!given.schedule && "schedule", !given.tz && "time zone"].filter(Boolean) as string[];
      let text = `I'm monitoring ${n} ${n === 1 ? "table" : "tables"} in ${whs.join(" and ")} for ${dimText}, ${scheduleLabel(final.profiling, final.timeZone).replace(/^D/, "d").replace(/^W/, "w")}.`;
      if (defaulted.length) text += ` I used the recommended ${defaulted.join(" and ")}.`;
      push({ role: "agent", text });
      const why = checkRationale(final).slice(0, 3);
      if (why.length)
        push({
          role: "agent",
          text:
            `I included the recommended checks based on what the columns already look like:\n` +
            why
              .map((r) => `**${r.dimension}** on ${r.columns.map((c) => `\`${c}\``).join(", ")} — ${r.why}.`)
              .join("\n"),
          showMe: "checks",
        });
      observations(final).forEach((o) =>
        push({ role: "agent", text: o.text, showMe: o.text.includes("uniqueness") ? "checks" : "select", showKeys: o.keys }),
      );
      push({ role: "agent", text: "Open any section on the right to change a threshold or drop a check, or just tell me here." });
    }, 800 * 3 + 200);
  };

  /** State the plan in plain language and wait for a yes before drafting. */
  const proposeText = (p: Plan) => {
    const names = p.selected.map(tableName);
    const whs = Array.from(new Set(p.selected.map((k) => assetOf(k).conn?.warehouse).filter(Boolean))) as string[];
    const schemas = Array.from(new Set(p.selected.map((k) => k.split("::")[1])));
    const dims = dimensionsInUse(p);
    const sched = scheduleLabel(p.profiling ?? RECOMMENDED_SCHEDULE, p.timeZone ?? RECOMMENDED_TZ);
    return (
      `Here's what I'd set up:\n` +
      `**Tables (${names.length})** ${names.map((n) => `\`${n}\``).join(", ")} — ${whs.join(", ")} · ${schemas.join(", ")}\n` +
      `**Checks** Recommended for each table — ${dims.join(", ")} (${checkTotal(p)} in total)\n` +
      `**Schedule** ${sched}${p.profiling ? "" : " (recommended)"}\n` +
      `Does that look right, or should I change something first?`
    );
  };

  const propose = (p: Plan) => {
    setProposal(p);
    push({ role: "agent", text: proposeText(p), chips: PROPOSAL_CHIPS });
  };

  const proposalReply = (text: string) => {
    push({ role: "user", text });
    const t = text.toLowerCase().trim();
    const base = proposal ?? plan;
    agentSay(() => {
      if (PROPOSAL_YES.test(t)) {
        setProposal(null);
        push({ role: "agent", text: "Setting it up now." });
        return startDrafting(base, { schedule: !!base.profiling, tz: !!base.timeZone });
      }
      if (/^change the schedule/.test(t))
        return push({ role: "agent", text: "How often should it run, and at what time? For example \"weekly on Monday at 7am\"." });
      if (/^add more tables/.test(t))
        return push({ role: "agent", text: "Which tables should I add? Name them, or name a schema and I'll take everything in it." });

      let p = base;
      const changed: string[] = [];
      const sched = parseSchedule(text);
      const tz = parseTimeZone(text);
      if (sched) {
        p = { ...p, profiling: sched, checks: sched };
        changed.push("schedule");
      }
      if (tz) {
        p = { ...p, timeZone: tz };
        changed.push("time zone");
      }
      const removing = /\b(remove|drop|delete|exclude|without)\b/.test(t);
      const schema = /schema|everything in|all of/.test(t) ? findSchema(t) : null;
      const tables = schema ? ALL_ASSETS.filter((a) => a.schema === schema) : ALL_ASSETS.filter((a) => t.includes(a.name.toLowerCase()));
      if (tables.length) {
        const keys = tables.map((a) => a.key);
        p = removing ? withoutTables(p, keys) : withTables(p, keys);
        changed.push("tables");
      }
      if (!changed.length)
        return push({
          role: "agent",
          text: "I can change the tables, the schedule or the time zone before I draft anything. Otherwise say yes and I'll build it.",
          chips: PROPOSAL_CHIPS,
        });
      setProposal(p);
      push({ role: "agent", text: `Updated the ${changed.join(" and ")}.\n` + proposeText(p), chips: PROPOSAL_CHIPS });
    });
  };

  const askNext = (q: Question[], p: Plan) => {
    if (q.length === 0) return propose(p);
    setQueue(q);
    push({ role: "agent", text: q[0].text, question: q[0] });
  };



  const applyAnswer = (q: Question, answer: string, p: Plan): Plan => {
    const a = answer.toLowerCase();
    if (q.id === "tables") {
      let found = findTables(answer);
      if (!found.length) found = ALL_ASSETS.filter((x) => x.name === "dim_customers" || x.name === "fct_orders_daily");
      return withTables(p, found.map((f) => f.key));
    }
    if (q.id === "checks") {
      if (/null|unique|only/.test(a)) {
        const checked: Record<string, string[]> = {};
        for (const k of p.selected)
          checked[k] = generateChecks(tableName(k))
            .filter((c) => c.dimension === "Completeness" || c.dimension === "Uniqueness")
            .map((c) => c.id);
        return { ...p, checked };
      }
      return p;
    }
    if (q.id === "schedule") {
      const s = parseSchedule(answer) ?? RECOMMENDED_SCHEDULE;
      return { ...p, profiling: s, checks: s, linked: true };
    }
    return { ...p, timeZone: parseTimeZone(answer) ?? RECOMMENDED_TZ };
  };

  const answerQuestion = (answer: string) => {
    const [q, ...rest] = queue;
    push({ role: "user", text: answer });
    if (/use the recommended/i.test(answer)) {
      let p = plan;
      for (const qq of queue) p = applyAnswer(qq, qq.options.find((o) => o.recommended)!.label, p);
      setQueue([]);
      agentSay(() => propose(p));
      return;
    }
    const p = applyAnswer(q, answer, plan);
    setPlanRaw(p);
    let nextQ = rest;
    if (q.id === "tables") {
      const n = p.selected.length;
      agentSay(() => {
        push({ role: "agent", text: `Found ${n} ${n === 1 ? "table" : "tables"}: ${p.selected.map(tableName).join(", ")}.` });
        askNext(nextQ, p);
      });
      return;
    }
    agentSay(() => askNext(nextQ, p), 450);
  };

  const firstMessage = (text: string) => {
    push({ role: "user", text });
    const low = text.toLowerCase();
    const missingWh = UNSUPPORTED_WAREHOUSES.find((w) => low.includes(w));
    const found = findTables(text);
    let p = found.length ? withTables(EMPTY_PLAN, found.map((f) => f.key)) : EMPTY_PLAN;
    const sched = parseSchedule(text);
    if (sched) p = { ...p, profiling: sched, checks: sched };
    const tz = parseTimeZone(text);
    if (tz) p = { ...p, timeZone: tz };
    setPlanRaw(p);
    // No questions about checks, schedule, or time zone — the plan uses the
    // recommended checks and schedule by default. Only ask when the tables
    // themselves couldn't be identified.
    const qs: Question[] = [];
    if (!found.length) qs.push(Q_TABLES);
    agentSay(() => {
      if (missingWh)
        push({
          role: "agent",
          text: `You don't have a ${missingWh[0].toUpperCase() + missingWh.slice(1)} connection yet. You can connect one from Explore; for now I'll look in your connected warehouses.`,
        });
      askNext(qs, p);
    }, 900);
  };

  const applyRule = (rule: Check, keys: string[]) => {
    let next = plan;
    const ids = new Set<string>();
    for (const k of keys) {
      const c = { ...rule, id: `${rule.id}-${k}` };
      ids.add(c.id);
      next = {
        ...next,
        customChecks: { ...next.customChecks, [k]: [...(next.customChecks[k] ?? []), c] },
        checked: { ...next.checked, [k]: [...(next.checked[k] ?? []), c.id] },
      };
    }
    setCc(null);
    chatChange(next, `Added "${rule.rule}" to ${keys.length === 1 ? tableName(keys[0]) : `${keys.length} tables`}.`, "checks", { ids, focusKey: keys[0] });
  };

  const createFlow = (text: string, t: string) => {
    if (!cc) return false;
    if (cc.stage === "describe") {
      const rule = draftRule(t);
      if (!rule) {
        push({ role: "agent", text: "Which column should it look at, and what should be true about it? For example \"email is never empty\" or \"amount is between 0 and 10000\"." });
        return true;
      }
      setCc({ stage: "target", rule });
      push({
        role: "agent",
        text: `Here's the rule: **${rule.rule}** (${rule.dimension}). Expectation \`${rule.expectation}\`, pattern \`${rule.pattern}\`, fails if more than ${rule.threshold}% of values don't match. I tested it against a sample and it runs. Where should I apply it?`,
        chips: APPLY_CHIPS,
      });
      return true;
    }
    if (cc.stage === "target" && cc.rule) {
      const named = plan.selected.filter((k) => t.includes(tableName(k).toLowerCase()));
      if (/all/.test(t)) applyRule(cc.rule, plan.selected);
      else if (named.length) applyRule(cc.rule, named);
      else if (/choose|pick|select/.test(t)) {
        setCc({ ...cc, stage: "choose" });
        push({ role: "agent", text: "Which tables?", chips: plan.selected.map(tableName) });
      } else {
        const col = cc.rule.field;
        const withCol = plan.selected.find((k) => keptChecks(plan, k).some((c) => (c.fields ?? [c.field]).includes(col))) ?? plan.selected[0];
        applyRule(cc.rule, [withCol]);
      }
      return true;
    }
    if (cc.stage === "choose" && cc.rule) {
      const named = plan.selected.filter((k) => t.includes(tableName(k).toLowerCase()));
      if (!named.length) {
        push({ role: "agent", text: "I didn't catch a table from the plan. Pick one below.", chips: plan.selected.map(tableName) });
        return true;
      }
      applyRule(cc.rule, named);
      return true;
    }
    return false;
  };

  const command = (text: string) => {
    push({ role: "user", text });
    const t = text.toLowerCase().trim();
    agentSay(() => {
      if (createFlow(text, t)) return;
      if (WANTS_NEW_CHECK.test(t) && !/(null|unique)[^.]*check/.test(t)) {
        if (!plan.selected.length) return push({ role: "agent", text: "Add a table first, then I'll create the check for it." });
        const rule = draftRule(t);
        if (rule) {
          setCc({ stage: "target", rule });
          return push({
            role: "agent",
            text: `Here's the rule: **${rule.rule}** (${rule.dimension}). Expectation \`${rule.expectation}\`, pattern \`${rule.pattern}\`, fails if more than ${rule.threshold}% of values don't match. I tested it against a sample and it runs. Where should I apply it?`,
            chips: APPLY_CHIPS,
          });
        }
        setCc({ stage: "describe" });
        return push({ role: "agent", text: "Sure. What should the check verify? Name the column and what should be true about it." });
      }
      if (CONFIRM_WORDS.test(t)) {
        pulse("confirm");
        return push({ role: "agent", text: "Only the Confirm button creates it — it's highlighted at the bottom right." });
      }
      if (/^undo\b/.test(t)) return undo();
      const removing = /\b(remove|drop|delete|exclude|without)\b/.test(t);
      const adding = /\b(add|include|also|plus|monitor|watch)\b/.test(t);
      const schema = /schema|everything in|all of/.test(t) ? findSchema(t) : null;
      const tables = schema
        ? ALL_ASSETS.filter((a) => a.schema === schema)
        : ALL_ASSETS.filter((a) => t.includes(a.name.toLowerCase()));
      const checkWord = /(null|unique|format|freshness)[^.]*check|check[^.]*(null|unique)/.test(t);
      if (checkWord && (adding || removing)) {
        const col = t.match(/on ([a-z_]+)/)?.[1] ?? "id";
        const key = plan.selected[0];
        if (!key) return push({ role: "agent", text: "Add a table first, then I can add checks to it." });
        if (removing) {
          const ids = (plan.checked[key] ?? []).filter((id) => !id.includes(col));
          return chatChange({ ...plan, checked: { ...plan.checked, [key]: ids } }, `Removed checks on ${col} from ${tableName(key)}.`, "checks");
        }
        const isNull = /null/.test(t);
        const c: Check = {
          id: `chat-${Date.now()}`,
          rule: `${col} ${isNull ? "is not null" : "is unique"}`,
          description: isNull ? `Every row must have a ${col}` : `${col} values must not repeat`,
          dimension: isNull ? "Completeness" : "Uniqueness",
          field: col,
          creator: { kind: "reltio" },
        };
        return chatChange(
          {
            ...plan,
            customChecks: { ...plan.customChecks, [key]: [...(plan.customChecks[key] ?? []), c] },
            checked: { ...plan.checked, [key]: [...(plan.checked[key] ?? []), c.id] },
          },
          `Added "${c.rule}" to ${tableName(key)}.`,
          "checks",
          { ids: new Set([c.id]), focusKey: key },
        );
      }
      if (tables.length && removing) {
        const keys = tables.map((a) => a.key).filter((k) => selectedSet.has(k));
        return chatChange(withoutTables(plan, keys), `Removed ${keys.length} ${keys.length === 1 ? "table" : "tables"}${schema ? ` from ${schema}` : ""}.`, "select");
      }
      if (tables.length) {
        const keys = tables.map((a) => a.key).filter((k) => !selectedSet.has(k));
        if (!keys.length) return push({ role: "agent", text: "Those are already in the plan." });
        return chatChange(withTables(plan, keys), `Added ${keys.length} ${keys.length === 1 ? "table" : "tables"}: ${keys.map(tableName).join(", ")}.`, "select", { keys: new Set(keys) });
      }
      const sched = parseSchedule(t);
      const tz = parseTimeZone(text);
      if (sched || tz) {
        const next: Plan = {
          ...plan,
          ...(sched ? (/check/.test(t) && !/profil/.test(t) ? { checks: sched, linked: false } : { profiling: sched, checks: plan.linked ? sched : plan.checks }) : {}),
          ...(tz ? { timeZone: tz } : {}),
        };
        return chatChange(next, `Schedule is now ${scheduleLabel(next.profiling, next.timeZone)}.`, "schedule");
      }
      if (/which|what|missing|unused|stale/.test(t)) {
        return push({
          role: "agent",
          text: "I can't rank tables by usage from here. The closest I can do is open the table list so you can add or remove them directly.",
          showMe: "select",
        });
      }
      push({
        role: "agent",
        text: "I'm not sure what to change from that. I can't answer general data questions in this setup, but if you name a table, a check or a schedule I'll update the plan.",
      });
    });
  };

  const send = (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text || thinking) return;
    setInput("");
    if (mode === "chat" && msgs.length === 0) firstMessage(text);
    else if (queue.length) answerQuestion(text);
    else if (proposal) proposalReply(text);
    else command(text);

    inputRef.current?.focus();
  };

  const confirm = () => {
    const { plan: final, defaults } = finalize(plan);
    const result = buildAssets(final, domainName ?? "");
    onComplete?.(result);
    setDone(
      `Created ${result.tables.length} ${result.tables.length === 1 ? "asset" : "assets"} with ${result.checkCount} checks.` +
        (defaults.length ? ` Defaults applied — ${defaults.join("; ")}.` : ""),
    );
    window.setTimeout(() => onOpenChange(false), 2600);
  };

  const openManual = () => {
    setMode("manual");
    setManualStep(0);
    setTab("plan");
    push({ role: "note", text: "Setting it up step by step. Ask me anything along the way." });
  };

  const showMe = (s: Section, keys?: string[]) => {
    if (mode === "manual") setManualStep(s === "select" ? 0 : s === "checks" ? 1 : 2);
    else setOpenSection(s);
    setTab("plan");
    pulse(s);
    if (keys?.length) flashRows(s === "select" ? { keys: new Set(keys) } : { focusKey: keys[0] });
  };

  // ---- Step screens wired to the plan ----
  const renderStep = (s: Section) => {
    if (s === "select")
      return (
        <Step1SelectData
          selected={selectedSet}
          flashKeys={rowFlash?.keys}
          onToggle={(key) =>
            selectedSet.has(key)
              ? workspaceChange(withoutTables(plan, [key]), `You removed ${tableName(key)}.`)
              : workspaceChange(withTables(plan, [key]), `You added ${tableName(key)}.`)
          }
          onClear={() => workspaceChange(withoutTables(plan, plan.selected), `You removed ${plan.selected.length} tables.`)}
        />
      );
    if (s === "checks")
      return (
        <Step2ApplyChecks
          selected={selectedSet}
          checked={checkedSets}
          customChecks={plan.customChecks}
          flashIds={rowFlash?.ids}
          focusKey={rowFlash?.focusKey}
          onToggleCheck={(key, id) => {
            const cur = plan.checked[key] ?? [];
            const on = cur.includes(id);
            workspaceChange(
              { ...plan, checked: { ...plan.checked, [key]: on ? cur.filter((x) => x !== id) : [...cur, id] } },
              `You ${on ? "turned off" : "turned on"} a check on ${tableName(key)}.`,
            );
          }}
          onAddCheck={(key, c) =>
            workspaceChange(
              {
                ...plan,
                customChecks: { ...plan.customChecks, [key]: [...(plan.customChecks[key] ?? []), c] },
                checked: { ...plan.checked, [key]: [...(plan.checked[key] ?? []), c.id] },
              },
              `You added "${c.rule}" to ${tableName(key)}.`,
            )
          }
        />
      );
    return (
      <div>
        <Step3Schedule
          checkCount={checkTotal(plan)}
          profiling={plan.profiling ?? RECOMMENDED_SCHEDULE}
          checks={plan.checks ?? RECOMMENDED_SCHEDULE}
          onChangeProfiling={(c) => workspaceChange({ ...plan, profiling: c, checks: plan.linked ? c : plan.checks }, "You changed the profiling schedule.")}
          onChangeChecks={(c) => workspaceChange({ ...plan, checks: c, linked: false }, "You changed the DQ checks schedule.")}
        />
        <div className="mx-auto -mt-4 max-w-[960px] px-10 pb-10">
          <label className="flex max-w-[260px] flex-col gap-1.5 text-[13px] font-medium" style={{ color: "var(--ink-700)" }}>
            Time zone
            <select
              value={plan.timeZone ?? ""}
              onChange={(e) => workspaceChange({ ...plan, timeZone: e.target.value || null }, `You set the time zone to ${e.target.value}.`)}
              className="h-10 rounded-lg border bg-white px-3 text-[14px]"
              style={{ borderColor: "var(--hairline)", color: "var(--ink-900)" }}
            >
              <option value="">Not set</option>
              {TIME_ZONES.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    );
  };

  // ---- Chat UI ----
  const lastQuestionId = [...msgs].reverse().find((m) => m.question)?.id;
  const lastChipsId = [...msgs].reverse().find((m) => m.chips)?.id;
  const chatBody = (
    <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-5">
      <div className="mx-auto flex max-w-[720px] flex-col gap-3">
        {msgs.map((m) => (
          <div key={m.id} className={m.role === "user" ? "flex justify-end" : ""}>
            {m.role === "note" ? (
              <p className="text-center text-[12px]" style={{ color: "var(--ink-500)" }}>
                {m.text}
              </p>
            ) : (
              <div
                className={m.role === "user" ? "max-w-[85%] rounded-2xl px-3.5 py-2 text-[14px]" : "whitespace-pre-line text-[14px] leading-relaxed"}
                style={m.role === "user" ? { background: "var(--surface-soft)", color: "var(--ink-900)" } : { color: "var(--ink-900)" }}
              >
                <RichText text={m.text} />
                {(m.undo || m.showMe) && (
                  <span className="ml-2 inline-flex gap-2 text-[13px]">
                    {m.undo && (
                      <button className="underline" style={{ color: "var(--brand-blue)" }} onClick={undo}>
                        Undo
                      </button>
                    )}
                    {m.showMe && (
                      <button className="underline" style={{ color: "var(--brand-blue)" }} onClick={() => showMe(m.showMe!, m.showKeys)}>
                        Show me
                      </button>
                    )}
                  </span>
                )}
                {m.chips && m.id === lastChipsId && (cc || proposal) && (
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {m.chips.map((c) => (
                      <button
                        key={c}
                        onClick={() => send(c)}
                        className="rounded-full border px-3 py-1.5 text-[13px] transition-colors hover:bg-[color:var(--surface-soft)]"
                        style={{ borderColor: "var(--hairline)", color: "var(--ink-900)" }}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}
                {m.question && m.id === lastQuestionId && queue.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {m.question.options.map((o) => (
                      <button
                        key={o.label}
                        onClick={() => send(o.label)}
                        className="rounded-full border px-3 py-1.5 text-[13px] transition-colors hover:bg-[color:var(--surface-soft)]"
                        style={{ borderColor: o.recommended ? "var(--brand-blue)" : "var(--hairline)", color: "var(--ink-900)" }}
                      >
                        {o.label}
                        {o.recommended && (
                          <span className="ml-1.5 text-[11px] font-medium" style={{ color: "var(--brand-blue)" }}>
                            Recommended
                          </span>
                        )}
                      </button>
                    ))}
                    {queue.length > 1 && (
                      <button
                        onClick={() => send("Use the recommended answers")}
                        className="rounded-full px-3 py-1.5 text-[13px] font-medium"
                        style={{ background: "rgba(67,134,250,0.10)", color: "var(--brand-blue)" }}
                      >
                        Use the recommended answers
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {thinking && (
          <div className="flex items-center gap-2 text-[13px]" style={{ color: "var(--ink-500)" }}>
            <Loader2 size={14} className="animate-spin" /> Looking that up…
          </div>
        )}
      </div>
    </div>
  );

  const composer = (placeholder: string) => (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        send();
      }}
      className="relative rounded-2xl border bg-white p-2"
      style={{ borderColor: "#E3E3F2" }}
    >
      <textarea
        ref={inputRef}
        autoFocus
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
          }
        }}
        rows={2}
        placeholder={placeholder}
        className="w-full resize-none bg-transparent px-2 py-1 pr-10 text-[14px] outline-none"
        style={{ color: "var(--ink-900)" }}
      />
      <button
        type="submit"
        aria-label="Send"
        className="absolute bottom-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-full text-white"
        style={{ background: "var(--brand-blue)", opacity: input.trim() ? 1 : 0.5 }}
      >
        <ArrowUp size={16} />
      </button>
    </form>
  );

  const header = (
    <header className="flex h-14 shrink-0 items-center justify-between border-b bg-white px-5" style={{ borderColor: "var(--hairline)" }}>
      <div className="flex items-center gap-2 text-[15px] font-semibold" style={{ color: "var(--ink-900)" }}>
        Add data asset
        {domainName && (
          <span className="text-[12px] font-medium" style={{ color: "var(--ink-500)" }}>
            · {domainName}
          </span>
        )}
      </div>
      <button aria-label="Close" onClick={() => onOpenChange(false)} className="rounded-full p-2 hover:bg-[color:var(--surface-soft)]">
        <X size={18} />
      </button>
    </header>
  );

  // ---- First load: chat only ----
  if (mode === "chat" && msgs.length === 0) {
    return (
      <div className="fixed inset-0 z-[60] flex flex-col" style={{ background: "var(--canvas)" }} role="dialog" aria-modal="true" aria-label="Add data asset">
        {header}
        <div className="flex flex-1 items-center justify-center px-6">
          <div className="w-full max-w-[680px]">
            <h1 className="mb-2 text-center text-[28px] font-semibold" style={{ color: "var(--ink-900)" }}>
              What data should we start watching?
            </h1>
            <p className="mb-6 text-center text-[14px]" style={{ color: "var(--ink-500)" }}>
              Tell me the connection, tables, checks and schedule in a sentence or two. I'll draft the plan.
            </p>
            {composer("Monitor dim_customers in Databricks, daily at 6pm…")}
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {EXAMPLES.map((e) => (
                <button
                  key={e}
                  onClick={() => send(e)}
                  className="rounded-full border bg-white px-3 py-1.5 text-[13px] hover:bg-[color:var(--surface-soft)]"
                  style={{ borderColor: "var(--hairline)", color: "var(--ink-700)" }}
                >
                  {e}
                </button>
              ))}
            </div>
            <div className="mt-6 text-center">
              <button onClick={openManual} className="text-[13px] underline" style={{ color: "var(--ink-500)" }}>
                Set it up step by step
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---- Conversation before drafting ----
  if (mode === "chat") {
    return (
      <div className="fixed inset-0 z-[60] flex flex-col" style={{ background: "var(--canvas)" }} role="dialog" aria-modal="true" aria-label="Add data asset">
        {header}
        {chatBody}
        <div className="mx-auto w-full max-w-[720px] px-5 pb-5">{composer("Answer, or tell me more…")}</div>
      </div>
    );
  }

  // ---- Workspace ----
  const ring = (s: Section | "confirm") => (flash === s ? "0 0 0 3px rgba(67,134,250,0.35)" : "none");

  const sectionMeta: { id: Section; title: string; has: boolean; summary: React.ReactNode }[] = [
    {
      id: "select",
      title: "Select data",
      has: plan.selected.length > 0,
      summary: (() => {
        const names = plan.selected.map(tableName);
        const whs = Array.from(new Set(plan.selected.map((k) => assetOf(k).conn?.warehouse).filter(Boolean))) as string[];
        return (
          <span className="flex min-w-0 items-center gap-2">
            {whs.map((w) => (
              <span key={w} className="inline-flex h-4 w-4 shrink-0 items-center justify-center">
                <SourceLogo source={w as never} />
              </span>
            ))}
            <span className="truncate font-mono text-[12px]">
              {names.slice(0, 2).join(", ")}
              {names.length > 2 && ` +${names.length - 2} more`}
            </span>
            {names.length > 2 && <span className="shrink-0">· {formatRowCount(totalRows(plan))} rows</span>}
          </span>
        );
      })(),
    },
    {
      id: "checks",
      title: "Apply checks",
      has: checkTotal(plan) > 0,
      summary: (
        <span className="flex min-w-0 items-center gap-1.5 overflow-hidden">
          {dimensionsInUse(plan).map((d) => (
            <DimensionBadge key={d} label={d} size="sm" />
          ))}
          <span className="shrink-0 pl-1">{checkTotal(plan)} checks</span>
        </span>
      ),
    },
    {
      id: "schedule",
      title: "Schedule",
      has: !!plan.profiling,
      summary: (
        <span className="truncate">
          {scheduleLabel(plan.profiling, plan.timeZone)}
          {plan.profiling && !plan.linked && ` · DQ checks ${scheduleLabel(plan.checks, plan.timeZone).replace(/^D/, "d").replace(/^W/, "w")}`}
        </span>
      ),
    },
  ];

  const accordion = (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden p-4">
      {sectionMeta.map((sec, i) => {
        const isOpen = openSection === sec.id;
        const loading = filled <= i;
        return (
          <section
            key={sec.id}
            className={`flex min-h-0 flex-col overflow-hidden rounded-xl border bg-white transition-[flex-grow,box-shadow] duration-300 ease-out motion-reduce:transition-none ${isOpen ? "flex-1" : "flex-none"}`}
            style={{ borderColor: "var(--hairline)", boxShadow: ring(sec.id) }}
          >
            <h3>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`plan-${sec.id}`}
                onClick={() => setOpenSection(isOpen ? null : sec.id)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[color:var(--surface-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--brand-blue)]"
              >
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold"
                  style={sec.has && !loading ? { background: "var(--brand-blue)", color: "white" } : { background: "var(--surface-soft)", color: "var(--ink-500)" }}
                >
                  {sec.has && !loading ? <CheckIcon size={13} strokeWidth={3} /> : i + 1}
                </span>
                <span className="w-[110px] shrink-0 text-[14px] font-semibold" style={{ color: "var(--ink-900)" }}>
                  {sec.title}
                </span>
                <span className="min-w-0 flex-1 text-[13px]" style={{ color: "var(--ink-500)" }}>
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 size={13} className="animate-spin" /> Drafting…
                    </span>
                  ) : sec.has ? (
                    <span style={{ color: "var(--ink-700)" }}>{sec.summary}</span>
                  ) : (
                    "Not set"
                  )}
                </span>
                <ChevronDown size={16} className={`shrink-0 transition-transform duration-300 motion-reduce:transition-none ${isOpen ? "rotate-180" : ""}`} style={{ color: "var(--ink-500)" }} />
              </button>
            </h3>
            {isOpen && (
              <div id={`plan-${sec.id}`} className="min-h-0 flex-1 overflow-y-auto border-t animate-in fade-in duration-300 motion-reduce:animate-none" style={{ borderColor: "var(--hairline)" }}>
                {loading ? (
                  <div className="flex h-full items-center justify-center gap-2 text-[13px]" style={{ color: "var(--ink-500)" }}>
                    <Loader2 size={14} className="animate-spin" /> Filling in {sec.title.toLowerCase()}…
                  </div>
                ) : (
                  renderStep(sec.id)
                )}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );

  const bottomBar = (
    <div className="flex shrink-0 items-center justify-between gap-4 border-t bg-white px-6 py-3" style={{ borderColor: "var(--hairline)" }}>
      {done ? (
        <p className="text-[14px]" style={{ color: "var(--ink-900)" }}>
          {done}
        </p>
      ) : (
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-[13px]" style={{ color: "var(--ink-700)" }}>
          <span>
            <b>{plan.selected.length}</b> tables
          </span>
          <span>
            <b>{checkTotal(plan)}</b> checks
          </span>
          <span>{scheduleLabel(plan.profiling ?? RECOMMENDED_SCHEDULE, plan.timeZone ?? RECOMMENDED_TZ)}</span>
        </div>
      )}
      <div className="flex items-center gap-2">
        {mode === "manual" && manualStep > 0 && (
          <button onClick={() => setManualStep((s) => s - 1)} className="h-10 rounded-full border px-5 text-[14px]" style={{ borderColor: "var(--hairline)" }}>
            Back
          </button>
        )}
        {mode === "manual" && manualStep < 2 ? (
          <button onClick={() => setManualStep((s) => s + 1)} className="h-10 rounded-full px-6 text-[14px] font-medium text-white" style={{ background: "var(--brand-blue)" }}>
            Continue
          </button>
        ) : (
          <button
            onClick={confirm}
            disabled={!!done}
            className="h-10 rounded-full px-7 text-[14px] font-medium text-white transition-shadow"
            style={{ background: "var(--brand-blue)", boxShadow: ring("confirm") }}
          >
            Confirm
          </button>
        )}
      </div>
    </div>
  );

  const workspace = (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden animate-in slide-in-from-right duration-300" style={{ background: "var(--canvas)" }}>
      {mode === "manual" ? (
        <>
          <div className="shrink-0 border-b bg-white px-8 py-4" style={{ borderColor: "var(--hairline)" }}>
            <Stepper steps={[{ label: "Select data" }, { label: "Apply checks" }, { label: "Schedule" }]} current={manualStep} />
          </div>
          <div className="flex-1 overflow-y-auto">{renderStep((["select", "checks", "schedule"] as Section[])[manualStep])}</div>
        </>
      ) : (
        accordion
      )}
      {bottomBar}
    </div>
  );

  const rail = (
    <aside className="flex h-full min-w-0 flex-col border-r bg-white" style={{ borderColor: "var(--hairline)", width: narrow ? "100%" : "50%" }}>
      <div className="flex items-center justify-between px-4 pt-3 text-[12px] font-medium" style={{ color: "var(--ink-500)" }}>
        Assistant
        {!narrow && (
          <button aria-label="Collapse chat" onClick={() => setRailOpen(false)} className="rounded p-1 hover:bg-[color:var(--surface-soft)]">
            <PanelLeftClose size={16} />
          </button>
        )}
      </div>
      {chatBody}
      <div className="px-4 pb-4">{composer(mode === "manual" ? "Ask anything…" : "Change the plan, e.g. remove fct_orders_daily…")}</div>
    </aside>
  );

  return (
    <div className="fixed inset-0 z-[60] flex flex-col" style={{ background: "var(--canvas)" }} role="dialog" aria-modal="true" aria-label="Add data asset">
      {header}
      {narrow && (
        <div className="flex shrink-0 border-b bg-white" style={{ borderColor: "var(--hairline)" }}>
          {(["chat", "plan"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-2.5 text-[14px] font-medium"
              style={{ color: tab === t ? "var(--brand-blue)" : "var(--ink-500)", borderBottom: tab === t ? "2px solid var(--brand-blue)" : "2px solid transparent" }}
            >
              {t === "chat" ? "Chat" : "Plan"}
            </button>
          ))}
        </div>
      )}
      <div className="flex min-h-0 flex-1">
        {narrow ? (
          tab === "chat" ? rail : workspace
        ) : (
          <>
            {railOpen ? (
              rail
            ) : (
              <button
                aria-label="Open chat"
                onClick={() => setRailOpen(true)}
                className="flex w-10 shrink-0 items-start justify-center border-r bg-white pt-3"
                style={{ borderColor: "var(--hairline)" }}
              >
                <PanelLeftOpen size={16} />
              </button>
            )}
            {workspace}
          </>
        )}
      </div>
    </div>
  );
}

/** Plain text with **bold** and `monospace` spans. */
function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") ? (
          <b key={i}>{p.slice(2, -2)}</b>
        ) : p.startsWith("`") ? (
          <code key={i} className="rounded px-1 font-mono text-[12.5px]" style={{ background: "var(--surface-soft)" }}>
            {p.slice(1, -1)}
          </code>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}
