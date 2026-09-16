import * as React from "react";
import { X } from "lucide-react";
import { Spark } from "./charts";
import { DIMENSIONS, checksCard, metricFor, type DimensionId, type MetricCard } from "./data";
import type { PinPayload } from "./answers";

export type Pin = PinPayload & { id: string; fresh?: boolean };

function Card({ m }: { m: MetricCard }) {
  return (
    <div
      className="rounded-xl p-3"
      style={{ border: "1px solid var(--hairline)", background: "#fff" }}
    >
      <div className="text-[10px] font-semibold uppercase tracking-[0.1em]" style={{ color: "var(--ink-300)" }}>
        {m.tag}
      </div>
      <div className="mt-1 text-[12px]" style={{ color: "var(--ink-500)" }}>
        {m.label}
      </div>
      <div
        className="mt-1 text-[24px] font-semibold leading-none"
        style={{ color: m.breaching ? "var(--brand-red)" : "var(--ink-900)" }}
      >
        {m.value}
      </div>
      <div className="mt-2">
        <Spark values={m.series} band={m.band} breaching={m.breaching} />
      </div>
      <div className="mt-1.5 text-[11.5px]" style={{ color: m.breaching ? "var(--brand-red)" : "var(--ink-500)" }}>
        {m.delta}
      </div>
    </div>
  );
}

function PinCard({ pin, onRemove }: { pin: Pin; onRemove: () => void }) {
  return (
    <div
      className="relative rounded-xl p-3 transition-shadow"
      style={{
        border: `1px solid ${pin.fresh ? "var(--brand-blue)" : "var(--hairline)"}`,
        background: "#fff",
        boxShadow: pin.fresh ? "0 0 0 3px rgba(67,134,250,0.18)" : "none",
      }}
    >
      <button
        type="button"
        aria-label={`Remove ${pin.title}`}
        onClick={onRemove}
        className="absolute right-2 top-2 rounded p-0.5 hover:bg-[color:var(--surface-soft)]"
        style={{ color: "var(--ink-300)" }}
      >
        <X size={13} />
      </button>
      <div className="text-[10px] font-semibold uppercase tracking-[0.1em]" style={{ color: "var(--ink-300)" }}>
        Pinned
      </div>
      <div className="mt-1 text-[12px]" style={{ color: "var(--ink-500)" }}>
        {pin.title}
      </div>
      <div className="mt-1 text-[24px] font-semibold leading-none" style={{ color: "var(--ink-900)" }}>
        {pin.value}
      </div>
      <div className="mt-3 text-[11.5px]" style={{ color: "var(--ink-500)" }}>
        {pin.sub}
      </div>
    </div>
  );
}

export function Scorecard({
  name,
  tableCount,
  dims,
  healthy,
  pins,
  onRemovePin,
  onAsk,
}: {
  name: string;
  tableCount: number;
  dims: Record<DimensionId, boolean>;
  healthy: boolean;
  pins: Pin[];
  onRemovePin: (id: string) => void;
  onAsk: (q: string) => void;
}) {
  const cards = DIMENSIONS.filter((d) => dims[d.id]).map((d) => metricFor(d.id, healthy));
  cards.push(checksCard(healthy));

  return (
    <section>
      <div className="flex items-baseline gap-2">
        <h2 className="text-[14px] font-semibold" style={{ color: "var(--ink-900)" }}>
          Scorecard
        </h2>
        <button
          type="button"
          onClick={() => onAsk("Why these metrics?")}
          className="ml-auto text-[12px] underline"
          style={{ color: "var(--brand-blue)" }}
        >
          Why these metrics?
        </button>
      </div>

      <div className="mt-3 grid gap-3" style={{ gridTemplateColumns: "repeat(4, minmax(0,1fr))" }}>
        {cards.map((c) => (
          <Card key={c.id} m={c} />
        ))}
        {pins.map((p) => (
          <PinCard key={p.id} pin={p} onRemove={() => onRemovePin(p.id)} />
        ))}
      </div>
    </section>
  );
}
