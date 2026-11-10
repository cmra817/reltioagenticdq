import { useEffect, useMemo, useRef, useState } from "react";
import { Lock, Plus, Search, Sparkles, TriangleAlert, X } from "lucide-react";
import { DimensionBadge } from "@/components/dq-dimensions";
import { RuleModal } from "@/components/dq-checks/RuleModal";
import { MOCK_RULES, creatorLabel, type Creator, type Rule } from "@/components/dq-checks/mock-rules";
import type { Check } from "@/components/add-dataset/mock-checks";
import {
  ScheduleCard,
  frequencyLabel,
  type ScheduleConfig,
} from "@/components/add-dataset/Step3Schedule";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LineChart, ClipboardCheck } from "lucide-react";

/* ---------------------------------- shell --------------------------------- */

function ModalShell({
  open,
  title,
  subtitle,
  onClose,
  children,
  footer,
  width = "min(1040px, 94vw)",
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div
        className="absolute inset-0"
        style={{ background: "rgba(15,23,42,0.35)" }}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative flex max-h-[88vh] w-full flex-col overflow-hidden rounded-2xl border bg-white shadow-xl"
        style={{ borderColor: "var(--hairline)", width }}
      >
        <div
          className="flex items-start justify-between gap-4 border-b px-6 py-4"
          style={{ borderColor: "var(--hairline)" }}
        >
          <div>
            <div className="text-[17px] font-semibold" style={{ color: "var(--ink-900)" }}>
              {title}
            </div>
            {subtitle && (
              <div className="mt-0.5 text-[13px]" style={{ color: "var(--ink-500)" }}>
                {subtitle}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-[color:var(--surface-soft)]"
            style={{ color: "var(--ink-500)" }}
          >
            <X size={16} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>

        {footer && (
          <div
            className="flex items-center justify-end gap-2 border-t px-6 py-4"
            style={{ borderColor: "var(--hairline)" }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

function PrimaryButton({
  children,
  onClick,
  danger = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md px-4 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
      style={{ background: danger ? "#dc2626" : "var(--brand-blue)" }}
    >
      {children}
    </button>
  );
}

function GhostButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md border px-4 py-2 text-[13px] font-medium transition-colors hover:bg-[color:var(--surface-soft)]"
      style={{ borderColor: "var(--hairline)", color: "var(--ink-700)" }}
    >
      {children}
    </button>
  );
}

/* ------------------------------ edit DQ checks ----------------------------- */

function CreatorBadge({ creator }: { creator: Creator }) {
  const managed = creator.kind === "reltio";
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px]" style={{ color: "var(--ink-700)" }}>
      {managed && <Lock size={12} style={{ color: "var(--ink-500)" }} />}
      {creatorLabel(creator)}
    </span>
  );
}

function ruleToCheck(rule: Rule, idPrefix = ""): Check {
  return {
    id: `${idPrefix}${rule.id}`,
    rule: rule.name,
    description: rule.description,
    dimension: rule.dimension,
    field: "(custom)",
    creator: rule.creator,
  };
}

const GRID =
  "grid grid-cols-[minmax(260px,2fr)_minmax(120px,0.7fr)_minmax(120px,0.7fr)_minmax(120px,0.7fr)_48px] gap-4";

export function EditChecksModal({
  open,
  tableName,
  checks,
  onClose,
  onSave,
}: {
  open: boolean;
  tableName: string;
  checks: Check[];
  onClose: () => void;
  onSave: (checks: Check[]) => void;
}) {
  const [draft, setDraft] = useState<Check[]>(checks);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setDraft(checks);
      setQuery("");
      setSearchOpen(false);
    }
  }, [open, checks]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const existingIds = useMemo(() => new Set(draft.map((c) => c.id)), [draft]);
  const q = query.trim().toLowerCase();
  const libraryResults = MOCK_RULES.filter(
    (r) =>
      !existingIds.has(`lib-${r.id}`) &&
      (q === "" ||
        r.name.toLowerCase().includes(q) ||
        r.dimension.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q)),
  ).slice(0, 6);

  const addCheck = (check: Check) =>
    setDraft((prev) => (prev.some((c) => c.id === check.id) ? prev : [...prev, check]));

  return (
    <ModalShell
      open={open}
      title="Edit DQ checks"
      subtitle={`${draft.length} ${draft.length === 1 ? "check" : "checks"} configured on ${tableName}`}
      onClose={onClose}
      footer={
        <>
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <PrimaryButton onClick={() => onSave(draft)}>Save checks</PrimaryButton>
        </>
      }
    >
      <TooltipProvider delayDuration={200}>
        <div className="px-6 py-5">
          <div
            className="flex items-start gap-2.5 rounded-xl border px-4 py-3"
            style={{ borderColor: "var(--hairline)", background: "rgba(67,134,250,0.06)" }}
          >
            <Sparkles size={15} className="mt-0.5 shrink-0" style={{ color: "var(--brand-blue)" }} />
            <div className="text-[13px]" style={{ color: "var(--ink-700)" }}>
              These are the checks currently running on this table. Remove any you don't need, or
              search your checks library to add more.
            </div>
          </div>

          <div className="mt-5 rounded-2xl border" style={{ borderColor: "var(--hairline)" }}>
            {/* Toolbar */}
            <div
              className="flex items-center justify-between gap-3 border-b px-6 py-3"
              style={{ borderColor: "var(--hairline)" }}
            >
              <div className="text-[13px] font-medium" style={{ color: "var(--ink-900)" }}>
                <span className="font-mono">{tableName}</span>{" "}
                <span style={{ color: "var(--ink-500)" }}>({draft.length})</span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <div className="relative" ref={searchRef}>
                  <Search
                    size={13}
                    className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--ink-500)" }}
                  />
                  <input
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setSearchOpen(true);
                    }}
                    onFocus={() => setSearchOpen(true)}
                    placeholder="Search checks library…"
                    className="w-[220px] rounded-full border bg-white py-1.5 pl-7 pr-3 text-[12px] outline-none focus:border-[color:var(--brand-blue)]"
                    style={{ borderColor: "var(--hairline)", color: "var(--ink-900)" }}
                  />
                  {searchOpen && (
                    <div
                      className="absolute right-0 top-[calc(100%+6px)] z-30 w-[380px] overflow-hidden rounded-xl border bg-white shadow-lg"
                      style={{ borderColor: "var(--hairline)" }}
                    >
                      {libraryResults.length === 0 ? (
                        <div className="px-4 py-3 text-[12px]" style={{ color: "var(--ink-500)" }}>
                          No other checks found in your library.
                        </div>
                      ) : (
                        libraryResults.map((rule) => (
                          <button
                            key={rule.id}
                            type="button"
                            onClick={() => {
                              addCheck(ruleToCheck(rule, "lib-"));
                              setQuery("");
                              setSearchOpen(false);
                            }}
                            className="flex w-full items-start gap-3 border-b px-4 py-2.5 text-left transition-colors last:border-b-0 hover:bg-[color:var(--surface-soft)]"
                            style={{ borderColor: "var(--hairline)" }}
                          >
                            <div className="min-w-0 flex-1">
                              <div
                                className="truncate text-[13px] font-medium"
                                style={{ color: "var(--ink-900)" }}
                              >
                                {rule.name}
                              </div>
                              <div
                                className="mt-0.5 line-clamp-1 text-[12px]"
                                style={{ color: "var(--ink-500)" }}
                              >
                                {rule.description}
                              </div>
                              <div className="mt-1.5">
                                <DimensionBadge label={rule.dimension} size="sm" />
                              </div>
                            </div>
                            <Plus size={14} className="mt-1 shrink-0" style={{ color: "var(--brand-blue)" }} />
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setRuleModalOpen(true)}
                  className="flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors"
                  style={{ background: "rgba(67,134,250,0.10)", color: "var(--brand-blue)" }}
                >
                  <Plus size={12} />
                  Checks
                </button>
              </div>
            </div>

            {/* Column headers */}
            <div
              className={`${GRID} border-b px-6 py-3 text-[11px] font-medium uppercase tracking-wide`}
              style={{ borderColor: "var(--hairline)", color: "var(--ink-500)" }}
            >
              <div>Name</div>
              <div>Dimension</div>
              <div>Creator</div>
              <div>Field applied</div>
              <div className="sr-only">Remove</div>
            </div>

            {/* Rows */}
            <div>
              {draft.length === 0 ? (
                <div className="px-6 py-10 text-center text-[13px]" style={{ color: "var(--ink-500)" }}>
                  No checks configured. Search your library or create a new check.
                </div>
              ) : (
                draft.map((check) => {
                  const creator = check.creator ?? ({ kind: "reltio" } as Creator);
                  return (
                    <div
                      key={check.id}
                      className={`${GRID} items-center border-b px-6 py-4 transition-colors last:border-b-0 hover:bg-[color:var(--surface-soft)]`}
                      style={{ borderColor: "var(--hairline)" }}
                    >
                      <div className="min-w-0">
                        <div
                          className="truncate text-[13px] font-medium"
                          style={{ color: "var(--ink-900)" }}
                        >
                          {check.rule}
                        </div>
                        {check.description && (
                          <div
                            className="mt-0.5 line-clamp-1 text-[12px]"
                            style={{ color: "var(--ink-500)" }}
                          >
                            {check.description}
                          </div>
                        )}
                      </div>
                      <div>
                        <DimensionBadge label={check.dimension} size="sm" />
                      </div>
                      <div>
                        <CreatorBadge creator={creator} />
                      </div>
                      <div className="font-mono text-[12px]" style={{ color: "var(--ink-700)" }}>
                        {check.field}
                      </div>
                      <div className="flex justify-end">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={() =>
                                setDraft((prev) => prev.filter((c) => c.id !== check.id))
                              }
                              className="inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-[color:var(--surface-soft)]"
                              style={{ color: "var(--ink-500)" }}
                              aria-label="Remove check"
                            >
                              <X size={14} />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">remove</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <RuleModal
          open={ruleModalOpen}
          mode="create"
          source={null}
          onClose={() => setRuleModalOpen(false)}
          onSave={(rule) => {
            addCheck(ruleToCheck(rule));
            setRuleModalOpen(false);
          }}
        />
      </TooltipProvider>
    </ModalShell>
  );
}

/* ----------------------------- edit schedules ----------------------------- */

export function EditSchedulesModal({
  open,
  tableName,
  checkCount,
  profiling,
  checks,
  onClose,
  onSave,
}: {
  open: boolean;
  tableName: string;
  checkCount: number;
  profiling: ScheduleConfig;
  checks: ScheduleConfig;
  onClose: () => void;
  onSave: (next: { profiling: ScheduleConfig; checks: ScheduleConfig }) => void;
}) {
  const [p, setP] = useState(profiling);
  const [c, setC] = useState(checks);

  useEffect(() => {
    if (open) {
      setP(profiling);
      setC(checks);
    }
  }, [open, profiling, checks]);

  return (
    <ModalShell
      open={open}
      title="Edit tasks"
      subtitle={`Profiling ${frequencyLabel(p).toLowerCase()} · Checks ${frequencyLabel(c).toLowerCase()} on ${tableName}`}
      onClose={onClose}
      width="min(880px, 94vw)"
      footer={
        <>
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <PrimaryButton onClick={() => onSave({ profiling: p, checks: c })}>
            Save tasks
          </PrimaryButton>
        </>
      }
    >
      <div className="grid gap-5 px-6 py-6 lg:grid-cols-2">
        <ScheduleCard
          icon={<LineChart size={17} />}
          title="Profiling"
          description="Column stats, distributions, and history used to detect drift."
          value={p}
          onChange={setP}
        />
        <ScheduleCard
          icon={<ClipboardCheck size={17} />}
          title="DQ checks"
          description={`Runs the ${checkCount} ${checkCount === 1 ? "check" : "checks"} configured on this table.`}
          value={c}
          onChange={setC}
        />
      </div>
    </ModalShell>
  );
}

/* -------------------------- remove from monitoring ------------------------ */

export function RemoveFromMonitoringModal({
  open,
  tableName,
  onClose,
  onConfirm,
}: {
  open: boolean;
  tableName: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <ModalShell
      open={open}
      title="Remove from monitoring"
      onClose={onClose}
      width="min(520px, 94vw)"
      footer={
        <>
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <PrimaryButton danger onClick={onConfirm}>
            Remove from monitoring
          </PrimaryButton>
        </>
      }
    >
      <div className="flex items-start gap-3 px-6 py-6">
        <span
          className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
          style={{ background: "rgba(220,38,38,0.10)", color: "#dc2626" }}
        >
          <TriangleAlert size={17} />
        </span>
        <div>
          <div className="text-[14px] font-medium" style={{ color: "var(--ink-900)" }}>
            Stop monitoring <span className="font-mono">{tableName}</span>?
          </div>
          <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: "var(--ink-700)" }}>
            Profiling and DQ checks will stop running, scheduled tasks will be cancelled, and this
            table will no longer appear in Explore or Data health. Existing history is kept, and you
            can add the table back later through Add new dataset.
          </p>
        </div>
      </div>
    </ModalShell>
  );
}
