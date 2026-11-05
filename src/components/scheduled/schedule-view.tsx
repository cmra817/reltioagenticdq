import * as React from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Pencil, Play } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useDomainState } from "@/components/domain-context";
import {
  GhostButton,
  PrimaryButton,
  RunPill,
  ScopedChat,
  SectionTitle,
  SplitWorkspace,
  Tag,
} from "@/components/workspace/primitives";
import { REPEAT_PRESETS, tablesFor, type Schedule } from "@/lib/mock-ops";
import { useRules, useRuns, useSchedules } from "@/lib/ops-store";
import { ago } from "./format";
import { useScheduledNav } from "./nav";

const PERMISSIONS = ["Only you", "Everyone can view", "Domain team can view and run"];

/**
 * One schedule: run history in the center (with a chat scoped to the schedule),
 * its definition on the right.
 */
export function ScheduleView({ scheduleId }: { scheduleId: string }) {
  const go = useScheduledNav();
  const { schedules, update } = useSchedules();
  const { runs, startRun } = useRuns(schedules);
  const { rules } = useRules();
  const [editing, setEditing] = React.useState(false);

  const schedule = schedules.find((s) => s.id === scheduleId);
  if (!schedule) {
    return (
      <div className="p-8">
        <GhostButton onClick={() => go({ tab: "schedules" })}>Back to schedules</GhostButton>
        <p className="mt-4 text-[14px]" style={{ color: "var(--ink-500)" }}>
          This schedule isn't available.
        </p>
      </div>
    );
  }

  const history = runs.filter((r) => r.scheduleId === schedule.id);
  const running = history.some((r) => r.status === "running");
  const ruleName = (id: string) => rules.find((r) => r.id === id)?.name ?? "Deleted rule";

  function reply(q: string): string {
    if (/fail|why|wrong/i.test(q)) {
      const bad = history.find((r) => r.status === "failed" || r.status === "attention");
      return bad
        ? `The latest problem was ${ago(bad.hoursAgo)}: ${bad.checksFailed} of ${bad.checksRun} checks failed. Open that run to see the findings and ask about any of them.`
        : "This schedule hasn't failed recently.";
    }
    if (/cadence|often|time|when/i.test(q)) {
      return `It repeats ${schedule!.repeats.toLowerCase()}. Edit the schedule to change that, or tell me what you want and I'll draft the change.`;
    }
    return `${schedule!.name} has run ${history.length} times in the history I keep. ${history.filter((r) => r.status === "passed").length} passed.`;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 px-6 pt-4">
        <button
          type="button"
          onClick={() => go({ tab: "schedules" })}
          className="flex items-center gap-1.5 text-[13px]"
          style={{ color: "var(--ink-500)" }}
        >
          <ArrowLeft size={14} /> Schedules
        </button>
      </div>

      <SplitWorkspace
        panelLabel="Schedule definition"
        panelWidth={380}
        center={
          <ScopedChat
            key={schedule.id}
            scopeLabel="This schedule"
            placeholder="Ask about this schedule…"
            suggestions={["Why did the last run fail?", "How often does this run?"]}
            reply={reply}
            header={
              <section aria-label="Run history">
                <h1 className="text-[20px] font-semibold" style={{ color: "var(--ink-900)" }}>
                  {schedule.name}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <Tag>{schedule.domain}</Tag>
                  <Tag>{schedule.kind}</Tag>
                  {!schedule.active && <Tag>Paused</Tag>}
                </div>
                <h2
                  className="mb-2 mt-6 text-[13px] font-semibold"
                  style={{ color: "var(--ink-900)" }}
                >
                  Run history
                </h2>
                {history.length === 0 ? (
                  <p className="text-[13.5px]" style={{ color: "var(--ink-500)" }}>
                    This schedule hasn't run yet.
                  </p>
                ) : (
                  <ul
                    className="divide-y rounded-xl border bg-white"
                    style={{ borderColor: "var(--hairline)" }}
                  >
                    {history.map((r) => (
                      <li key={r.id}>
                        <button
                          type="button"
                          onClick={() => go({ run: r.id })}
                          className="flex w-full items-center gap-4 px-4 py-2.5 text-left hover:bg-[color:var(--surface-soft)]"
                        >
                          <span className="w-[120px] shrink-0">
                            <RunPill status={r.status} />
                          </span>
                          <span
                            className="min-w-0 flex-1 text-[13px]"
                            style={{ color: "var(--ink-700)" }}
                          >
                            {r.status === "running"
                              ? "In progress"
                              : r.checksRun === 0
                                ? "Profiled, no checks"
                                : `${r.checksFailed} of ${r.checksRun} checks failed`}
                          </span>
                          <span className="text-[12.5px]" style={{ color: "var(--ink-300)" }}>
                            {ago(r.hoursAgo)}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            }
          />
        }
        panel={
          <div className="space-y-6 p-5">
            <div className="flex items-center justify-between gap-3">
              <label
                className="flex items-center gap-2.5 text-[13.5px]"
                style={{ color: "var(--ink-900)" }}
              >
                <Switch
                  checked={schedule.active}
                  onCheckedChange={(on) =>
                    update(schedule.id, {
                      active: on,
                      nextRun: on ? "Next scheduled time" : "Paused",
                    })
                  }
                  aria-label="Active"
                />
                {schedule.active ? "Active" : "Paused"}
              </label>
              <div className="flex gap-2">
                <GhostButton onClick={() => setEditing(true)} className="flex items-center gap-1.5">
                  <Pencil size={13} /> Edit
                </GhostButton>
                <PrimaryButton
                  onClick={() => startRun(schedule.id)}
                  disabled={running}
                  className="flex items-center gap-1.5"
                >
                  <Play size={13} /> {running ? "Running…" : "Run now"}
                </PrimaryButton>
              </div>
            </div>

            <Field title="Tables">
              <ChipList items={schedule.tables} empty="No tables" />
            </Field>
            <Field title="Checks">
              {schedule.ruleIds.length === 0 ? (
                <span style={{ color: "var(--ink-500)" }}>
                  No checks. This schedule only profiles.
                </span>
              ) : (
                <ul className="space-y-1.5">
                  {schedule.ruleIds.map((id) => (
                    <li key={id}>
                      <Link
                        to="/rules"
                        search={{ rule: id }}
                        className="underline"
                        style={{ color: "var(--brand-blue)" }}
                      >
                        {ruleName(id)}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Field>
            <Field title="Repeats">{schedule.repeats}</Field>
            <Field title="Next run">{schedule.active ? schedule.nextRun : "Paused"}</Field>
            <Field title="Permissions">{schedule.permissions}</Field>
            <Field title="Owner">{schedule.owner}</Field>
          </div>
        }
      />

      {editing && <EditScheduleDialog schedule={schedule} onClose={() => setEditing(false)} />}
    </div>
  );
}

function Field({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <SectionTitle>{title}</SectionTitle>
      <div className="text-[13.5px]" style={{ color: "var(--ink-900)" }}>
        {children}
      </div>
    </div>
  );
}

function ChipList({ items, empty }: { items: string[]; empty: string }) {
  if (items.length === 0) return <span style={{ color: "var(--ink-500)" }}>{empty}</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((i) => (
        <Tag key={i}>{i}</Tag>
      ))}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  border: "1px solid var(--hairline)",
  background: "#fff",
  color: "var(--ink-900)",
};

function EditScheduleDialog({ schedule, onClose }: { schedule: Schedule; onClose: () => void }) {
  const { healthFor } = useDomainState();
  const { schedules, update } = useSchedules();
  const { rules } = useRules();
  const [name, setName] = React.useState(schedule.name);
  const [repeats, setRepeats] = React.useState(schedule.repeats);
  const [permissions, setPermissions] = React.useState(schedule.permissions);
  const [tables, setTables] = React.useState<string[]>(schedule.tables);
  const [ruleIds, setRuleIds] = React.useState<string[]>(schedule.ruleIds);

  const tableOptions = React.useMemo(() => {
    const names = tablesFor(schedule.domain, healthFor(schedule.domain), schedules).map(
      (t) => t.name,
    );
    return [...new Set([...names, ...schedule.tables])];
  }, [schedule, schedules, healthFor]);
  const ruleOptions = rules.filter((r) => r.status === "Active" && r.scope !== "Template");

  const toggle = (list: string[], v: string) =>
    list.includes(v) ? list.filter((x) => x !== v) : [...list, v];

  function save() {
    update(schedule.id, {
      name: name.trim() || schedule.name,
      repeats,
      permissions,
      tables,
      ruleIds,
      kind:
        ruleIds.length === 0
          ? "Profiling"
          : schedule.kind === "Profiling"
            ? "Profiling + checks"
            : schedule.kind,
    });
    onClose();
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit schedule</DialogTitle>
          <DialogDescription>
            Changes apply from the next run. Past runs keep the settings they ran with.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-[13.5px]">
          <label className="block">
            <span className="mb-1 block font-medium">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg px-3 py-2"
              style={inputStyle}
            />
          </label>

          <label className="block">
            <span className="mb-1 block font-medium">Repeats</span>
            <select
              value={repeats}
              onChange={(e) => setRepeats(e.target.value)}
              className="w-full rounded-lg px-3 py-2"
              style={inputStyle}
            >
              {[...new Set([schedule.repeats, ...REPEAT_PRESETS])].map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>

          <fieldset>
            <legend className="mb-1 font-medium">Tables</legend>
            <div className="grid grid-cols-2 gap-1.5">
              {tableOptions.map((t) => (
                <label key={t} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={tables.includes(t)}
                    onChange={() => setTables((l) => toggle(l, t))}
                  />
                  {t}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-1 font-medium">Checks</legend>
            <div className="space-y-1.5">
              {ruleOptions.map((r) => (
                <label key={r.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={ruleIds.includes(r.id)}
                    onChange={() => setRuleIds((l) => toggle(l, r.id))}
                  />
                  {r.name}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="block">
            <span className="mb-1 block font-medium">Permissions</span>
            <select
              value={permissions}
              onChange={(e) => setPermissions(e.target.value)}
              className="w-full rounded-lg px-3 py-2"
              style={inputStyle}
            >
              {[...new Set([schedule.permissions, ...PERMISSIONS])].map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
        </div>

        <DialogFooter>
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <PrimaryButton onClick={save} disabled={tables.length === 0}>
            Save changes
          </PrimaryButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
