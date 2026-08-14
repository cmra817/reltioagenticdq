import type { DonutDetail, MetricDetail, Widget } from "./widget-model";

function DeltaPill({ value, direction = "up" }: { value: string; direction?: "up" | "down" }) {
  const positive = direction === "up";
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[12px] font-medium"
      style={{
        background: positive ? "rgba(34,197,94,0.10)" : "rgba(239,68,68,0.10)",
        color: positive ? "#16a34a" : "#dc2626",
      }}
    >
      <span aria-hidden="true">{positive ? "↑" : "↓"}</span>
      {value} from last
    </span>
  );
}

function MetricVisual({
  values,
  value,
  detail,
}: {
  values: number[];
  value?: string;
  detail: MetricDetail;
}) {
  return (
    <div className="flex h-full min-h-[84px] flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[28px] font-semibold leading-none" style={{ color: "var(--ink-900)" }}>
          {value ?? "—"}
        </span>
        <DeltaPill value={detail.delta} direction={detail.direction} />
      </div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full"
        style={{ background: "var(--surface-soft)" }}
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${detail.ratio * 100}%`, background: detail.color }}
        />
      </div>
      {detail.passed && (
        <div className="text-[12px]" style={{ color: "var(--ink-500)" }}>
          {detail.passed}
        </div>
      )}
      <div className="min-h-0 flex-1">
        <LineVisual values={values.length ? values : [1, 2, 3]} color={detail.color} />
      </div>
    </div>
  );
}

function DonutVisual({
  detail,
  onSegment,
}: {
  detail: DonutDetail;
  onSegment?: (segment: string) => void;
}) {
  const radius = 70;
  const stroke = 22;
  const C = 2 * Math.PI * radius;
  let offset = 0;
  return (
    <div className="flex h-full min-h-[84px] flex-wrap items-center gap-4">
      <svg viewBox="0 0 180 180" width="140" height="140" aria-hidden="true">
        <g transform="translate(90 90) rotate(-90)">
          <circle r={radius} fill="none" stroke="var(--surface-soft)" strokeWidth={stroke} />
          {detail.segments.map((s) => {
            const len = (s.value / 100) * C;
            const dasharray = `${len} ${C - len}`;
            const dashoffset = -offset;
            offset += len;
            return (
              <circle
                key={s.label}
                r={radius}
                fill="none"
                stroke={s.color}
                strokeWidth={stroke}
                strokeDasharray={dasharray}
                strokeDashoffset={dashoffset}
                strokeLinecap="butt"
              />
            );
          })}
        </g>
        <text x="90" y="86" textAnchor="middle" fontSize="28" fontWeight="700" fill="var(--ink-900)">
          {detail.total}
        </text>
        <text x="90" y="106" textAnchor="middle" fontSize="12" fill="var(--ink-500)">
          {detail.totalLabel}
        </text>
      </svg>
      <ul className="space-y-2 text-[13px]">
        {detail.segments.map((s) => (
          <li key={s.label}>
            <button
              type="button"
              tabIndex={onSegment ? 0 : -1}
              onClick={
                onSegment
                  ? (e) => {
                      e.stopPropagation();
                      onSegment(s.label);
                    }
                  : undefined
              }
              className="flex items-center gap-2 rounded-md px-1 py-0.5 transition-colors hover:bg-[color:var(--surface-soft)]"
              style={{ cursor: onSegment ? "pointer" : "default" }}
            >
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} aria-hidden="true" />
              <span style={{ color: "var(--ink-700)" }}>{s.label}:</span>
              <span className="font-semibold" style={{ color: "var(--ink-900)" }}>
                {s.display}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}


function LineVisual({ values, color = "#14a6a6" }: { values: number[]; color?: string }) {
  const w = 280;
  const h = 84;
  const pad = 6;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = (w - pad * 2) / Math.max(values.length - 1, 1);
  const path = values
    .map((v, i) => {
      const x = pad + i * step;
      const y = pad + (h - pad * 2) * (1 - (v - min) / range);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width="100%"
      height="100%"
      preserveAspectRatio="none"
      aria-hidden="true"
      className="h-full min-h-[84px] w-full"
    >
      <path d={`${path} L${w - pad} ${h - pad} L${pad} ${h - pad} Z`} fill={`${color}1f`} />
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}



function BarVisual({
  values,
  segments,
  onSegment,
}: {
  values: number[];
  segments?: string[];
  onSegment?: (segment: string) => void;
}) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex h-full min-h-[84px] items-end gap-2">
      {values.map((v, i) => {
        const label = segments?.[i] ?? `Segment ${i + 1}`;
        return (
          <button
            key={label}
            type="button"
            tabIndex={onSegment ? 0 : -1}
            aria-label={onSegment ? `View incidents for ${label}` : label}
            title={label}
            onClick={
              onSegment
                ? (e) => {
                    e.stopPropagation();
                    onSegment(label);
                  }
                : undefined
            }
            className="flex-1 rounded-t-[3px] transition-opacity hover:opacity-80"
            style={{
              height: `${Math.max((v / max) * 100, 6)}%`,
              background: "#4386fa",
              cursor: onSegment ? "pointer" : "default",
            }}
          />
        );
      })}
    </div>
  );
}

function NumberVisual({ value }: { value?: string }) {
  return (
    <div className="flex h-full min-h-[84px] items-center">
      <span className="text-[34px] font-semibold leading-none" style={{ color: "var(--ink-900)" }}>
        {value ?? "—"}
      </span>
    </div>
  );
}

function TableVisual({ rows }: { rows?: { label: string; value: string }[] }) {
  return (
    <div className="h-full min-h-[84px] overflow-hidden">
      {(rows ?? []).slice(0, 4).map((r) => (
        <div
          key={r.label}
          className="flex items-center justify-between border-b py-1 text-[12px] last:border-b-0"
          style={{ borderColor: "var(--hairline)", color: "var(--ink-700)" }}
        >
          <span className="truncate pr-2">{r.label}</span>
          <span className="font-medium" style={{ color: "var(--ink-900)" }}>
            {r.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export function WidgetVisual({
  widget,
  onSegment,
}: {
  widget: Widget;
  onSegment?: (segment: string) => void;
}) {
  switch (widget.chartType) {
    case "line":
      return <LineVisual values={widget.data.length ? widget.data : [1, 2, 3]} />;
    case "bar":
      return (
        <BarVisual
          values={widget.data.length ? widget.data : [3, 6, 4]}
          segments={widget.segments}
          onSegment={onSegment}
        />
      );
    case "number":
      return <NumberVisual value={widget.value} />;
    case "table":
      return <TableVisual rows={widget.rows} />;
  }
}
