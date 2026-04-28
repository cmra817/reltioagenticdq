import { Check } from "lucide-react";

type Step = { label: string };

export function Stepper({ steps, current }: { steps: Step[]; current: number }) {
  return (
    <ol className="flex items-start gap-0">
      {steps.map((s, i) => {
        const status: "done" | "current" | "upcoming" =
          i < current ? "done" : i === current ? "current" : "upcoming";
        const isLast = i === steps.length - 1;

        const circleStyle: React.CSSProperties =
          status === "upcoming"
            ? { background: "white", borderColor: "var(--hairline)", color: "var(--ink-300)" }
            : { background: "var(--brand-blue)", borderColor: "var(--brand-blue)", color: "white" };

        const labelStyle: React.CSSProperties = {
          color:
            status === "current"
              ? "var(--ink-900)"
              : status === "done"
                ? "var(--ink-700)"
                : "var(--ink-300)",
          fontWeight: status === "current" ? 600 : 500,
        };

        return (
          <li key={s.label} className="flex items-start">
            <div className="flex flex-col items-center">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-full border text-[12px] font-semibold"
                style={circleStyle}
              >
                {status === "done" ? <Check size={14} strokeWidth={3} /> : i + 1}
              </div>
              <div className="mt-2 text-[13px] leading-none" style={labelStyle}>
                {s.label}
              </div>
            </div>
            {!isLast && (
              <div
                className="mx-3 mt-[13px] h-px w-24"
                style={{ background: i < current ? "var(--brand-blue)" : "var(--hairline)" }}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
