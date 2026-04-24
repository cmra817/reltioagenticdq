import { useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { ChatComposer } from "@/components/chat-composer";
import { SourceLogo, TableIcon, DatasetIcon } from "@/components/explore-screen";

export const Route = createFileRoute("/assets/$assetSlug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.assetSlug} — AgentFlow Quality` },
      {
        name: "description",
        content: `Overview, quality score, and classification breakdown for ${params.assetSlug}.`,
      },
    ],
  }),
  component: AssetDetailPage,
});

type AssetDetail = {
  name: string;
  source: string;
  dataset: string;
  columns: number;
  rows: string;
  checks: number;
  fillRate: string;
  quality: number;
  validity: number;
  accuracy: number;
  consistency: number;
  classification: { label: string; pct: number }[];
};

const ASSET_DETAILS: Record<string, AssetDetail> = {
  orders: {
    name: "Orders",
    source: "Databricks",
    dataset: "customer_data",
    columns: 184,
    rows: "4,897",
    checks: 21,
    fillRate: "85%",
    quality: 70,
    validity: 70,
    accuracy: 40,
    consistency: 45,
    classification: [
      { label: "PII", pct: 8 },
      { label: "Sensitive PII", pct: 12 },
      { label: "Confidential business", pct: 20 },
      { label: "Operational", pct: 65 },
      { label: "Analytical", pct: 15 },
      { label: "Reference", pct: 9 },
      { label: "System metadata", pct: 9 },
    ],
  },
};

const TABS = ["Overview", "Columns", "Checks", "Activity"] as const;
type TabName = (typeof TABS)[number];

type ColumnRow = {
  name: string;
  dataType: string;
  length: number;
  min: string;
  max: string;
  mean: string;
  nullCount: number;
  distinct: number;
  uniqueness: string;
  fillRate: string;
  tag?: string;
};

const SAMPLE_COLUMNS: ColumnRow[] = [
  { name: "Order_ID", dataType: "Integer", length: 8, min: "1", max: "1234", mean: "1234", nullCount: 0, distinct: 1234, uniqueness: "98%", fillRate: "98%", tag: "PII Data" },
  { name: "Customer_ID", dataType: "Integer", length: 8, min: "1", max: "1234", mean: "1234", nullCount: 0, distinct: 1234, uniqueness: "98%", fillRate: "98%" },
  { name: "Order_Date", dataType: "Date", length: 10, min: "2023-01-01", max: "2024-12-31", mean: "—", nullCount: 0, distinct: 720, uniqueness: "62%", fillRate: "100%" },
  { name: "Total_Amount", dataType: "Decimal", length: 10, min: "0.99", max: "9999.00", mean: "245.50", nullCount: 0, distinct: 1180, uniqueness: "97%", fillRate: "100%" },
  { name: "Status", dataType: "String", length: 12, min: "—", max: "—", mean: "—", nullCount: 0, distinct: 5, uniqueness: "1%", fillRate: "100%" },
  { name: "Shipping_Address", dataType: "String", length: 120, min: "—", max: "—", mean: "—", nullCount: 12, distinct: 1100, uniqueness: "92%", fillRate: "99%", tag: "PII Data" },
  { name: "Payment_Method", dataType: "String", length: 24, min: "—", max: "—", mean: "—", nullCount: 0, distinct: 6, uniqueness: "1%", fillRate: "100%" },
  { name: "Discount_Code", dataType: "String", length: 16, min: "—", max: "—", mean: "—", nullCount: 482, distinct: 28, uniqueness: "3%", fillRate: "60%" },
];

function AssetDetailPage() {
  const { assetSlug } = useParams({ from: "/assets/$assetSlug" });
  const detail = ASSET_DETAILS[assetSlug.toLowerCase()] ?? ASSET_DETAILS.orders;
  const [activeTab, setActiveTab] = useState<TabName>("Overview");
  const [columnsSubTab, setColumnsSubTab] = useState<"Profiling" | "Sample data">("Profiling");

  return (
    <AppShell activeNav="explore">
      <div className="relative flex flex-1 flex-col">
        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-8 pt-6 pb-28">
          {/* Header */}
          <div className="rounded-2xl border bg-white p-5" style={{ borderColor: "var(--hairline)" }}>
            <div className="flex items-start gap-3">
              <Link
                to="/explore"
                aria-label="Back to Explore"
                className="mt-1 inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-[color:var(--surface-soft)]"
                style={{ color: "var(--ink-700)" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
              </Link>
              <span
                className="mt-0.5 inline-flex h-9 w-9 items-center justify-center"
                aria-hidden="true"
              >
                <SourceLogo source={detail.source} />
              </span>
              <div className="flex-1">
                <h1
                  className="text-[22px] font-semibold leading-tight"
                  style={{ color: "var(--brand-blue)" }}
                >
                  {detail.name}
                </h1>
                <div
                  className="mt-1 flex items-center gap-1.5 text-[12px]"
                  style={{ color: "var(--ink-500)" }}
                >
                  <span style={{ color: "var(--ink-300)" }}>
                    <TableIcon size={13} />
                  </span>
                  <span>Table</span>
                  <span style={{ color: "var(--ink-300)" }}>›</span>
                  <span style={{ color: "var(--brand-blue)" }}>
                    <DatasetIcon size={13} />
                  </span>
                  <span style={{ color: "var(--ink-700)" }}>{detail.dataset}</span>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-5 flex items-center gap-6 border-b" style={{ borderColor: "var(--hairline)" }}>
              {TABS.map((t, i) => {
                const active = i === 0;
                return (
                  <button
                    key={t}
                    type="button"
                    className="relative pb-2.5 text-[14px] font-medium transition-colors"
                    style={{ color: active ? "var(--brand-blue)" : "var(--ink-700)" }}
                  >
                    {t}
                    {active && (
                      <span
                        className="absolute inset-x-0 -bottom-px h-[2px] rounded-full"
                        style={{ background: "var(--brand-blue)" }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { label: "Columns", value: String(detail.columns) },
              { label: "Rows", value: detail.rows },
              { label: "Checks", value: String(detail.checks) },
              { label: "Fill rate", value: detail.fillRate },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border bg-white p-4"
                style={{ borderColor: "var(--hairline)" }}
              >
                <div className="text-[13px]" style={{ color: "var(--ink-500)" }}>
                  {s.label}
                </div>
                <div
                  className="mt-2 text-[26px] font-semibold leading-none"
                  style={{ color: "var(--brand-blue)" }}
                >
                  {s.value}
                </div>
              </div>
            ))}
          </div>

          {/* Quality + Classification */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Quality score */}
            <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--hairline)" }}>
              <h2 className="text-[16px] font-semibold" style={{ color: "var(--ink-900)" }}>
                Quality score
              </h2>
              <div className="mt-5 flex items-center gap-8">
                <QualityDonut value={detail.quality} />
                <div className="flex-1 space-y-4">
                  <Bar label="Validity" value={detail.validity} />
                  <Bar label="Accuracy" value={detail.accuracy} />
                  <Bar label="Consistency" value={detail.consistency} />
                </div>
              </div>
            </div>

            {/* Classification */}
            <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--hairline)" }}>
              <h2 className="text-[16px] font-semibold" style={{ color: "var(--ink-900)" }}>
                Classification
              </h2>
              <ul className="mt-4 space-y-3">
                {detail.classification.map((c) => (
                  <li key={c.label} className="grid grid-cols-[150px_1fr_36px] items-center gap-3">
                    <span className="text-[13px]" style={{ color: "var(--ink-700)" }}>
                      {c.label}
                    </span>
                    <div
                      className="h-1.5 overflow-hidden rounded-full"
                      style={{ background: "var(--surface-soft)" }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${Math.min(c.pct, 100)}%`, background: "var(--teal-500, #14a6a6)" }}
                      />
                    </div>
                    <span
                      className="text-right text-[12px] font-medium"
                      style={{ color: "var(--ink-700)" }}
                    >
                      {c.pct}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* floating composer */}
        <div className="pointer-events-none absolute inset-x-0 bottom-6 px-8">
          <div className="pointer-events-auto mx-auto w-full max-w-2xl">
            <ChatComposer />
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-[13px]">
        <span style={{ color: "var(--ink-700)" }}>{label}</span>
        <span className="font-semibold" style={{ color: "#14a6a6" }}>
          {value}%
        </span>
      </div>
      <div
        className="mt-1.5 h-1.5 overflow-hidden rounded-full"
        style={{ background: "var(--surface-soft)" }}
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${value}%`, background: "#14a6a6" }}
        />
      </div>
    </div>
  );
}

function QualityDonut({ value }: { value: number }) {
  const r = 56;
  const C = 2 * Math.PI * r;
  const dash = (value / 100) * C;
  return (
    <svg width="150" height="150" viewBox="0 0 150 150" aria-label={`Quality score ${value}%`}>
      <circle cx="75" cy="75" r={r} fill="none" stroke="var(--surface-soft)" strokeWidth="14" />
      <circle
        cx="75"
        cy="75"
        r={r}
        fill="none"
        stroke="#14a6a6"
        strokeWidth="14"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${C}`}
        transform="rotate(-90 75 75)"
      />
      <text x="75" y="82" textAnchor="middle" fontSize="26" fontWeight="600" fill="#14a6a6">
        {value}%
      </text>
    </svg>
  );
}
