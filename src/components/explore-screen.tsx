import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChatComposer } from "./chat-composer";

/* ---------- icons ---------- */
function ChevronDown({ size = 14, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
function ChevronUp({ size = 14, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );
}
function GridIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1.2" />
      <rect x="14" y="3" width="7" height="7" rx="1.2" />
      <rect x="3" y="14" width="7" height="7" rx="1.2" />
      <rect x="14" y="14" width="7" height="7" rx="1.2" />
    </svg>
  );
}
function DatasetIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M8 9h8M8 13h8M8 17h5" />
    </svg>
  );
}
function TableIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 10h18M3 16h18M9 4v16M15 4v16" />
    </svg>
  );
}
function ChartIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="3 17 9 11 13 15 21 7" />
      <polyline points="14 7 21 7 21 14" />
    </svg>
  );
}

function QueryIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="8 7 3 12 8 17" />
      <polyline points="16 7 21 12 16 17" />
      <line x1="14" y1="4" x2="10" y2="20" />
    </svg>
  );
}
function StarIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="12 2 15 9 22 9.3 16.5 14 18.5 21 12 17 5.5 21 7.5 14 2 9.3 9 9 12 2" />
    </svg>
  );
}
function ColumnIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M9 4v16M15 4v16" />
    </svg>
  );
}
function ClockIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 16 14" />
    </svg>
  );
}
function XIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function CheckSquare({ checked }: { checked: boolean }) {
  return (
    <span
      className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border"
      style={{
        background: checked ? "var(--brand-blue)" : "white",
        borderColor: checked ? "var(--brand-blue)" : "var(--hairline)",
      }}
    >
      {checked && (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </span>
  );
}

/* ---------- data ---------- */
type AssetKind = "dataset" | "table" | "chart";
type TreeNode = {
  name: string;
  kind: AssetKind;
  children?: TreeNode[];
};

type AssetRow = {
  name: string;
  kind: AssetKind;
  description: string;
  source: string;
  dataset: string;
  columns: number | null;
  rows: number | null;
  checks: number;
  tags: string[];
  lastAnalyzed: string;
};

type ColumnRow = {
  name: string;
  description: string;
  lastAnalyzed: string;
};

const CUSTOMER_DATA_CHILDREN: AssetRow[] = [
  {
    name: "Orders",
    kind: "table",
    description: "Stores all customer order transactions including amounts, dates, and statuses",
    source: "Databricks",
    dataset: "customer_data",
    columns: 40,
    rows: 200,
    checks: 4,
    tags: ["PII", "Marketing"],
    lastAnalyzed: "15 hours ago",
  },
  {
    name: "customer_profiles",
    kind: "table",
    description: "Golden customer profile table with attributes from CRM, ERP, and loyalty systems",
    source: "Databricks",
    dataset: "customer_data",
    columns: 200,
    rows: 1_250_000,
    checks: 12,
    tags: ["PII", "Sensitive PII", "Analytical"],
    lastAnalyzed: "2 hours ago",
  },
  {
    name: "revenue_dashboard",
    kind: "chart",
    description: "Shows real-time inventory counts across warehouses and fulfillment centers",
    source: "Databricks",
    dataset: "customer_data",
    columns: null,
    rows: null,
    checks: 3,
    tags: ["Analytical", "Confidential business"],
    lastAnalyzed: "1 hour ago",
  },
];

const PRODUCT_CATALOG_CHILDREN: AssetRow[] = [
  {
    name: "products",
    kind: "table",
    description: "Master product table with SKU, name, category, and pricing information",
    source: "Databricks",
    dataset: "product_catalog",
    columns: 28,
    rows: 84_000,
    checks: 6,
    tags: ["Operational", "Analytical"],
    lastAnalyzed: "2 hours ago",
  },
  {
    name: "categories",
    kind: "table",
    description: "Product taxonomy and category hierarchy",
    source: "Databricks",
    dataset: "product_catalog",
    columns: 12,
    rows: 320,
    checks: 2,
    tags: ["Operational", "System metadata"],
    lastAnalyzed: "1 day ago",
  },
];

const LOYALTY_POINTS_CHILDREN: AssetRow[] = [
  {
    name: "points_ledger",
    kind: "table",
    description: "Transaction-level ledger of loyalty points earned and redeemed",
    source: "Databricks",
    dataset: "loyalty_points",
    columns: 18,
    rows: 4_200_000,
    checks: 8,
    tags: ["PII", "Operational"],
    lastAnalyzed: "4 hours ago",
  },
  {
    name: "tier_status",
    kind: "table",
    description: "Current loyalty tier per customer with thresholds",
    source: "Databricks",
    dataset: "loyalty_points",
    columns: 9,
    rows: 980_000,
    checks: 3,
    tags: ["PII", "Marketing"],
    lastAnalyzed: "12 hours ago",
  },
];

const DATABRICKS_TREE: TreeNode[] = [
  { name: "Customer Data", kind: "dataset" },
  { name: "Product catalog", kind: "dataset" },
  { name: "Loyalty Points", kind: "dataset" },
];

const DATASET_ASSETS: Record<string, AssetRow[]> = {
  "Customer Data": CUSTOMER_DATA_CHILDREN,
  "Product catalog": PRODUCT_CATALOG_CHILDREN,
  "Loyalty Points": LOYALTY_POINTS_CHILDREN,
};

const DATASET_TABLE_COUNTS: Record<string, number> = {
  "Customer Data": CUSTOMER_DATA_CHILDREN.length,
  "Product catalog": PRODUCT_CATALOG_CHILDREN.length,
  "Loyalty Points": LOYALTY_POINTS_CHILDREN.length,
};

const DATABRICKS_ALL: AssetRow[] = [
  ...CUSTOMER_DATA_CHILDREN,
  ...PRODUCT_CATALOG_CHILDREN,
  ...LOYALTY_POINTS_CHILDREN,
];

const MARKETING_ANALYTICS_CHILDREN: AssetRow[] = [
  {
    name: "campaign_performance",
    kind: "table",
    description: "Daily performance metrics for paid marketing campaigns across channels",
    source: "BigQuery",
    dataset: "marketing_analytics",
    columns: 24,
    rows: 540_000,
    checks: 5,
    tags: ["Marketing", "Analytical"],
    lastAnalyzed: "2 hours ago",
  },
  {
    name: "attribution_events",
    kind: "table",
    description: "Multi-touch attribution events linking conversions to marketing touchpoints",
    source: "BigQuery",
    dataset: "marketing_analytics",
    columns: 16,
    rows: 8_400_000,
    checks: 4,
    tags: ["Marketing", "Operational"],
    lastAnalyzed: "5 hours ago",
  },
  {
    name: "channel_mix_dashboard",
    kind: "chart",
    description: "Executive dashboard showing channel mix and ROAS trends",
    source: "BigQuery",
    dataset: "marketing_analytics",
    columns: null,
    rows: null,
    checks: 2,
    tags: ["Marketing", "Confidential business"],
    lastAnalyzed: "1 day ago",
  },
];

const WEB_EVENTS_CHILDREN: AssetRow[] = [
  {
    name: "page_views",
    kind: "table",
    description: "Raw page view events captured from web and mobile properties",
    source: "BigQuery",
    dataset: "web_events",
    columns: 32,
    rows: 92_000_000,
    checks: 6,
    tags: ["Operational", "Analytical"],
    lastAnalyzed: "30 minutes ago",
  },
  {
    name: "sessions",
    kind: "table",
    description: "Sessionized user activity with entry/exit pages and duration",
    source: "BigQuery",
    dataset: "web_events",
    columns: 21,
    rows: 14_500_000,
    checks: 4,
    tags: ["PII", "Analytical"],
    lastAnalyzed: "1 hour ago",
  },
];

const FINANCE_CHILDREN: AssetRow[] = [
  {
    name: "gl_journal",
    kind: "table",
    description: "General ledger journal entries from the ERP system",
    source: "BigQuery",
    dataset: "finance",
    columns: 14,
    rows: 3_100_000,
    checks: 9,
    tags: ["Confidential business", "Operational"],
    lastAnalyzed: "8 hours ago",
  },
  {
    name: "ar_invoices",
    kind: "table",
    description: "Accounts receivable invoices with aging and payment status",
    source: "BigQuery",
    dataset: "finance",
    columns: 19,
    rows: 720_000,
    checks: 7,
    tags: ["Sensitive PII", "Confidential business"],
    lastAnalyzed: "6 hours ago",
  },
  {
    name: "revenue_recognition",
    kind: "table",
    description: "Recognized revenue by contract and period (ASC 606)",
    source: "BigQuery",
    dataset: "finance",
    columns: 11,
    rows: 410_000,
    checks: 5,
    tags: ["Confidential business", "System metadata"],
    lastAnalyzed: "1 day ago",
  },
];

const BIGQUERY_TREE: TreeNode[] = [
  { name: "Marketing Analytics", kind: "dataset" },
  { name: "Web Events", kind: "dataset" },
  { name: "Finance", kind: "dataset" },
];

const BIGQUERY_DATASET_ASSETS: Record<string, AssetRow[]> = {
  "Marketing Analytics": MARKETING_ANALYTICS_CHILDREN,
  "Web Events": WEB_EVENTS_CHILDREN,
  Finance: FINANCE_CHILDREN,
};

Object.assign(DATASET_ASSETS, BIGQUERY_DATASET_ASSETS);
Object.assign(DATASET_TABLE_COUNTS, {
  "Marketing Analytics": MARKETING_ANALYTICS_CHILDREN.length,
  "Web Events": WEB_EVENTS_CHILDREN.length,
  Finance: FINANCE_CHILDREN.length,
});

const BIGQUERY_ALL: AssetRow[] = [
  ...MARKETING_ANALYTICS_CHILDREN,
  ...WEB_EVENTS_CHILDREN,
  ...FINANCE_CHILDREN,
];

const SOURCE_ALL: Record<string, AssetRow[]> = {
  Databricks: DATABRICKS_ALL,
  BigQuery: BIGQUERY_ALL,
};

const SOURCE_DATASETS: Record<string, string[]> = {
  Databricks: DATABRICKS_TREE.map((n) => n.name),
  BigQuery: BIGQUERY_TREE.map((n) => n.name),
};

const TABLE_COLUMNS: Record<string, ColumnRow[]> = {
  Orders: [
    { name: "order_id", description: "Unique identifier for each order", lastAnalyzed: "15h ago" },
    { name: "customer_id", description: "Foreign key to customer_profiles", lastAnalyzed: "15h ago" },
    { name: "order_date", description: "Date the order was placed", lastAnalyzed: "15h ago" },
    { name: "order_status", description: "Current fulfillment status of the order", lastAnalyzed: "15h ago" },
    { name: "total_amount", description: "Total order amount in USD", lastAnalyzed: "15h ago" },
    { name: "currency", description: "ISO currency code", lastAnalyzed: "1d ago" },
    { name: "shipping_address", description: "Destination shipping address", lastAnalyzed: "1d ago" },
    { name: "payment_method", description: "Method used to pay for the order", lastAnalyzed: "1d ago" },
  ],
};

function getColumnsFor(name: string): ColumnRow[] {
  return TABLE_COLUMNS[name] ?? [
    { name: "id", description: "Primary key", lastAnalyzed: "1d ago" },
    { name: "created_at", description: "Row creation timestamp", lastAnalyzed: "1d ago" },
    { name: "updated_at", description: "Row last update timestamp", lastAnalyzed: "1d ago" },
  ];
}

function kindIcon(kind: AssetKind, size = 16) {
  if (kind === "dataset") return <DatasetIcon size={size} />;
  if (kind === "table") return <TableIcon size={size} />;
  return <ChartIcon size={size} />;
}


function SourceLogo({ source }: { source: string }) {
  if (source === "BigQuery") {
    return (
      <span className="inline-block h-5 w-5">
        <svg width="20" height="20" viewBox="0 0 40 40" fill="none" aria-hidden="true">
          <path d="M20 3 4.5 12v16L20 37l15.5-9V12L20 3Z" fill="#4386FA" />
          <circle cx="18" cy="18" r="6" stroke="white" strokeWidth="2.4" fill="none" />
          <line x1="22.5" y1="22.5" x2="27" y2="27" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      </span>
    );
  }
  return (
    <span className="inline-block h-5 w-5">
      <svg width="20" height="20" viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <path d="M20 4 4 12.5l4 2.1L20 8.3l12 6.3 4-2.1L20 4Z" fill="#FF3621" />
        <path d="M4 19.4 20 27.9l16-8.5-4-2.1-12 6.3-12-6.3-4 2.1Z" fill="#FF3621" opacity="0.85" />
        <path d="M4 26.4 20 34.9l16-8.5-4-2.1-12 6.3-12-6.3-4 2.1Z" fill="#FF3621" opacity="0.65" />
      </svg>
    </span>
  );
}

function TagChip({ label }: { label: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
      style={{
        background: "color-mix(in oklab, var(--ink-500) 14%, white)",
        color: "var(--ink-700)",
      }}
    >
      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M21.41 11.58 12.41 2.58A2 2 0 0 0 11 2H4a2 2 0 0 0-2 2v7a2 2 0 0 0 .59 1.42l9 9a2 2 0 0 0 2.83 0l7-7a2 2 0 0 0-.01-2.84zM6.5 8A1.5 1.5 0 1 1 8 6.5 1.5 1.5 0 0 1 6.5 8z" />
      </svg>
      {label}
    </span>
  );
}

/* ---------- selection helpers ---------- */
type Selection = Set<string>;

function isSource(name: string) {
  return name === "Databricks" || name === "BigQuery";
}
function isDataset(name: string) {
  return DATASET_ASSETS[name] !== undefined;
}
function parentSourceOfDataset(name: string): string {
  return BIGQUERY_DATASET_ASSETS[name] ? "BigQuery" : "Databricks";
}

/* ---------- tree row (multi-select) ---------- */
function TreeRow({
  node,
  depth,
  selected,
  onToggle,
}: {
  node: TreeNode;
  depth: number;
  selected: Selection;
  onToggle: (name: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const hasChildren = !!node.children?.length;
  const isSel = selected.has(node.name);

  return (
    <div>
      <div
        className="group flex w-full items-center gap-1 rounded-md pr-1 text-left text-[13px] transition-colors hover:bg-[color:var(--surface-soft)]"
        style={{
          paddingLeft: 8 + depth * 14,
          color: isSel ? "var(--brand-blue)" : "var(--ink-700)",
          background: isSel ? "var(--surface-soft)" : "transparent",
        }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpen((o) => !o);
            }}
            aria-label={open ? "Collapse" : "Expand"}
            aria-expanded={open}
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[color:var(--ink-500)] transition-colors hover:bg-[color:var(--hairline)] hover:text-[color:var(--ink-900)]"
          >
            {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        ) : (
          <span className="h-5 w-5 shrink-0" />
        )}
        <button
          type="button"
          onClick={() => {
            if (hasChildren) setOpen(true);
            onToggle(node.name);
          }}
          className="flex flex-1 items-center gap-2 py-1.5 text-left"
        >
          <CheckSquare checked={isSel} />
          <span style={{ color: isSel ? "var(--brand-blue)" : "var(--ink-500)" }}>
            {kindIcon(node.kind, 14)}
          </span>
          <span className="flex-1 truncate font-medium">
            {node.name}
            {hasChildren && (
              <span className="ml-1 font-normal" style={{ color: "var(--ink-500)" }}>
                ({node.children!.length})
              </span>
            )}
          </span>
        </button>
      </div>
      {hasChildren && open && (
        <div>
          {node.children!.map((c) => (
            <TreeRow key={c.name} node={c} depth={depth + 1} selected={selected} onToggle={onToggle} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- left filter panel ---------- */
function FilterPanel({
  selected,
  onToggle,
  assetTypes,
  onToggleAssetType,
  tags,
  onToggleTag,
}: {
  selected: Selection;
  onToggle: (n: string) => void;
  assetTypes: Set<string>;
  onToggleAssetType: (label: string) => void;
  tags: Set<string>;
  onToggleTag: (label: string) => void;
}) {
  const [databricksOpen, setDatabricksOpen] = useState(true);
  const [bigqueryOpen, setBigqueryOpen] = useState(false);

  const renderSourceHeader = (
    label: string,
    count: number,
    open: boolean,
    setOpen: (v: boolean) => void,
  ) => {
    const isSel = selected.has(label);
    return (
      <div
        className="flex w-full items-center gap-1 rounded-md pr-1 text-[13px] hover:bg-[color:var(--surface-soft)]"
        style={{
          color: isSel ? "var(--brand-blue)" : "var(--ink-900)",
          background: isSel ? "var(--surface-soft)" : "transparent",
        }}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(!open);
          }}
          aria-label={open ? "Collapse" : "Expand"}
          aria-expanded={open}
          className="ml-1 flex h-5 w-5 shrink-0 items-center justify-center rounded text-[color:var(--ink-500)] transition-colors hover:bg-[color:var(--hairline)] hover:text-[color:var(--ink-900)]"
        >
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            onToggle(label);
          }}
          className="flex flex-1 items-center gap-2 py-1.5 text-left"
        >
          <CheckSquare checked={isSel} />
          <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center">
            <SourceLogo source={label} />
          </span>
          <span className="flex-1 font-medium">
            {label} ({count})
          </span>
        </button>
      </div>
    );
  };

  return (
    <aside
      className="flex w-[240px] shrink-0 flex-col gap-5 rounded-2xl border bg-white p-4"
      style={{ borderColor: "var(--hairline)" }}
    >
      <div>
        <div
          className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.08em]"
          style={{ color: "var(--ink-300)" }}
        >
          Data Source
        </div>

        {renderSourceHeader("Databricks", DATABRICKS_TREE.length, databricksOpen, setDatabricksOpen)}
        {databricksOpen && (
          <div className="mt-1">
            {DATABRICKS_TREE.map((n) => (
              <TreeRow key={n.name} node={n} depth={1} selected={selected} onToggle={onToggle} />
            ))}
          </div>
        )}

        <div className="mt-1">
          {renderSourceHeader("BigQuery", BIGQUERY_TREE.length, bigqueryOpen, setBigqueryOpen)}
        </div>
        {bigqueryOpen && (
          <div className="mt-1">
            {BIGQUERY_TREE.map((n) => (
              <TreeRow key={n.name} node={n} depth={1} selected={selected} onToggle={onToggle} />
            ))}
          </div>
        )}
      </div>

      <CheckboxFilterGroup
        title="Data Assets"
        options={[
          { label: "Tables", icon: <TableIcon size={14} /> },
          { label: "Dashboards", icon: <ChartIcon size={14} /> },
          { label: "Query", icon: <QueryIcon size={14} /> },
        ]}
        checked={assetTypes}
        onToggle={onToggleAssetType}
      />

      <CheckboxFilterGroup
        title="Tags"
        options={[
          "PII",
          "Sensitive PII",
          "Confidential business",
          "Operational",
          "Analytical",
          "Marketing",
          "System metadata",
        ]}
        checked={tags}
        onToggle={onToggleTag}
      />
    </aside>
  );
}

/* ---------- checkbox filter group ---------- */
type FilterOption = string | { label: string; icon?: React.ReactNode };

function CheckboxFilterGroup({
  title,
  options,
  checked,
  onToggle,
}: {
  title: string;
  options: FilterOption[];
  checked: Set<string>;
  onToggle: (label: string) => void;
}) {
  return (
    <div>
      <div
        className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.08em]"
        style={{ color: "var(--ink-300)" }}
      >
        {title}
      </div>
      <div className="flex flex-col">
        {options.map((opt) => {
          const label = typeof opt === "string" ? opt : opt.label;
          const icon = typeof opt === "string" ? null : opt.icon;
          const isOn = checked.has(label);
          return (
            <button
              key={label}
              type="button"
              onClick={() => onToggle(label)}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors hover:bg-[color:var(--surface-soft)]"
              style={{ color: isOn ? "var(--brand-blue)" : "var(--ink-700)" }}
            >
              <CheckSquare checked={isOn} />
              {icon && (
                <span style={{ color: isOn ? "var(--brand-blue)" : "var(--ink-500)" }}>
                  {icon}
                </span>
              )}
              <span className="font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- selection chips ---------- */
function SelectionChips({
  selected,
  onRemove,
  onClear,
}: {
  selected: Selection;
  onRemove: (n: string) => void;
  onClear: () => void;
}) {
  if (selected.size === 0) return null;
  const items = Array.from(selected);
  return (
    <div
      className="flex flex-wrap items-center gap-2 rounded-2xl border bg-white px-3 py-2"
      style={{ borderColor: "var(--hairline)" }}
    >
      <span className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--ink-300)" }}>
        Filters
      </span>
      {items.map((name) => (
        <button
          key={name}
          type="button"
          onClick={() => onRemove(name)}
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium transition-colors hover:opacity-90"
          style={{
            background: "color-mix(in oklab, var(--brand-blue) 12%, white)",
            color: "var(--brand-blue)",
            border: "1px solid color-mix(in oklab, var(--brand-blue) 25%, transparent)",
          }}
        >
          <span>{name}</span>
          <XIcon size={11} />
        </button>
      ))}
      {items.length > 1 && (
        <button
          type="button"
          onClick={onClear}
          className="ml-auto text-[12px] font-medium hover:underline"
          style={{ color: "var(--ink-500)" }}
        >
          Clear all
        </button>
      )}
    </div>
  );
}

/* ---------- view resolution ---------- */
type View =
  | { mode: "rows"; title: string; rows: AssetRow[] }
  | { mode: "table"; title: string; columns: ColumnRow[] };

function dedupeRows(rows: AssetRow[]): AssetRow[] {
  const seen = new Set<string>();
  const out: AssetRow[] = [];
  for (const r of rows) {
    const key = `${r.source}::${r.name}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(r);
    }
  }
  return out;
}

const ASSET_TYPE_TO_KIND: Record<string, AssetKind> = {
  Tables: "table",
  Dashboards: "chart",
  // "Query" has no matching kind in current data — will filter to nothing if selected alone
};

function applySecondaryFilters(
  rows: AssetRow[],
  assetTypes: Set<string>,
  tags: Set<string>,
): AssetRow[] {
  let out = rows;
  if (assetTypes.size > 0) {
    const allowedKinds = new Set<AssetKind>();
    for (const t of assetTypes) {
      const k = ASSET_TYPE_TO_KIND[t];
      if (k) allowedKinds.add(k);
    }
    out = out.filter((r) => allowedKinds.has(r.kind));
  }
  if (tags.size > 0) {
    out = out.filter((r) => r.tags.some((t) => tags.has(t)));
  }
  return out;
}

function resolveView(
  selected: Selection,
  assetTypes: Set<string>,
  tags: Set<string>,
): View {
  const hasSecondary = assetTypes.size > 0 || tags.size > 0;

  // Default: nothing selected → show everything across sources
  if (selected.size === 0) {
    return {
      mode: "rows",
      title: "All sources",
      rows: applySecondaryFilters(
        dedupeRows([...DATABRICKS_ALL, ...BIGQUERY_ALL]),
        assetTypes,
        tags,
      ),
    };
  }

  // Single selection of a leaf table/dashboard → column view (skip if secondary filters active)
  if (selected.size === 1 && !hasSecondary) {
    const only = Array.from(selected)[0];
    if (!isSource(only) && !isDataset(only)) {
      return { mode: "table", title: only, columns: getColumnsFor(only) };
    }
  }

  // Otherwise, merge rows from each selection
  const merged: AssetRow[] = [];
  const titleParts: string[] = [];
  for (const name of selected) {
    if (isSource(name)) {
      merged.push(...(SOURCE_ALL[name] ?? []));
      titleParts.push(name);
    } else if (isDataset(name)) {
      merged.push(...(DATASET_ASSETS[name] ?? []));
      titleParts.push(`${parentSourceOfDataset(name)} / ${name}`);
    } else {
      // leaf in a multi-select — surface as a row using its known source
      const allRows = [...DATABRICKS_ALL, ...BIGQUERY_ALL];
      const found = allRows.find((r) => r.name === name);
      if (found) {
        merged.push(found);
        titleParts.push(`${found.source} / ${name}`);
      }
    }
  }

  return {
    mode: "rows",
    title: titleParts.length > 2 ? `${titleParts.length} selections` : titleParts.join(" + "),
    rows: applySecondaryFilters(dedupeRows(merged), assetTypes, tags),
  };
}

function AssetOverview({
  selected,
  assetTypes,
  tags,
}: {
  selected: Selection;
  assetTypes: Set<string>;
  tags: Set<string>;
}) {
  const view = resolveView(selected, assetTypes, tags);

  return (
    <section
      className="rounded-2xl border bg-white"
      style={{ borderColor: "var(--hairline)" }}
    >
      <div
        className="flex items-center gap-2 px-4 py-2 text-[12px] border-b"
        style={{ color: "var(--ink-500)", borderColor: "var(--hairline)" }}
      >
        <span>{view.title}</span>
        <span
          className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5"
          style={{ borderColor: "var(--hairline)", color: "var(--ink-700)" }}
        >
          {view.mode === "table" ? (
            <>
              {view.columns.length} <ColumnIcon size={12} />
            </>
          ) : (
            <>
              {view.rows.length} <GridIcon size={12} />
            </>
          )}
        </span>
      </div>

      <div className="overflow-hidden">
        {view.mode === "table" ? (
          <table className="w-full table-fixed border-collapse text-left text-[13px]">
            <thead>
              <tr
                className="border-y text-[11px] uppercase tracking-[0.08em]"
                style={{ borderColor: "var(--hairline)", color: "var(--ink-300)" }}
              >
                <th className="w-[28%] px-6 py-3 font-semibold">Name</th>
                <th className="w-[52%] px-3 py-3 font-semibold">Description</th>
                <th className="w-[20%] px-6 py-3 font-semibold">Last Analyzed</th>
              </tr>
            </thead>
            <tbody>
              {view.columns.map((c) => (
                <tr key={c.name} className="border-b" style={{ borderColor: "var(--hairline)" }}>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-2" style={{ color: "var(--ink-900)" }}>
                      <span style={{ color: "var(--ink-500)" }}><ColumnIcon size={14} /></span>
                      <span className="font-medium">{c.name}</span>
                    </span>
                  </td>
                  <td className="px-3 py-4 align-top text-[13px]" style={{ color: "var(--ink-700)" }}>
                    {c.description}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 text-[13px]" style={{ color: "var(--ink-700)" }}>
                      <ClockIcon size={13} />
                      {c.lastAnalyzed}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full table-fixed border-collapse text-left text-[13px]">
            <thead>
              <tr
                className="border-y text-[11px] uppercase tracking-[0.08em]"
                style={{ borderColor: "var(--hairline)", color: "var(--ink-300)" }}
              >
                <th className="w-[38%] px-6 py-3 font-semibold">Name</th>
                <th className="w-[10%] px-3 py-3 font-semibold">No. of columns</th>
                <th className="w-[10%] px-3 py-3 font-semibold">No. of rows</th>
                <th className="w-[10%] px-3 py-3 font-semibold">No. of checks</th>
                <th className="w-[32%] px-6 py-3 text-right font-semibold">Last analyzed</th>
              </tr>
            </thead>
            <tbody>
              {view.rows.map((a) => {
                const slug = a.name.toLowerCase().replace(/\s+/g, "-");
                return (
                  <tr
                    key={`${a.source}-${a.name}`}
                    className="border-b transition-colors hover:bg-[color:var(--surface-soft)]"
                    style={{ borderColor: "var(--hairline)" }}
                  >
                    <td className="px-6 py-4 align-top">
                      <Link
                        to="/assets/$assetSlug"
                        params={{ assetSlug: slug }}
                        className="flex items-start gap-3"
                      >
                        <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center">
                          <SourceLogo source={a.source} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-[14px]" style={{ color: "var(--ink-900)" }}>
                            {a.name}
                          </div>
                          <div
                            className="mt-0.5 flex items-center gap-1.5 text-[12px]"
                            style={{ color: "var(--ink-500)" }}
                          >
                            <span style={{ color: "var(--ink-300)" }}>{kindIcon(a.kind, 13)}</span>
                            <span>{a.kind === "chart" ? "Dashboard" : a.kind === "table" ? "Table" : "Dataset"}</span>
                            <span style={{ color: "var(--ink-300)" }}>›</span>
                            <span style={{ color: "var(--brand-blue)" }}>
                              <DatasetIcon size={13} />
                            </span>
                            <span style={{ color: "var(--ink-700)" }}>{a.dataset}</span>
                          </div>
                          <p className="mt-2 text-[13px]" style={{ color: "var(--ink-700)" }}>
                            {a.description}
                          </p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-3 py-4 align-top text-[13px]" style={{ color: "var(--ink-900)" }}>
                      {a.columns !== null ? a.columns.toLocaleString() : <span style={{ color: "var(--ink-300)" }}>—</span>}
                    </td>
                    <td className="px-3 py-4 align-top text-[13px]" style={{ color: "var(--ink-900)" }}>
                      {a.rows !== null ? a.rows.toLocaleString() : <span style={{ color: "var(--ink-300)" }}>—</span>}
                    </td>
                    <td className="px-3 py-4 align-top text-[13px]" style={{ color: "var(--ink-900)" }}>
                      {a.checks}
                    </td>
                    <td className="relative px-6 py-4 align-top">
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1.5 text-[13px]" style={{ color: "var(--ink-700)" }}>
                          <ClockIcon size={13} />
                          {a.lastAnalyzed}
                        </span>
                      </div>
                      {a.tags.length > 0 && (
                        <div className="absolute right-6 bottom-4 flex flex-nowrap items-center gap-1.5">
                          {a.tags.map((t) => (
                            <TagChip key={t} label={t} />
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

/* ---------- screen ---------- */

export function ExploreScreen() {
  const [selected, setSelected] = useState<Selection>(() => new Set(["Databricks"]));
  const [assetTypes, setAssetTypes] = useState<Set<string>>(() => new Set());
  const [tags, setTags] = useState<Set<string>>(() => new Set());

  const toggle = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
        if (isSource(name)) {
          for (const ds of SOURCE_DATASETS[name] ?? []) next.delete(ds);
        }
      } else {
        if (isSource(name)) {
          for (const ds of SOURCE_DATASETS[name] ?? []) next.add(ds);
        }
        next.add(name);
      }
      return next;
    });
  };

  const toggleSetItem = (
    setter: React.Dispatch<React.SetStateAction<Set<string>>>,
  ) =>
    (label: string) =>
      setter((prev) => {
        const next = new Set(prev);
        if (next.has(label)) next.delete(label);
        else next.add(label);
        return next;
      });

  const toggleAssetType = toggleSetItem(setAssetTypes);
  const toggleTag = toggleSetItem(setTags);

  const removeSel = (name: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(name);
      return next;
    });

  const clearAll = () => setSelected(new Set());

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="flex gap-6 px-8 pt-6 pb-28">
          <FilterPanel
            selected={selected}
            onToggle={toggle}
            assetTypes={assetTypes}
            onToggleAssetType={toggleAssetType}
            tags={tags}
            onToggleTag={toggleTag}
          />
          <div className="flex flex-1 flex-col gap-4">
            <SelectionChips selected={selected} onRemove={removeSel} onClear={clearAll} />
            <AssetOverview selected={selected} assetTypes={assetTypes} tags={tags} />
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-6 px-8">
        <div className="pointer-events-auto mx-auto w-full max-w-2xl">
          <ChatComposer />
        </div>
      </div>
    </div>
  );
}
