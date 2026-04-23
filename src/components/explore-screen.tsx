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

const DATABRICKS_TREE: TreeNode[] = [
  {
    name: "Customer Data",
    kind: "dataset",
    children: [
      { name: "Orders", kind: "table" },
      { name: "Customer profiles", kind: "table" },
      { name: "Revenue dashboard", kind: "chart" },
    ],
  },
  { name: "Product catalog", kind: "table" },
  { name: "Loyalty Points", kind: "table" },
];

const ASSETS = [
  {
    name: "Orders",
    kind: "dataset" as AssetKind,
    description: "Stores all customer order transactions including amounts, dates, and statuses",
    source: "Databricks",
    columns: 40,
    lastAnalyzed: "15h ago",
  },
  {
    name: "customer_profiles",
    kind: "table" as AssetKind,
    description: "Golden customer profile table with attributes from CRM, ERP, and loyalty systems",
    source: "Databricks",
    columns: 200,
    lastAnalyzed: "3:30 PM, 11/25/2025",
  },
  {
    name: "revenue_dashboard",
    kind: "chart" as AssetKind,
    description: "Shows real-time inventory counts across warehouses and fulfillment centers",
    source: "Databricks",
    columns: null as number | null,
    lastAnalyzed: "6:01 PM, 11/25/2025",
  },
];

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
      <button
        type="button"
        onClick={() => {
          if (hasChildren) setOpen((o) => !o);
          onSelect(node.name);
        }}
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors hover:bg-[color:var(--surface-soft)]"
        style={{
          paddingLeft: 8 + depth * 14,
          color: isSel ? "var(--brand-blue)" : "var(--ink-700)",
          background: isSel ? "var(--surface-soft)" : "transparent",
        }}
      >
        <span style={{ color: isSel ? "var(--brand-blue)" : "var(--ink-500)" }}>
          {kindIcon(node.kind, 14)}
        </span>
        <span className="flex-1 truncate font-medium">{node.name}</span>
      </button>
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

        <button
          type="button"
          onClick={() => setDatabricksOpen((o) => !o)}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] hover:bg-[color:var(--surface-soft)]"
          style={{ color: "var(--ink-900)" }}
        >
          <GridIcon size={14} />
          <span className="flex-1 font-medium">Databricks (633)</span>
          {databricksOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {databricksOpen && (
          <div className="mt-1">
            {DATABRICKS_TREE.map((n) => (
              <TreeRow key={n.name} node={n} depth={1} selected={selected} onSelect={onSelect} />
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => setBigqueryOpen((o) => !o)}
          className="mt-1 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] hover:bg-[color:var(--surface-soft)]"
          style={{ color: "var(--ink-900)" }}
        >
          <GridIcon size={14} />
          <span className="flex-1 font-medium">BigQuery (2)</span>
          {bigqueryOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
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
function AssetOverview() {
  return (
    <section
      className="rounded-2xl border bg-white"
      style={{ borderColor: "var(--hairline)" }}
    >
      <div
        className="flex items-center gap-2 px-4 py-2 text-[12px] border-b"
        style={{ color: "var(--ink-500)", borderColor: "var(--hairline)" }}
      >
        <span>Databricks / customer_data</span>
        <span
          className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5"
          style={{ borderColor: "var(--hairline)", color: "var(--ink-700)" }}
        >
          240 <ColumnIcon size={12} />
        </span>
      </div>

      <div className="overflow-hidden">
        <table className="w-full table-fixed border-collapse text-left text-[13px]">
          <thead>
            <tr
              className="border-y text-[11px] uppercase tracking-[0.08em]"
              style={{ borderColor: "var(--hairline)", color: "var(--ink-300)" }}
            >
              <th className="w-[22%] px-6 py-3 font-semibold">Name</th>
              <th className="w-[34%] px-3 py-3 font-semibold">Description</th>
              <th className="w-[14%] px-3 py-3 font-semibold">Data Source</th>
              <th className="w-[12%] px-3 py-3 font-semibold">Columns</th>
              <th className="w-[18%] px-6 py-3 font-semibold">Last Analyzed</th>
            </tr>
          </thead>
          <tbody>
            {ASSETS.map((a) => {
              const slug = a.name.toLowerCase().replace(/\s+/g, "-");
              return (
                <tr
                  key={a.name}
                  className="border-b transition-colors hover:bg-[color:var(--surface-soft)] cursor-pointer"
                  style={{ borderColor: "var(--hairline)" }}
                >
                  <td className="px-6 py-4">
                    <Link
                      to="/asset/$assetSlug"
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
                    <span
                      className="inline-flex items-center gap-1.5 text-[13px]"
                      style={{ color: "var(--ink-700)" }}
                    >
                      <StarIcon size={13} />
                      {a.source}
                    </span>
                  </td>
                  <td className="px-3 py-4">
                    {a.columns !== null ? (
                      <span
                        className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[12px]"
                        style={{ borderColor: "var(--hairline)", color: "var(--ink-700)" }}
                      >
                        {a.columns} <ColumnIcon size={12} />
                      </span>
                    ) : (
                      <span style={{ color: "var(--ink-300)" }}>—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className="inline-flex items-center gap-1.5 text-[13px]"
                      style={{ color: "var(--ink-700)" }}
                    >
                      <ClockIcon size={13} />
                      {a.lastAnalyzed}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ---------- screen ---------- */
export function ExploreScreen() {
  const [selected, setSelected] = useState<string | null>("Customer Data");
  return (
    <div className="relative flex flex-1 flex-col">
      <div className="flex flex-1 gap-6 px-8 pt-6 pb-28">
        <FilterPanel selected={selected} onSelect={setSelected} />
        <div className="flex flex-1 flex-col gap-6">
          <AssetOverview />
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
