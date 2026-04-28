import { useEffect } from "react";
import { useDomainState } from "./domain-context";

/**
 * Toast/snackbar that confirms a domain was just connected with its tables
 * and checks. Floats at the bottom-center of the app.
 */
export function DomainConnectedBanner() {
  const { justConnected, dismissJustConnected } = useDomainState();

  // Auto-dismiss after a short delay so it behaves like a snackbar.
  useEffect(() => {
    if (!justConnected) return;
    const id = window.setTimeout(() => dismissJustConnected(), 6000);
    return () => window.clearTimeout(id);
  }, [justConnected, dismissJustConnected]);

  if (!justConnected) return null;

  const { name, tables, checkCount } = justConnected;
  const tableCount = tables.length;
  const preview = tables.slice(0, 3).join(", ");
  const remainder = tables.length > 3 ? ` +${tables.length - 3} more` : "";

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-6 z-[70] flex justify-center px-4"
      role="status"
      aria-live="polite"
    >
      <div
        className="pointer-events-auto flex max-w-[720px] items-center gap-3 rounded-xl border px-4 py-2.5 text-[13px]"
        style={{
          borderColor: "rgba(67,134,250,0.35)",
          background: "white",
          boxShadow: "0 12px 32px rgba(15,23,42,0.16)",
        }}
      >
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
        <button
          type="button"
          onClick={dismissJustConnected}
          className="ml-2 shrink-0 rounded-md px-2 py-1 text-[12px] font-medium transition-colors hover:bg-[color:var(--surface-soft)]"
          style={{ color: "var(--ink-700)" }}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
