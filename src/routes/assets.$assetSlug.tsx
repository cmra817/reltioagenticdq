import * as React from "react";
import { useState } from "react";
import { DimensionBadge } from "@/components/dq-dimensions";
import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { Columns3, X, ChevronLeft, ChevronRight, ChevronDown, Search, SlidersHorizontal, Check, Info, UploadCloud, Loader2, TriangleAlert, ClockAlert, ArrowRight } from "lucide-react";
import { SchemaDiffModal, type SchemaChange } from "@/components/asset-schema-diff";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { useNotifications } from "@/components/notification-context";
import { SourceLogo, TableIcon, DatasetIcon } from "@/components/explore-screen";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useCreatedAssets, type CreatedAsset } from "@/components/created-assets-context";
import {
  DEFAULT_SCHEDULE,
  frequencyLabel,
  type ScheduleConfig,
} from "@/components/add-dataset/Step3Schedule";
import { generateChecks, type Check as DQCheck } from "@/components/add-dataset/mock-checks";
import {
  EditChecksModal,
  EditSchedulesModal,
  RemoveFromMonitoringModal,
} from "@/components/asset-actions-modals";

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

/* ---------- newly created assets (from the Add data asset wizard) ---------- */

function createdToDetail(c: CreatedAsset): AssetDetail {
  return {
    name: c.name,
    source: c.source,
    dataset: c.schema,
    columns: c.columnCount,
    rows: c.rows.toLocaleString(),
    checks: c.checks.length,
    fillRate: "97%",
    quality: 96,
    validity: 98,
    accuracy: 96,
    consistency: 97,
    classification: [],
  };
}

function guessDataType(field: string): string {
  if (/(_at|date|time)$/.test(field)) return "Timestamp";
  if (/(_id|count|qty|quantity|num)/.test(field)) return "Integer";
  if (/(amount|total|price|rate|score)/.test(field)) return "Decimal";
  if (/(is_|has_|flag)/.test(field)) return "Boolean";
  return "String";
}

function createdColumns(c: CreatedAsset): ColumnRow[] {
  const fields: string[] = [];
  for (const chk of c.checks) if (!fields.includes(chk.field)) fields.push(chk.field);
  return fields.map((field) => {
    const seed = hashString(`${c.name}:${field}`);
    const fill = 92 + (seed % 9);
    const uniq = 20 + (seed % 79);
    const dataType = guessDataType(field);
    return {
      name: field,
      dataType,
      length: dataType === "String" ? 12 + (seed % 40) : 8,
      min: dataType === "Integer" || dataType === "Decimal" ? "1" : "—",
      max: dataType === "Integer" || dataType === "Decimal" ? String(1000 + (seed % 9000)) : "—",
      mean: dataType === "Decimal" ? (100 + (seed % 400)).toFixed(2) : "—",
      nullCount: Math.round((c.rows || 1000) * (100 - fill) / 100 / 100),
      distinct: Math.max(2, Math.round(((c.rows || 1000) * uniq) / 100 / 100)),
      uniqueness: `${uniq}%`,
      fillRate: `${fill}%`,
    };
  });
}

function createdCheckRows(c: CreatedAsset): CheckRow[] {
  return c.checks.map((chk) => ({
    name: chk.rule,
    dimension: chk.dimension,
    lastRun: "Just now",
    status: "Passed" as CheckStatus,
    passRate: "100/100 (100%)",
    children: [
      { column: chk.field, lastRun: "Just now", status: "Passed" as CheckStatus, passRate: "100/100 (100%)" },
    ],
  }));
}

function createdActivity(c: CreatedAsset): ActivityEvent[] {
  const ranAt = new Date(c.createdAt).toISOString();
  return c.checks.map((chk, i) => ({
    id: `c-${i}`,
    check: chk.rule,
    dimension: chk.dimension,
    target: chk.field,
    ranAt,
    status: "Passed" as ActivityStatus,
  }));
}

function createdCheckCategories(c: CreatedAsset) {
  const counts = new Map<string, number>();
  for (const chk of c.checks) counts.set(chk.dimension, (counts.get(chk.dimension) ?? 0) + 1);
  return Array.from(counts.entries()).map(([label, passing]) => ({ label, passing, failing: 0 }));
}

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
};

const SAMPLE_COLUMNS: ColumnRow[] = [
  { name: "Order_ID", dataType: "Integer", length: 8, min: "1", max: "1234", mean: "1234", nullCount: 0, distinct: 1234, uniqueness: "98%", fillRate: "98%" },
  { name: "Customer_ID", dataType: "Integer", length: 8, min: "1", max: "1234", mean: "1234", nullCount: 0, distinct: 1234, uniqueness: "98%", fillRate: "98%" },
  { name: "Order_Date", dataType: "Date", length: 10, min: "2023-01-01", max: "2024-12-31", mean: "—", nullCount: 0, distinct: 720, uniqueness: "62%", fillRate: "100%" },
  { name: "Total_Amount", dataType: "Decimal", length: 10, min: "0.99", max: "9999.00", mean: "245.50", nullCount: 0, distinct: 1180, uniqueness: "97%", fillRate: "100%" },
  { name: "Status", dataType: "String", length: 12, min: "—", max: "—", mean: "—", nullCount: 0, distinct: 5, uniqueness: "1%", fillRate: "100%" },
  { name: "Shipping_Address", dataType: "String", length: 120, min: "—", max: "—", mean: "—", nullCount: 12, distinct: 1100, uniqueness: "92%", fillRate: "99%" },
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
] as const;

function AssetDetailPage() {
  const { assetSlug } = useParams({ from: "/assets/$assetSlug" });
  const { bySlug } = useCreatedAssets();
  const created = bySlug[assetSlug.toLowerCase()] ?? null;
  const detail = created
    ? createdToDetail(created)
    : ASSET_DETAILS[assetSlug.toLowerCase()] ?? ASSET_DETAILS.orders;
  // A freshly added asset has run exactly once, so there is no history to trend against.
  const firstRun = created !== null;
  const columns = React.useMemo(
    () => (created ? createdColumns(created) : SAMPLE_COLUMNS),
    [created],
  );
  const [activeTab, setActiveTab] = useState<TabName>("Overview");
  const [columnsSubTab, setColumnsSubTab] = useState<"Profiling" | "Sample data">("Profiling");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const selectedColumn = selectedIndex === null ? null : columns[selectedIndex] ?? null;
  const { runJob } = useNotifications();
  const { updateAsset, removeAsset } = useCreatedAssets();
  const navigate = useNavigate();

  // Editable monitoring config. Created assets persist through the store; static
  // sample assets keep their edits in local state for the prototype.
  const [localChecks, setLocalChecks] = useState<DQCheck[] | null>(null);
  const [localSchedules, setLocalSchedules] = useState<{
    profiling: ScheduleConfig;
    checks: ScheduleConfig;
  } | null>(null);
  const [checksModalOpen, setChecksModalOpen] = useState(false);
  const [schedulesModalOpen, setSchedulesModalOpen] = useState(false);
  const [removeModalOpen, setRemoveModalOpen] = useState(false);

  const configuredChecks = React.useMemo(
    () => localChecks ?? created?.checks ?? generateChecks(detail.name),
    [localChecks, created, detail.name],
  );
  const schedules = React.useMemo(
    () =>
      localSchedules ?? {
        profiling: created?.profilingSchedule ?? DEFAULT_SCHEDULE,
        checks: created?.checksSchedule ?? DEFAULT_SCHEDULE,
      },
    [localSchedules, created],
  );

  const anomalyMetrics = React.useMemo(
    () =>
      buildOverviewStats(detail, firstRun)
        .filter((s) => "anomalous" in s && s.anomalous)
        .map((s) => s.label),
    [detail, firstRun],
  );

  const rightPanelOpen = activeTab === "Columns" && selectedColumn !== null;

  return (
    <AppShell activeNav="explore">
      <div className="relative flex flex-1 flex-col min-h-0">
        <div className="flex flex-1 min-h-0 flex-col gap-5 overflow-y-auto px-8 pt-6 pb-28">
          {/* Header */}
          <div className="rounded-2xl border bg-white p-5" style={{ borderColor: "var(--hairline)" }}>
            <div className="flex items-start justify-between gap-3">
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
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h1
                      className="text-[22px] font-semibold leading-tight"
                      style={{ color: "var(--brand-blue)" }}
                    >
                      {detail.name}
                    </h1>
                    <AnomalyBadge metrics={anomalyMetrics} />
                  </div>
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
                  {created && (
                    <div
                      className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]"
                      style={{ color: "var(--ink-500)" }}
                    >
                      <span
                        className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
                        style={{ background: "rgba(67,134,250,0.10)", color: "var(--brand-blue)" }}
                      >
                        New
                      </span>
                      <span>Profiling: {frequencyLabel(created.profilingSchedule)}</span>
                      <span style={{ color: "var(--ink-300)" }}>·</span>
                      <span>DQ checks: {frequencyLabel(created.checksSchedule)}</span>
                      {created.domain && (
                        <>
                          <span style={{ color: "var(--ink-300)" }}>·</span>
                          <span>Domain: {created.domain}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[13px] font-medium transition-colors hover:bg-[color:var(--surface-soft)]"
                    style={{ borderColor: "var(--hairline)", color: "var(--ink-700)" }}
                  >
                    Actions
                    <ChevronDown size={14} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[190px]">
                  <DropdownMenuItem
                    onClick={() => runJob({ kind: "profiling", table: detail.name })}
                  >
                    Run profiling
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => runJob({ kind: "checks", table: detail.name })}
                  >
                    Run DQ checks
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toast("Loading to Reltio...")}>
                    Load to Reltio
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setChecksModalOpen(true)}>
                    Edit DQ checks
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSchedulesModalOpen(true)}>
                    Edit schedules
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setRemoveModalOpen(true)}
                    className="focus:text-[#dc2626]"
                    style={{ color: "#dc2626" }}
                  >
                    Remove from monitoring
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
            <OverviewPanel detail={detail} created={created} />
          )}


          {activeTab === "Columns" && (
            <ColumnsPanel
              columns={columns}
              hasHistory={!firstRun}
              subTab={columnsSubTab}
              onSubTab={setColumnsSubTab}
              selectedIndex={selectedIndex}
              onSelectIndex={setSelectedIndex}
            />
          )}

          {activeTab === "Checks" && (
            <ChecksPanel checks={created ? createdCheckRows(created) : SAMPLE_CHECKS} />
          )}
          {activeTab === "Activity" && (
            <ActivityPanel
              events={created ? createdActivity(created) : SAMPLE_ACTIVITY}
              slug={assetSlug}
              showHeatmap={!firstRun}
            />
          )}
        </div>

        {/* floating composer (centered over content area, not full viewport) */}
      </div>

      <EditChecksModal
        open={checksModalOpen}
        tableName={detail.name}
        checks={configuredChecks}
        onClose={() => setChecksModalOpen(false)}
        onSave={(next) => {
          if (created) updateAsset(created.slug, { checks: next });
          else setLocalChecks(next);
          setChecksModalOpen(false);
          toast.success(`Saved ${next.length} ${next.length === 1 ? "check" : "checks"} on ${detail.name}`);
        }}
      />

      <EditSchedulesModal
        open={schedulesModalOpen}
        tableName={detail.name}
        checkCount={configuredChecks.length}
        profiling={schedules.profiling}
        checks={schedules.checks}
        onClose={() => setSchedulesModalOpen(false)}
        onSave={(next) => {
          if (created)
            updateAsset(created.slug, {
              profilingSchedule: next.profiling,
              checksSchedule: next.checks,
            });
          else setLocalSchedules(next);
          setSchedulesModalOpen(false);
          toast.success(
            `Schedules updated — profiling ${frequencyLabel(next.profiling).toLowerCase()}, checks ${frequencyLabel(next.checks).toLowerCase()}`,
          );
        }}
      />

      <RemoveFromMonitoringModal
        open={removeModalOpen}
        tableName={detail.name}
        onClose={() => setRemoveModalOpen(false)}
        onConfirm={() => {
          if (created) removeAsset(created.slug);
          setRemoveModalOpen(false);
          toast.success(`${detail.name} removed from monitoring`);
          navigate({ to: "/explore" });
        }}
      />
    </AppShell>
  );
}

// ============================================================
// Overview tab
// ============================================================

const SYNC_TYPICAL_HOURS = 4;

type TimestampCell = {
  label: string;
  value: string;
  hoursAgo: number | null;
  typicalHours: number;
  priority: "primary" | "secondary";
  tip: string;
};

const OVERVIEW_ACTIVITY: TimestampCell[] = [
  { label: "Last profiled", value: "6 hrs ago", hoursAgo: 6, typicalHours: 24, priority: "secondary", tip: "When this table was last scanned to compute column profiles and statistics." },
  { label: "Checks run", value: "6 hrs ago", hoursAgo: 6, typicalHours: 24, priority: "secondary", tip: "The most recent execution of the quality checks attached to this table." },
  { label: "Last synced", value: "14 hrs ago", hoursAgo: 14, typicalHours: SYNC_TYPICAL_HOURS, priority: "primary", tip: "When metadata and row counts were last refreshed from the source warehouse. Connector health — not a quality signal." },
  { label: "Loaded to Reltio", value: "3 days ago", hoursAgo: null, typicalHours: 0, priority: "secondary", tip: "When records from this table were last loaded into Reltio." },
];

const FIRST_RUN_ACTIVITY: TimestampCell[] = [
  { label: "Last profiled", value: "Just now", hoursAgo: 0, typicalHours: 24, priority: "secondary", tip: "When this table was last scanned to compute column profiles and statistics." },
  { label: "Checks run", value: "Just now", hoursAgo: 0, typicalHours: 24, priority: "secondary", tip: "The most recent execution of the quality checks attached to this table." },
  { label: "Last synced", value: "Just now", hoursAgo: 0, typicalHours: SYNC_TYPICAL_HOURS, priority: "primary", tip: "When metadata and row counts were last refreshed from the source warehouse. Connector health — not a quality signal." },
  { label: "Loaded to Reltio", value: "—", hoursAgo: null, typicalHours: 0, priority: "secondary", tip: "When records from this table were last loaded into Reltio." },
];

function isStale(cell: TimestampCell): boolean {
  if (cell.hoursAgo === null || !cell.typicalHours) return false;
  return cell.hoursAgo > cell.typicalHours * 2.5;
}

/* ---------- metric card model: drift / event / rollup metrics ---------- */

type DriftStat = {
  kind: "drift";
  label: string;
  value: string;
  trend: number[];
  note: string;
  anomalous: boolean;
  /** true when direction is meaningless (e.g. fill rate up is fine) */
  neutral?: boolean;
};

type EventStat = {
  kind: "event";
  label: string;
  value: string;
  note: string;
  anomalous: boolean;
  linkLabel?: string;
};

type RollupStat = {
  kind: "rollup";
  label: string;
  value: string;
  trend: number[];
  note: string;
};

type OverviewStat = DriftStat | EventStat | RollupStat;

function baselineBand(values: number[]): { low: number; high: number } {
  const hist = values.slice(0, -1);
  const base = hist.length ? hist : values;
  const mean = base.reduce((a, b) => a + b, 0) / base.length;
  const variance = base.reduce((a, b) => a + (b - mean) ** 2, 0) / base.length;
  const sd = Math.sqrt(variance);
  const half = Math.max(sd * 3.5, Math.abs(mean) * 0.004);
  return { low: mean - half, high: mean + half };
}

function outsideBand(values: number[]): boolean {
  const band = baselineBand(values);
  const last = values[values.length - 1];
  return last < band.low || last > band.high;
}

const ROWS_TREND = [5320, 5290, 5310, 5240, 5260, 5180, 4897];
const FILL_TREND = [82, 82.5, 83, 83.2, 83.6, 83.8, 85];
const CHECKS_TREND = [21, 21, 20, 20, 20, 20, 19];
const COLUMNS_ADDED = 2;

const SCHEMA_CHANGES: SchemaChange[] = [
  { column: "loyalty_tier", type: "added", before: "—", after: "String(16)" },
  { column: "promo_code", type: "added", before: "—", after: "String(16)" },
  { column: "order_total", type: "type-changed", before: "Decimal(10,2)", after: "String(20)" },
];

function buildOverviewStats(detail: AssetDetail, firstRun: boolean): OverviewStat[] {
  if (firstRun) {
    return [
      { kind: "event", label: "Columns", value: String(detail.columns), note: "First run — no prior run to compare", anomalous: false },
      { kind: "drift", label: "Rows", value: detail.rows, trend: [], note: "First run — no prior run to compare", anomalous: false },
      { kind: "drift", label: "Fill rate", value: detail.fillRate, trend: [], note: "First run — no prior run to compare", anomalous: false },
      { kind: "rollup", label: "Checks passing", value: `${detail.checks}/${detail.checks}`, trend: [], note: "First run — no prior run to compare" },
    ];
  }
  const rowsValue = ROWS_TREND[ROWS_TREND.length - 1];
  const zeroRows = rowsValue === 0;
  const rowsAnomalous = zeroRows || outsideBand(ROWS_TREND);
  const fillAnomalous = outsideBand(FILL_TREND);
  return [
    {
      kind: "event",
      label: "Columns",
      value: String(detail.columns),
      note: COLUMNS_ADDED ? `+${COLUMNS_ADDED} columns since last run` : "No change from last run",
      anomalous: COLUMNS_ADDED > 0,
      linkLabel: COLUMNS_ADDED ? `+${COLUMNS_ADDED} columns since last run` : undefined,
    },
    {
      kind: "drift",
      label: "Rows",
      value: detail.rows,
      trend: ROWS_TREND,
      note: zeroRows ? "No rows loaded" : "Decreased 8% — outside normal range",
      anomalous: rowsAnomalous,
    },
    {
      kind: "drift",
      label: "Fill rate",
      value: detail.fillRate,
      trend: FILL_TREND,
      note: fillAnomalous ? "Increased 1.2 pts — outside normal range" : "Increased 1.2 pts — within range",
      anomalous: fillAnomalous,
      neutral: true,
    },
    {
      kind: "rollup",
      label: "Checks passing",
      value: `19/${detail.checks}`,
      trend: CHECKS_TREND,
      note: "Decreased 1 from last run",
    },
  ];
}

const OVERVIEW_CHECK_CATEGORIES = [
  { label: "Validity", passing: 3, failing: 0 },
  { label: "Completeness", passing: 4, failing: 0 },
  { label: "Accuracy", passing: 3, failing: 1, failingSince: "new" as const },
  { label: "Consistency", passing: 3, failing: 0 },
  { label: "Uniqueness", passing: 2, failing: 0 },
  { label: "Referential integrity", passing: 2, failing: 1, failingSince: "4 days" },
  { label: "Format and range", passing: 2, failing: 0 },
];

const TOP_AFFECTED_COLUMNS = [
  { column: "customer_id", check: "Referential integrity", example: "CUST-88213 (no match)", status: "recurring" as const },
  { column: "order_total", check: "Accuracy", example: "-42.00", status: "new" as const },
  { column: "order_date", check: "Format and range", example: "13/45/2026", status: "new" as const },
];

const PASS_GREEN = "#4CAF50";
const FAIL_RED = "#d05252";
const DANGER = "#b42318";
const WARN_AMBER = "#b45309";
const TREND_OK = "#4CAF50";
const TREND_NEUTRAL = "#4386fa";

function StatusTag({ tone, children }: { tone: "danger" | "neutral"; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
      style={
        tone === "danger"
          ? { background: "rgba(208,82,82,0.12)", color: DANGER }
          : { background: "var(--surface-soft)", color: "var(--ink-500)" }
      }
    >
      {children}
    </span>
  );
}

function BandSparkline({
  values,
  anomalous,
  neutral,
  width = 96,
  height = 28,
}: {
  values: number[];
  anomalous: boolean;
  neutral?: boolean;
  width?: number;
  height?: number;
}) {
  const band = baselineBand(values);
  const min = Math.min(...values, band.low);
  const max = Math.max(...values, band.high);
  const range = max - min || 1;
  const pad = 3;
  const y = (v: number) => pad + (height - pad * 2) * (1 - (v - min) / range);
  const stepX = (width - pad * 2) / Math.max(values.length - 1, 1);
  const path = values
    .map((v, i) => `${i === 0 ? "M" : "L"}${(pad + i * stepX).toFixed(1)},${y(v).toFixed(1)}`)
    .join(" ");
  const color = anomalous ? DANGER : neutral ? TREND_NEUTRAL : TREND_OK;
  const bandTop = y(band.high);
  const bandBottom = y(band.low);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <rect
        x={0}
        y={bandTop}
        width={width}
        height={Math.max(bandBottom - bandTop, 2)}
        fill="rgba(76,175,80,0.12)"
      />
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function AnomalyBadge({ metrics }: { metrics: string[] }) {
  if (metrics.length === 0) return null;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium"
      style={{ background: "rgba(208,82,82,0.12)", color: DANGER }}
    >
      <TriangleAlert size={13} aria-hidden="true" />
      {metrics.length} active {metrics.length === 1 ? "anomaly" : "anomalies"}
      <span style={{ color: FAIL_RED }}>· {metrics.join(", ")}</span>
    </span>
  );
}

function OverviewPanel({
  detail,
  created,
}: {
  detail: AssetDetail;
  created?: CreatedAsset | null;
}) {
  const firstRun = !!created;
  const activity = firstRun ? FIRST_RUN_ACTIVITY : OVERVIEW_ACTIVITY;
  const categories = created ? createdCheckCategories(created) : OVERVIEW_CHECK_CATEGORIES;
  const stats = React.useMemo(() => buildOverviewStats(detail, firstRun), [detail, firstRun]);
  const [reltioState, setReltioState] = useState<"idle" | "loading" | "done">("idle");
  const [diffOpen, setDiffOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      {/* Activity strip — intentionally uncarded */}
      <div className="pl-4">
        <div className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-4">
          {activity.map((a) => {
            const stale = isStale(a);
            const staleColor = stale
              ? a.priority === "primary"
                ? WARN_AMBER
                : "var(--ink-500)"
              : "var(--ink-900)";
            return (
            <div key={a.label}>
              <div className="flex items-center gap-1.5 text-[13px]" style={{ color: "var(--ink-500)" }}>
                <span>{a.label}</span>
                <InfoTooltip text={a.tip} />
              </div>
              <div
                className="mt-1 flex items-center gap-1.5 text-[15px] font-medium"
                style={{ color: staleColor }}
              >
                {stale && a.priority === "primary" && <ClockAlert size={14} aria-hidden="true" />}
                <span>
                  {reltioState === "done" && a.label === "Loaded to Reltio" ? "Just now" : a.value}
                </span>
              </div>
              {firstRun && a.label === "Loaded to Reltio" && reltioState !== "done" && (
                <div className="mt-2">
                  <button
                    type="button"
                    disabled={reltioState === "loading"}
                    onClick={() => {
                      setReltioState("loading");
                      toast("Loading to Reltio...");
                      window.setTimeout(() => {
                        setReltioState("done");
                        toast.success("Loaded to Reltio");
                      }, 2500);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors disabled:opacity-70"
                    style={{
                      borderColor: "var(--brand-blue)",
                      color: "var(--brand-blue)",
                      background: "rgba(67,134,250,0.08)",
                    }}
                  >
                    {reltioState === "loading" ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <UploadCloud size={13} />
                    )}
                    <span>{reltioState === "loading" ? "Loading…" : "Load to Reltio"}</span>
                  </button>
                  <div className="mt-1.5 text-[11px] leading-snug" style={{ color: "var(--ink-500)" }}>
                    Profiling and checks are done — push these records into Reltio.
                  </div>
                </div>
              )}
            </div>
            );
          })}
        </div>
      </div>

      <div className="h-px w-full" style={{ background: "var(--hairline)" }} />

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="flex flex-col rounded-2xl border bg-white p-4"
            style={{ borderColor: "var(--hairline)" }}
          >
            <div className="flex items-center gap-1.5 text-[13px]" style={{ color: "var(--ink-500)" }}>
              {s.kind !== "rollup" && s.anomalous && (
                <TriangleAlert size={13} style={{ color: DANGER }} aria-label="Anomaly detected" />
              )}
              <span>{s.label}</span>
            </div>
            <div
              className="mt-2 text-[26px] font-semibold leading-none"
              style={{ color: "var(--brand-blue)" }}
            >
              {s.value}
            </div>
            <div className="mt-3 h-[28px]">
              {s.kind === "drift" && s.trend.length > 1 && (
                <BandSparkline values={s.trend} anomalous={s.anomalous} neutral={s.neutral} />
              )}
              {s.kind === "rollup" && s.trend.length > 1 && (
                <Sparkline values={s.trend} color={TREND_NEUTRAL} width={96} height={28} />
              )}
            </div>
            {s.kind === "event" && s.anomalous && s.linkLabel ? (
              <button
                type="button"
                onClick={() => setDiffOpen(true)}
                className="mt-2 inline-flex items-center gap-1 self-start text-left text-[12px] font-medium underline leading-snug"
                style={{ color: DANGER }}
              >
                {s.linkLabel}
                <ArrowRight size={12} />
              </button>
            ) : (
              <div
                className="mt-2 text-[12px] leading-snug"
                style={{
                  color:
                    s.kind !== "rollup" && s.anomalous ? DANGER : "var(--ink-500)",
                }}
              >
                {s.note}
              </div>
            )}
          </div>
        ))}
      </div>

      <SchemaDiffModal
        open={diffOpen}
        onOpenChange={setDiffOpen}
        table={detail.name}
        changes={SCHEMA_CHANGES}
      />

      {/* Checks by category */}
      <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--hairline)" }}>
        <h2 className="text-[16px] font-semibold" style={{ color: "var(--ink-900)" }}>
          Checks by category
        </h2>
        <ChecksByCategoryChart rows={categories} />
        <div className="mt-4 flex items-center gap-5 text-[12px]" style={{ color: "var(--ink-700)" }}>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: PASS_GREEN }} aria-hidden="true" />
            Passing
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: FAIL_RED }} aria-hidden="true" />
            Failing
          </span>
        </div>
      </div>

      {/* Top affected columns */}
      <div className="rounded-2xl border bg-white p-6" style={{ borderColor: "var(--hairline)" }}>
        <h2 className="text-[16px] font-semibold" style={{ color: "var(--ink-900)" }}>
          Top affected columns
        </h2>
        {firstRun ? (
          <p className="mt-3 text-[13px]" style={{ color: "var(--ink-500)" }}>
            No failing checks in the first run.
          </p>
        ) : (
        <table className="mt-4 w-full text-[13px]">
          <thead>
            <tr style={{ color: "var(--ink-500)" }}>
              <th className="pb-2 text-left font-medium">Column</th>
              <th className="pb-2 text-left font-medium">Check failed</th>
              <th className="pb-2 text-left font-medium">Example failed value</th>
              <th className="pb-2 text-right font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {TOP_AFFECTED_COLUMNS.map((r) => (
              <tr key={r.column} className="border-t" style={{ borderColor: "var(--hairline)" }}>
                <td className="py-2.5 font-mono text-[13px]" style={{ color: "var(--ink-900)" }}>
                  {r.column}
                </td>
                <td className="py-2.5" style={{ color: FAIL_RED }}>
                  {r.check}
                </td>
                <td className="py-2.5 font-mono text-[12px]" style={{ color: "var(--ink-700)" }}>
                  {r.example}
                </td>
                <td className="py-2.5 text-right">
                  <StatusTag tone={r.status === "new" ? "danger" : "neutral"}>{r.status}</StatusTag>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>
    </div>
  );
}


function ChecksByCategoryChart({
  rows,
}: {
  rows: { label: string; passing: number; failing: number; failingSince?: string }[];
}) {
  const max = Math.max(4, ...rows.map((r) => r.passing + r.failing));
  const ticks = Array.from({ length: max * 2 + 1 }, (_, i) => i / 2);
  return (
    <div className="mt-5">
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.label} className="grid grid-cols-[140px_1fr_72px] items-center gap-3">
            <span className="truncate text-right text-[12px]" style={{ color: "var(--ink-500)" }}>
              {r.label}
            </span>
            <div className="relative h-6" style={{ background: "var(--surface-soft)" }}>
              <div className="absolute inset-0 flex h-full">
                <div style={{ width: `${(r.passing / max) * 100}%`, background: PASS_GREEN }} />
                <div style={{ width: `${(r.failing / max) * 100}%`, background: FAIL_RED }} />
              </div>
            </div>
            <span className="flex justify-start">
              {r.failing > 0 && (
                <StatusTag tone={r.failingSince === "new" || !r.failingSince ? "danger" : "neutral"}>
                  {r.failingSince ?? "new"}
                </StatusTag>
              )}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-[140px_1fr_72px] gap-3">
        <span />
        <div className="flex justify-between text-[11px]" style={{ color: "var(--ink-500)" }}>
          {ticks.map((t) => (
            <span key={t}>{t % 1 === 0 ? t.toFixed(1) : t.toFixed(1)}</span>
          ))}
        </div>

      </div>
    </div>
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
  hasHistory = true,
  subTab,
  onSubTab,
  selectedIndex,
  onSelectIndex,
}: {
  columns: ColumnRow[];
  hasHistory?: boolean;
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
        hasHistory={hasHistory}
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
  hasHistory = true,
  index,
  total,
  onPrev,
  onNext,
  onClose,
}: {
  column: ColumnRow | null;
  hasHistory?: boolean;
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
              <MetricTrendSection
                hasHistory={hasHistory}
                title="Completeness"
                subtitle="How full is this column"
                trendLabel="Fill rate trend"
                values={makeHistory(`${column.name}:fill`, parseInt(column.fillRate), 4)}
              >
                <FillNullBar fill={parseInt(column.fillRate)} />
              </MetricTrendSection>

              {/* Uniqueness */}
              <MetricTrendSection
                hasHistory={hasHistory}
                title="Uniqueness"
                subtitle="How distinct are the values"
                trendLabel="Uniqueness trend"
                values={makeHistory(`${column.name}:uniq`, parseInt(column.uniqueness), 5)}
              >
                <UniqueDupBar unique={parseInt(column.uniqueness)} uniqueCount={20} dupCount={10} />
              </MetricTrendSection>

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
                    { type: "xxx-xxxx", count: 200, pct: 76, trend: makeHistory(`${column.name}:p1`, 76, 5) },
                    { type: "xxxxxxx", count: 150, pct: 76, trend: makeHistory(`${column.name}:p2`, 60, 8) },
                    { type: "xxx.xxxx", count: 100, pct: 76, isNew: true },
                  ]}
                />
              </section>

              {/* Most frequent value */}
              <section className="rounded-xl p-4" style={{ background: "var(--surface-soft)" }}>
                <h4 className="text-[14px] font-semibold" style={{ color: "var(--ink-900)" }}>Most frequent value</h4>
                <p className="text-[12px]" style={{ color: "var(--brand-blue)" }}>What appears most often</p>
                <FreqTable
                  rows={[
                    { type: "Databricks", count: 1, pct: 76, trend: makeHistory(`${column.name}:v1`, 76, 4) },
                    { type: "Snowflake", count: 1, pct: 62, trend: makeHistory(`${column.name}:v2`, 62, 5) },
                    { type: "BigQuery", count: 1, pct: 48, trend: makeHistory(`${column.name}:v3`, 48, 6) },
                    { type: "Redshift", count: 1, pct: 34, isNew: true },
                    { type: "Postgres", count: 1, pct: 22, trend: makeHistory(`${column.name}:v5`, 22, 5) },
                    { type: "MySQL", count: 1, pct: 12, isNew: true },
                  ]}
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

type FreqRow = {
  type: string;
  count: number;
  pct: number;
  trend?: number[];
  isNew?: boolean;
};

function FreqTable({ rows }: { rows: FreqRow[] }) {
  const showTrend = rows.some((r) => r.trend || r.isNew);
  const cols = showTrend
    ? "grid-cols-[1fr_60px_1.2fr_120px]"
    : "grid-cols-[1fr_70px_1.4fr]";
  return (
    <div className="mt-3 overflow-hidden rounded-lg border" style={{ borderColor: "var(--hairline)", background: "white" }}>
      <div className={`grid ${cols} px-3 py-2 text-[10px] font-semibold uppercase tracking-wide`} style={{ color: "var(--ink-500)", background: "var(--surface-soft)" }}>
        <span>Type</span>
        <span>Count</span>
        <span>Percentage</span>
        {showTrend && <span>Last 5 runs</span>}
      </div>
      {rows.map((r, i) => {
        const dir = r.trend ? trendDirection(r.trend) : "flat";
        return (
          <div key={i} className={`grid ${cols} items-center border-t px-3 py-2.5 text-[12px]`} style={{ borderColor: "var(--hairline)", color: "var(--ink-700)" }}>
            <span>{r.type}</span>
            <span>{r.count}</span>
            <div className="flex items-center gap-2">
              <span className="font-medium" style={{ color: "var(--ink-900)" }}>{r.pct}%</span>
              <div className="flex-1 h-1.5 overflow-hidden rounded-full" style={{ background: "var(--surface-soft)" }}>
                <div className="h-full rounded-full" style={{ width: `${r.pct}%`, background: "#c9c2f5" }} />
              </div>
            </div>
            {showTrend && (
              <div className="flex items-center justify-end gap-1.5">
                {r.isNew ? (
                  <NewBadge />
                ) : r.trend ? (
                  <>
                    <Sparkline values={r.trend} color={dir === "down" ? "#ef4444" : "#14a6a6"} />
                    <DeltaPts values={r.trend} />
                  </>
                ) : null}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ---------- history helpers ---------- */

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function makeHistory(seed: string, current: number, spread = 6, points = 5): number[] {
  let h = hashSeed(seed);
  const out: number[] = [];
  for (let i = 0; i < points - 1; i++) {
    h = (h * 1664525 + 1013904223) >>> 0;
    const jitter = ((h % 1000) / 1000 - 0.5) * 2 * spread;
    out.push(Math.max(0, Math.min(100, Math.round(current + jitter))));
  }
  out.push(current);
  return out;
}

function trendDirection(values: number[]): "up" | "down" | "flat" {
  if (values.length < 2) return "flat";
  const a = values[values.length - 2];
  const b = values[values.length - 1];
  if (b - a > 0.5) return "up";
  if (a - b > 0.5) return "down";
  return "flat";
}

function trendDelta(values: number[]): number {
  if (values.length < 2) return 0;
  return values[values.length - 1] - values[values.length - 2];
}

function Sparkline({
  values,
  color = "#14a6a6",
  width = 72,
  height = 24,
}: {
  values: number[];
  color?: string;
  width?: number;
  height?: number;
}) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pad = 2;
  const stepX = (width - pad * 2) / (values.length - 1);
  const pts = values.map((v, i) => {
    const x = pad + i * stepX;
    const y = pad + (height - pad * 2) * (1 - (v - min) / range);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const path = "M" + pts.join(" L");
  const area = `${path} L${width - pad},${height - pad} L${pad},${height - pad} Z`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <path d={area} fill={`${color}22`} />
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={pts[pts.length - 1].split(",")[0]} cy={pts[pts.length - 1].split(",")[1]} r="1.8" fill={color} />
    </svg>
  );
}

function DeltaChip({
  values,
  suffix = "%",
}: {
  values: number[];
  suffix?: string;
}) {
  const d = trendDelta(values);
  const dir = trendDirection(values);
  const positive = dir === "up";
  const flat = dir === "flat";
  const color = flat ? "var(--ink-500)" : positive ? "#16a34a" : "#dc2626";
  const bg = flat
    ? "var(--surface-soft)"
    : positive
      ? "rgba(34,197,94,0.10)"
      : "rgba(239,68,68,0.10)";
  const arrow = flat ? "=" : positive ? "↑" : "↓";
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium"
      style={{ background: bg, color }}
    >
      <span aria-hidden="true">{arrow}</span>
      {Math.abs(d).toFixed(Math.abs(d) < 10 ? 1 : 0)}
      {suffix}
    </span>
  );
}

function DeltaArrow({ direction }: { direction: "up" | "down" | "flat" }) {
  const color = direction === "flat" ? "var(--ink-500)" : direction === "up" ? "#16a34a" : "#dc2626";
  const glyph = direction === "flat" ? "=" : direction === "up" ? "↑" : "↓";
  return (
    <span className="text-[11px] font-semibold" style={{ color }} aria-hidden="true">
      {glyph}
    </span>
  );
}

function DeltaPts({ values, suffix = "pts" }: { values: number[]; suffix?: string }) {
  const d = trendDelta(values);
  const dir = trendDirection(values);
  const flat = dir === "flat";
  const positive = dir === "up";
  const color = flat ? "var(--ink-500)" : positive ? "#16a34a" : "#dc2626";
  const glyph = flat ? "=" : positive ? "↑" : "↓";
  return (
    <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold whitespace-nowrap" style={{ color }}>
      <span aria-hidden="true">{glyph}</span>
      {Math.abs(d).toFixed(Math.abs(d) < 10 ? 1 : 0)} {suffix}
    </span>
  );
}

function NewBadge() {
  return (
    <span
      className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
      style={{ background: "rgba(67,134,250,0.10)", color: "var(--brand-blue)" }}
    >
      New
    </span>
  );
}

function TrendRow({
  label,
  values,
  suffix = "%",
}: {
  label: string;
  values: number[];
  suffix?: string;
}) {
  const dir = trendDirection(values);
  const color = dir === "down" ? "#ef4444" : "#14a6a6";
  return (
    <div
      className="flex items-center justify-between gap-3 rounded-md px-3 py-2"
      style={{ background: "white" }}
    >
      <span className="text-[12px]" style={{ color: "var(--ink-500)" }}>
        {label}
      </span>
      <div className="flex items-center gap-2">
        <Sparkline values={values} color={color} />
        <span className="text-[12px] font-semibold" style={{ color: "var(--ink-900)" }}>
          {values[values.length - 1]}
          {suffix}
        </span>
        <DeltaChip values={values} suffix={suffix} />
      </div>
    </div>
  );
}
/* ---------- large trend chart used in Completeness / Uniqueness ---------- */

function MetricTrendSection({
  title,
  subtitle,
  trendLabel,
  values,
  children,
  hasHistory = true,
}: {
  title: string;
  subtitle: string;
  trendLabel: string;
  values: number[];
  children: React.ReactNode;
  hasHistory?: boolean;
}) {
  const delta = trendDelta(values);
  const dir = trendDirection(values);
  const positive = dir === "up";
  const flat = dir === "flat";
  const color = flat ? "var(--ink-500)" : positive ? "#16a34a" : "#dc2626";
  const verb = flat ? "No change" : positive ? "Increased" : "Decreased";
  const arrow = flat ? "→" : positive ? "↗" : "↘";
  return (
    <section className="rounded-xl p-4" style={{ background: "var(--surface-soft)" }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-[15px] font-semibold" style={{ color: "var(--ink-900)" }}>{title}</h4>
          <p className="text-[12px]" style={{ color: "var(--brand-blue)" }}>{subtitle}</p>
        </div>
        {hasHistory ? (
          <span className="inline-flex items-center gap-1 whitespace-nowrap text-[12px]" style={{ color }}>
            <span aria-hidden="true">{arrow}</span>
            {flat ? verb : `${verb} ${Math.abs(delta).toFixed(1)} pts`} from last run
          </span>
        ) : (
          <span className="whitespace-nowrap text-[12px]" style={{ color: "var(--ink-500)" }}>
            First run
          </span>
        )}
      </div>
      <div className="mt-4">{children}</div>
      <div className="mt-4 border-t pt-3" style={{ borderColor: "var(--hairline)" }}>
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--ink-500)" }}>
          {trendLabel}
        </div>
        {hasHistory ? (
          <TrendChart values={values} />
        ) : (
          <p className="text-[12px]" style={{ color: "var(--ink-500)" }}>
            No history yet — trends appear after the next run.
          </p>
        )}
      </div>
    </section>
  );
}

function FillNullBar({ fill }: { fill: number }) {
  const nullPct = 100 - fill;
  return (
    <div>
      <div className="flex h-9 w-full overflow-hidden rounded-md" style={{ background: "white" }}>
        <div
          className="flex items-center px-3 text-[13px] font-semibold text-white"
          style={{ width: `${fill}%`, background: "#4CAF7A" }}
        >
          {fill}%
        </div>
        <div className="flex flex-1 items-center justify-end px-3 text-[13px] font-semibold" style={{ color: "var(--ink-900)" }}>
          {nullPct}%
        </div>
      </div>
      <div className="mt-1 flex items-center justify-between text-[12px]" style={{ color: "var(--ink-500)" }}>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm" style={{ background: "#4CAF7A" }} aria-hidden="true" />
          Filled
        </span>
        <span>Null</span>
      </div>
    </div>
  );
}

function UniqueDupBar({ unique, uniqueCount, dupCount }: { unique: number; uniqueCount: number; dupCount: number }) {
  const dup = 100 - unique;
  return (
    <div>
      <div className="flex h-9 w-full overflow-hidden rounded-md" style={{ background: "white" }}>
        <div
          className="flex items-center gap-1 px-3 text-[13px] font-semibold text-white"
          style={{ width: `${unique}%`, background: "#4CAF7A" }}
        >
          {unique}% <span className="opacity-80">({uniqueCount})</span>
        </div>
        <div className="flex flex-1 items-center justify-end gap-1 px-3 text-[13px] font-semibold" style={{ color: "var(--ink-900)" }}>
          {dup}% <span style={{ color: "var(--ink-500)" }}>({dupCount})</span>
        </div>
      </div>
      <div className="mt-1 flex items-center justify-between text-[12px]" style={{ color: "var(--ink-500)" }}>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm" style={{ background: "#4CAF7A" }} aria-hidden="true" />
          Unique
        </span>
        <span>Duplicated</span>
      </div>
    </div>
  );
}

function TrendChart({ values }: { values: number[] }) {
  const width = 320;
  const height = 160;
  const padL = 32;
  const padR = 16;
  const padT = 18;
  const padB = 24;

  // Fixed 90-100 domain to match design
  const yMin = 90;
  const yMax = 100;
  const yTicks = [90, 95, 100];

  // Deterministic date labels ending "today"
  const now = new Date();
  const dates = values.map((_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() - (values.length - 1 - i) * 3);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  });

  const stepX = (width - padL - padR) / (values.length - 1);
  const yFor = (v: number) => padT + (height - padT - padB) * (1 - (Math.max(yMin, Math.min(yMax, v)) - yMin) / (yMax - yMin));
  const pts = values.map((v, i) => ({ x: padL + i * stepX, y: yFor(v), v }));
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1];
  const stroke = "#4CAF7A";

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} role="img" aria-label="Trend over last 5 runs">
      {yTicks.map((t) => {
        const y = yFor(t);
        return (
          <g key={t}>
            <line x1={padL} x2={width - padR} y1={y} y2={y} stroke="var(--hairline)" strokeDasharray="3 4" />
            <text x={padL - 6} y={y + 3} fontSize="10" textAnchor="end" fill="var(--ink-500)">{t}</text>
          </g>
        );
      })}
      <path d={path} fill="none" stroke={stroke} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3.5" fill={stroke} />
      ))}
      <text x={last.x} y={last.y - 8} fontSize="11" fontWeight="600" textAnchor="middle" fill={stroke}>
        {Math.round(last.v)}%
      </text>
      {dates.map((d, i) => (
        <text key={i} x={pts[i].x} y={height - 6} fontSize="10" textAnchor="middle" fill="var(--ink-500)">
          {d}
        </text>
      ))}
    </svg>
  );
}


// ===================== Checks tab =====================

type CheckStatus = "Passed" | "Failed" | "Warning";
type CheckChild = { column: string; lastRun: string; status: CheckStatus; passRate: string };
type CheckRow = {
  name: string;
  dimension: string;
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
  return <DimensionBadge label={label} size="sm" />;
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
  dimension: string;
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
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex cursor-help">
            <Info className="h-4 w-4 text-slate-400 hover:text-slate-600" />
          </span>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          align="start"
          className="max-w-xs bg-slate-900 px-3 py-2 text-xs leading-snug text-slate-100 shadow-lg border-slate-800"
        >
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
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

function ActivityPanel({
  events,
  slug,
  showHeatmap = true,
}: {
  events: ActivityEvent[];
  slug: string;
  showHeatmap?: boolean;
}) {
  const sorted = [...events].sort((a, b) => +new Date(b.ranAt) - +new Date(a.ranAt));

  // Build a flat row sequence with divider markers when group label changes
  const rows: Array<
    | { kind: "divider"; label: string }
    | { kind: "event"; ev: ActivityEvent }
  > = [];
  let lastLabel: string | null = null;
  for (const ev of sorted) {
    const label = activityGroupLabel(ev.ranAt);
    if (label !== lastLabel) {
      rows.push({ kind: "divider", label });
      lastLabel = label;
    }
    rows.push({ kind: "event", ev });
  }

  const formatTimeOnly = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  return (
    <div className="space-y-6">
      {showHeatmap && <HeatmapCard slug={slug} />}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2 text-left font-medium">Check</th>
              <th className="px-4 py-2 text-left font-medium">Dimension</th>
              <th className="px-4 py-2 text-left font-medium">Column</th>
              <th className="px-4 py-2 text-left font-medium">Ran on</th>
              <th className="px-4 py-2 text-right font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) =>
              row.kind === "divider" ? (
                <tr key={`d-${i}-${row.label}`}>
                  <td
                    colSpan={5}
                    className="bg-slate-50/70 px-4 py-1.5 text-xs font-medium uppercase tracking-wide text-slate-500 border-y border-slate-200"
                  >
                    {row.label}
                  </td>
                </tr>
              ) : (
                <tr key={row.ev.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-mono text-[13px] text-slate-900">{row.ev.check}</td>
                  <td className="px-4 py-3"><DimensionPill label={row.ev.dimension} /></td>
                  <td className="px-4 py-3 text-slate-700">{row.ev.target}</td>
                  <td className="px-4 py-3 text-slate-500">{formatTimeOnly(row.ev.ranAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <ActivityStatusPill status={row.ev.status} />
                      {row.ev.status === "Failed" && row.ev.detail ? (
                        <InfoTooltip text={row.ev.detail} />
                      ) : null}
                    </div>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
