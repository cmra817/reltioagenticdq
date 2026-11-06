import * as React from "react";
import { SectionTitle } from "@/components/workspace/primitives";
import { AskItem } from "./ask";
import {
  ATTRIBUTE_GRID,
  BAD_SHARE_NOTE,
  BY_SOURCE,
  CHECK_KINDS,
  FAILURE_SHARE,
  GOOD_TREND,
  NEAR_MISSES,
  RQ,
  RQ_BAD,
  RQ_GOOD,
} from "@/lib/record-quality";

const n = (v: number) => v.toLocaleString("en-US");

function Card({
  children,
  label,
  topic,
}: {
  children: React.ReactNode;
  label?: string;
  /** When set, the whole card can be selected to discuss it in chat. */
  topic?: string;
}) {
  const box = (
    <div
      className="rounded-xl border bg-white p-3.5"
      style={{ borderColor: "var(--hairline)" }}
      role={label ? "group" : undefined}
      aria-label={label}
    >
      {children}
    </div>
  );
  return topic ? (
    <AskItem topic={topic} className="rounded-xl">
      {box}
    </AskItem>
  ) : (
    box
  );
}

/** Good vs bad as one split bar, with the target marked on it. */
function Headline() {
  const bad = 100 - RQ.goodPct;
  const delta = +(RQ.goodPct - RQ.lastWeekGoodPct).toFixed(1);
  return (
    <Card label="Good and bad records" topic="Good and bad records">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-[12px]" style={{ color: "var(--ink-500)" }}>
            Good records
          </div>
          <div
            className="text-[34px] font-semibold leading-none tabular-nums"
            style={{ color: "var(--ink-900)" }}
          >
            {RQ.goodPct}%
          </div>
          <div className="mt-1 text-[12px]" style={{ color: "var(--ink-500)" }}>
            {n(RQ_GOOD)} of {n(RQ.total)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[12px]" style={{ color: "var(--ink-500)" }}>
            Bad records
          </div>
          <div
            className="text-[24px] font-semibold leading-none tabular-nums"
            style={{ color: "var(--ink-900)" }}
          >
            {bad.toFixed(1)}%
          </div>
          <div className="mt-1 text-[12px]" style={{ color: "var(--ink-500)" }}>
            {n(RQ_BAD)}
          </div>
        </div>
      </div>

      <div
        className="relative mt-4 h-3 overflow-hidden rounded-full"
        style={{ background: "var(--status-bad)" }}
        role="img"
        aria-label={`${RQ.goodPct}% good, ${bad.toFixed(1)}% bad, target ${RQ.targetPct}% good`}
      >
        <div
          className="h-full"
          style={{ width: `${RQ.goodPct}%`, background: "var(--status-good)" }}
        />
        <div
          className="absolute top-0 h-full w-0.5"
          style={{ left: `${RQ.targetPct}%`, background: "var(--ink-900)" }}
        />
      </div>
      <div className="mt-2 flex justify-between text-[11.5px]" style={{ color: "var(--ink-500)" }}>
        <span>
          {delta < 0 ? "Down" : "Up"} {Math.abs(delta)} pts vs last week
        </span>
        <span>
          Target {RQ.targetPct}% · {(RQ.targetPct - RQ.goodPct).toFixed(1)} pts to go
        </span>
      </div>
    </Card>
  );
}

function FailureBars() {
  return (
    <Card label="Why records fail">
      <ul className="space-y-2">
        {FAILURE_SHARE.map((f) => (
          <li key={f.attribute}>
            <AskItem
              topic={`Why records fail on ${f.attribute}`}
              className="flex items-center gap-3 rounded-lg px-1.5 py-1 text-[13px]"
            >
              <span className="w-[76px] shrink-0" style={{ color: "var(--ink-700)" }}>
                {f.attribute}
              </span>
              <span
                className="h-2.5 flex-1 overflow-hidden rounded-full"
                style={{ background: "var(--surface-soft)" }}
              >
                <span
                  className="block h-full rounded-full"
                  style={{ width: `${f.pct}%`, background: "var(--brand-blue)" }}
                />
              </span>
              <span
                className="w-[88px] shrink-0 text-right tabular-nums"
                style={{ color: "var(--ink-900)" }}
              >
                {f.pct}% · {n(Math.round((RQ_BAD * f.pct) / 100))}
              </span>
            </AskItem>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[12px]" style={{ color: "var(--ink-500)" }}>
        {BAD_SHARE_NOTE}
      </p>
    </Card>
  );
}

function shade(rate: number): string {
  // Darker red as the pass rate drops below 100; never the only signal, the number is always shown.
  const strength = Math.min(1, Math.max(0, (100 - rate) / 20));
  return `rgba(217, 56, 43, ${(strength * 0.28).toFixed(2)})`;
}

function AttributeGrid() {
  return (
    <Card label="Pass rate by attribute and check" topic="Pass rate by attribute and check">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="text-[11px] uppercase tracking-wide" style={{ color: "var(--ink-300)" }}>
            <th className="pb-1.5 text-left font-semibold">Attribute</th>
            {CHECK_KINDS.map((k) => (
              <th key={k} className="pb-1.5 text-right font-semibold">
                {k}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ATTRIBUTE_GRID.map((row) => (
            <tr key={row.attribute} className="border-t" style={{ borderColor: "var(--hairline)" }}>
              <th
                scope="row"
                className="py-1.5 text-left font-normal"
                style={{ color: "var(--ink-700)" }}
              >
                {row.attribute}
              </th>
              {CHECK_KINDS.map((k) => {
                const rate = row.rates[k];
                return (
                  <td
                    key={k}
                    className="px-1.5 py-1.5 text-right tabular-nums"
                    style={{
                      background: rate === undefined ? "transparent" : shade(rate),
                      color: rate === undefined ? "var(--ink-300)" : "var(--ink-900)",
                    }}
                  >
                    {rate === undefined ? "—" : `${rate}%`}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-[12px]" style={{ color: "var(--ink-500)" }}>
        Distinct only applies to Email and Phone.
      </p>
    </Card>
  );
}

function TrendChart() {
  const w = 320;
  const h = 96;
  const lo = 70;
  const hi = 92;
  const y = (v: number) => h - 6 - ((v - lo) / (hi - lo)) * (h - 12);
  const pts = GOOD_TREND.map((v, i) => `${(i / (GOOD_TREND.length - 1)) * w},${y(v)}`).join(" ");
  return (
    <Card label="Good records, last 30 days" topic="Good records over the last 30 days">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="h-24 w-full"
        preserveAspectRatio="none"
        role="img"
        aria-label={`Good records went from ${GOOD_TREND[0]}% to ${GOOD_TREND[GOOD_TREND.length - 1]}% over 30 days, target ${RQ.targetPct}%`}
      >
        <line
          x1="0"
          x2={w}
          y1={y(RQ.targetPct)}
          y2={y(RQ.targetPct)}
          stroke="var(--ink-300)"
          strokeDasharray="4 4"
          vectorEffect="non-scaling-stroke"
        />
        <polyline
          points={pts}
          fill="none"
          stroke="var(--brand-blue)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="mt-1 flex justify-between text-[11.5px]" style={{ color: "var(--ink-500)" }}>
        <span>30 days ago · {GOOD_TREND[0]}%</span>
        <span>Dashed line: {RQ.targetPct}% target</span>
        <span>Today · {GOOD_TREND[GOOD_TREND.length - 1]}%</span>
      </div>
    </Card>
  );
}

function NearMisses() {
  const total = NEAR_MISSES.reduce((sum, m) => sum + m.records, 0);
  return (
    <Card label="Near misses">
      <p className="text-[13px]" style={{ color: "var(--ink-700)" }}>
        {n(total)} bad records fail on just one attribute. Fix that one and they turn good.
      </p>
      <ul className="mt-2.5 divide-y" style={{ borderColor: "var(--hairline)" }}>
        {NEAR_MISSES.map((m) => (
          <li key={m.attribute} style={{ borderColor: "var(--hairline)" }}>
            <AskItem
              topic={`Fix ${m.attribute}`}
              className="flex items-center justify-between rounded-lg px-1.5 py-1.5 text-[13px]"
            >
              <span style={{ color: "var(--ink-700)" }}>Fix {m.attribute}</span>
              <span className="tabular-nums" style={{ color: "var(--ink-900)" }}>
                +{n(m.records)} good ({((m.records / RQ.total) * 100).toFixed(1)} pts)
              </span>
            </AskItem>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function SourceTable() {
  const rows = [...BY_SOURCE].sort((a, b) => a.goodPct - b.goodPct);
  return (
    <Card label="Good records by source">
      <ul className="space-y-2.5">
        {rows.map((r) => (
          <li key={r.source}>
            <AskItem topic={`Source: ${r.source}`} className="rounded-lg px-1.5 py-1 text-[13px]">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-medium" style={{ color: "var(--ink-900)" }}>
                  {r.source}
                </span>
                <span className="tabular-nums" style={{ color: "var(--ink-900)" }}>
                  {r.goodPct}% good
                </span>
              </div>
              <div
                className="mt-1 h-2 overflow-hidden rounded-full"
                style={{ background: "var(--surface-soft)" }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${r.goodPct}%`,
                    background:
                      r.goodPct >= RQ.targetPct ? "var(--status-good)" : "var(--brand-blue)",
                  }}
                />
              </div>
              <div className="mt-0.5 text-[11.5px]" style={{ color: "var(--ink-500)" }}>
                {n(r.records)} records · steward: {r.steward}
              </div>
            </AskItem>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/** Right panel for "My brief": how good the Marketing contact records are, and why the rest aren't. */
export function RecordQualityPanel({
  leading,
  top,
}: {
  leading?: React.ReactNode;
  /** Rendered under the title, above the charts: the daily brief. */
  top?: React.ReactNode;
}) {
  return (
    <div className="space-y-6 p-5">
      <div>
        <div className="flex items-center gap-2">
          {leading}
          <div className="text-[15px] font-semibold" style={{ color: "var(--ink-900)" }}>
            Marketing contacts
          </div>
        </div>
        <div className="mt-0.5 text-[12.5px]" style={{ color: "var(--ink-500)" }}>
          {RQ.entity} records in {RQ.domain} · updated {RQ.updated}
        </div>
        <details className="mt-2 text-[12.5px]" style={{ color: "var(--ink-500)" }}>
          <summary className="cursor-pointer underline">What counts as a good record</summary>
          <p className="mt-1.5">
            Every one of First name, Last name, Email, Phone, Address, Role, Company and Title must
            be complete and valid, and Email and Phone must also be distinct. Target: {RQ.targetPct}
            % of records good. Ask the agent to change any of this.
          </p>
        </details>
      </div>

      {top}

      <Headline />

      <div>
        <SectionTitle>Why bad records fail</SectionTitle>
        <FailureBars />
      </div>

      <div>
        <SectionTitle>Pass rate by attribute</SectionTitle>
        <AttributeGrid />
      </div>

      <div>
        <SectionTitle>Trend</SectionTitle>
        <TrendChart />
      </div>

      <div>
        <SectionTitle>Quickest wins</SectionTitle>
        <NearMisses />
      </div>

      <div>
        <SectionTitle>Where bad records come from</SectionTitle>
        <SourceTable />
      </div>
    </div>
  );
}
