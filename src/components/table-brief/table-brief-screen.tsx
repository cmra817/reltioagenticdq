import * as React from "react";
import { ArrowUp, Clock, X } from "lucide-react";
import { DatasetIcon, SourceLogo, TableIcon } from "@/components/explore-screen";
import { ComposedBrief, type Pin } from "./composed-brief";
import { EvidencePanel } from "./evidence-panel";
import { Thread, type ThreadMessage } from "./thread";
import { answerFor, mentionsSfdc, type PinPayload } from "./answers";
import { TABLE, type EvidenceId } from "./data";

function displayName(slug: string) {
  if (slug.includes("_")) return slug;
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const LAST_ANALYZED: Record<string, string> = {
  orders: "15 hours ago",
  customer_data: "2 hours ago",
};
function lastAnalyzed(slug: string) {
  return LAST_ANALYZED[slug] ?? "2 hours ago";
}

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
    setCollapsed(true);
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
        <div className="flex items-center gap-3 pb-3">
          <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center">
            <SourceLogo source="Databricks" />
          </span>
          <div className="min-w-0">
            <div className="text-[17px] font-semibold" style={{ color: "var(--ink-900)" }}>
              {displayName(tableName ?? TABLE.name)}
            </div>
            <div
              className="mt-0.5 flex items-center gap-1.5 text-[12px]"
              style={{ color: "var(--ink-500)" }}
            >
              <span style={{ color: "var(--ink-300)" }}>
                <TableIcon size={13} />
              </span>
              <span>Table</span>
              <span style={{ color: "var(--ink-300)" }}>›</span>
              <span style={{ color: "var(--brand-blue)" }}>
                <DatasetIcon size={13} />
              </span>
              <span style={{ color: "var(--ink-700)" }}>{TABLE.name}</span>
            </div>
          </div>
          <span
            className="ml-auto inline-flex items-center gap-1.5 text-[12.5px]"
            style={{ color: "var(--ink-700)" }}
          >
            <Clock size={13} />
            Last analyzed {lastAnalyzed(tableName ?? TABLE.name)}
          </span>
        </div>

        {/* Conversation — brief opens it, then folds into a pinned summary bar */}
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <div className={collapsed ? "sticky top-0 z-10 pb-3" : ""} style={{ background: "var(--canvas)" }}>
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
          <div className={messages.length > 0 ? "mt-4" : ""}>
            <Thread messages={messages} onAsk={ask} onPin={addPin} />
          </div>
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
