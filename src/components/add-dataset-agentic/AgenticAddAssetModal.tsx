import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowUp, Loader2, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
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
  connectionSummary,
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
  Q_TABLES,
  UNSUPPORTED_WAREHOUSES,
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
};

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
  const [view, setView] = useState<"overview" | Section>("overview");
  const [manualStep, setManualStep] = useState(0);
  const [plan, setPlanRaw] = useState<Plan>(EMPTY_PLAN);
  const [history, setHistory] = useState<Plan[]>([]);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [queue, setQueue] = useState<Question[]>([]);
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
      setView("overview");
      setManualStep(0);
      setPlanRaw(EMPTY_PLAN);
      setHistory([]);
      setMsgs([]);
      setQueue([]);
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
  const chatChange = (next: Plan, line: string, section: Section) => {
    setHistory((h) => [...h, plan]);
    setPlanRaw(next);
    pulse(section);
    push({ role: "agent", text: line, undo: true, showMe: section });
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

  const startDrafting = (p: Plan) => {
    push({ role: "agent", text: "No more questions. I'm drafting your plan now — you can change anything on the right." });
    setPlanRaw(p);
    setMode("plan");
    setView("overview");
    setTab("plan");
    setFilled(0);
    [1, 2, 3].forEach((n) => window.setTimeout(() => setFilled(n), 700 * n));
    window.setTimeout(
      () =>
        push({
          role: "agent",
          text: `Your plan is ready: ${connectionSummary(p)}, ${checkTotal(p)} checks, ${scheduleLabel(p.profiling, p.timeZone)}. Press Confirm when it looks right.`,
        }),
      2300,
    );
  };

  const askNext = (q: Question[], p: Plan) => {
    if (q.length === 0) return startDrafting(p);
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
      agentSay(() => startDrafting(p));
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
      if (found.length)
        push({
          role: "agent",
          text: `I looked up your connections and found ${found.length} matching ${found.length === 1 ? "table" : "tables"}: ${found.map((f) => f.name).join(", ")}. I'll use the recommended checks and schedule — you can change anything once the plan is drafted.`,
        });
      askNext(qs, p);
    }, 900);
  };

  const command = (text: string) => {
    push({ role: "user", text });
    const t = text.toLowerCase().trim();
    agentSay(() => {
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
        );
      }
      if (tables.length && removing) {
        const keys = tables.map((a) => a.key).filter((k) => selectedSet.has(k));
        return chatChange(withoutTables(plan, keys), `Removed ${keys.length} ${keys.length === 1 ? "table" : "tables"}${schema ? ` from ${schema}` : ""}.`, "select");
      }
      if (tables.length) {
        const keys = tables.map((a) => a.key).filter((k) => !selectedSet.has(k));
        if (!keys.length) return push({ role: "agent", text: "Those are already in the plan." });
        return chatChange(withTables(plan, keys), `Added ${keys.length} ${keys.length === 1 ? "table" : "tables"}: ${keys.map(tableName).join(", ")}.`, "select");
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
          text: "You can review the tables directly — I'll open the list so you can add or remove by clicking.",
          showMe: "select",
        });
      }
      push({
        role: "agent",
        text: "I can add or remove tables or a whole schema, add or remove a check, change the schedule, or undo. Try \"remove fct_orders_daily\" or \"run every 6 hours\".",
      });
    });
  };

  const send = (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text || thinking) return;
    setInput("");
    if (mode === "chat" && msgs.length === 0) firstMessage(text);
    else if (queue.length) answerQuestion(text);
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

  const showMe = (s: Section) => {
    if (mode === "manual") setManualStep(s === "select" ? 0 : s === "checks" ? 1 : 2);
    else setView(s);
    setTab("plan");
    pulse(s);
  };

  // ---- Step screens wired to the plan ----
  const renderStep = (s: Section) => {
    if (s === "select")
      return (
        <Step1SelectData
          selected={selectedSet}
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
                className={m.role === "user" ? "max-w-[85%] rounded-2xl px-3.5 py-2 text-[14px]" : "text-[14px] leading-relaxed"}
                style={m.role === "user" ? { background: "var(--surface-soft)", color: "var(--ink-900)" } : { color: "var(--ink-900)" }}
              >
                {m.text}
                {(m.undo || m.showMe) && (
                  <span className="ml-2 inline-flex gap-2 text-[13px]">
                    {m.undo && (
                      <button className="underline" style={{ color: "var(--brand-blue)" }} onClick={undo}>
                        Undo
                      </button>
                    )}
                    {m.showMe && (
                      <button className="underline" style={{ color: "var(--brand-blue)" }} onClick={() => showMe(m.showMe!)}>
                        Show me
                      </button>
                    )}
                  </span>
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

  const overview = (
    <div className="mx-auto max-w-[880px] px-8 py-8">
      <h2 className="mb-1 text-[22px] font-semibold" style={{ color: "var(--ink-900)" }}>
        Your plan
      </h2>
      <p className="mb-6 text-[14px]" style={{ color: "var(--ink-500)" }}>
        Review what will be set up. Edit any part directly.
      </p>
      <div className="flex flex-col gap-3">
        {(
          [
            ["select", "Select data", connectionSummary(plan), plan.selected.map(tableName).join(", ")],
            ["checks", "Apply checks", plan.selected.length ? `${checkTotal(plan)} checks` : "Not set", plan.selected.length ? `Across ${plan.selected.length} tables` : ""],
            [
              "schedule",
              "Schedule",
              scheduleLabel(plan.profiling, plan.timeZone),
              plan.profiling ? (plan.linked ? "Profiling and DQ checks run together" : `DQ checks: ${scheduleLabel(plan.checks, plan.timeZone)}`) : "",
            ],
          ] as [Section, string, string, string][]
        ).map(([id, title, value, sub], i) => (
          <section
            key={id}
            className="flex items-center justify-between rounded-xl border bg-white px-5 py-4 transition-shadow"
            style={{ borderColor: "var(--hairline)", boxShadow: ring(id) }}
          >
            <div className="min-w-0">
              <div className="text-[12px] font-medium uppercase tracking-wide" style={{ color: "var(--ink-500)" }}>
                {title}
              </div>
              {filled > i ? (
                <>
                  <div className="mt-1 text-[16px] font-semibold" style={{ color: value === "Not set" ? "var(--ink-500)" : "var(--ink-900)" }}>
                    {value}
                  </div>
                  {sub && (
                    <div className="mt-0.5 truncate font-mono text-[12px]" style={{ color: "var(--ink-500)" }}>
                      {sub}
                    </div>
                  )}
                </>
              ) : (
                <div className="mt-2 flex items-center gap-2 text-[13px]" style={{ color: "var(--ink-500)" }}>
                  <Loader2 size={14} className="animate-spin" /> Drafting…
                </div>
              )}
            </div>
            <button
              onClick={() => setView(id)}
              className="h-9 shrink-0 rounded-full border px-4 text-[13px] font-medium hover:bg-[color:var(--surface-soft)]"
              style={{ borderColor: "var(--hairline)", color: "var(--ink-900)" }}
            >
              Edit
            </button>
          </section>
        ))}
      </div>
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
          <span>{scheduleLabel(plan.profiling, plan.timeZone)}</span>
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
        <div className="shrink-0 border-b bg-white px-8 py-4" style={{ borderColor: "var(--hairline)" }}>
          <Stepper steps={[{ label: "Select data" }, { label: "Apply checks" }, { label: "Schedule" }]} current={manualStep} />
        </div>
      ) : (
        view !== "overview" && (
          <div className="shrink-0 border-b bg-white px-6 py-3" style={{ borderColor: "var(--hairline)" }}>
            <button onClick={() => setView("overview")} className="flex items-center gap-1.5 text-[13px] font-medium" style={{ color: "var(--brand-blue)" }}>
              <ArrowLeft size={14} /> Back to plan
            </button>
          </div>
        )
      )}
      <div className="flex-1 overflow-y-auto">
        {mode === "manual" ? renderStep((["select", "checks", "schedule"] as Section[])[manualStep]) : view === "overview" ? overview : renderStep(view)}
      </div>
      {bottomBar}
    </div>
  );

  const rail = (
    <aside className="flex h-full min-w-0 flex-col border-r bg-white" style={{ borderColor: "var(--hairline)", width: narrow ? "100%" : "30%" }}>
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
