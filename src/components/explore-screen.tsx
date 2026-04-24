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
  columns: number | null;
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
    columns: 40,
    lastAnalyzed: "15h ago",
  },
  {
    name: "customer_profiles",
    kind: "table",
    description: "Golden customer profile table with attributes from CRM, ERP, and loyalty systems",
    source: "Databricks",
    columns: 200,
    lastAnalyzed: "3:30 PM, 11/25/2025",
  },
  {
    name: "revenue_dashboard",
    kind: "chart",
    description: "Shows real-time inventory counts across warehouses and fulfillment centers",
    source: "Databricks",
    columns: null,
    lastAnalyzed: "6:01 PM, 11/25/2025",
  },
];

const PRODUCT_CATALOG_CHILDREN: AssetRow[] = [
  {
    name: "products",
    kind: "table",
    description: "Master product table with SKU, name, category, and pricing information",
    source: "Databricks",
    columns: 28,
    lastAnalyzed: "2h ago",
  },
  {
    name: "categories",
    kind: "table",
    description: "Product taxonomy and category hierarchy",
    source: "Databricks",
    columns: 12,
    lastAnalyzed: "1d ago",
  },
];

const LOYALTY_POINTS_CHILDREN: AssetRow[] = [
  {
    name: "points_ledger",
    kind: "table",
    description: "Transaction-level ledger of loyalty points earned and redeemed",
    source: "Databricks",
    columns: 18,
    lastAnalyzed: "4h ago",
  },
  {
    name: "tier_status",
    kind: "table",
    description: "Current loyalty tier per customer with thresholds",
    source: "Databricks",
    columns: 9,
    lastAnalyzed: "12h ago",
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
    columns: 24,
    lastAnalyzed: "2h ago",
  },
  {
    name: "attribution_events",
    kind: "table",
    description: "Multi-touch attribution events linking conversions to marketing touchpoints",
    source: "BigQuery",
    columns: 16,
    lastAnalyzed: "5h ago",
  },
  {
    name: "channel_mix_dashboard",
    kind: "chart",
    description: "Executive dashboard showing channel mix and ROAS trends",
    source: "BigQuery",
    columns: null,
    lastAnalyzed: "1d ago",
  },
];

const WEB_EVENTS_CHILDREN: AssetRow[] = [
  {
    name: "page_views",
    kind: "table",
    description: "Raw page view events captured from web and mobile properties",
    source: "BigQuery",
    columns: 32,
    lastAnalyzed: "30m ago",
  },
  {
    name: "sessions",
    kind: "table",
    description: "Sessionized user activity with entry/exit pages and duration",
    source: "BigQuery",
    columns: 21,
    lastAnalyzed: "1h ago",
  },
];

const FINANCE_CHILDREN: AssetRow[] = [
  {
    name: "gl_journal",
    kind: "table",
    description: "General ledger journal entries from the ERP system",
    source: "BigQuery",
    columns: 14,
    lastAnalyzed: "8h ago",
  },
  {
    name: "ar_invoices",
    kind: "table",
    description: "Accounts receivable invoices with aging and payment status",
    source: "BigQuery",
    columns: 19,
    lastAnalyzed: "6h ago",
  },
  {
    name: "revenue_recognition",
    kind: "table",
    description: "Recognized revenue by contract and period (ASC 606)",
    source: "BigQuery",
    columns: 11,
    lastAnalyzed: "1d ago",
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
}: {
  selected: Selection;
  onToggle: (n: string) => void;
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
          <GridIcon size={14} />
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
    </aside>
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

function resolveView(selected: Selection): View {
  // Default: nothing selected → show everything across sources
  if (selected.size === 0) {
    return {
      mode: "rows",
      title: "All sources",
      rows: dedupeRows([...DATABRICKS_ALL, ...BIGQUERY_ALL]),
    };
  }

  // Single selection of a leaf table/dashboard → column view
  if (selected.size === 1) {
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
    rows: dedupeRows(merged),
  };
}

function AssetOverview({ selected }: { selected: Selection }) {
  const view = resolveView(selected);

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
                <th className="w-[22%] px-6 py-3 font-semibold">Name</th>
                <th className="w-[34%] px-3 py-3 font-semibold">Description</th>
                <th className="w-[14%] px-3 py-3 font-semibold">Data Source</th>
                <th className="w-[12%] px-3 py-3 font-semibold">Contents</th>
                <th className="w-[18%] px-6 py-3 font-semibold">Last Analyzed</th>
              </tr>
            </thead>
            <tbody>
              {view.rows.map((a) => {
                const slug = a.name.toLowerCase().replace(/\s+/g, "-");
                const isDs = a.kind === "dataset";
                const isTbl = a.kind === "table";
                const tableCount = isDs ? DATASET_TABLE_COUNTS[a.name] ?? 0 : 0;
                return (
                  <tr
                    key={`${a.source}-${a.name}`}
                    className="border-b transition-colors hover:bg-[color:var(--surface-soft)] cursor-pointer"
                    style={{ borderColor: "var(--hairline)" }}
                  >
                    <td className="px-6 py-4">
                      <Link
                        to="/assets/$assetSlug"
                        params={{ assetSlug: slug }}
                        className="flex items-center gap-2"
                        style={{ color: "var(--ink-900)" }}
                      >
                        <span style={{ color: "var(--ink-500)" }}>{kindIcon(a.kind, 16)}</span>
                        <span className="font-medium">{a.name}</span>
                      </Link>
                    </td>
                    <td className="px-3 py-4 align-top text-[13px]" style={{ color: "var(--ink-700)" }}>
                      {a.description}
                    </td>
                    <td className="px-3 py-4">
                      <span className="inline-flex items-center gap-1.5 text-[13px]" style={{ color: "var(--ink-700)" }}>
                        <StarIcon size={13} />
                        {a.source}
                      </span>
                    </td>
                    <td className="px-3 py-4">
                      {isDs ? (
                        <span
                          className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[12px]"
                          style={{ borderColor: "var(--hairline)", color: "var(--ink-700)" }}
                          title={`${tableCount} assets`}
                        >
                          {tableCount} <GridIcon size={12} />
                        </span>
                      ) : isTbl && a.columns !== null ? (
                        <span
                          className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[12px]"
                          style={{ borderColor: "var(--hairline)", color: "var(--ink-700)" }}
                          title={`${a.columns} columns`}
                        >
                          {a.columns} <ColumnIcon size={12} />
                        </span>
                      ) : (
                        <span style={{ color: "var(--ink-300)" }}>—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 text-[13px]" style={{ color: "var(--ink-700)" }}>
                        <ClockIcon size={13} />
                        {a.lastAnalyzed}
                      </span>
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

  const toggle = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        // If selecting a source, drop its child datasets (redundant)
        if (isSource(name)) {
          for (const ds of SOURCE_DATASETS[name] ?? []) next.delete(ds);
        }
        // If selecting a dataset whose parent source is selected, deselect parent (more specific)
        if (isDataset(name)) {
          const parent = parentSourceOfDataset(name);
          if (next.has(parent)) next.delete(parent);
        }
        next.add(name);
      }
      return next;
    });
  };

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
          <FilterPanel selected={selected} onToggle={toggle} />
          <div className="flex flex-1 flex-col gap-4">
            <SelectionChips selected={selected} onRemove={removeSel} onClear={clearAll} />
            <AssetOverview selected={selected} />
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
