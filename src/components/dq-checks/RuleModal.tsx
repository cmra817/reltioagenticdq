import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Search, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import {
  CONNECTED_COLUMNS,
  HAS_CONNECTED_SOURCES,
  searchColumns,
  type ConnectedColumn,
} from "./mock-columns";
import {
  DIMENSIONS,
  suggestFromDescription,
  type Dimension,
  type Rule,
} from "./mock-rules";


type Mode = "create" | "clone" | "edit";

const fieldStyle: React.CSSProperties = {
  borderColor: "var(--hairline)",
  color: "var(--ink-900)",
};

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-1.5 text-[12px] font-medium" style={{ color: "var(--ink-500)" }}>
      {children}
    </div>
  );
}

export function RuleModal({
  open,
  mode,
  source,
  onClose,
  onSave,
}: {
  open: boolean;
  mode: Mode;
  source?: Rule | null;
  onClose: () => void;
  onSave: (rule: Rule) => void;
}) {
  const [name, setName] = useState("");
  const [dimension, setDimension] = useState<Dimension>("Validity");
  const [dimensionSuggested, setDimensionSuggested] = useState(true);
  const [tab, setTab] = useState<"describe" | "direct">("describe");
  const [description, setDescription] = useState("");
  const [pattern, setPattern] = useState("");
  const [expectation, setExpectation] = useState("expect_column_values_to_match_regex");
  const [sampleMode, setSampleMode] = useState<"column" | "manual">(
    HAS_CONNECTED_SOURCES ? "column" : "manual",
  );
  const [columnQuery, setColumnQuery] = useState("");
  const [selectedColumn, setSelectedColumn] = useState<ConnectedColumn | null>(null);
  const [manualStrings, setManualStrings] = useState("");
  const [threshold, setThreshold] = useState(5);
  const [testResult, setTestResult] = useState<null | { passed: number; failed: number; lines: { value: string; ok: boolean }[] }>(null);
  const columnResults = useMemo(() => searchColumns(columnQuery), [columnQuery]);


  useEffect(() => {
    if (!open) return;
    setTestResult(null);
    if (source) {
      setName(mode === "clone" ? `Copy of ${source.name}` : source.name);
      setDimension(source.dimension);
      setDimensionSuggested(false);
      setDescription(source.description);
      setPattern(source.pattern);
      setExpectation(source.expectation);
      setThreshold(source.threshold);
      setTab("direct");
    } else {
      setName("");
      setDimension("Validity");
      setDimensionSuggested(true);
      setDescription("");
      setPattern("");
      setExpectation("expect_column_values_to_match_regex");
      setThreshold(5);
      setTab("describe");
    }
    setSampleMode("column");
    setManualStrings("");
  }, [open, mode, source]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const summary = useMemo(() => {
    const p = pattern.trim() || "the generated pattern";
    return `Flags ${dimension.toLowerCase()} issues by checking values against ${p}, and fails the rule when more than ${threshold}% of values don't match.`;
  }, [dimension, pattern, threshold]);

  function generatePattern() {
    const s = suggestFromDescription(description);
    setPattern(s.pattern);
    setExpectation(s.expectation);
    if (dimensionSuggested) setDimension(s.dimension);
    toast.success("Pattern generated from description");
  }

  function runTest() {
    const values =
      sampleMode === "manual"
        ? manualStrings.split("\n").map((v) => v.trim()).filter(Boolean)
        : [
            "molly.gordon@reltio.com",
            "a.rivera@example.co",
            "not-an-email",
            "jpark@corp.io",
            "missing@tld",
          ];
    let re: RegExp | null = null;
    try {
      re = new RegExp(pattern);
    } catch {
      re = null;
    }
    const lines = values.map((value, i) => ({
      value,
      ok: re ? re.test(value) : i % 5 !== 2,
    }));
    setTestResult({
      passed: lines.filter((l) => l.ok).length,
      failed: lines.filter((l) => !l.ok).length,
      lines,
    });
  }

  function save() {
    if (!name.trim()) {
      toast.error("Give the rule a name");
      return;
    }
    onSave({
      id: source && mode === "edit" ? source.id : `r-${Date.now()}`,
      name: name.trim(),
      dimension,
      description: description.trim() || "Custom rule created in the rules library.",
      creator: { kind: "me" },
      columns: source?.columns ?? 1,
      passRate: source?.passRate ?? 100,
      expectation,
      pattern,
      threshold,
    });
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto p-6">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="fixed inset-0 cursor-default"
        style={{ background: "rgba(15,23,42,0.42)" }}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 my-6 w-full max-w-[720px] rounded-2xl border bg-white"
        style={{ borderColor: "var(--hairline)", boxShadow: "0 24px 64px rgba(15,23,42,0.22)" }}
      >
        <div className="px-7 pt-6">
          <h2 className="text-[22px] font-semibold" style={{ color: "var(--ink-900)" }}>
            {mode === "edit" ? "Edit rule" : mode === "clone" ? "Clone rule" : "Create a new rule"}
          </h2>
        </div>

        <div className="space-y-5 px-7 py-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Name</Label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Email format validation"
                className="w-full rounded-lg border px-3 py-2 text-[14px] outline-none focus:border-[color:var(--brand-blue)]"
                style={fieldStyle}
              />
            </div>
            <div>
              <Label>Dimension</Label>
              <select
                value={dimension}
                onChange={(e) => {
                  setDimension(e.target.value as Dimension);
                  setDimensionSuggested(false);
                }}
                className="w-full rounded-lg border bg-white px-3 py-2 text-[14px] outline-none focus:border-[color:var(--brand-blue)]"
                style={fieldStyle}
              >
                {DIMENSIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                    {dimensionSuggested && d === dimension ? " — suggested" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div
              className="inline-flex rounded-lg border p-1"
              style={{ borderColor: "var(--hairline)", background: "var(--surface-soft)" }}
            >
              {(
                [
                  ["describe", "Describe it"],
                  ["direct", "Write it directly"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className="rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors"
                  style={{
                    background: tab === key ? "#fff" : "transparent",
                    color: tab === key ? "var(--ink-900)" : "var(--ink-500)",
                    boxShadow: tab === key ? "0 1px 2px rgba(15,23,42,0.10)" : "none",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {tab === "describe" ? (
              <div className="mt-3">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="e.g., validate email addresses"
                  className="w-full resize-y rounded-lg border px-3 py-2 text-[14px] outline-none focus:border-[color:var(--brand-blue)]"
                  style={fieldStyle}
                />
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={generatePattern}
                    className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[13px] font-medium transition-colors"
                    style={{
                      borderColor: "var(--brand-blue)",
                      color: "var(--brand-blue)",
                      background: "rgba(67,134,250,0.08)",
                    }}
                  >
                    <Sparkles size={14} />
                    Generate pattern
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-3">
                <Label>Pattern or expression</Label>
                <input
                  value={pattern}
                  onChange={(e) => setPattern(e.target.value)}
                  placeholder="^[a-zA-Z0-9._%+-]+@..."
                  className="w-full rounded-lg border px-3 py-2 font-mono text-[13px] outline-none focus:border-[color:var(--brand-blue)]"
                  style={fieldStyle}
                />
              </div>
            )}
          </div>

          <div
            className="rounded-xl border p-3"
            style={{ borderColor: "var(--hairline)", background: "var(--surface-soft)" }}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="truncate text-[12px]" style={{ color: "var(--ink-500)" }}>
                Expectation: <span className="font-mono">{expectation}</span>
              </div>
              <button
                type="button"
                aria-label="Copy expectation"
                onClick={() => {
                  navigator.clipboard?.writeText(`${expectation}(${pattern})`);
                  toast.success("Copied expectation");
                }}
                style={{ color: "var(--ink-500)" }}
              >
                <Copy size={14} />
              </button>
            </div>
            <input
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="Generated pattern appears here"
              className="mt-2 w-full rounded-lg border bg-white px-3 py-2 font-mono text-[13px] outline-none focus:border-[color:var(--brand-blue)]"
              style={fieldStyle}
            />

            <div className="mt-3">
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <div className="text-[12px] font-medium" style={{ color: "var(--ink-500)" }}>
                  Test this pattern
                </div>
                <button
                  type="button"
                  disabled={sampleMode === "manual" && !HAS_CONNECTED_SOURCES}
                  onClick={() => {
                    setSampleMode(sampleMode === "manual" ? "column" : "manual");
                    setTestResult(null);
                  }}
                  className="text-[12px] underline disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ color: "var(--ink-500)" }}
                >
                  {sampleMode === "manual"
                    ? "Search a real column instead"
                    : "Enter test strings manually instead"}
                </button>
              </div>

              {sampleMode === "manual" && !HAS_CONNECTED_SOURCES && (
                <div className="mb-2 text-[12px]" style={{ color: "var(--ink-500)" }}>
                  Connect a source to test against real data.
                </div>
              )}

              {sampleMode === "column" ? (
                selectedColumn ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <div
                      className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-[13px]"
                      style={{ borderColor: "var(--hairline)", color: "var(--ink-900)" }}
                    >
                      <span className="font-mono">
                        {selectedColumn.source} › {selectedColumn.table} › {selectedColumn.column}
                      </span>
                      <span style={{ color: "var(--ink-500)" }}>sampling 50 recent values</span>
                      <button
                        type="button"
                        aria-label="Clear selected column"
                        onClick={() => {
                          setSelectedColumn(null);
                          setColumnQuery("");
                          setTestResult(null);
                        }}
                        style={{ color: "var(--ink-500)" }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={runTest}
                      className="rounded-lg border bg-white px-4 py-2 text-[13px] font-medium"
                      style={{ borderColor: "var(--hairline)", color: "var(--ink-900)" }}
                    >
                      Run test
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search
                      size={14}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
                      style={{ color: "var(--ink-500)" }}
                    />
                    <input
                      value={columnQuery}
                      onChange={(e) => setColumnQuery(e.target.value)}
                      placeholder="Search any connected column, e.g. 'email'"
                      className="w-full rounded-lg border bg-white pl-9 pr-3 py-2 text-[13px] outline-none focus:border-[color:var(--brand-blue)]"
                      style={fieldStyle}
                    />
                    {columnResults.length > 0 && (
                      <ul
                        className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border bg-white py-1"
                        style={{ borderColor: "var(--hairline)", boxShadow: "0 12px 28px rgba(15,23,42,0.14)" }}
                      >
                        {columnResults.map((c) => (
                          <li key={c.id}>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedColumn(c);
                                setTestResult(null);
                              }}
                              className="flex w-full items-center gap-1 px-3 py-2 text-left font-mono text-[13px] hover:bg-[color:var(--surface-soft)]"
                              style={{ color: "var(--ink-700)" }}
                            >
                              <span>{c.source}</span>
                              <span style={{ color: "var(--ink-500)" }}>›</span>
                              <span>{c.table}</span>
                              <span style={{ color: "var(--ink-500)" }}>›</span>
                              <span style={{ color: "var(--ink-900)" }}>{c.column}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )
              ) : (
                <div>
                  <textarea
                    value={manualStrings}
                    onChange={(e) => setManualStrings(e.target.value)}
                    rows={3}
                    placeholder="Enter one test string per line"
                    className="w-full resize-y rounded-lg border bg-white px-3 py-2 font-mono text-[13px] outline-none focus:border-[color:var(--brand-blue)]"
                    style={fieldStyle}
                  />
                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={runTest}
                      className="rounded-lg border bg-white px-4 py-2 text-[13px] font-medium"
                      style={{ borderColor: "var(--hairline)", color: "var(--ink-900)" }}
                    >
                      Test
                    </button>
                  </div>
                </div>
              )}

              {testResult && (
                <div
                  className="mt-2 rounded-lg border bg-white p-3"
                  style={{ borderColor: "var(--hairline)" }}
                >
                  <div className="text-[12px]" style={{ color: "var(--ink-500)" }}>
                    {testResult.passed} passed · {testResult.failed} failed
                  </div>
                  <ul className="mt-2 space-y-1">
                    {testResult.lines.map((l, i) => (
                      <li key={`${l.value}-${i}`} className="flex items-center gap-2 font-mono text-[12px]">
                        <span style={{ color: l.ok ? "var(--brand-blue)" : "#c2410c" }}>
                          {l.ok ? "pass" : "fail"}
                        </span>
                        <span style={{ color: "var(--ink-700)" }}>{l.value}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

          </div>

          <div className="flex flex-wrap items-center gap-2 text-[14px]" style={{ color: "var(--ink-900)" }}>
            <span>Fail rule if more than</span>
            <input
              type="number"
              min={0}
              max={100}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-16 rounded-lg border px-2 py-1.5 text-[14px] outline-none focus:border-[color:var(--brand-blue)]"
              style={fieldStyle}
            />
            <span>% of values don't match</span>
          </div>

          <div
            className="flex items-start gap-2 rounded-xl border p-3 text-[13px]"
            style={{ borderColor: "var(--hairline)", color: "var(--ink-700)" }}
          >
            <Check size={14} className="mt-0.5 shrink-0" style={{ color: "var(--brand-blue)" }} />
            <div>
              <div className="font-medium" style={{ color: "var(--ink-900)" }}>
                What this rule does
              </div>
              <div className="mt-0.5">{summary}</div>
            </div>
          </div>
        </div>

        <div
          className="flex items-center justify-end gap-2 border-t px-7 py-4"
          style={{ borderColor: "var(--hairline)" }}
        >
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border bg-white px-4 py-2 text-[14px] font-medium"
            style={{ borderColor: "var(--hairline)", color: "var(--ink-700)" }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            className="rounded-lg px-4 py-2 text-[14px] font-medium text-white"
            style={{ background: "var(--brand-blue)" }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
