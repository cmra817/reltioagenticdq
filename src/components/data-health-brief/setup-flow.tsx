import * as React from "react";
import { Check, ChevronDown, ChevronRight, Loader2, X } from "lucide-react";
import {
  DEFAULT_DIMS,
  DEFAULT_INTENT,
  DIMENSIONS,
  EXCLUDED,
  INTENT_RESTATEMENT,
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

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="text-[11px] font-semibold uppercase tracking-[0.14em]"
      style={{ color: "var(--ink-300)" }}
    >
      {children}
    </div>
  );
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onChange}
      className="relative h-[20px] w-[34px] shrink-0 rounded-full transition-colors"
      style={{ background: on ? "var(--brand-blue)" : "var(--hairline)" }}
    >
      <span
        className="absolute top-[2px] h-4 w-4 rounded-full bg-white transition-all"
        style={{ left: on ? 16 : 2, boxShadow: "0 1px 2px rgba(0,0,0,0.2)" }}
      />
    </button>
  );
}

export function SetupFlow({ onCreate }: { onCreate: (c: SetupConfig) => void }) {
  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const [intent, setIntent] = React.useState(DEFAULT_INTENT);
  const [done, setDone] = React.useState(0);

  // draft state
  const [removed, setRemoved] = React.useState<string[]>([]);
  const [showMore, setShowMore] = React.useState(false);
  const [dims, setDims] = React.useState<Record<DimensionId, boolean>>({ ...DEFAULT_DIMS });
  const [excludedOpen, setExcludedOpen] = React.useState(false);
  const [refine, setRefine] = React.useState("");
  const [refined, setRefined] = React.useState<string[]>([]);
  const [name, setName] = React.useState("Q4 migration");
  const [editingSentence, setEditingSentence] = React.useState(false);
  const [sentence, setSentence] = React.useState(INTENT_RESTATEMENT);

  React.useEffect(() => {
    if (step !== 2) return;
    setDone(0);
    const timers = [
      setTimeout(() => setDone(1), 650),
      setTimeout(() => setDone(2), 1300),
      setTimeout(() => setDone(3), 1950),
      setTimeout(() => setStep(3), 2500),
    ];
    return () => timers.forEach(clearTimeout);
  }, [step]);

  const totalTables = 14 - removed.length + refined.length;
  const tiles = [
    ...DIMENSIONS.filter((d) => dims[d.id]).map((d) => d.tile),
    "Checks passing",
  ];

  /* ---------------- screen 1 ---------------- */
  if (step === 1) {
    return (
      <div className="mx-auto w-full max-w-[720px] px-6 py-16">
        <Eyebrow>Data health · First run</Eyebrow>
        <h1 className="mt-4 text-[34px] font-semibold leading-tight" style={{ color: "var(--ink-900)" }}>
          What are you responsible for?
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed" style={{ color: "var(--ink-500)" }}>
          Describe it the way you'd say it to a colleague. I'll tell you what I'd watch, and you can change
          it.
        </p>

        <textarea
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
          rows={4}
          className="mt-6 w-full resize-none rounded-2xl px-4 py-3 text-[14px] outline-none"
          style={{
            border: "1px solid var(--hairline)",
            background: "#fff",
            color: "var(--ink-900)",
            boxShadow: "var(--shadow-input)",
          }}
        />

        <div className="mt-6 text-[12.5px]" style={{ color: "var(--ink-500)" }}>
          Or start from something I found in your warehouse
        </div>
        <div className="mt-2 flex flex-col gap-2">
          {STARTERS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setIntent(s)}
              className="rounded-xl px-3.5 py-2.5 text-left text-[13px] transition-colors hover:bg-[color:var(--surface-soft)]"
              style={{ border: "1px solid var(--hairline)", background: "#fff", color: "var(--ink-700)" }}
            >
              {s}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setStep(2)}
          disabled={!intent.trim()}
          className="mt-8 rounded-xl px-5 py-2.5 text-[13px] font-medium disabled:opacity-40"
          style={{ background: "var(--brand-blue)", color: "#fff" }}
        >
          Continue
        </button>
      </div>
    );
  }

  /* ---------------- screen 2 ---------------- */
  if (step === 2) {
    return (
      <div className="mx-auto w-full max-w-[720px] px-6 py-16">
        <Eyebrow>Reading your warehouse</Eyebrow>
        <div
          className="mt-4 rounded-2xl px-4 py-3 text-[14px]"
          style={{ border: "1px solid var(--hairline)", background: "#fff", color: "var(--ink-900)" }}
        >
          {intent}
        </div>
        <div className="mt-8 flex flex-col gap-4">
          {RESOLVE_STEPS.map((s, i) => {
            const complete = done > i;
            return (
              <div key={s} className="flex items-center gap-3 transition-opacity" style={{ opacity: complete ? 1 : 0.45 }}>
                <span
                  className="flex h-5 w-5 items-center justify-center rounded-full"
                  style={{
                    background: complete ? "var(--brand-blue)" : "transparent",
                    border: complete ? "none" : "1px solid var(--hairline)",
                  }}
                >
                  {complete ? (
                    <Check size={12} color="#fff" strokeWidth={3} />
                  ) : (
                    <Loader2 size={12} className="animate-spin" color="var(--ink-300)" />
                  )}
                </span>
                <span className="text-[13.5px]" style={{ color: "var(--ink-700)" }}>
                  {s}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  /* ---------------- screen 3 ---------------- */
  const visible = WATCHING.concat(showMore ? WATCHING_HIDDEN : []);

  return (
    <div className="mx-auto w-full max-w-[820px] px-6 py-12">
      <Eyebrow>Here's my draft — change anything</Eyebrow>

      <div className="mt-4">
        {editingSentence ? (
          <textarea
            value={sentence}
            autoFocus
            onChange={(e) => setSentence(e.target.value)}
            onBlur={() => setEditingSentence(false)}
            rows={4}
            className="w-full resize-none rounded-xl px-3 py-2 text-[15px] leading-relaxed outline-none"
            style={{ border: "1px solid var(--hairline)", background: "#fff", color: "var(--ink-900)" }}
          />
        ) : (
          <p className="text-[15px] leading-relaxed" style={{ color: "var(--ink-900)" }}>
            {sentence}
          </p>
        )}
        <button
          type="button"
          onClick={() => setEditingSentence(true)}
          className="mt-2 text-[12.5px] underline"
          style={{ color: "var(--brand-blue)" }}
        >
          Edit this sentence
        </button>
      </div>

      {/* WATCHING */}
      <div className="mt-8">
        <div className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--ink-500)" }}>
          Watching — {totalTables} tables
        </div>
        <div className="mt-3 overflow-hidden rounded-xl" style={{ border: "1px solid var(--hairline)", background: "#fff" }}>
          {visible.map((r, i) => {
            const gone = removed.includes(r.table);
            return (
              <div
                key={r.table}
                className="flex items-start gap-3 px-3 py-2.5"
                style={{ borderTop: i === 0 ? "none" : "1px solid var(--hairline)" }}
              >
                <div className="min-w-0 flex-1">
                  <div
                    className="font-mono text-[12.5px]"
                    style={{
                      color: gone ? "var(--ink-100)" : "var(--ink-900)",
                      textDecoration: gone ? "line-through" : "none",
                    }}
                  >
                    {r.table}
                  </div>
                  <div
                    className="mt-0.5 text-[12px] leading-snug"
                    style={{
                      color: gone ? "var(--ink-100)" : "var(--ink-500)",
                      textDecoration: gone ? "line-through" : "none",
                    }}
                  >
                    {r.reason}
                  </div>
                </div>
                <button
                  type="button"
                  aria-label={gone ? `Put ${r.table} back` : `Remove ${r.table}`}
                  onClick={() =>
                    setRemoved((prev) => (gone ? prev.filter((t) => t !== r.table) : [...prev, r.table]))
                  }
                  className="mt-0.5 shrink-0 rounded-md p-1 transition-colors hover:bg-[color:var(--surface-soft)]"
                  style={{ color: "var(--ink-300)" }}
                >
                  {gone ? <span className="text-[11px] px-1">Undo</span> : <X size={14} />}
                </button>
              </div>
            );
          })}
          {refined.map((t) => (
            <div key={t} className="flex items-start gap-3 px-3 py-2.5" style={{ borderTop: "1px solid var(--hairline)" }}>
              <div className="min-w-0 flex-1">
                <div className="font-mono text-[12.5px]" style={{ color: "var(--ink-900)" }}>
                  {t}
                </div>
                <div className="mt-0.5 text-[12px]" style={{ color: "var(--ink-500)" }}>
                  Added by you just now
                </div>
              </div>
              <button
                type="button"
                aria-label={`Remove ${t}`}
                onClick={() => setRefined((p) => p.filter((x) => x !== t))}
                className="mt-0.5 shrink-0 rounded-md p-1 hover:bg-[color:var(--surface-soft)]"
                style={{ color: "var(--ink-300)" }}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
        {!showMore && (
          <button
            type="button"
            onClick={() => setShowMore(true)}
            className="mt-2 text-[12.5px] underline"
            style={{ color: "var(--brand-blue)" }}
          >
            Show 8 more
          </button>
        )}
      </div>

      {/* PRIORITISING */}
      <div className="mt-8">
        <div className="flex items-baseline gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--ink-500)" }}>
            Prioritising
          </span>
          <span className="text-[12px]" style={{ color: "var(--ink-300)" }}>
            these become your scorecard
          </span>
        </div>
        <div className="mt-3 flex flex-col gap-3">
          {DIMENSIONS.filter((d) => d.prioritised).map((d) => (
            <div key={d.id} className="flex items-start gap-3">
              <Toggle on={dims[d.id]} label={d.name} onChange={() => setDims((p) => ({ ...p, [d.id]: !p[d.id] }))} />
              <div className="min-w-0">
                <div className="text-[13px] font-medium" style={{ color: "var(--ink-900)" }}>
                  {d.name}
                </div>
                <div className="text-[12px]" style={{ color: "var(--ink-500)" }}>
                  {d.reason}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div
          className="mt-4 rounded-xl px-3 py-2 text-[12.5px]"
          style={{ background: "var(--surface-soft)", color: "var(--ink-700)" }}
        >
          Scorecard will show: {tiles.join(" · ")}
        </div>
      </div>

      {/* DEPRIORITISING */}
      <div className="mt-8">
        <div className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--ink-500)" }}>
          Deprioritising
        </div>
        <div className="mt-3 flex flex-col gap-3">
          {DIMENSIONS.filter((d) => !d.prioritised).map((d) => (
            <div key={d.id} className="flex items-start gap-3">
              <Toggle on={dims[d.id]} label={d.name} onChange={() => setDims((p) => ({ ...p, [d.id]: !p[d.id] }))} />
              <div className="min-w-0">
                <div className="text-[13px] font-medium" style={{ color: "var(--ink-900)" }}>
                  {d.name}
                </div>
                <div className="text-[12px]" style={{ color: "var(--ink-500)" }}>
                  {d.reason}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* considered and excluded */}
      <div className="mt-8">
        <button
          type="button"
          onClick={() => setExcludedOpen((v) => !v)}
          className="flex items-center gap-1.5 text-[12.5px]"
          style={{ color: "var(--ink-500)" }}
          aria-expanded={excludedOpen}
        >
          {excludedOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          I considered 6 more and left them out — see why
        </button>
        {excludedOpen && (
          <div className="mt-3 overflow-hidden rounded-xl" style={{ border: "1px solid var(--hairline)", background: "#fff" }}>
            {EXCLUDED.map((r, i) => (
              <div
                key={r.table}
                className="px-3 py-2.5"
                style={{ borderTop: i === 0 ? "none" : "1px solid var(--hairline)" }}
              >
                <div className="font-mono text-[12.5px]" style={{ color: "var(--ink-700)" }}>
                  {r.table}
                </div>
                <div className="mt-0.5 text-[12px]" style={{ color: "var(--ink-500)" }}>
                  {r.reason}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* refine */}
      <form
        className="mt-8"
        onSubmit={(e) => {
          e.preventDefault();
          const q = refine.trim();
          if (!q) return;
          const words = q.match(/[a-z_]+_?[a-z]*/gi) ?? [];
          const guess = words.find((w) => w.length > 4 && !["also", "include", "tables", "table", "add", "the"].includes(w.toLowerCase()));
          setRefined((p) => [...p, guess ? `${guess.toLowerCase()}_tables` : "additional_tables"]);
          setRefine("");
        }}
      >
        <input
          value={refine}
          onChange={(e) => setRefine(e.target.value)}
          placeholder="Anything I'm missing? e.g. 'also include the billing tables'"
          className="w-full rounded-xl px-3.5 py-2.5 text-[13px] outline-none"
          style={{ border: "1px solid var(--hairline)", background: "#fff", color: "var(--ink-900)" }}
        />
      </form>

      {/* name + create */}
      <div className="mt-8 flex items-center gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="Dashboard name"
          className="rounded-xl px-3.5 py-2.5 text-[13px] outline-none"
          style={{ border: "1px solid var(--hairline)", background: "#fff", color: "var(--ink-900)", width: 220 }}
        />
        <button
          type="button"
          onClick={() => onCreate({ intent, name: name.trim() || "Q4 migration", tableCount: totalTables, dims })}
          className="rounded-xl px-5 py-2.5 text-[13px] font-medium"
          style={{ background: "var(--brand-blue)", color: "#fff" }}
        >
          Create dashboard
        </button>
      </div>
    </div>
  );
}
