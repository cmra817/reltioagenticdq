import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Copy, RotateCcw, Search, Sparkles, TriangleAlert, X } from "lucide-react";
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
  contained = false,
  initialDescription,
}: {
  open: boolean;
  mode: Mode;
  source?: Rule | null;
  onClose: () => void;
  onSave: (rule: Rule) => void;
  /** Render inside the nearest positioned parent instead of over the whole screen. */
  contained?: boolean;
  /** Prefill "Describe it" and generate a pattern straight away. */
  initialDescription?: string;
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
  type TestResult = {
    passed: number;
    failed: number;
    lines: { value: string; ok: boolean }[];
    logicKey: string;
  };
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [testOpen, setTestOpen] = useState(false);
  /** Description the current definition was generated from; null = never generated. */
  const [generatedFrom, setGeneratedFrom] = useState<string | null>(null);
  const [nameEdited, setNameEdited] = useState(false);
  const [thresholdEdited, setThresholdEdited] = useState(false);
  const [patternEdited, setPatternEdited] = useState(false);
  const columnResults = useMemo(() => searchColumns(columnQuery), [columnQuery]);

  useEffect(() => {
    if (!open) return;
    setTestResult(null);
    setTestOpen(false);
    setNameEdited(false);
    setThresholdEdited(false);
    setPatternEdited(false);
    if (source) {
      setName(mode === "clone" ? `Copy of ${source.name}` : source.name);
      setDimension(source.dimension);
      setDimensionSuggested(false);
      setDescription(source.description);
      setPattern(source.pattern);
      setExpectation(source.expectation);
      setThreshold(source.threshold);
      setGeneratedFrom(null);
      setTab("direct");
    } else {
      setName("");
      setDimension("Validity");
      setDimensionSuggested(true);
      setDescription("");
      setPattern("");
      setExpectation("expect_column_values_to_match_regex");
      setThreshold(5);
      setGeneratedFrom(null);
      setTab("describe");
      if (initialDescription) {
        const sg = suggestFromDescription(initialDescription);
        setDescription(initialDescription);
        setPattern(sg.pattern);
        setExpectation(sg.expectation);
        setThreshold(sg.threshold);
        setDimension(sg.dimension);
        setName(sg.name);
        setGeneratedFrom(initialDescription);
      }
    }
    setSampleMode(HAS_CONNECTED_SOURCES ? "column" : "manual");
    setColumnQuery("");
    setSelectedColumn(null);
    setManualStrings("");
  }, [open, mode, source, initialDescription]);

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
    const fail = `Fails the rule when more than ${threshold}% of values don't comply.`;
    if (expectation === "expect_column_values_to_not_be_null")
      return `Flags rows where the column is null or empty. ${fail}`;
    if (expectation === "expect_column_values_to_be_unique")
      return `Flags duplicate values so the column stays unique. ${fail}`;
    if (expectation === "expect_column_values_to_be_in_set")
      return `Flags values that are not present in ${p}. ${fail}`;
    if (expectation === "expect_column_values_to_be_between")
      return `Flags values outside ${p}. ${fail}`;
    if (expectation === "expect_column_pair_values_a_to_be_greater_than_b")
      return `Flags rows where ${p} does not hold. ${fail}`;
    return `Flags ${dimension.toLowerCase()} issues by checking values against ${p}. ${fail}`;
  }, [dimension, expectation, pattern, threshold]);

  const needsPattern =
    expectation !== "expect_column_values_to_not_be_null" &&
    expectation !== "expect_column_values_to_be_unique";

  const patternError = useMemo(() => {
    const p = pattern.trim();
    if (!needsPattern) return null;
    if (!p) return "Add a pattern or expression.";
    if (expectation === "expect_column_values_to_be_between") {
      return /min=-?\d|max=-?\d/.test(p) ? null : "Use min=… and/or max=…, e.g. min=0, max=100.";
    }
    if (expectation === "expect_column_values_to_match_regex") {
      try {
        new RegExp(p);
        return null;
      } catch (e) {
        return `Invalid pattern: ${e instanceof Error ? e.message.replace(/^Invalid regular expression: /, "") : "check the syntax"}`;
      }
    }
    return null;
  }, [pattern, expectation, needsPattern]);

  const logicKey = `${expectation}::${pattern}`;
  const testOutdated = testResult !== null && testResult.logicKey !== logicKey;
  const hasDefinition = needsPattern ? pattern.trim().length > 0 : true;
  const descChanged = generatedFrom !== null && description.trim() !== generatedFrom.trim();
  const canSave = name.trim().length > 0 && hasDefinition && !patternError && !descChanged;

  function generatePattern() {
    if (!description.trim()) {
      toast.error("Describe the rule first");
      return;
    }
    const s = suggestFromDescription(description);
    const replacedManual = patternEdited && pattern.trim() && pattern !== s.pattern;
    setPattern(s.pattern);
    setPatternEdited(false);
    setExpectation(s.expectation);
    if (!thresholdEdited) setThreshold(s.threshold);
    if (dimensionSuggested) setDimension(s.dimension);
    if (!nameEdited) setName(s.name);
    setGeneratedFrom(description);
    if (s.column) {
      const match = searchColumns(s.column)[0];
      if (match) {
        setSampleMode("column");
        setSelectedColumn(match);
        setColumnQuery(s.column);
      }
    }
    if (replacedManual) {
      toast.message("Pattern regenerated", {
        description: "Your manual pattern edit was replaced. Name, dimension and threshold you set were kept.",
      });
    } else {
      toast.success(
        s.column
          ? `Generated a ${s.dimension.toLowerCase()} rule for ${s.column}`
          : `Generated a ${s.dimension.toLowerCase()} rule`,
      );
    }
  }

  function runTest() {
    const values =
      sampleMode === "manual"
        ? manualStrings.split("\n").map((v) => v.trim()).filter(Boolean)
        : (selectedColumn?.samples ?? CONNECTED_COLUMNS[0].samples);

    let evaluate: (value: string, i: number) => boolean;

    if (expectation === "expect_column_values_to_not_be_null") {
      evaluate = (value) => value.trim().length > 0 && !/^(null|n\/a|-)$/i.test(value.trim());
    } else if (expectation === "expect_column_values_to_be_unique") {
      const seen = new Set<string>();
      evaluate = (value) => {
        const key = value.trim().toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      };
    } else if (expectation === "expect_column_values_to_be_between") {
      const min = Number(pattern.match(/min=(-?\d+(?:\.\d+)?)/)?.[1] ?? Number.NEGATIVE_INFINITY);
      const max = Number(pattern.match(/max=(-?\d+(?:\.\d+)?)/)?.[1] ?? Number.POSITIVE_INFINITY);
      evaluate = (value) => {
        const n = Number(value.replace(/[^0-9.-]/g, ""));
        return Number.isFinite(n) && n >= min && n <= max;
      };
    } else {
      let re: RegExp | null = null;
      try {
        re = new RegExp(pattern);
      } catch {
        re = null;
      }
      evaluate = (value, i) => (re ? re.test(value) : i % 5 !== 2);
    }

    const lines = values.map((value, i) => ({ value, ok: evaluate(value, i) }));
    setTestResult({
      passed: lines.filter((l) => l.ok).length,
      failed: lines.filter((l) => !l.ok).length,
      lines,
      logicKey,
    });
  }

  function save() {
    if (!canSave) return;
    onSave({
      id: source && mode === "edit" ? source.id : `r-${Date.now()}`,
      name: name.trim(),
      dimension,
      description: description.trim() || "Custom rule created in the rules library.",
      creator: mode === "edit" && source ? source.creator : { kind: "me" },
      columns: source?.columns ?? 1,
      passRate: source?.passRate ?? 100,
      expectation,
      pattern,
      threshold,
    });
  }

  const focusRing =
    "outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-blue)] focus-visible:ring-offset-1";

  if (!open) return null;

  const saveLabel = mode === "edit" ? "Save" : "Create rule";
  const saveHint = !name.trim()
    ? "Give the rule a name"
    : descChanged
      ? "Regenerate the rule or undo description changes first"
      : !hasDefinition || patternError
        ? "Add a valid rule definition"
        : undefined;

  return (
    <div className={`${contained ? "absolute z-[40] max-sm:fixed max-sm:p-0" : "fixed z-[70]"} inset-0 flex items-center justify-center p-6`}>
      <button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        onClick={onClose}
        className={`${contained ? "absolute" : "fixed"} inset-0 cursor-default`}
        style={{ background: "rgba(15,23,42,0.42)" }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="rule-modal-title"
        className="relative z-10 flex max-h-full w-full max-w-[720px] flex-col overflow-hidden rounded-2xl border bg-white"
        style={{ borderColor: "var(--hairline)", boxShadow: "0 24px 64px rgba(15,23,42,0.22)" }}
      >
        <div className="relative shrink-0 px-7 pb-2 pt-6">
          {contained && (
            <button type="button" aria-label="Close" onClick={onClose} className={`absolute right-5 top-5 rounded-full p-2 hover:bg-[color:var(--surface-soft)] ${focusRing}`}>
              <X size={18} />
            </button>
          )}
          <h2 id="rule-modal-title" className="text-[22px] font-semibold" style={{ color: "var(--ink-900)" }}>
            {mode === "edit" ? "Edit rule" : mode === "clone" ? "Clone rule" : "Create a new rule"}
          </h2>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="space-y-5 px-7 py-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="rule-name"><Label>Name</Label></label>
                <input
                  id="rule-name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setNameEdited(true);
                  }}
                  placeholder="Email format validation"
                  className="w-full rounded-lg border px-3 py-2 text-[14px] outline-none focus:border-[color:var(--brand-blue)] focus-visible:ring-2 focus-visible:ring-[color:var(--brand-blue)]/30"
                  style={fieldStyle}
                />
              </div>
              <div>
                <label htmlFor="rule-dimension"><Label>Dimension</Label></label>
                <select
                  id="rule-dimension"
                  value={dimension}
                  onChange={(e) => {
                    setDimension(e.target.value as Dimension);
                    setDimensionSuggested(false);
                  }}
                  className="w-full rounded-lg border bg-white px-3 py-2 text-[14px] outline-none focus:border-[color:var(--brand-blue)] focus-visible:ring-2 focus-visible:ring-[color:var(--brand-blue)]/30"
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
                role="tablist"
                aria-label="How to define the rule"
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
                    role="tab"
                    aria-selected={tab === key}
                    onClick={() => setTab(key)}
                    className={`rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${focusRing}`}
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
                    aria-label="Describe the rule"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    placeholder="e.g., validate email addresses"
                    className="w-full resize-y rounded-lg border px-3 py-2 text-[14px] outline-none focus:border-[color:var(--brand-blue)] focus-visible:ring-2 focus-visible:ring-[color:var(--brand-blue)]/30"
                    style={fieldStyle}
                  />
                  {descChanged ? (
                    <div
                      role="status"
                      className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border px-3 py-2 text-[13px]"
                      style={{ borderColor: "rgba(194,65,12,0.30)", background: "rgba(194,65,12,0.06)", color: "var(--ink-900)" }}
                    >
                      <TriangleAlert size={14} style={{ color: "#c2410c" }} aria-hidden />
                      <span className="flex-1">Description changed. Regenerate to update the rule.</span>
                      <button
                        type="button"
                        onClick={() => setDescription(generatedFrom ?? "")}
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[12px] font-medium underline-offset-2 hover:underline ${focusRing}`}
                        style={{ color: "var(--ink-700)" }}
                      >
                        <RotateCcw size={12} aria-hidden />
                        Undo description changes
                      </button>
                      <button
                        type="button"
                        onClick={generatePattern}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium text-white ${focusRing}`}
                        style={{ background: "var(--brand-blue)" }}
                      >
                        <Sparkles size={14} aria-hidden />
                        Regenerate rule
                      </button>
                    </div>
                  ) : (
                    <div className="mt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={generatePattern}
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[13px] font-medium transition-colors ${focusRing}`}
                        style={{
                          borderColor: "var(--brand-blue)",
                          color: "var(--brand-blue)",
                          background: "rgba(67,134,250,0.08)",
                        }}
                      >
                        <Sparkles size={14} aria-hidden />
                        {generatedFrom !== null ? "Regenerate rule" : "Generate pattern"}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-3 text-[13px]" style={{ color: "var(--ink-500)" }}>
                  Edit the pattern below. Your description and any generated logic are kept.
                </div>
              )}
            </div>

            {/* Rule logic */}
            <div
              className="rounded-xl border p-3"
              style={{ borderColor: "var(--hairline)", background: "var(--surface-soft)" }}
            >
              <div className="truncate text-[12px]" style={{ color: "var(--ink-500)" }}>
                Expectation: <span className="font-mono" style={{ color: "var(--ink-700)" }}>{expectation}</span>
              </div>

              {tab === "describe" ? (
                <div
                  className="mt-2 flex items-start gap-2 rounded-lg px-3 py-2"
                  style={{ background: "rgba(15,23,42,0.05)" }}
                >
                  <pre
                    aria-label="Generated pattern"
                    className="min-w-0 flex-1 whitespace-pre-wrap break-all font-mono text-[13px]"
                    style={{ color: pattern ? "var(--ink-900)" : "var(--ink-500)" }}
                  >
                    <code>{pattern || (needsPattern ? "Generated pattern appears here" : "No pattern needed for this rule type")}</code>
                  </pre>
                  {pattern && (
                    <button
                      type="button"
                      aria-label="Copy pattern"
                      onClick={() => {
                        navigator.clipboard?.writeText(pattern);
                        toast.success("Copied pattern");
                      }}
                      className={`shrink-0 rounded p-1 hover:bg-white ${focusRing}`}
                      style={{ color: "var(--ink-500)" }}
                    >
                      <Copy size={14} />
                    </button>
                  )}
                </div>
              ) : (
                <div className="mt-2">
                  <label htmlFor="rule-pattern" className="sr-only">Pattern or expression</label>
                  <input
                    id="rule-pattern"
                    value={pattern}
                    onChange={(e) => {
                      setPattern(e.target.value);
                      setPatternEdited(true);
                    }}
                    placeholder="^[a-zA-Z0-9._%+-]+@..."
                    aria-invalid={!!patternError}
                    aria-describedby={patternError ? "rule-pattern-error" : undefined}
                    className="w-full rounded-lg border bg-white px-3 py-2 font-mono text-[13px] outline-none focus:border-[color:var(--brand-blue)] focus-visible:ring-2 focus-visible:ring-[color:var(--brand-blue)]/30"
                    style={{ ...fieldStyle, borderColor: patternError && pattern ? "#c2410c" : "var(--hairline)" }}
                  />
                  {patternError && (pattern || patternEdited) && (
                    <div id="rule-pattern-error" className="mt-1.5 text-[12px]" style={{ color: "#c2410c" }}>
                      {patternError}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[14px]" style={{ color: "var(--ink-900)" }}>
              <span id="threshold-label">Fail rule if more than</span>
              <input
                type="number"
                min={0}
                max={100}
                aria-labelledby="threshold-label threshold-suffix"
                value={threshold}
                onChange={(e) => {
                  setThreshold(Number(e.target.value));
                  setThresholdEdited(true);
                }}
                className="w-16 rounded-lg border px-2 py-1.5 text-[14px] outline-none focus:border-[color:var(--brand-blue)] focus-visible:ring-2 focus-visible:ring-[color:var(--brand-blue)]/30"
                style={fieldStyle}
              />
              <span id="threshold-suffix">% of values don't match</span>
            </div>

            <div>
              <div className="text-[14px] font-semibold" style={{ color: "var(--ink-900)" }}>
                What this rule does
              </div>
              <p className="mt-1 text-[13px]" style={{ color: "var(--ink-700)" }} aria-live="polite">
                {summary}
              </p>
            </div>
          </div>

          {/* Optional testing */}
          <div className="border-t" style={{ borderColor: "var(--hairline)" }}>
            <button
              type="button"
              aria-expanded={testOpen}
              aria-controls="rule-test-panel"
              onClick={() => setTestOpen((o) => !o)}
              className={`flex w-full items-center justify-between gap-2 px-7 py-4 text-left hover:bg-[color:var(--surface-soft)] ${focusRing} focus-visible:ring-inset`}
            >
              <span className="text-[14px] font-medium" style={{ color: "var(--ink-900)" }}>
                Test rule <span className="font-normal" style={{ color: "var(--ink-500)" }}>— Optional</span>
              </span>
              <ChevronDown
                size={16}
                aria-hidden
                className="transition-transform"
                style={{ color: "var(--ink-500)", transform: testOpen ? "rotate(180deg)" : "none" }}
              />
            </button>

            {testOpen && (
              <div id="rule-test-panel" className="px-7 pb-5">
                <div className="mb-1.5 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    disabled={sampleMode === "manual" && !HAS_CONNECTED_SOURCES}
                    onClick={() => {
                      setSampleMode(sampleMode === "manual" ? "column" : "manual");
                      setTestResult(null);
                    }}
                    className={`rounded text-[12px] underline disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}
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
                          className={`rounded ${focusRing}`}
                          style={{ color: "var(--ink-500)" }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={runTest}
                        disabled={!!patternError}
                        className={`rounded-lg border bg-white px-4 py-2 text-[13px] font-medium disabled:opacity-50 ${focusRing}`}
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
                        aria-label="Search a connected column"
                        value={columnQuery}
                        onChange={(e) => setColumnQuery(e.target.value)}
                        placeholder="Search any connected column, e.g. 'email'"
                        className="w-full rounded-lg border bg-white py-2 pl-9 pr-3 text-[13px] outline-none focus:border-[color:var(--brand-blue)]"
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
                                className={`flex w-full items-center gap-1 px-3 py-2 text-left font-mono text-[13px] hover:bg-[color:var(--surface-soft)] ${focusRing} focus-visible:ring-inset`}
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
                      aria-label="Test values, one per line"
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
                        disabled={!!patternError}
                        className={`rounded-lg border bg-white px-4 py-2 text-[13px] font-medium disabled:opacity-50 ${focusRing}`}
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
                    style={{ borderColor: "var(--hairline)", opacity: testOutdated ? 0.6 : 1 }}
                  >
                    <div className="flex items-center gap-2 text-[12px]" style={{ color: "var(--ink-500)" }}>
                      <span>{testResult.passed} passed · {testResult.failed} failed</span>
                      {testOutdated && (
                        <span className="rounded px-1.5 py-0.5 font-medium" style={{ background: "rgba(194,65,12,0.10)", color: "#c2410c" }}>
                          Outdated — rule logic changed, run again
                        </span>
                      )}
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
            )}
          </div>
        </div>

        <div
          className="flex shrink-0 items-center justify-end gap-2 border-t px-7 py-4"
          style={{ borderColor: "var(--hairline)" }}
        >
          <button
            type="button"
            onClick={onClose}
            className={`rounded-lg border bg-white px-4 py-2 text-[14px] font-medium ${focusRing}`}
            style={{ borderColor: "var(--hairline)", color: "var(--ink-700)" }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!canSave}
            title={saveHint}
            className={`rounded-lg px-4 py-2 text-[14px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}
            style={{ background: "var(--brand-blue)" }}
          >
            {saveLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
