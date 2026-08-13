import { useMemo, useState } from "react";
import { Columns3, Copy, LayoutGrid, List, Lock, Pencil, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import {
  DIMENSIONS,
  MOCK_RULES,
  creatorLabel,
  type Rule,
} from "./mock-rules";
import { RuleModal } from "./RuleModal";

type CreatorFilter = "all" | "me" | "team" | "reltio";
type SortKey = "name" | "dimension" | "creator" | "columns" | "passRate";

function CreatorBadge({ rule }: { rule: Rule }) {
  const managed = rule.creator.kind === "reltio";
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px]" style={{ color: "var(--ink-700)" }}>
      {managed && <Lock size={12} style={{ color: "var(--ink-500)" }} />}
      {creatorLabel(rule.creator)}
    </span>
  );
}

function RowActions({ rule, onClone }: { rule: Rule; onClone: (r: Rule) => void }) {
  const managed = rule.creator.kind === "reltio";
  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        disabled={managed}
        aria-label={managed ? "Reltio-managed rules can't be edited" : "Edit rule"}
        title={managed ? "Reltio-managed rules can't be edited" : "Edit rule"}
        onClick={() => toast("Editing is available for your own rules")}
        className="disabled:cursor-not-allowed disabled:opacity-40"
        style={{ color: "var(--ink-500)" }}
      >
        <Pencil size={15} />
      </button>
      <button
        type="button"
        aria-label="Clone rule"
        title="Clone rule"
        onClick={() => onClone(rule)}
        style={{ color: "var(--ink-500)" }}
      >
        <Copy size={15} />
      </button>
    </span>
  );
}

export function DqChecksScreen() {
  const [rules, setRules] = useState<Rule[]>(MOCK_RULES);
  const [query, setQuery] = useState("");
  const [dimension, setDimension] = useState<string>("all");
  const [creator, setCreator] = useState<CreatorFilter>("all");
  const [view, setView] = useState<"list" | "card">("list");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "name",
    dir: "asc",
  });
  const [modal, setModal] = useState<{ open: boolean; mode: "create" | "clone"; source: Rule | null }>({
    open: false,
    mode: "create",
    source: null,
  });

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = rules.filter((r) => {
      if (q && !r.name.toLowerCase().includes(q)) return false;
      if (dimension !== "all" && r.dimension !== dimension) return false;
      if (creator === "me" && r.creator.kind !== "me") return false;
      if (creator === "team" && r.creator.kind !== "team") return false;
      if (creator === "reltio" && r.creator.kind !== "reltio") return false;
      return true;
    });
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const get = (r: Rule) => {
        switch (sort.key) {
          case "name":
            return r.name.toLowerCase();
          case "dimension":
            return r.dimension.toLowerCase();
          case "creator":
            return creatorLabel(r.creator).toLowerCase();
          case "columns":
            return r.columns;
          case "passRate":
            return r.passRate;
        }
      };
      const av = get(a);
      const bv = get(b);
      if (av === bv) return 0;
      return av > bv ? dir : -dir;
    });
  }, [rules, query, dimension, creator, sort]);

  function toggleSort(key: SortKey) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  }

  const selectStyle: React.CSSProperties = {
    borderColor: "var(--hairline)",
    color: "var(--ink-900)",
  };

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6">
      <div className="mx-auto max-w-[1200px]">
        <h1 className="text-[24px] font-semibold" style={{ color: "var(--ink-900)" }}>
          DQ checks
        </h1>
        <p className="mt-1 text-[14px]" style={{ color: "var(--ink-500)" }}>
          Reusable data quality rules applied across columns.
        </p>

        {/* toolbar */}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px] flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--ink-500)" }}
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for rules"
              className="w-full rounded-xl border bg-white py-2.5 pl-9 pr-3 text-[14px] outline-none focus:border-[color:var(--brand-blue)]"
              style={selectStyle}
            />
          </div>
          <select
            value={dimension}
            onChange={(e) => setDimension(e.target.value)}
            className="rounded-xl border bg-white px-3 py-2.5 text-[14px] outline-none focus:border-[color:var(--brand-blue)]"
            style={selectStyle}
            aria-label="Filter by dimension"
          >
            <option value="all">All dimensions</option>
            {DIMENSIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <select
            value={creator}
            onChange={(e) => setCreator(e.target.value as CreatorFilter)}
            className="rounded-xl border bg-white px-3 py-2.5 text-[14px] outline-none focus:border-[color:var(--brand-blue)]"
            style={selectStyle}
            aria-label="Filter by creator"
          >
            <option value="all">All creators</option>
            <option value="me">Created by me</option>
            <option value="team">Created by team</option>
            <option value="reltio">Reltio-managed</option>
          </select>

          <div
            className="flex items-center gap-1 rounded-xl border bg-white p-1"
            style={{ borderColor: "var(--hairline)" }}
          >
            {(
              [
                ["list", List, "List view"],
                ["card", LayoutGrid, "Card view"],
              ] as const
            ).map(([key, Icon, label]) => (
              <button
                key={key}
                type="button"
                aria-label={label}
                aria-pressed={view === key}
                onClick={() => setView(key)}
                className="rounded-lg px-2.5 py-1.5"
                style={{
                  background: view === key ? "var(--surface-soft)" : "transparent",
                  color: view === key ? "var(--brand-blue)" : "var(--ink-500)",
                }}
              >
                <Icon size={16} />
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setModal({ open: true, mode: "create", source: null })}
            className="inline-flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-[14px] font-medium"
            style={{
              borderColor: "var(--brand-blue)",
              color: "var(--brand-blue)",
              background: "rgba(67,134,250,0.08)",
            }}
          >
            <Plus size={15} />
            Rules
          </button>
        </div>

        {visible.length === 0 && (
          <div
            className="mt-6 rounded-2xl border bg-white px-6 py-12 text-center text-[14px]"
            style={{ borderColor: "var(--hairline)", color: "var(--ink-500)" }}
          >
            No rules match these filters.
          </div>
        )}

        {view === "list" && visible.length > 0 && (
          <section
            className="mt-6 overflow-hidden rounded-2xl border bg-white"
            style={{ borderColor: "var(--hairline)" }}
          >
            <table className="w-full border-collapse text-left text-[13px]">
              <thead>
                <tr
                  className="border-b text-[11px] uppercase tracking-[0.08em]"
                  style={{ borderColor: "var(--hairline)", color: "var(--ink-300)" }}
                >
                  {(
                    [
                      ["name", "Name"],
                      ["dimension", "Dimension"],
                      ["creator", "Creator"],
                      ["columns", "Columns applied"],
                      ["passRate", "Pass rate"],
                    ] as const
                  ).map(([key, label]) => (
                    <th key={key} className="px-6 py-3 font-semibold">
                      <button
                        type="button"
                        onClick={() => toggleSort(key)}
                        className="inline-flex items-center gap-1 uppercase tracking-[0.08em]"
                      >
                        {label}
                        {sort.key === key && <span>{sort.dir === "asc" ? "↑" : "↓"}</span>}
                      </button>
                    </th>
                  ))}
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b transition-colors last:border-b-0 hover:bg-[color:var(--surface-soft)]"
                    style={{ borderColor: "var(--hairline)" }}
                  >
                    <td className="px-6 py-4 font-medium" style={{ color: "var(--ink-900)" }}>
                      {r.name}
                    </td>
                    <td className="px-6 py-4" style={{ color: "var(--ink-700)" }}>
                      {r.dimension}
                    </td>
                    <td className="px-6 py-4">
                      <CreatorBadge rule={r} />
                    </td>
                    <td className="px-6 py-4" style={{ color: "var(--ink-900)" }}>
                      {r.columns}
                    </td>
                    <td className="px-6 py-4" style={{ color: "var(--ink-900)" }}>
                      {r.passRate}%
                    </td>
                    <td className="px-6 py-4 text-right">
                      <RowActions
                        rule={r}
                        onClone={(rule) => setModal({ open: true, mode: "clone", source: rule })}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {view === "card" && visible.length > 0 && (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((r) => (
              <article
                key={r.id}
                className="flex flex-col rounded-2xl border bg-white p-4"
                style={{ borderColor: "var(--hairline)" }}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-[15px] font-semibold" style={{ color: "var(--ink-900)" }}>
                    {r.name}
                  </h3>
                  <RowActions
                    rule={r}
                    onClone={(rule) => setModal({ open: true, mode: "clone", source: rule })}
                  />
                </div>
                <div className="mt-2 flex items-center gap-3 text-[12px]" style={{ color: "var(--ink-700)" }}>
                  <span
                    className="rounded-md border px-2 py-0.5"
                    style={{ borderColor: "var(--hairline)" }}
                  >
                    {r.dimension}
                  </span>
                  <CreatorBadge rule={r} />
                </div>
                <p className="mt-3 text-[13px]" style={{ color: "var(--ink-700)" }}>
                  {r.description}
                </p>
                <div
                  className="mt-3 flex items-center gap-4 text-[12px]"
                  style={{ color: "var(--ink-500)" }}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <Columns3 size={13} /> {r.columns} columns
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <div
                    className="h-1.5 flex-1 overflow-hidden rounded-full"
                    style={{ background: "var(--surface-soft)" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${r.passRate}%`, background: "var(--brand-blue)" }}
                    />
                  </div>
                  <span className="text-[12px] font-medium" style={{ color: "var(--ink-700)" }}>
                    {r.passRate}% pass
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <RuleModal
        open={modal.open}
        mode={modal.mode}
        source={modal.source}
        onClose={() => setModal({ open: false, mode: "create", source: null })}
        onSave={(rule) => {
          setRules((prev) => [rule, ...prev]);
          setModal({ open: false, mode: "create", source: null });
          toast.success(`Saved “${rule.name}”`);
        }}
      />
    </div>
  );
}
