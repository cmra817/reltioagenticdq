import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp, Loader2, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { PlanView, hasKey, type PlanFilter, type Reveal, type RuleRequest } from "./PlanView";
import { generateChecks, type Check } from "../add-dataset/mock-checks";
import type { AddDatasetCompletion } from "../add-dataset/AddDatasetModal";
import {
  ALL_ASSETS,
  EMPTY_PLAN,
  RECOMMENDED_SCHEDULE,
  RECOMMENDED_TZ,
  buildAssets,
  checkTotal,
  assetOf,
  keptChecks,
  dimensionsInUse,
  observations,
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
  filterLabel?: string;
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
  const [reveal, setReveal] = useState<Reveal>(null);
  const [ruleRequest, setRuleRequest] = useState<RuleRequest>(null);
  const [filter, setFilter] = useState<PlanFilter>(null);
  const dialogOpenRef = useRef(false);
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
      setReveal(null);
      setRuleRequest(null);
      setFilter(null);
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
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !dialogOpenRef.current && onOpenChange(false);
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
    pulse(section);
    if (f) flashRows(f);
    const keys = f?.keys ? Array.from(f.keys) : f?.focusKey ? [f.focusKey] : [];
    if (keys.length) setReveal({ keys, nonce: Date.now() });
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
    [1, 2, 3].forEach((n) => window.setTimeout(() => setFilled(n), 700 * n));
    window.setTimeout(() => {
      const whs = Array.from(new Set(final.selected.map((k) => assetOf(k).conn?.warehouse ?? ""))).filter(Boolean);
      const dims = dimensionsInUse(final).map((d) => d.toLowerCase());
      const dimText = dims.length > 1 ? `${dims.slice(0, -1).join(", ")} and ${dims[dims.length - 1]}` : dims[0] ?? "the recommended checks";
      const n = final.selected.length;
      const defaulted = [!given.schedule && "schedule", !given.tz && "time zone"].filter(Boolean) as string[];
      let text = `I'm monitoring ${n} ${n === 1 ? "table" : "tables"} in ${whs.join(" and ")} for ${dimText}, ${scheduleLabel(final.profiling, final.timeZone).replace(/^(\w)/, (m) => m.toLowerCase())}.`;
      if (defaulted.length) text += ` I used the recommended ${defaulted.join(" and ")}.`;
      const obs = observations(final);
      if (n > 10) text += `\nWith ${n} tables I'll stagger the runs a few minutes apart so they don't all hit the warehouse at once.`;
      obs.forEach((o) => (text += `\n${o.text}`));
      text += "\nChange anything on the right, or tell me here.";
      const keys = Array.from(new Set(obs.flatMap((o) => o.keys)));
      const noKey = final.selected.filter((k) => !hasKey(k));
      push({
        role: "agent",
        text,
        ...(keys.length ? { showMe: "select" as Section, showKeys: keys, filterLabel: noKey.length && keys.every((k) => noKey.includes(k)) ? "Tables without a primary key" : undefined } : {}),
      });
    }, 700 * 3 + 200);
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

  /** Open the Create a new rule dialog on the most relevant table. */
  const openRuleDialog = (description: string) => {
    const low = description.toLowerCase();
    const key =
      plan.selected.find((k) => low.includes(tableName(k).toLowerCase())) ??
      plan.selected.find((k) => keptChecks(plan, k).some((c) => (c.fields ?? [c.field]).some((f) => f && low.includes(f.toLowerCase())))) ??
      plan.selected[0];
    if (!key) return push({ role: "agent", text: "Add a table first, then I'll create the check for it." });
    setTab("plan");
    setRuleRequest({ key, description, nonce: Date.now() });
    push({ role: "agent", text: `I drafted the rule on \`${tableName(key)}\` — check the pattern and save it on the right.` });
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
      setCc(null);
      openRuleDialog(text);
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
          openRuleDialog(text.replace(/^(can you |please )?(create|make|add|write)( me)? (a )?(new )?(dq )?(check|rule)( that| to| which)?/i, "").trim() || text);
          return;
        }
        setCc({ stage: "describe" });
        return push({ role: "agent", text: "Sure. What should the check verify? Name the column and what should be true about it." });
      }
      if (CONFIRM_WORDS.test(t)) {
        pulse("confirm");
        return push({ role: "agent", text: "Only **Complete setup** (top right) creates it — everything here is just the draft until then." });
      }
      if (/^undo\b/.test(t)) return undo();
      if (/without (any )?checks|no checks|profiling only/.test(t) && /show|which|list/.test(t)) {
        const keys = plan.selected.filter((k) => keptChecks(plan, k).length === 0);
        if (!keys.length) return push({ role: "agent", text: "Every table in the job has at least one check." });
        setFilter({ label: "Tables without checks", keys });
        setTab("plan");
        return push({ role: "agent", text: `${keys.length} ${keys.length === 1 ? "table has" : "tables have"} no checks and will be profiled only.` });
      }
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
    const doneText =
      `Created ${result.tables.length} ${result.tables.length === 1 ? "asset" : "assets"} with ${result.checkCount} checks.` +
      (defaults.length ? ` Defaults applied — ${defaults.join("; ")}.` : "");
    if (mode !== "manual") push({ role: "note", text: doneText });
    setDone(doneText);
    window.setTimeout(() => onOpenChange(false), 2600);
  };

  const openManual = () => {
    setMode("manual");
    setManualStep(0);
    setFilled(3);
    setPlanRaw({ ...EMPTY_PLAN, profiling: RECOMMENDED_SCHEDULE, checks: RECOMMENDED_SCHEDULE, timeZone: RECOMMENDED_TZ });
    setTab("plan");
    push({ role: "note", text: "Setting it up step by step. Ask me anything along the way." });
  };

  const showMe = (s: Section, keys?: string[], filterLabel?: string) => {
    setTab("plan");
    if (s === "schedule") pulse("schedule");
    if (filterLabel && keys?.length) setFilter({ label: filterLabel, keys });
    if (keys?.length) {
      setReveal({ keys, nonce: Date.now() });
      flashRows({ keys: new Set(keys) });
    }
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
                      <button className="underline" style={{ color: "var(--brand-blue)" }} onClick={() => showMe(m.showMe!, m.showKeys, m.filterLabel)}>
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

  const ring = (s: Section | "confirm") => (flash === s ? "0 0 0 3px rgba(67,134,250,0.35)" : "none");

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
    </header>
  );

  // ---- First load: chat only ----
  if (mode === "chat" && msgs.length === 0) {
    return (
      <div className="fixed bottom-0 left-[260px] right-0 top-12 z-40 flex flex-col border-l" style={{ background: "var(--canvas)", borderColor: "var(--hairline)" }} role="dialog" aria-label="Add data asset">
        {header}
        <div className="flex flex-1 items-center justify-center px-6">
          <div className="w-full max-w-[680px]">
            <h1 className="mb-2 text-center text-[28px] font-semibold" style={{ color: "var(--ink-900)" }}>
              What data should we start watching?
            </h1>
            <p className="mb-6 text-center text-[14px]" style={{ color: "var(--ink-500)" }}>
              Tell me the connection, tables and schedule in a sentence or two. I'll propose a plan before building anything.
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
      <div className="fixed bottom-0 left-[260px] right-0 top-12 z-40 flex flex-col border-l" style={{ background: "var(--canvas)", borderColor: "var(--hairline)" }} role="dialog" aria-label="Add data asset">
        {header}
        {chatBody}
        <div className="mx-auto w-full max-w-[720px] px-5 pb-5">{composer("Answer, or tell me more…")}</div>
      </div>
    );
  }

  // ---- Workspace ----


  const workspace = (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden animate-in slide-in-from-right duration-300 motion-reduce:animate-none" style={{ background: "var(--canvas)" }}>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <PlanView
          plan={plan}
          stage={filled}
          onChange={(next, line) => workspaceChange(next, line)}
          flashKeys={rowFlash?.keys}
          flashIds={rowFlash?.ids}
          reveal={reveal}
          ruleRequest={ruleRequest}
          filter={filter}
          onClearFilter={() => setFilter(null)}
          onDialogChange={(o) => {
            dialogOpenRef.current = o;
          }}
          pulseSchedule={flash === "schedule"}
        />
      </div>
      <div className="flex shrink-0 items-center justify-end border-t bg-white px-5 py-3" style={{ borderColor: "var(--hairline)" }}>
        <button
          onClick={confirm}
          disabled={!!done}
          className="h-9 rounded-full px-4 text-[13px] font-medium text-white transition-shadow disabled:opacity-50"
          style={{ background: "var(--brand-blue)", boxShadow: ring("confirm") }}
        >
          Complete setup
        </button>
      </div>
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
      <div className="px-4 pb-4">
        {composer(mode === "manual" ? "Ask anything…" : "Change the plan, e.g. remove fct_orders_daily…")}
      </div>
    </aside>
  );

  return (
    <div className="fixed bottom-0 left-[260px] right-0 top-12 z-40 flex flex-col border-l" style={{ background: "var(--canvas)", borderColor: "var(--hairline)" }} role="dialog" aria-label="Add data asset">
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
