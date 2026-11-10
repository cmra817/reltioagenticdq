import { PromptBox } from "@/components/chat/prompt-box";
import * as React from "react";
import { ArrowUp, Check, Loader2 } from "lucide-react";
import {
  DEFAULT_DIMS,
  DIMENSIONS,
  EXCLUDED,
  STARTERS,
  WATCHING,
  WATCHING_HIDDEN,
  type DimensionId,
} from "./data";

export type SetupConfig = {
  intent: string;
  name: string;
  tableCount: number;
  dims: Record<DimensionId, boolean>;
};

const RESOLVE_STEPS = [
  "Matching your description to schemas and column names",
  "Reading 90 days of profiling history",
  "Ranking by how much each table has moved recently",
];

type Draft = {
  tables: string[];
  added: string[];
  dims: Record<DimensionId, boolean>;
  name: string;
};

type Turn =
  | { id: string; kind: "agent"; text: string }
  | { id: string; kind: "user"; text: string }
  | { id: string; kind: "thinking" }
  | { id: string; kind: "proposal"; draft: Draft }
  | { id: string; kind: "excluded" };

const ALL_ROWS = [...WATCHING, ...WATCHING_HIDDEN];

const DIM_WORDS: { id: DimensionId; words: string[] }[] = [
  { id: "uniqueness", words: ["unique", "duplicate", "dupe", "key"] },
  { id: "completeness", words: ["complete", "null", "fill", "missing"] },
  { id: "volume", words: ["volume", "row count", "drift", "growth"] },
  { id: "timeliness", words: ["fresh", "timeli", "late", "stale", "load time"] },
  { id: "format", words: ["format", "pattern", "valid"] },
];

function listNames(names: string[]) {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

function deriveName(intent: string) {
  const q = intent.match(/q[1-4]/i);
  if (q && /migrat/i.test(intent)) return `${q[0].toUpperCase()} migration`;
  if (/migrat/i.test(intent)) return "Migration";
  if (/finance|revenue|billing/i.test(intent)) return "Finance tables";
  if (/customer|crm/i.test(intent)) return "Customer data";
  return "Data health";
}

function Mono({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[12.5px]" style={{ color: "var(--ink-900)" }}>
      {children}
    </span>
  );
}

function AgentBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-[640px] text-[14px] leading-relaxed" style={{ color: "var(--ink-900)" }}>
      {children}
    </div>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <div
        className="max-w-[520px] rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed"
        style={{ background: "var(--surface-soft)", color: "var(--ink-900)", border: "1px solid var(--hairline)" }}
      >
        {text}
      </div>
    </div>
  );
}

function Thinking() {
  const [done, setDone] = React.useState(0);
  React.useEffect(() => {
    const timers = [
      setTimeout(() => setDone(1), 650),
      setTimeout(() => setDone(2), 1300),
      setTimeout(() => setDone(3), 1950),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);
  return (
    <div className="flex flex-col gap-2.5">
      {RESOLVE_STEPS.map((s, i) => {
        const complete = done > i;
        return (
          <div key={s} className="flex items-center gap-2.5" style={{ opacity: complete ? 1 : 0.5 }}>
            <span
              className="flex h-4 w-4 items-center justify-center rounded-full"
              style={{
                background: complete ? "var(--brand-blue)" : "transparent",
                border: complete ? "none" : "1px solid var(--hairline)",
              }}
            >
              {complete ? (
                <Check size={10} color="#fff" strokeWidth={3} />
              ) : (
                <Loader2 size={10} className="animate-spin" color="var(--ink-300)" />
              )}
            </span>
            <span className="text-[13px]" style={{ color: "var(--ink-500)" }}>
              {s}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function Proposal({ draft, intent }: { draft: Draft; intent: string }) {
  const [open, setOpen] = React.useState(false);
  const all = [...draft.tables, ...draft.added];
  const lead = all.slice(0, 6);
  const rest = all.slice(6);
  const measures = DIMENSIONS.filter((d) => draft.dims[d.id]).map((d) => d.name.replace(/ on .*$/, ""));
  const dropped = DIMENSIONS.filter((d) => !draft.dims[d.id]);
  const reason = ALL_ROWS.find((r) => r.table === all[0])?.reason;

  return (
    <AgentBubble>
      <p>
        Here's what I'd do. You own {intent.replace(/^i own /i, "").replace(/\.$/, "")}, so I'll watch the{" "}
        {all.length} tables that flow into it and leave the copies, backups and derived views out of it.
      </p>

      <p className="mt-3">
        I'd start with{" "}
        {lead.map((t, i) => (
          <React.Fragment key={t}>
            <Mono>{t}</Mono>
            {i < lead.length - 2 ? ", " : i === lead.length - 2 ? " and " : ""}
          </React.Fragment>
        ))}
        {rest.length > 0 && (
          <>
            {" "}
            plus{" "}
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="underline"
              style={{ color: "var(--brand-blue)" }}
            >
              {rest.length} more
            </button>
          </>
        )}
        . {reason ? <span style={{ color: "var(--ink-500)" }}>{reason}.</span> : null}
      </p>

      {open && rest.length > 0 && (
        <div className="mt-2 flex flex-col gap-1.5 pl-3" style={{ borderLeft: "2px solid var(--hairline)" }}>
          {rest.map((t) => (
            <div key={t}>
              <Mono>{t}</Mono>
              <span className="ml-2 text-[12.5px]" style={{ color: "var(--ink-500)" }}>
                {ALL_ROWS.find((r) => r.table === t)?.reason ?? "Added by you"}
              </span>
            </div>
          ))}
        </div>
      )}

      <p className="mt-3">
        I'd measure {listNames(measures.map((m) => m.toLowerCase()))}, and always show how many checks are passing.{" "}
        {dropped.length > 0 && (
          <span style={{ color: "var(--ink-500)" }}>
            I'm leaving {listNames(dropped.map((d) => d.name.toLowerCase()))} out — {dropped[0].reason}.
          </span>
        )}
      </p>

      <p className="mt-3" style={{ color: "var(--ink-500)" }}>
        I can't see what reads these tables downstream yet — connect dbt or query history and I'll rank on that too.
      </p>

      <p className="mt-3 font-medium">Want me to build this? You can also tell me what to change.</p>
    </AgentBubble>
  );
}

function ExcludedList() {
  return (
    <AgentBubble>
      <p>These six matched your description, but I left them out:</p>
      <div className="mt-2 flex flex-col gap-1.5 pl-3" style={{ borderLeft: "2px solid var(--hairline)" }}>
        {EXCLUDED.map((r) => (
          <div key={r.table}>
            <Mono>{r.table}</Mono>
            <span className="ml-2 text-[12.5px]" style={{ color: "var(--ink-500)" }}>
              {r.reason}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-3">Say the word and I'll put any of them back. Otherwise — shall I build it?</p>
    </AgentBubble>
  );
}

export function SetupFlow({ onCreate }: { onCreate: (c: SetupConfig) => void }) {
  const [turns, setTurns] = React.useState<Turn[]>([]);
  const [intent, setIntent] = React.useState("");
  const [draft, setDraft] = React.useState<Draft>({
    tables: ALL_ROWS.map((w) => w.table),
    added: [],
    dims: { ...DEFAULT_DIMS },
    name: "Q4 migration",
  });
  const [input, setInput] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const bottom = React.useRef<HTMLDivElement>(null);
  const started = intent.length > 0;

  React.useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns]);

  const push = (t: Turn) => setTurns((prev) => [...prev, t]);

  const proposeAfterThinking = (nextDraft: Draft, nextIntent: string) => {
    setBusy(true);
    push({ id: `t${Date.now()}`, kind: "thinking" });
    setTimeout(() => {
      setTurns((prev) => [...prev, { id: `p${Date.now()}`, kind: "proposal", draft: nextDraft }]);
      setBusy(false);
      void nextIntent;
    }, 2400);
  };

  const firstAnswer = (text: string) => {
    setIntent(text);
    const nextDraft = { ...draft, name: deriveName(text) };
    setDraft(nextDraft);
    push({ id: `u${Date.now()}`, kind: "user", text });
    proposeAfterThinking(nextDraft, text);
  };

  const reply = (raw: string) => {
    const text = raw.trim();
    if (!text || busy) return;
    if (!started) {
      firstAnswer(text);
      return;
    }
    push({ id: `u${Date.now()}`, kind: "user", text });
    const q = text.toLowerCase();

    // build it
    if (/^(yes|yep|yeah|ok|okay|sure|go|do it|build|looks good|ship it|perfect|great)\b/.test(q) || /build (it|this)/.test(q)) {
      const total = draft.tables.length + draft.added.length;
      push({
        id: `a${Date.now()}`,
        kind: "agent",
        text: `Building it now — I'll call it "${draft.name}". ${total} tables, checked every morning at 6:00am.`,
      });
      setBusy(true);
      setTimeout(() => onCreate({ intent, name: draft.name, tableCount: total, dims: draft.dims }), 900);
      return;
    }

    // what are you skipping
    if (/skip|exclud|left out|leaving out|why not/.test(q)) {
      push({ id: `e${Date.now()}`, kind: "excluded" });
      return;
    }

    let next = { ...draft, dims: { ...draft.dims } };
    const notes: string[] = [];

    // name it
    const nameMatch = text.match(/(?:call it|name it)\s+"?([^".]+)"?/i);
    if (nameMatch) {
      next.name = nameMatch[1].trim();
      notes.push(`Calling it "${next.name}".`);
    }

    // remove tables
    if (/\b(drop|remove|exclude|ignore|don'?t watch)\b/.test(q)) {
      const hits = [...next.tables, ...next.added].filter((t) => q.includes(t.toLowerCase()));
      if (hits.length) {
        next.tables = next.tables.filter((t) => !hits.includes(t));
        next.added = next.added.filter((t) => !hits.includes(t));
        notes.push(`Dropped ${listNames(hits)}.`);
      }
    }

    // add tables
    if (/\b(add|include|also watch|watch)\b/.test(q)) {
      const known = ALL_ROWS.map((r) => r.table).filter(
        (t) => q.includes(t.toLowerCase()) && !next.tables.includes(t) && !next.added.includes(t),
      );
      let picked = known;
      if (!picked.length) {
        const word = (q.match(/[a-z_]{5,}/g) ?? []).find(
          (w) => !["include", "tables", "table", "please", "should", "watch"].includes(w),
        );
        if (word) picked = [`${word}_tables`];
      }
      if (picked.length) {
        next.added = [...next.added, ...picked];
        notes.push(`Added ${listNames(picked)}.`);
      }
    }

    // dimensions
    const on = /\b(add|include|also|care about|want|track)\b/.test(q);
    const off = /\b(drop|remove|ignore|don'?t|stop)\b/.test(q);
    for (const d of DIM_WORDS) {
      if (!d.words.some((w) => q.includes(w))) continue;
      if (off && next.dims[d.id]) {
        next.dims[d.id] = false;
        notes.push(`Dropped ${DIMENSIONS.find((x) => x.id === d.id)!.name.toLowerCase()}.`);
      } else if (on && !next.dims[d.id]) {
        next.dims[d.id] = true;
        notes.push(`Measuring ${DIMENSIONS.find((x) => x.id === d.id)!.name.toLowerCase()} too.`);
      }
    }

    setDraft(next);
    push({
      id: `a${Date.now()}`,
      kind: "agent",
      text: notes.length
        ? `${notes.join(" ")} Here's the updated version.`
        : "Noted — I've kept the rest the same. Here's where that leaves us.",
    });
    setTurns((prev) => [...prev, { id: `p${Date.now()}`, kind: "proposal", draft: next }]);
  };

  const send = () => {
    reply(input);
    setInput("");
  };

  const promptForm = (placeholder: string) => (
    <PromptBox
      value={input}
      onChange={setInput}
      onSubmit={send}
      placeholder={placeholder}
      autoFocus
      busy={busy}
    />
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {started ? (
        <>
          <div className="mx-auto min-h-0 w-full max-w-[720px] flex-1 overflow-y-auto px-6 pt-14">
            <div className="flex flex-col gap-6 pb-6">
              {turns.map((t) => {
                if (t.kind === "user") return <UserBubble key={t.id} text={t.text} />;
                if (t.kind === "agent")
                  return (
                    <AgentBubble key={t.id}>
                      <p>{t.text}</p>
                    </AgentBubble>
                  );
                if (t.kind === "thinking") return <Thinking key={t.id} />;
                if (t.kind === "excluded") return <ExcludedList key={t.id} />;
                return <Proposal key={t.id} draft={t.draft} intent={intent} />;
              })}
              <div ref={bottom} />
            </div>
          </div>

          <div className="mx-auto w-full max-w-[720px] shrink-0 px-6 pb-6 pt-2">
            {promptForm("Tell me what to change, or say yes…")}
          </div>
        </>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-6">
          <div className="w-full max-w-[640px]">
            <h1
              className="text-center text-[26px] font-semibold leading-tight"
              style={{ color: "var(--ink-900)" }}
            >
              Let’s build your personal data health dashboard.
            </h1>
            <p
              className="mx-auto mt-3 max-w-[520px] text-center text-[14.5px] leading-relaxed"
              style={{ color: "var(--ink-500)" }}
            >
              What are you responsible for? Describe it the way you’d say to a colleague — I’ll tell you what I’d watch, and you can change it before I build anything.
            </p>

            <div className="mb-2 mt-8 flex flex-wrap justify-center gap-2">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => reply(s)}
                  className="rounded-full px-3 py-1.5 text-[12px]"
                  style={{ border: "1px solid var(--hairline)", background: "#fff", color: "var(--ink-700)" }}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="mt-3">{promptForm("I own the customer data going into our Q4 migration…")}</div>
          </div>
        </div>
      )}
    </div>
  );
}
