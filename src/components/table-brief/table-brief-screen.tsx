import * as React from "react";
import { ArrowUp, X } from "lucide-react";
import { ComposedBrief, type Pin } from "./composed-brief";
import { EvidencePanel } from "./evidence-panel";
import { Thread, type ThreadMessage } from "./thread";
import { answerFor, mentionsSfdc, type PinPayload } from "./answers";
import { TABLE, type EvidenceId } from "./data";

const CHIPS = [
  "Why did the check only fire now?",
  "How bad is this on a join?",
  "Prevent this",
];

export function TableBriefScreen({ tableName }: { tableName?: string }) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [pins, setPins] = React.useState<Pin[]>([]);
  const [messages, setMessages] = React.useState<ThreadMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [scope, setScope] = React.useState<string | null>(null);
  const [evidence, setEvidence] = React.useState<EvidenceId | null>(null);
  const [dupeFilter, setDupeFilter] = React.useState<string | null>(null);

  const addPin = React.useCallback((p: PinPayload) => {
    const id = `${p.title}-${Date.now()}`;
    setCollapsed(false);
    setPins((prev) =>
      prev.some((x) => x.title === p.title) ? prev : [...prev, { ...p, id, fresh: true }],
    );
    window.setTimeout(
      () => setPins((prev) => prev.map((x) => (x.id === id ? { ...x, fresh: false } : x))),
      1400,
    );
  }, []);

  const ask = React.useCallback((question: string) => {
    const q = question.trim();
    if (!q) return;
    const answer = answerFor(q);
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: "user", text: q },
      { id: `a-${Date.now() + 1}`, role: "agent", blocks: answer.blocks },
    ]);
    if (mentionsSfdc(q)) {
      setEvidence("duplicates");
      setDupeFilter("SFDC re-inserts · 900");
    }
  }, []);

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    ask(input);
    setInput("");
  };

  return (
    <div className="flex h-full min-h-0 flex-1">
      {/* Center column */}
      <div className="flex min-w-0 flex-1 flex-col px-6 py-4">
        <div className="flex items-center gap-2 pb-3">
          <span className="font-mono text-[15px] font-semibold" style={{ color: "var(--ink-900)" }}>
            {tableName ?? TABLE.name}
          </span>
          <span className="text-[12.5px]" style={{ color: "var(--ink-300)" }}>
            · {TABLE.domain}
          </span>
          <span className="ml-auto text-[12px]" style={{ color: "var(--ink-300)" }}>
            {TABLE.entry}
          </span>
        </div>

        {/* Pinned composed region — never scrolls away */}
        <div className="shrink-0">
          <ComposedBrief
            collapsed={collapsed}
            onToggleCollapsed={() => setCollapsed((c) => !c)}
            pins={pins}
            onRemovePin={(id) => setPins((prev) => prev.filter((p) => p.id !== id))}
            onPin={addPin}
            onAsk={ask}
            onOpenEvidence={(id) => setEvidence(id)}
          />
        </div>

        {/* Thread — independently scrolling */}
        <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
          <Thread messages={messages} onAsk={ask} onPin={addPin} />
        </div>

        {/* Input — fixed at the bottom of the column */}
        <div className="shrink-0 pt-3">
          <div className="mb-2 flex flex-wrap gap-2">
            {CHIPS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => ask(c)}
                className="rounded-full px-3 py-1.5 text-[12px]"
                style={{
                  background: "#fff",
                  border: "1px solid var(--hairline)",
                  color: "var(--ink-700)",
                }}
              >
                {c}
              </button>
            ))}
          </div>
          <form
            onSubmit={submit}
            className="flex flex-col items-start gap-2 rounded-2xl p-3"
            style={{
              background: "#E3E3F2",
              boxSizing: "border-box",
              minHeight: "112px",
              border: "1px solid rgba(0, 0, 204, 0.14)",
              boxShadow:
                "0px -2px 20px -10px rgba(67, 67, 112, 0.15), 0px 24px 48px -16px rgba(67, 67, 112, 0.5)",
            }}
          >
            <div className="flex w-full items-start gap-2">
              {scope && (
                <span
                  className="mt-0.5 inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-2 py-1 text-[11.5px]"
                  style={{ color: "var(--ink-700)" }}
                >
                  {TABLE.name} › {scope}
                  <button type="button" onClick={() => setScope(null)} aria-label="Clear scope">
                    <X size={11} />
                  </button>
                </span>
              )}
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submit();
                  }
                }}
                placeholder={scope ? `Ask about ${scope}…` : "Ask about this table…"}
                className="min-h-[56px] flex-1 resize-none bg-transparent px-1 py-0.5 text-[13px] outline-none"
                style={{ color: "var(--ink-900)" }}
              />
            </div>
            <div className="flex w-full justify-end px-1 pb-1">
              <button
                type="submit"
                aria-label="Send"
                className="flex h-8 w-8 items-center justify-center rounded-full"
                style={{ background: "var(--brand-blue)", color: "#fff" }}
              >
                <ArrowUp size={16} />
              </button>
            </div>
          </form>
        </div>
      </div>

      <EvidencePanel
        openView={evidence}
        onOpen={(id) => setEvidence(id)}
        onClose={() => {
          setEvidence(null);
          setDupeFilter(null);
        }}
        onAsk={ask}
        onScope={(id) => setScope(id)}
        dupeFilter={dupeFilter}
        onClearDupeFilter={() => setDupeFilter(null)}
      />
    </div>
  );
}
