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

/* ---------- tree ---------- */
function TreeRow({
  node,
  depth,
  selected,
  onSelect,
}: {
  node: TreeNode;
  depth: number;
  selected: string | null;
  onSelect: (name: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const hasChildren = !!node.children?.length;
  const isSel = selected === node.name;

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
            onSelect(node.name);
          }}
          className="flex flex-1 items-center gap-2 py-1.5 text-left"
        >
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
            <TreeRow key={c.name} node={c} depth={depth + 1} selected={selected} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- left filter panel ---------- */
function FilterPanel({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (n: string) => void;
}) {
  const [databricksOpen, setDatabricksOpen] = useState(true);
  const [bigqueryOpen, setBigqueryOpen] = useState(false);
  const [types, setTypes] = useState({ Dataset: true, Table: false, Dashboard: false });
  const [tags, setTags] = useState([true, false, false]);

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

        <div
          className="flex w-full items-center gap-1 rounded-md pr-1 text-[13px] hover:bg-[color:var(--surface-soft)]"
          style={{ color: "var(--ink-900)" }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setDatabricksOpen((o) => !o);
            }}
            aria-label={databricksOpen ? "Collapse" : "Expand"}
            aria-expanded={databricksOpen}
            className="ml-1 flex h-5 w-5 shrink-0 items-center justify-center rounded text-[color:var(--ink-500)] transition-colors hover:bg-[color:var(--hairline)] hover:text-[color:var(--ink-900)]"
          >
            {databricksOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button
            type="button"
            onClick={() => {
              setDatabricksOpen(true);
              onSelect("Databricks");
            }}
            className="flex flex-1 items-center gap-2 py-1.5 text-left"
          >
            <GridIcon size={14} />
            <span className="flex-1 font-medium">Databricks ({DATABRICKS_TREE.length})</span>
          </button>
        </div>
        {databricksOpen && (
          <div className="mt-1">
            {DATABRICKS_TREE.map((n) => (
              <TreeRow key={n.name} node={n} depth={1} selected={selected} onSelect={onSelect} />
            ))}
          </div>
        )}

        <div
          className="mt-1 flex w-full items-center gap-1 rounded-md pr-1 text-[13px] hover:bg-[color:var(--surface-soft)]"
          style={{ color: "var(--ink-900)" }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setBigqueryOpen((o) => !o);
            }}
            aria-label={bigqueryOpen ? "Collapse" : "Expand"}
            aria-expanded={bigqueryOpen}
            className="ml-1 flex h-5 w-5 shrink-0 items-center justify-center rounded text-[color:var(--ink-500)] transition-colors hover:bg-[color:var(--hairline)] hover:text-[color:var(--ink-900)]"
          >
            {bigqueryOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button
            type="button"
            onClick={() => {
              setBigqueryOpen(true);
              onSelect("BigQuery");
            }}
            className="flex flex-1 items-center gap-2 py-1.5 text-left"
          >
            <GridIcon size={14} />
            <span className="flex-1 font-medium">BigQuery ({BIGQUERY_TREE.length})</span>
          </button>
        </div>
        {bigqueryOpen && (
          <div className="mt-1">
            {BIGQUERY_TREE.map((n) => (
              <TreeRow key={n.name} node={n} depth={1} selected={selected} onSelect={onSelect} />
            ))}
          </div>
        )}
      </div>

      <div>
        <div
          className="mb-2 px-1 text-[14px] font-semibold"
          style={{ color: "var(--ink-900)" }}
        >
          Types
        </div>
        <ul className="space-y-1">
          {(["Dataset", "Table", "Dashboard"] as const).map((t) => (
            <li key={t}>
              <button
                type="button"
                onClick={() => setTypes((s) => ({ ...s, [t]: !s[t] }))}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] hover:bg-[color:var(--surface-soft)]"
                style={{ color: "var(--ink-700)" }}
              >
                <CheckSquare checked={types[t]} />
                <span style={{ color: "var(--ink-500)" }}>
                  {t === "Dataset" && <DatasetIcon size={14} />}
                  {t === "Table" && <TableIcon size={14} />}
                  {t === "Dashboard" && <ChartIcon size={14} />}
                </span>
                <span className="font-medium">{t}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <div
          className="mb-2 px-1 text-[14px] font-semibold"
          style={{ color: "var(--ink-900)" }}
        >
          Tags
        </div>
        <ul className="space-y-1">
          {tags.map((checked, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() =>
                  setTags((arr) => arr.map((v, idx) => (idx === i ? !v : v)))
                }
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] hover:bg-[color:var(--surface-soft)]"
                style={{ color: "var(--ink-700)" }}
              >
                <CheckSquare checked={checked} />
                <span className="font-medium">Tag Label</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

/* ---------- asset overview ---------- */
type View =
  | { mode: "source"; title: string; rows: AssetRow[] }
  | { mode: "dataset"; title: string; rows: AssetRow[] }
  | { mode: "table"; title: string; columns: ColumnRow[] };

function resolveView(selected: string | null): View {
  if (!selected || selected === "Databricks") {
    return { mode: "source", title: "Databricks", rows: DATABRICKS_ALL };
  }
  if (DATASET_ASSETS[selected]) {
    return { mode: "dataset", title: `Databricks / ${selected}`, rows: DATASET_ASSETS[selected] };
  }
  // assume table/dashboard leaf
  return { mode: "table", title: `Databricks / ${selected}`, columns: getColumnsFor(selected) };
}

function AssetOverview({ selected }: { selected: string | null }) {
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
          ) : view.mode === "dataset" ? (
            <>
              {view.rows.length} <GridIcon size={12} />
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
                const isDataset = a.kind === "dataset";
                const isTable = a.kind === "table";
                const tableCount = isDataset ? DATASET_TABLE_COUNTS[a.name] ?? 0 : 0;
                return (
                  <tr
                    key={a.name}
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
                      {isDataset ? (
                        <span
                          className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[12px]"
                          style={{ borderColor: "var(--hairline)", color: "var(--ink-700)" }}
                          title={`${tableCount} assets`}
                        >
                          {tableCount} <GridIcon size={12} />
                        </span>
                      ) : isTable && a.columns !== null ? (
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
  const [selected, setSelected] = useState<string | null>("Databricks");
  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="flex gap-6 px-8 pt-6 pb-28">
          <FilterPanel selected={selected} onSelect={setSelected} />
          <div className="flex flex-1 flex-col gap-6">
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
