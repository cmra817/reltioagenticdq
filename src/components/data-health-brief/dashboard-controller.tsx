import * as React from "react";
import { Maximize2, Pencil } from "lucide-react";
import { ALL_DOMAINS, type DashboardDef } from "@/lib/mock-ops";
import { useLocalStore } from "@/lib/use-local-store";
import { dayKey } from "./dashboard-topics";

/** What the agent watches for a dashboard, in the person's own words. */
export type DashboardInstructions = { text: string; schedule: string };
const KEY = "agentflow.dashboard-instructions.v1";
const INIT: Record<string, DashboardInstructions> = {};

export function defaultInstructions(dash: DashboardDef): DashboardInstructions {
  const scope = dash.scope === ALL_DOMAINS ? "every domain" : dash.scope;
  return {
    text: `Watch ${scope}. Tell me what changed since yesterday, which tables or checks need my attention, and anything that crossed a threshold. Notify me when a score drops below 80 or a check fails twice in a row.`,
    schedule: "Daily at 6:00 AM",
  };
}

export function useInstructions(dash: DashboardDef) {
  const [all, setAll] = useLocalStore(KEY, INIT);
  const value = all[dash.id] ?? defaultInstructions(dash);
  const save = React.useCallback(
    (next: DashboardInstructions) => setAll((prev) => ({ ...prev, [dash.id]: next })),
    [dash.id, setAll],
  );
  return [value, save] as const;
}

/** The last seven daily runs, newest first. */
export function recentDays(n = 7): { day: string; label: string }[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return { day: dayKey(d), label: i === 0 ? "Today at 6:00 AM" : `${date} at 6:00 AM` };
  });
}

const label = "text-[11px] font-semibold uppercase tracking-wide";

/**
 * The minimized right panel: the dashboard's instructions (edited in place)
 * and its daily runs. Opening the dashboard expands the panel.
 */
export function DashboardController({
  dash,
  day,
  onPickDay,
  onExpand,
}: {
  dash: DashboardDef;
  day: string;
  onPickDay: (day: string) => void;
  onExpand: () => void;
}) {
  const [ins, save] = useInstructions(dash);
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(ins);
  React.useEffect(() => {
    if (!editing) setDraft(ins);
  }, [ins, editing]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-white px-4 py-4">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[14px] font-semibold" style={{ color: "var(--ink-900)" }}>
          {dash.name}
        </span>
        <button
          type="button"
          onClick={onExpand}
          aria-label="Open dashboard"
          title="Open dashboard"
          className="grid h-7 w-7 place-items-center rounded-md hover:bg-[color:var(--surface-soft)]"
          style={{ color: "var(--ink-500)" }}
        >
          <Maximize2 size={15} />
        </button>
      </div>

      <section className="mt-5">
        <div className="flex items-center justify-between">
          <h2 className={label} style={{ color: "var(--ink-500)" }}>
            Instructions
          </h2>
          {!editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              aria-label="Edit instructions"
              title="Edit instructions"
              className="grid h-6 w-6 place-items-center rounded-md hover:bg-[color:var(--surface-soft)]"
              style={{ color: "var(--ink-500)" }}
            >
              <Pencil size={13} />
            </button>
          )}
        </div>
        {editing ? (
          <div className="mt-2 space-y-2">
            <textarea
              aria-label="What to monitor, thresholds and notifications"
              value={draft.text}
              onChange={(e) => setDraft({ ...draft, text: e.target.value })}
              rows={7}
              className="w-full resize-y rounded-lg border px-2.5 py-2 text-[13px] leading-relaxed outline-none focus:border-[color:var(--brand-blue)]"
              style={{ borderColor: "var(--hairline)", color: "var(--ink-900)" }}
            />
            <label className="block text-[12px]" style={{ color: "var(--ink-500)" }}>
              How often
              <select
                value={draft.schedule}
                onChange={(e) => setDraft({ ...draft, schedule: e.target.value })}
                className="mt-1 block w-full rounded-lg border px-2 py-1.5 text-[13px]"
                style={{ borderColor: "var(--hairline)", color: "var(--ink-900)", background: "#fff" }}
              >
                {["Daily at 6:00 AM", "Weekdays at 6:00 AM", "Every 12 hours", "Weekly on Monday at 6:00 AM"].map(
                  (s) => (
                    <option key={s}>{s}</option>
                  ),
                )}
              </select>
            </label>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-md px-2.5 py-1 text-[12.5px]"
                style={{ color: "var(--ink-700)" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  save(draft);
                  setEditing(false);
                }}
                className="rounded-md px-2.5 py-1 text-[12.5px] font-medium"
                style={{ background: "var(--brand-blue)", color: "var(--primary-foreground, #fff)" }}
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="mt-2 block w-full rounded-lg text-left text-[13px] leading-relaxed hover:bg-[color:var(--surface-soft)]"
            style={{ color: "var(--ink-700)" }}
          >
            {ins.text}
            <span className="mt-2 block text-[12.5px]" style={{ color: "var(--ink-900)" }}>
              {ins.schedule}
            </span>
          </button>
        )}
      </section>

      <section className="mt-6 border-t pt-4" style={{ borderColor: "var(--hairline)" }}>
        <h2 className={label} style={{ color: "var(--ink-500)" }}>
          Runs
        </h2>
        <ul className="mt-1.5">
          {recentDays().map((r) => {
            const on = r.day === day;
            return (
              <li key={r.day}>
                <button
                  type="button"
                  onClick={() => onPickDay(r.day)}
                  aria-current={on ? "true" : undefined}
                  className="block w-full rounded-md px-2 py-1.5 text-left text-[13px] hover:bg-[color:var(--surface-soft)]"
                  style={{
                    color: "var(--ink-900)",
                    background: on ? "var(--surface-soft)" : undefined,
                    fontWeight: on ? 600 : 400,
                  }}
                >
                  {r.label}
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
