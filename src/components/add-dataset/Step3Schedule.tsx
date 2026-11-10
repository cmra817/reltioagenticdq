import { useState } from "react";
import { LineChart, ClipboardCheck } from "lucide-react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export type Frequency = "6h" | "12h" | "daily" | "weekly" | "custom";
export type EndsMode = "never" | "on" | "after";

export type ScheduleConfig = {
  frequency: Frequency;
  repeatEvery: number;
  repeatUnit: "hours" | "days" | "weeks";
  endsMode: EndsMode;
  endsOn: string;
  endsAfter: number;
  day?: string;
  time?: string;
};

export const FREQUENCY_OPTIONS: { value: Frequency; label: string }[] = [
  { value: "6h", label: "Every 6 hours" },
  { value: "12h", label: "Every 12 hours" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "custom", label: "Custom" },
];

export const DEFAULT_SCHEDULE: ScheduleConfig = {
  frequency: "weekly",
  day: "Monday",
  time: "00:05",
  repeatEvery: 1,
  repeatUnit: "days",
  endsMode: "never",
  endsOn: "",
  endsAfter: 1,
};

export function frequencyLabel(c: ScheduleConfig) {
  if (c.frequency !== "custom")
    return FREQUENCY_OPTIONS.find((o) => o.value === c.frequency)!.label;
  const base = `Every ${c.repeatEvery} ${c.repeatUnit}`;
  if (c.endsMode === "on" && c.endsOn) return `${base}, until ${c.endsOn}`;
  if (c.endsMode === "after") return `${base}, ${c.endsAfter} runs`;
  return base;
}

export function Step3Schedule({
  checkCount,
  profiling,
  checks,
  onChangeProfiling,
  onChangeChecks,
}: {
  checkCount: number;
  profiling: ScheduleConfig;
  checks: ScheduleConfig;
  onChangeProfiling: (c: ScheduleConfig) => void;
  onChangeChecks: (c: ScheduleConfig) => void;
}) {
  const [same, setSame] = useState(false);
  const setProfiling = (c: ScheduleConfig) => {
    onChangeProfiling(c);
    if (same) onChangeChecks(c);
  };
  return (
    <div className="@container px-10 py-8">
      <p className="text-[13px]" style={{ color: "var(--ink-700)" }}>
        Schedule when profiling and checks run
      </p>

      <div
        className="mt-5 rounded-3xl border bg-white p-8"
        style={{ borderColor: "var(--hairline)" }}
      >
        <div className="grid gap-6 @[820px]:grid-cols-2">

          <ScheduleCard
            icon={<LineChart size={17} />}
            title="Profiling"
            description="Column stats, distributions, and history used to detect drift."
            value={profiling}
            onChange={setProfiling}
          />
          <ScheduleCard
            icon={<ClipboardCheck size={17} />}
            title="DQ checks"
            description={`Runs the ${checkCount} ${checkCount === 1 ? "check" : "checks"} configured for this source.`}
            value={same ? profiling : checks}
            onChange={onChangeChecks}
            disabled={same}
            extra={
              <label
                className="mt-4 flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-[14px]"
                style={{ borderColor: "var(--hairline)", background: "var(--surface-soft)", color: "var(--ink-900)" }}
              >
                <input
                  type="checkbox"
                  checked={same}
                  onChange={(e) => {
                    setSame(e.target.checked);
                    if (e.target.checked) onChangeChecks(profiling);
                  }}
                  className="h-4 w-4"
                  style={{ accentColor: "var(--brand-blue)" }}
                />
                Run on the same schedule as profiling
              </label>
            }
          />
        </div>
      </div>
    </div>
  );
}

export function ScheduleCard({
  icon,
  title,
  description,
  value,
  onChange,
  extra,
  disabled,
}: {
  extra?: React.ReactNode;
  disabled?: boolean;
  icon: React.ReactNode;
  title: string;
  description: string;
  value: ScheduleConfig;
  onChange: (c: ScheduleConfig) => void;
}) {
  const set = (patch: Partial<ScheduleConfig>) => onChange({ ...value, ...patch });

  return (
    <div
      className="rounded-2xl border bg-white p-6"
      style={{ borderColor: "var(--hairline)" }}
    >
      <div className="flex items-center gap-2.5">
        <span style={{ color: "var(--ink-900)" }}>{icon}</span>
        <h3 className="text-[13.5px] font-medium" style={{ color: "var(--ink-900)" }}>
          {title}
        </h3>
      </div>
      <p className="mt-2 text-[13px] leading-relaxed" style={{ color: "var(--ink-700)" }}>
        {description}
      </p>
      {extra}
      <fieldset disabled={disabled} className={disabled ? "opacity-50" : ""}>

      <label
        className="mt-5 block text-[12px] font-medium"
        style={{ color: "var(--ink-500)" }}
      >
        Frequency
      </label>
      <select
        value={value.frequency}
        onChange={(e) => set({ frequency: e.target.value as Frequency })}
        className="mt-1.5 h-10 w-full rounded-xl border bg-white px-3 text-[14px] outline-none focus:ring-2"
        style={{
          borderColor: "var(--hairline)",
          color: "var(--ink-900)",
          // @ts-expect-error custom property for focus ring color
          "--tw-ring-color": "rgba(67,134,250,0.35)",
        }}
      >
        {FREQUENCY_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      {value.frequency === "custom" && (
        <div
          className="mt-3 rounded-xl p-4"
          style={{ background: "var(--surface-soft)" }}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[13px]" style={{ color: "var(--ink-900)" }}>
              Repeat every
            </span>
            <input
              type="number"
              min={1}
              value={value.repeatEvery}
              onChange={(e) => set({ repeatEvery: Math.max(1, Number(e.target.value) || 1) })}
              className="h-9 w-16 rounded-lg border bg-white px-2.5 text-[14px] outline-none"
              style={{ borderColor: "var(--hairline)", color: "var(--ink-900)" }}
            />
            <select
              value={value.repeatUnit}
              onChange={(e) =>
                set({ repeatUnit: e.target.value as ScheduleConfig["repeatUnit"] })
              }
              className="h-9 rounded-lg border bg-white px-2.5 text-[14px] outline-none"
              style={{ borderColor: "var(--hairline)", color: "var(--ink-900)" }}
            >
              <option value="hours">hours</option>
              <option value="days">days</option>
              <option value="weeks">weeks</option>
            </select>
          </div>

          <div className="mt-4 text-[12px] font-medium" style={{ color: "var(--ink-500)" }}>
            Ends
          </div>
          <div className="mt-2 flex flex-col gap-2.5">
            <label className="flex items-center gap-2.5 text-[13px]" style={{ color: "var(--ink-900)" }}>
              <input
                type="radio"
                checked={value.endsMode === "never"}
                onChange={() => set({ endsMode: "never" })}
                className="h-4 w-4"
                style={{ accentColor: "var(--brand-blue)" }}
              />
              Never
            </label>
            <label className="flex items-center gap-2.5 text-[13px]" style={{ color: "var(--ink-900)" }}>
              <input
                type="radio"
                checked={value.endsMode === "on"}
                onChange={() => set({ endsMode: "on" })}
                className="h-4 w-4"
                style={{ accentColor: "var(--brand-blue)" }}
              />
              On
              <input
                type="date"
                value={value.endsOn}
                onChange={(e) => set({ endsOn: e.target.value, endsMode: "on" })}
                className="h-9 rounded-lg border bg-white px-2.5 text-[13px] outline-none"
                style={{ borderColor: "var(--hairline)", color: "var(--ink-900)" }}
              />
            </label>
            <label className="flex items-center gap-2.5 text-[13px]" style={{ color: "var(--ink-900)" }}>
              <input
                type="radio"
                checked={value.endsMode === "after"}
                onChange={() => set({ endsMode: "after" })}
                className="h-4 w-4"
                style={{ accentColor: "var(--brand-blue)" }}
              />
              After
              <input
                type="number"
                min={1}
                value={value.endsAfter}
                onChange={(e) =>
                  set({
                    endsAfter: Math.max(1, Number(e.target.value) || 1),
                    endsMode: "after",
                  })
                }
                className="h-9 w-16 rounded-lg border bg-white px-2.5 text-[13px] outline-none"
                style={{ borderColor: "var(--hairline)", color: "var(--ink-900)" }}
              />
              runs
            </label>
          </div>
        </div>
      )}

      {value.frequency === "weekly" && (
        <>
          <label className="mt-4 block text-[12px] font-medium" style={{ color: "var(--ink-500)" }}>
            Day
          </label>
          <select
            value={value.day ?? "Monday"}
            onChange={(e) => set({ day: e.target.value })}
            className="mt-1.5 h-10 w-full rounded-xl border bg-white px-3 text-[14px] outline-none"
            style={{ borderColor: "var(--hairline)", color: "var(--ink-900)" }}
          >
            {DAYS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </>
      )}
      {(value.frequency === "weekly" || value.frequency === "daily" || value.frequency === "custom") && (
        <>
          <label className="mt-4 block text-[12px] font-medium" style={{ color: "var(--ink-500)" }}>
            Time
          </label>
          <input
            type="time"
            value={value.time ?? "00:05"}
            onChange={(e) => set({ time: e.target.value })}
            className="mt-1.5 h-10 w-full rounded-xl border bg-white px-3 text-[14px] outline-none"
            style={{ borderColor: "var(--hairline)", color: "var(--ink-900)" }}
          />
        </>
      )}
      </fieldset>
    </div>
  );
}
