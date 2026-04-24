import * as React from "react";
import { useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { Columns3, X, ChevronLeft, ChevronRight, ChevronDown, Search, SlidersHorizontal, Check, Info } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ChatComposer } from "@/components/chat-composer";
import { SourceLogo, TableIcon, DatasetIcon } from "@/components/explore-screen";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { useSidebarState } from "@/components/sidebar-context";

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

const SAMPLE_ATTRIBUTES = SAMPLE_COLUMNS.map((c) => c.name);

const SAMPLE_DATA_ROWS: (SampleRow & { primary: string })[] = [
  { primary: "Sally Smith",      Order_ID: 1001, Customer_ID: 123,  Order_Date: "2024-01-15", Total_Amount: "$245.50",   Status: "Shipped",   Shipping_Address: "123 Maple St, Austin TX",     Payment_Method: "Credit Card", Discount_Code: "WELCOME10" },
  { primary: "John Smith",       Order_ID: 1002, Customer_ID: 847,  Order_Date: "2024-02-03", Total_Amount: "$89.99",    Status: "Delivered", Shipping_Address: "47 Oak Ave, Seattle WA",      Payment_Method: "PayPal",      Discount_Code: "—" },
  { primary: "Carina Alabanza",  Order_ID: 1003, Customer_ID: 1738, Order_Date: "2024-02-21", Total_Amount: "$1,299.00", Status: "Pending",   Shipping_Address: "920 Pine Rd, Denver CO",      Payment_Method: "Credit Card", Discount_Code: "SPRING25" },
  { primary: "Diego Martinez",   Order_ID: 1004, Customer_ID: 3918, Order_Date: "2024-03-08", Total_Amount: "$57.25",    Status: "Cancelled", Shipping_Address: "12 Birch Ln, Miami FL",       Payment_Method: "Apple Pay",   Discount_Code: "—" },
  { primary: "Priya Patel",      Order_ID: 1005, Customer_ID: 839,  Order_Date: "2024-03-19", Total_Amount: "$432.10",   Status: "Shipped",   Shipping_Address: "88 Cedar Ct, Boston MA",      Payment_Method: "Credit Card", Discount_Code: "—" },
  { primary: "Marcus Lee",       Order_ID: 1006, Customer_ID: 927,  Order_Date: "2024-04-02", Total_Amount: "$15.00",    Status: "Delivered", Shipping_Address: "5 Elm St, Portland OR",       Payment_Method: "Debit Card",  Discount_Code: "FREESHIP" },
  { primary: "Emma Johnson",     Order_ID: 1007, Customer_ID: 121,  Order_Date: "2024-04-14", Total_Amount: "$782.40",   Status: "Shipped",   Shipping_Address: "330 Walnut Way, Chicago IL",  Payment_Method: "Credit Card", Discount_Code: "—" },
  { primary: "Liam Chen",        Order_ID: 1008, Customer_ID: 846,  Order_Date: "2024-04-28", Total_Amount: "$199.95",   Status: "Delivered", Shipping_Address: "76 Spruce Blvd, Phoenix AZ",  Payment_Method: "PayPal",      Discount_Code: "SAVE15" },
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
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const selectedColumn = selectedIndex === null ? null : SAMPLE_COLUMNS[selectedIndex] ?? null;
  const rightPanelOpen = activeTab === "Columns" && selectedColumn !== null;

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
              selectedIndex={selectedIndex}
              onSelectIndex={setSelectedIndex}
            />
          )}

          {activeTab === "Checks" && <ChecksPanel checks={SAMPLE_CHECKS} />}
          {activeTab === "Activity" && <ActivityPanel events={SAMPLE_ACTIVITY} slug={assetSlug} />}
        </div>

        {/* floating composer (centered over content area, not full viewport) */}
        <FloatingComposer rightPanelOpen={rightPanelOpen} />
      </div>
    </AppShell>
  );
}

function FloatingComposer({ rightPanelOpen }: { rightPanelOpen: boolean }) {
  const { collapsed } = useSidebarState();
  const PANEL_WIDTH = 440;
  return (
    <div
      className="pointer-events-none fixed bottom-6 z-30 px-8"
      style={{
        left: collapsed ? 0 : 260,
        right: rightPanelOpen ? PANEL_WIDTH : 0,
      }}
    >
      <div className="pointer-events-auto mx-auto w-full max-w-2xl">
        <ChatComposer />
      </div>
    </div>
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
  selectedIndex,
  onSelectIndex,
}: {
  columns: ColumnRow[];
  subTab: "Profiling" | "Sample data";
  onSubTab: (s: "Profiling" | "Sample data") => void;
  selectedIndex: number | null;
  onSelectIndex: (i: number | null) => void;
}) {
  const [visibleProfiling, setVisibleProfiling] = useState<Set<string>>(
    () => new Set(PROFILING_COLUMNS.map((c) => c.key)),
  );
  const [visibleSample, setVisibleSample] = useState<Set<string>>(
    () => new Set(SAMPLE_ATTRIBUTES),
  );
  const selectedColumn = selectedIndex === null ? null : columns[selectedIndex] ?? null;

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
          className="overflow-x-auto rounded-2xl border bg-white"
          style={{ borderColor: "var(--hairline)" }}
        >
          <table className="w-full min-w-[1100px] border-collapse text-left text-[13px]">
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
              {columns.map((row, idx) => {
                const isSelected = selectedIndex === idx;
                return (
                <tr
                  key={row.name}
                  onClick={() => onSelectIndex(idx)}
                  className="cursor-pointer border-t transition-colors hover:bg-[color:var(--surface-soft)]"
                  style={{
                    borderColor: "var(--hairline)",
                    background: isSelected ? "var(--surface-soft)" : undefined,
                  }}
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
              )})}
            </tbody>
          </table>
        </div>
      ) : (
        <div
          className="overflow-x-auto rounded-2xl border bg-white"
          style={{ borderColor: "var(--hairline)" }}
        >
          <table className="w-full min-w-[1100px] border-collapse text-left text-[13px]">
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
              {SAMPLE_DATA_ROWS.map((row) => (
                <tr
                  key={row.primary}
                  className="border-t"
                  style={{ borderColor: "var(--hairline)" }}
                >
                  <td className="px-5 py-4 font-semibold" style={{ color: "var(--ink-900)" }}>
                    {row.primary}
                  </td>
                  {sampleCols.map((k, i) => {
                    const isLast = i === sampleCols.length - 1;
                    const pad = isLast ? "px-5" : "px-3";
                    return (
                      <td key={k} className={`${pad} py-4`} style={{ color: "var(--ink-700)" }}>
                        {row[k]}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ColumnDetailPanel
        column={selectedColumn}
        index={selectedIndex}
        total={columns.length}
        onPrev={() =>
          onSelectIndex(
            selectedIndex === null
              ? null
              : (selectedIndex - 1 + columns.length) % columns.length,
          )
        }
        onNext={() =>
          onSelectIndex(
            selectedIndex === null ? null : (selectedIndex + 1) % columns.length,
          )
        }
        onClose={() => onSelectIndex(null)}
      />
    </div>
  );
}

function ColumnDetailPanel({
  column,
  index,
  total,
  onPrev,
  onNext,
  onClose,
}: {
  column: ColumnRow | null;
  index: number | null;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
}) {
  const open = column !== null;
  return (
    <>
      {/* Slide-over (non-modal, does not block clicks elsewhere) */}
      <aside
        role="complementary"
        aria-label="Column profile details"
        className={`fixed right-0 top-0 z-40 flex h-full w-full max-w-[440px] flex-col border-l bg-white shadow-xl transition-transform duration-300 ${
          open ? "translate-x-0" : "pointer-events-none translate-x-full"
        }`}
        style={{ borderColor: "var(--hairline)" }}
      >
        {column && (
          <>
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b px-6 py-5" style={{ borderColor: "var(--hairline)" }}>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-mono" style={{ color: "var(--ink-300)" }}>123</span>
                  <h3 className="text-[18px] font-semibold" style={{ color: "var(--ink-900)" }}>
                    {column.name}
                  </h3>
                  {column.tag && (
                    <span
                      className="inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium"
                      style={{ borderColor: "var(--hairline)", color: "var(--ink-700)" }}
                    >
                      {column.tag}
                    </span>
                  )}
                </div>
                <div className="mt-1 text-[12px]" style={{ color: "var(--ink-500)" }}>
                  Finance Sales Data &gt; Orders &gt; {column.name}
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-[color:var(--surface-soft)]"
                style={{ color: "var(--ink-700)" }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
              {/* Completeness */}
              <section className="rounded-xl p-4" style={{ background: "var(--surface-soft)" }}>
                <h4 className="text-[14px] font-semibold" style={{ color: "var(--ink-900)" }}>Completeness</h4>
                <p className="text-[12px]" style={{ color: "var(--brand-blue)" }}>How distinct are the value</p>
                <div className="mt-4 flex items-center gap-5">
                  <CompletenessDonut fill={parseInt(column.fillRate)} />
                  <div className="flex-1 space-y-3">
                    <MiniBar label="Fill Rate:" value={parseInt(column.fillRate)} />
                    <MiniBar label="Null" value={100 - parseInt(column.fillRate)} />
                  </div>
                </div>
              </section>

              {/* Uniqueness */}
              <section className="rounded-xl p-4" style={{ background: "var(--surface-soft)" }}>
                <h4 className="text-[14px] font-semibold" style={{ color: "var(--ink-900)" }}>Uniqueness</h4>
                <p className="text-[12px]" style={{ color: "var(--brand-blue)" }}>How distinct are the value</p>
                <div className="mt-4 space-y-3">
                  <StatBar label="Uniqueness" valueText={`${column.uniqueness} (20)`} pct={parseInt(column.uniqueness)} />
                  <StatBar label="Distinct" valueText={`24% (${Math.min(column.distinct, 10)})`} pct={24} />
                </div>
              </section>

              {/* Distribution */}
              <section className="rounded-xl p-4" style={{ background: "var(--surface-soft)" }}>
                <h4 className="text-[14px] font-semibold" style={{ color: "var(--ink-900)" }}>Distribution</h4>
                <p className="text-[12px]" style={{ color: "var(--brand-blue)" }}>How the values are spread</p>
                <DistributionChart />
                <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                  {[
                    { label: "Min Length", value: 2 },
                    { label: "Max Length", value: 3 },
                    { label: "Mean Length", value: 3 },
                    { label: "Median Length", value: 3 },
                  ].map((s) => (
                    <div key={s.label}>
                      <div className="text-[20px] font-semibold" style={{ color: "var(--brand-blue)" }}>{s.value}</div>
                      <div className="text-[11px]" style={{ color: "var(--ink-500)" }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Pattern */}
              <section className="rounded-xl p-4" style={{ background: "var(--surface-soft)" }}>
                <h4 className="text-[14px] font-semibold" style={{ color: "var(--ink-900)" }}>Pattern</h4>
                <p className="text-[12px]" style={{ color: "var(--brand-blue)" }}>What format do values follow</p>
                <FreqTable
                  rows={[
                    { type: "xxx-xxxx", count: 200, pct: 76 },
                    { type: "xxxxxxx", count: 150, pct: 76 },
                    { type: "xxx.xxxx", count: 100, pct: 76 },
                  ]}
                />
              </section>

              {/* Most frequent value */}
              <section className="rounded-xl p-4" style={{ background: "var(--surface-soft)" }}>
                <h4 className="text-[14px] font-semibold" style={{ color: "var(--ink-900)" }}>Most frequent value</h4>
                <p className="text-[12px]" style={{ color: "var(--brand-blue)" }}>What appears most often</p>
                <FreqTable
                  rows={Array.from({ length: 6 }).map(() => ({ type: "Databricks", count: 1, pct: 76 }))}
              />
              </section>
            </div>

            {/* Footer nav: prev / current / next */}
            <div
              className="flex items-center justify-between border-t bg-white px-6 py-3"
              style={{ borderColor: "var(--hairline)" }}
            >
              <button
                type="button"
                onClick={onPrev}
                aria-label="Previous column"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-[color:var(--surface-soft)] disabled:opacity-40"
                style={{ color: "var(--ink-700)" }}
                disabled={total <= 1}
              >
                <ChevronLeft size={18} />
              </button>
              <div className="text-[12px] font-medium" style={{ color: "var(--ink-700)" }}>
                {(index ?? 0) + 1} of {total} columns
              </div>
              <button
                type="button"
                onClick={onNext}
                aria-label="Next column"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-[color:var(--surface-soft)] disabled:opacity-40"
                style={{ color: "var(--ink-700)" }}
                disabled={total <= 1}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}

function MiniBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[12px]">
        <span style={{ color: "var(--ink-500)" }}>{label}</span>
        <span className="font-semibold" style={{ color: "var(--ink-900)" }}>{value}%</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full" style={{ background: "white" }}>
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: "#14a6a6" }} />
      </div>
    </div>
  );
}

function StatBar({ label, valueText, pct }: { label: string; valueText: string; pct: number }) {
  return (
    <div>
      <div className="text-[12px]" style={{ color: "var(--ink-500)" }}>{label}</div>
      <div className="mt-1 flex items-center gap-3">
        <div className="text-[14px] font-semibold" style={{ color: "var(--ink-900)" }}>{valueText}</div>
        <div className="flex-1 h-1.5 overflow-hidden rounded-full" style={{ background: "white" }}>
          <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, background: "#14a6a6" }} />
        </div>
      </div>
    </div>
  );
}

function CompletenessDonut({ fill }: { fill: number }) {
  const r = 32;
  const C = 2 * Math.PI * r;
  const dash = (fill / 100) * C;
  return (
    <svg width="90" height="90" viewBox="0 0 90 90" aria-label={`Fill rate ${fill}%`}>
      <circle cx="45" cy="45" r={r} fill="none" stroke="#e6e8eb" strokeWidth="12" />
      <circle
        cx="45"
        cy="45"
        r={r}
        fill="none"
        stroke="#14a6a6"
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${C}`}
        transform="rotate(-90 45 45)"
      />
    </svg>
  );
}

function DistributionChart() {
  // bell curve path approximation
  const points: string[] = [];
  for (let i = 0; i <= 60; i++) {
    const x = i * 5; // 0..300
    const t = (i - 30) / 10;
    const y = 110 - 90 * Math.exp(-(t * t) / 2);
    points.push(`${x},${y}`);
  }
  return (
    <svg viewBox="0 0 320 140" className="mt-3 w-full">
      {/* grid */}
      {[0, 1, 2, 3, 4].map((i) => (
        <line key={i} x1="20" x2="310" y1={20 + i * 22} y2={20 + i * 22} stroke="#e6e8eb" strokeWidth="1" />
      ))}
      <polyline fill="none" stroke="#e89b3a" strokeWidth="2" points={points.map((p) => {
        const [x, y] = p.split(",").map(Number);
        return `${20 + (x / 300) * 290},${y + 10}`;
      }).join(" ")} />
      {/* x-axis labels */}
      {[-30, -20, -10, 0, 10, 20, 30].map((v, i) => (
        <text key={v} x={20 + (i / 6) * 290} y="135" textAnchor="middle" fontSize="9" fill="#9aa3ad">{v}</text>
      ))}
    </svg>
  );
}

function FreqTable({ rows }: { rows: { type: string; count: number; pct: number }[] }) {
  return (
    <div className="mt-3 overflow-hidden rounded-lg border" style={{ borderColor: "var(--hairline)", background: "white" }}>
      <div className="grid grid-cols-[1fr_70px_1.4fr] px-3 py-2 text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--ink-500)", background: "var(--surface-soft)" }}>
        <span>Type</span>
        <span>Count</span>
        <span>Percentage</span>
      </div>
      {rows.map((r, i) => (
        <div key={i} className="grid grid-cols-[1fr_70px_1.4fr] items-center border-t px-3 py-2.5 text-[12px]" style={{ borderColor: "var(--hairline)", color: "var(--ink-700)" }}>
          <span>{r.type}</span>
          <span>{r.count}</span>
          <div className="flex items-center gap-2">
            <span className="font-medium" style={{ color: "var(--ink-900)" }}>{r.pct}%</span>
            <div className="flex-1 h-1.5 overflow-hidden rounded-full" style={{ background: "var(--surface-soft)" }}>
              <div className="h-full rounded-full" style={{ width: `${r.pct}%`, background: "#c9c2f5" }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ===================== Checks tab =====================

type CheckStatus = "Passed" | "Failed" | "Warning";
type CheckChild = { column: string; lastRun: string; status: CheckStatus; passRate: string };
type CheckRow = {
  name: string;
  dimension: "Validity" | "Completeness" | "Uniqueness" | "Accuracy" | "Consistency";
  lastRun: string;
  status: CheckStatus;
  passRate: string;
  children: CheckChild[];
};

const SAMPLE_CHECKS: CheckRow[] = [
  {
    name: "Email Format Validation",
    dimension: "Validity",
    lastRun: "2h ago",
    status: "Passed",
    passRate: "98/100 (98%)",
    children: [
      { column: "attributes.Email", lastRun: "2h ago", status: "Passed", passRate: "100/100 (100%)" },
      { column: "attributes.SecondaryEmail", lastRun: "2h ago", status: "Passed", passRate: "98/100 (98%)" },
      { column: "attributes.WorkEmail", lastRun: "2h ago", status: "Passed", passRate: "100/100 (100%)" },
      { column: "attributes.RecoveryEmail", lastRun: "2h ago", status: "Passed", passRate: "99/100 (99%)" },
    ],
  },
  {
    name: "Phone Number Completeness",
    dimension: "Completeness",
    lastRun: "2h ago",
    status: "Failed",
    passRate: "2/3 (67%)",
    children: [
      { column: "attributes.PrimaryPhone", lastRun: "2h ago", status: "Passed", passRate: "100/100 (100%)" },
      { column: "attributes.MobilePhone", lastRun: "2h ago", status: "Passed", passRate: "100/100 (100%)" },
      { column: "attributes.WorkPhone", lastRun: "2h ago", status: "Failed", passRate: "42/100 (42%)" },
    ],
  },
  {
    name: "Customer ID Uniqueness",
    dimension: "Uniqueness",
    lastRun: "2h ago",
    status: "Failed",
    passRate: "0/1 (0%)",
    children: [
      { column: "attributes.CustomerID", lastRun: "2h ago", status: "Failed", passRate: "9821/10000 (98%)" },
    ],
  },
  {
    name: "Date Range Validation",
    dimension: "Accuracy",
    lastRun: "3h ago",
    status: "Warning",
    passRate: "4/5 (80%)",
    children: [
      { column: "attributes.CreatedAt", lastRun: "3h ago", status: "Passed", passRate: "100/100 (100%)" },
      { column: "attributes.UpdatedAt", lastRun: "3h ago", status: "Passed", passRate: "100/100 (100%)" },
      { column: "attributes.OrderDate", lastRun: "3h ago", status: "Passed", passRate: "100/100 (100%)" },
      { column: "attributes.ShipDate", lastRun: "3h ago", status: "Warning", passRate: "94/100 (94%)" },
      { column: "attributes.DeliveryDate", lastRun: "3h ago", status: "Passed", passRate: "100/100 (100%)" },
    ],
  },
  {
    name: "Status Value Set Check",
    dimension: "Consistency",
    lastRun: "2h ago",
    status: "Passed",
    passRate: "2/2 (100%)",
    children: [
      { column: "attributes.OrderStatus", lastRun: "2h ago", status: "Passed", passRate: "100/100 (100%)" },
      { column: "attributes.PaymentStatus", lastRun: "2h ago", status: "Passed", passRate: "100/100 (100%)" },
    ],
  },
  {
    name: "Address Completeness",
    dimension: "Completeness",
    lastRun: "2h ago",
    status: "Passed",
    passRate: "2/2 (100%)",
    children: [
      { column: "attributes.BillingAddress", lastRun: "2h ago", status: "Passed", passRate: "100/100 (100%)" },
      { column: "attributes.ShippingAddress", lastRun: "2h ago", status: "Passed", passRate: "100/100 (100%)" },
    ],
  },
];

function StatusPill({ status }: { status: CheckStatus }) {
  const styles =
    status === "Passed"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : status === "Failed"
        ? "bg-red-50 text-red-700 ring-red-200"
        : "bg-amber-50 text-amber-700 ring-amber-200";
  const dot =
    status === "Passed" ? "bg-emerald-500" : status === "Failed" ? "bg-red-500" : "bg-amber-500";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${styles}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {status}
    </span>
  );
}

function DimensionPill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-200">
      {label}
    </span>
  );
}

function CoverageBadge({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-slate-700">
      <TableIcon size={13} />
      {count}
    </span>
  );
}

function ChecksPanel({ checks }: { checks: CheckRow[] }) {
  const [expanded, setExpanded] = React.useState<Set<string>>(
    () => new Set(checks.length > 0 ? [checks[0].name] : []),
  );
  const toggle = (name: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };
  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search
            size={14}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search checks…"
            className="h-8 w-full rounded-md border border-slate-200 bg-white pl-8 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
        </div>
        <button
          type="button"
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-700 hover:bg-slate-50"
        >
          <SlidersHorizontal size={13} />
          Filter
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Name</th>
              <th className="px-3 py-2 text-left font-medium">Dimension</th>
              <th className="px-3 py-2 text-left font-medium">Coverage</th>
              <th className="px-3 py-2 text-left font-medium">Last Run</th>
              <th className="px-3 py-2 text-left font-medium">Status</th>
              <th className="px-3 py-2 text-left font-medium">Pass Rate</th>
            </tr>
          </thead>
          <tbody>
            {checks.map((check) => {
              const isOpen = expanded.has(check.name);
              return (
                <React.Fragment key={check.name}>
                  <tr className="border-t border-slate-100 hover:bg-slate-50/60">
                    <td className="px-3 py-2.5">
                      <button
                        type="button"
                        onClick={() => toggle(check.name)}
                        className="inline-flex items-center gap-1.5 text-left font-medium text-blue-600 hover:underline"
                      >
                        {isOpen ? (
                          <ChevronDown size={14} className="text-slate-400" />
                        ) : (
                          <ChevronRight size={14} className="text-slate-400" />
                        )}
                        {check.name}
                      </button>
                    </td>
                    <td className="px-3 py-2.5">
                      <DimensionPill label={check.dimension} />
                    </td>
                    <td className="px-3 py-2.5">
                      <CoverageBadge count={check.children.length} />
                    </td>
                    <td className="px-3 py-2.5 text-slate-600">{check.lastRun}</td>
                    <td className="px-3 py-2.5">
                      <StatusPill status={check.status} />
                    </td>
                    <td className="px-3 py-2.5 text-slate-700">{check.passRate}</td>
                  </tr>
                  {isOpen &&
                    check.children.map((child) => (
                      <tr
                        key={`${check.name}::${child.column}`}
                        className="border-t border-slate-100 bg-slate-50/50"
                      >
                        <td className="px-3 py-2 pl-10">
                          <span className="inline-flex items-center gap-2 text-slate-700">
                            <Check size={13} className="text-emerald-500" />
                            <span className="font-mono text-xs">{child.column}</span>
                          </span>
                        </td>
                        <td className="px-3 py-2" />
                        <td className="px-3 py-2" />
                        <td className="px-3 py-2 text-slate-600">{child.lastRun}</td>
                        <td className="px-3 py-2">
                          <StatusPill status={child.status} />
                        </td>
                        <td className="px-3 py-2 text-slate-700">{child.passRate}</td>
                      </tr>
                    ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// Activity tab
// ============================================================

type ActivityStatus = "Passed" | "Failed" | "Warning";
type ActivityEvent = {
  id: string;
  check: string;
  dimension: "Validity" | "Completeness" | "Uniqueness" | "Accuracy" | "Consistency";
  target: string;
  ranAt: string; // ISO
  status: ActivityStatus;
  detail?: string;
};

const NOW = new Date();
function isoOffset(daysAgo: number, hour: number, minute: number): string {
  const d = new Date(NOW);
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

const SAMPLE_ACTIVITY: ActivityEvent[] = [
  { id: "a1", check: "ExpectColumnMostCommonValueToBeInSet", dimension: "Validity", target: "first_name", ranAt: isoOffset(0, 2, 45), status: "Passed" },
  { id: "a2", check: "ExpectColumnValueLengthsToBeBetween", dimension: "Validity", target: "ssn", ranAt: isoOffset(0, 1, 30), status: "Failed", detail: "Expected: Length between 9 and 11 characters. 1,247 records contain SSN values that are shorter or longer than the expected length." },
  { id: "a3", check: "ExpectColumnValuesToNotBeNull", dimension: "Completeness", target: "email", ranAt: isoOffset(0, 0, 12), status: "Passed" },
  { id: "a4", check: "ExpectColumnValuesToBeUnique", dimension: "Uniqueness", target: "customer_id", ranAt: isoOffset(1, 23, 5), status: "Failed", detail: "Expected: All values unique. Found 17 duplicate customer_id values." },
  { id: "a5", check: "ExpectColumnPairValuesAToBeGreaterThanB", dimension: "Consistency", target: "shipped_date, order_date", ranAt: isoOffset(1, 18, 12), status: "Failed", detail: "Expected: shipped_date > order_date. 42 rows violate this constraint." },
  { id: "a6", check: "ExpectColumnValuesToMatchRegex", dimension: "Validity", target: "phone", ranAt: isoOffset(1, 9, 30), status: "Warning", detail: "Expected: E.164 phone format. 3.2% of values do not match." },
  { id: "a7", check: "ExpectColumnValuesToBeBetween", dimension: "Accuracy", target: "order_total", ranAt: isoOffset(2, 14, 22), status: "Passed" },
  { id: "a8", check: "ExpectColumnValuesToNotBeNull", dimension: "Completeness", target: "shipping_address", ranAt: isoOffset(2, 8, 5), status: "Passed" },
  { id: "a9", check: "ExpectColumnValuesToBeInSet", dimension: "Validity", target: "status", ranAt: isoOffset(3, 16, 40), status: "Passed" },
  { id: "a10", check: "ExpectColumnValuesToBeUnique", dimension: "Uniqueness", target: "order_id", ranAt: isoOffset(3, 6, 0), status: "Passed" },
  { id: "a11", check: "ExpectColumnValueLengthsToBeBetween", dimension: "Validity", target: "postal_code", ranAt: isoOffset(5, 11, 18), status: "Failed", detail: "Expected: Length between 5 and 10. 89 rows out of range." },
  { id: "a12", check: "ExpectColumnValuesToNotBeNull", dimension: "Completeness", target: "phone", ranAt: isoOffset(6, 19, 50), status: "Warning", detail: "Expected: < 1% null. Currently 2.4% null." },
];

function ActivityStatusPill({ status }: { status: ActivityStatus }) {
  const styles =
    status === "Passed"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : status === "Failed"
      ? "bg-rose-50 text-rose-700 ring-rose-200"
      : "bg-amber-50 text-amber-700 ring-amber-200";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${styles}`}>
      {status}
    </span>
  );
}

function InfoTooltip({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex">
      <Info className="h-4 w-4 text-slate-400 hover:text-slate-600 cursor-help" />
      <span className="pointer-events-none absolute right-0 top-full z-20 mt-1 hidden w-72 rounded-md bg-slate-900 px-3 py-2 text-xs leading-snug text-slate-100 shadow-lg group-hover:block">
        {text}
      </span>
    </span>
  );
}

function formatActivityTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  const target = new Date(d); target.setHours(0, 0, 0, 0);
  const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (target.getTime() === today.getTime()) return `Today ${time}`;
  if (target.getTime() === yesterday.getTime()) return `Yesterday ${time}`;
  const md = d.toLocaleDateString([], { month: "short", day: "numeric" });
  return `${md} ${time}`;
}

function activityGroupLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 6);
  const target = new Date(d); target.setHours(0, 0, 0, 0);
  if (target.getTime() === today.getTime()) return "Today";
  if (target.getTime() === yesterday.getTime()) return "Yesterday";
  if (target >= weekAgo) return d.toLocaleDateString([], { weekday: "long" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

const HEATMAP_PALETTE = ["#EEF2F7", "#D6F0DA", "#9FE0AC", "#5BC074", "#1F8A3E"];

function seededRand(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function HeatmapCard({ slug }: { slug: string }) {
  const seed = hashString(slug);
  const cellSize = 12;
  const gap = 3;
  const days = 7;
  const leftPad = 28;
  const topPad = 18;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Start at the Sunday on/before Jan 1 of current year so column 0 = first week of January.
  const year = today.getFullYear();
  const jan1 = new Date(year, 0, 1);
  const start = new Date(jan1);
  start.setDate(start.getDate() - jan1.getDay()); // back up to Sunday

  // End at the Saturday on/after Dec 31 of current year.
  const dec31 = new Date(year, 11, 31);
  const end = new Date(dec31);
  end.setDate(end.getDate() + (6 - dec31.getDay()));

  const totalDays = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
  const weeks = totalDays / 7;

  const width = leftPad + weeks * (cellSize + gap);
  const height = topPad + days * (cellSize + gap) + 6;

  type Cell = { date: Date; intensity: number; passed: number; failed: number; isFuture: boolean };
  const cells: Cell[][] = [];
  const monthLabels: { x: number; label: string }[] = [];
  let lastMonth = -1;

  for (let w = 0; w < weeks; w++) {
    const col: Cell[] = [];
    for (let dRow = 0; dRow < days; dRow++) {
      const date = new Date(start);
      date.setDate(date.getDate() + w * 7 + dRow);
      const isFuture = date.getTime() > today.getTime();
      const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
      const seasonal = Math.sin((dayOfYear / 365) * Math.PI);
      const r = seededRand(seed + w * 7 + dRow);
      let intensity = 0;
      if (!isFuture) {
        const score = seasonal * 0.7 + r * 0.5;
        if (score < 0.2) intensity = 0;
        else if (score < 0.45) intensity = 1;
        else if (score < 0.7) intensity = 2;
        else if (score < 0.95) intensity = 3;
        else intensity = 4;
      }
      const passed = intensity === 0 ? 0 : Math.round(50 + r * 200);
      const failed = intensity >= 3 ? 0 : intensity === 0 ? 0 : Math.round(r * 8);
      col.push({ date, intensity, passed, failed, isFuture });
      if (dRow === 0 && date.getMonth() !== lastMonth && date.getFullYear() === year) {
        monthLabels.push({ x: leftPad + w * (cellSize + gap), label: date.toLocaleDateString([], { month: "short" }) });
        lastMonth = date.getMonth();
      }
    }
    cells.push(col);
  }

  const dayLabels = ["", "Mon", "", "Wed", "", "Fri", ""];

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        width="100%"
        height="auto"
        role="img"
        aria-label="DQ check activity heatmap"
      >
        {monthLabels.map((m) => (
          <text key={`${m.label}-${m.x}`} x={m.x} y={12} fontSize={10} fill="#64748b">{m.label}</text>
        ))}
        {dayLabels.map((lbl, i) => lbl ? (
          <text key={lbl} x={0} y={topPad + i * (cellSize + gap) + cellSize - 2} fontSize={10} fill="#64748b">{lbl}</text>
        ) : null)}
        {cells.map((col, wi) => col.map((cell, di) => (
          <rect
            key={`${wi}-${di}`}
            x={leftPad + wi * (cellSize + gap)}
            y={topPad + di * (cellSize + gap)}
            width={cellSize}
            height={cellSize}
            rx={2}
            fill={cell.isFuture ? "transparent" : HEATMAP_PALETTE[cell.intensity]}
          >
            <title>
              {cell.date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
              {cell.isFuture ? "" : ` — ${cell.passed} passed, ${cell.failed} failed`}
            </title>
          </rect>
        )))}
      </svg>
      <div className="mt-3 flex items-center justify-end gap-2 text-xs text-slate-500">
        <span>Failed</span>
        {HEATMAP_PALETTE.map((c) => (
          <span key={c} className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: c }} />
        ))}
        <span>Passed</span>
      </div>
    </div>
  );
}

function ActivityPanel({ events, slug }: { events: ActivityEvent[]; slug: string }) {
  // Group events by label, preserving order
  const groups: { label: string; items: ActivityEvent[] }[] = [];
  const sorted = [...events].sort((a, b) => +new Date(b.ranAt) - +new Date(a.ranAt));
  for (const ev of sorted) {
    const label = activityGroupLabel(ev.ranAt);
    const existing = groups.find((g) => g.label === label);
    if (existing) existing.items.push(ev);
    else groups.push({ label, items: [ev] });
  }

  return (
    <div className="space-y-6">
      <HeatmapCard slug={slug} />

      {groups.map((g) => (
        <div key={g.label} className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-900">{g.label}</h3>
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            {g.items.map((ev, idx) => (
              <div
                key={ev.id}
                className={`flex items-center gap-3 px-4 py-3 ${idx > 0 ? "border-t border-slate-100" : ""}`}
              >
                <div className="min-w-0 flex-1 flex items-center gap-3">
                  <span className="font-mono text-sm text-slate-900 truncate">{ev.check}</span>
                  <DimensionPill label={ev.dimension} />
                  <span className="text-sm text-slate-600 truncate">{ev.target}</span>
                  {ev.status === "Failed" && ev.detail ? <InfoTooltip text={ev.detail} /> : null}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-slate-500">{formatActivityTime(ev.ranAt)}</span>
                  <ActivityStatusPill status={ev.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
