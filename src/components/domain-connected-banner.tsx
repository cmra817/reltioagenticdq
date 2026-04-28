import { useDomainState } from "./domain-context";

/**
 * Breadcrumb-style banner that confirms a domain was just connected with its
 * tables and checks. Shown right under the topbar across the app.
 */
export function DomainConnectedBanner() {
  const { justConnected, dismissJustConnected } = useDomainState();
  if (!justConnected) return null;

  const { name, tables, checkCount } = justConnected;
  const tableCount = tables.length;
  const preview = tables.slice(0, 3).join(", ");
  const remainder = tables.length > 3 ? ` +${tables.length - 3} more` : "";

  return (
    <div
      role="status"
      aria-live="polite"
      className="mx-4 mt-1 mb-2 flex items-center justify-between gap-4 rounded-xl border px-4 py-2.5"
      style={{
        borderColor: "rgba(67,134,250,0.35)",
        background:
          "linear-gradient(90deg, rgba(67,134,250,0.10), rgba(103,240,255,0.10))",
      }}
    >
      <div className="flex min-w-0 items-center gap-3 text-[13px]">
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white"
          style={{ background: "var(--brand-blue)" }}
          aria-hidden="true"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
        <nav
          aria-label="Connection breadcrumb"
          className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5"
          style={{ color: "var(--ink-700)" }}
        >
          <span style={{ color: "var(--ink-500)" }}>Domain</span>
          <span aria-hidden="true" style={{ color: "var(--ink-300)" }}>/</span>
          <span className="font-semibold" style={{ color: "var(--ink-900)" }}>
            {name}
          </span>
          <span aria-hidden="true" style={{ color: "var(--ink-300)" }}>·</span>
          <span>
            <span className="font-semibold" style={{ color: "var(--ink-900)" }}>
              {tableCount}
            </span>{" "}
            table{tableCount === 1 ? "" : "s"} connected
          </span>
          <span aria-hidden="true" style={{ color: "var(--ink-300)" }}>·</span>
          <span>
            <span className="font-semibold" style={{ color: "var(--ink-900)" }}>
              {checkCount}
            </span>{" "}
            check{checkCount === 1 ? "" : "s"} applied
          </span>
          {tableCount > 0 && (
            <span className="truncate" style={{ color: "var(--ink-500)" }}>
              — {preview}
              {remainder}
            </span>
          )}
        </nav>
      </div>
      <button
        type="button"
        onClick={dismissJustConnected}
        className="shrink-0 rounded-md px-2 py-1 text-[12px] font-medium transition-colors hover:bg-white/60"
        style={{ color: "var(--ink-700)" }}
      >
        Dismiss
      </button>
    </div>
  );
}
