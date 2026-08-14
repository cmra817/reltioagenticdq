import type { Widget } from "./widget-model";

function LineVisual({ values }: { values: number[] }) {
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
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="84" aria-hidden="true">
      <path d={`${path} L${w - pad} ${h - pad} L${pad} ${h - pad} Z`} fill="rgba(20,166,166,0.10)" />
      <path d={path} fill="none" stroke="#14a6a6" strokeWidth="2" strokeLinejoin="round" />
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
    <div className="flex h-[84px] items-end gap-2">
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
    <div className="flex h-[84px] items-center">
      <span className="text-[34px] font-semibold leading-none" style={{ color: "var(--ink-900)" }}>
        {value ?? "—"}
      </span>
    </div>
  );
}

function TableVisual({ rows }: { rows?: { label: string; value: string }[] }) {
  return (
    <div className="h-[84px] overflow-hidden">
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
