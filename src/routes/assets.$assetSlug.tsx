import { useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { Columns3 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ChatComposer } from "@/components/chat-composer";
import { SourceLogo, TableIcon, DatasetIcon } from "@/components/explore-screen";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";

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

type SampleRow = Record<string, string | number>;

const SAMPLE_ATTRIBUTES = [
  "FIRST_NAME",
  "LAST_NAME",
  "TOTAL_ORDERS",
  "TOTAL_SPENT",
  "FIRST_ORDER_DATE",
  "LAST_ORDER_DATE",
] as const;

const SAMPLE_DATA_ROWS: (SampleRow & { primary: string })[] = [
  { primary: "123",  FIRST_NAME: "Charles", LAST_NAME: "*********", TOTAL_ORDERS: 3, TOTAL_SPENT: "$357.87", FIRST_ORDER_DATE: "08-09-2023", LAST_ORDER_DATE: "10-21-2025" },
  { primary: "847",  FIRST_NAME: "Bob",     LAST_NAME: "*********", TOTAL_ORDERS: 5, TOTAL_SPENT: "$357.87", FIRST_ORDER_DATE: "08-09-2023", LAST_ORDER_DATE: "10-21-2025" },
  { primary: "1738", FIRST_NAME: "Maggie",  LAST_NAME: "*********", TOTAL_ORDERS: 8, TOTAL_SPENT: "$357.87", FIRST_ORDER_DATE: "08-09-2023", LAST_ORDER_DATE: "10-21-2025" },
  { primary: "3918", FIRST_NAME: "Susan",   LAST_NAME: "*********", TOTAL_ORDERS: 2, TOTAL_SPENT: "$357.87", FIRST_ORDER_DATE: "08-09-2023", LAST_ORDER_DATE: "10-21-2025" },
  { primary: "839",  FIRST_NAME: "Timmy",   LAST_NAME: "*********", TOTAL_ORDERS: 4, TOTAL_SPENT: "$357.87", FIRST_ORDER_DATE: "08-09-2023", LAST_ORDER_DATE: "10-21-2025" },
  { primary: "0927", FIRST_NAME: "Zach",    LAST_NAME: "*********", TOTAL_ORDERS: 1, TOTAL_SPENT: "$357.87", FIRST_ORDER_DATE: "08-09-2023", LAST_ORDER_DATE: "10-21-2025" },
  { primary: "121",  FIRST_NAME: "Justin",  LAST_NAME: "*********", TOTAL_ORDERS: 6, TOTAL_SPENT: "$357.87", FIRST_ORDER_DATE: "08-09-2023", LAST_ORDER_DATE: "10-21-2025" },
  { primary: "846",  FIRST_NAME: "Emma",    LAST_NAME: "*********", TOTAL_ORDERS: 9, TOTAL_SPENT: "$357.87", FIRST_ORDER_DATE: "08-09-2023", LAST_ORDER_DATE: "10-21-2025" },
];

const PROFILING_COLUMNS = [
  { key: "name", label: "Name" },
  { key: "dataType", label: "Data type" },
  { key: "length", label: "Length" },
  { key: "min", label: "Min value" },
  { key: "max", label: "Max value" },
  { key: "mean", label: "Mean value" },
  { key: "nullCount", label: "Null count" },
  { key: "distinct", label: "Distinct count" },
  { key: "uniqueness", label: "Uniqueness" },
  { key: "fillRate", label: "Fill rate" },
  { key: "tag", label: "Tags" },
] as const;

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
              {TABS.map((t) => {
                const active = t === activeTab;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setActiveTab(t)}
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

          {activeTab === "Overview" && (
            <>
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
            </>
          )}

          {activeTab === "Columns" && (
            <ColumnsPanel
              columns={SAMPLE_COLUMNS}
              subTab={columnsSubTab}
              onSubTab={setColumnsSubTab}
            />
          )}

          {activeTab === "Checks" && <EmptyPanel label="Checks coming soon" />}
          {activeTab === "Activity" && <EmptyPanel label="Activity coming soon" />}
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

function EmptyPanel({ label }: { label: string }) {
  return (
    <div
      className="rounded-2xl border bg-white p-10 text-center text-[14px]"
      style={{ borderColor: "var(--hairline)", color: "var(--ink-500)" }}
    >
      {label}
    </div>
  );
}

function ColumnsToggle({
  options,
  visible,
  onToggle,
}: {
  options: readonly { key: string; label: string }[];
  visible: Set<string>;
  onToggle: (key: string) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Show or hide columns"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border bg-white transition-colors hover:bg-[color:var(--surface-soft)]"
          style={{ borderColor: "var(--hairline)", color: "var(--ink-700)" }}
        >
          <Columns3 size={16} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-2">
        <div className="px-2 pt-1 pb-2 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--ink-500)" }}>
          Show columns
        </div>
        <div className="flex flex-col">
          {options.map((opt) => {
            const checked = visible.has(opt.key);
            return (
              <label
                key={opt.key}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-[13px] hover:bg-[color:var(--surface-soft)]"
                style={{ color: "var(--ink-700)" }}
              >
                <Checkbox checked={checked} onCheckedChange={() => onToggle(opt.key)} />
                <span>{opt.label}</span>
              </label>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ColumnsPanel({
  columns,
  subTab,
  onSubTab,
}: {
  columns: ColumnRow[];
  subTab: "Profiling" | "Sample data";
  onSubTab: (s: "Profiling" | "Sample data") => void;
}) {
  const [visibleProfiling, setVisibleProfiling] = useState<Set<string>>(
    () => new Set(PROFILING_COLUMNS.map((c) => c.key)),
  );
  const [visibleSample, setVisibleSample] = useState<Set<string>>(
    () => new Set(SAMPLE_ATTRIBUTES),
  );

  const toggleSetItem = (
    setter: React.Dispatch<React.SetStateAction<Set<string>>>,
  ) => (key: string) =>
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const sampleOptions = SAMPLE_ATTRIBUTES.map((k) => ({ key: k, label: k }));
  const profilingCols = PROFILING_COLUMNS.filter((c) => visibleProfiling.has(c.key));
  const sampleCols = SAMPLE_ATTRIBUTES.filter((k) => visibleSample.has(k));

  return (
    <div className="flex flex-col gap-4">
      {/* Sub-tabs row with show/hide toggle */}
      <div className="flex items-center justify-between">
        <div
          className="inline-flex w-fit items-center gap-1 rounded-lg border bg-white p-1"
          style={{ borderColor: "var(--hairline)" }}
        >
          {(["Profiling", "Sample data"] as const).map((s) => {
            const active = s === subTab;
            return (
              <button
                key={s}
                type="button"
                onClick={() => onSubTab(s)}
                className="rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors"
                style={{
                  background: active ? "var(--surface-soft)" : "transparent",
                  color: active ? "var(--brand-blue)" : "var(--ink-700)",
                }}
              >
                {s}
              </button>
            );
          })}
        </div>

        {subTab === "Profiling" ? (
          <ColumnsToggle
            options={PROFILING_COLUMNS}
            visible={visibleProfiling}
            onToggle={toggleSetItem(setVisibleProfiling)}
          />
        ) : (
          <ColumnsToggle
            options={sampleOptions}
            visible={visibleSample}
            onToggle={toggleSetItem(setVisibleSample)}
          />
        )}
      </div>

      {subTab === "Profiling" ? (
        <div
          className="overflow-hidden rounded-2xl border bg-white"
          style={{ borderColor: "var(--hairline)" }}
        >
          <table className="w-full border-collapse text-left text-[13px]">
            <thead>
              <tr
                className="text-[11px] uppercase tracking-[0.08em]"
                style={{ color: "var(--ink-300)" }}
              >
                {profilingCols.map((c, i) => (
                  <th
                    key={c.key}
                    className={`${i === 0 || i === profilingCols.length - 1 ? "px-5" : "px-3"} py-3 font-semibold`}
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {columns.map((row) => (
                <tr
                  key={row.name}
                  className="border-t"
                  style={{ borderColor: "var(--hairline)" }}
                >
                  {profilingCols.map((c, i) => {
                    const isFirst = i === 0;
                    const isLast = i === profilingCols.length - 1;
                    const pad = isFirst || isLast ? "px-5" : "px-3";
                    if (c.key === "tag") {
                      return (
                        <td key={c.key} className={`${pad} py-4`}>
                          {row.tag && (
                            <span
                              className="inline-flex items-center rounded-md border px-2.5 py-1 text-[12px] font-medium"
                              style={{
                                borderColor: "var(--hairline)",
                                color: "var(--ink-700)",
                                background: "white",
                              }}
                            >
                              {row.tag}
                            </span>
                          )}
                        </td>
                      );
                    }
                    const raw = row[c.key as keyof ColumnRow];
                    const value =
                      c.key === "distinct" && typeof raw === "number"
                        ? raw.toLocaleString()
                        : raw ?? "";
                    return (
                      <td
                        key={c.key}
                        className={`${pad} py-4 ${isFirst ? "font-semibold" : ""}`}
                        style={{ color: isFirst ? "var(--ink-900)" : "var(--ink-700)" }}
                      >
                        {value as string | number}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div
          className="overflow-hidden rounded-2xl border bg-white"
          style={{ borderColor: "var(--hairline)" }}
        >
          <table className="w-full border-collapse text-left text-[13px]">
            <thead>
              <tr
                className="text-[11px] uppercase tracking-[0.08em]"
                style={{ color: "var(--ink-300)" }}
              >
                <th className="px-5 py-3 font-semibold">Name</th>
                {sampleCols.map((k, i) => (
                  <th
                    key={k}
                    className={`${i === sampleCols.length - 1 ? "px-5" : "px-3"} py-3 font-semibold`}
                  >
                    {k}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SAMPLE_FIELD_NAMES.map((fieldName) => (
                <tr
                  key={fieldName}
                  className="border-t"
                  style={{ borderColor: "var(--hairline)" }}
                >
                  <td className="px-5 py-4 font-semibold" style={{ color: "var(--ink-900)" }}>
                    {fieldName}
                  </td>
                  {sampleCols.map((k, i) => {
                    const sampleIdx = SAMPLE_VALUE_KEYS.indexOf(k as typeof SAMPLE_VALUE_KEYS[number]);
                    const row = SAMPLE_DATA_ROWS[sampleIdx];
                    const value = row?.[fieldName] ?? "—";
                    const isLast = i === sampleCols.length - 1;
                    const pad = isLast ? "px-5" : "px-3";
                    return (
                      <td key={k} className={`${pad} py-4`} style={{ color: "var(--ink-700)" }}>
                        {value}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
