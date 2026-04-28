import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import {
  BigQueryIcon,
  DatabricksIcon,
  RedshiftIcon,
  SnowflakeIcon,
} from "@/components/brand-icons";

type Platform = {
  id: string;
  name: string;
  description: string;
  Icon: React.ComponentType;
};

const PLATFORMS: Platform[] = [
  {
    id: "snowflake",
    name: "Snowflake",
    description: "Cloud-native data warehouse.",
    Icon: SnowflakeIcon,
  },
  {
    id: "databricks",
    name: "Databricks",
    description: "Lakehouse platform for analytics and ML.",
    Icon: DatabricksIcon,
  },
  {
    id: "bigquery",
    name: "BigQuery",
    description: "Serverless data warehouse on Google Cloud.",
    Icon: BigQueryIcon,
  },
  {
    id: "redshift",
    name: "Amazon Redshift",
    description: "Petabyte-scale warehouse on AWS.",
    Icon: RedshiftIcon,
  },
];

export function NewConnectionModal({
  open,
  onOpenChange,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (platformId: string) => void;
}) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PLATFORMS;
    return PLATFORMS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q),
    );
  }, [query]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center px-4"
      style={{ background: "rgba(15, 19, 28, 0.45)" }}
      onClick={() => onOpenChange(false)}
      role="dialog"
      aria-modal="true"
      aria-label="New connection"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[720px] overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_-12px_rgba(15,19,28,0.25)]"
        style={{ border: "1px solid var(--hairline)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between border-b px-7 pt-6 pb-5"
          style={{ borderColor: "var(--hairline)" }}
        >
          <h2
            className="text-[22px] font-semibold leading-tight"
            style={{ color: "var(--ink-900)" }}
          >
            New connection
          </h2>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-[color:var(--surface-soft)]"
            style={{ color: "var(--ink-500)" }}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-7 py-6">
          <div
            className="rounded-xl border p-5"
            style={{ borderColor: "var(--hairline)", background: "var(--surface-soft)" }}
          >
            <p className="text-[13px]" style={{ color: "var(--ink-500)" }}>
              Choose a platform to connect to AgentFlow.
            </p>

            <div className="relative mt-3">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2"
                style={{ color: "var(--ink-300)" }}
              />
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search platforms (e.g. snowflake, bigquery)"
                className="h-11 w-full rounded-lg border bg-white pl-10 pr-4 text-[14px] outline-none transition-shadow focus:shadow-[0_0_0_3px_rgba(67,134,250,0.15)]"
                style={{ borderColor: "var(--hairline)", color: "var(--ink-900)" }}
              />
            </div>

            <div
              className="mt-5 mb-2 text-[11px] font-semibold uppercase tracking-wide"
              style={{ color: "var(--ink-500)" }}
            >
              Data warehouse
            </div>

            {filtered.length === 0 ? (
              <div
                className="py-10 text-center text-[13px]"
                style={{ color: "var(--ink-500)" }}
              >
                No platforms match "{query}"
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {filtered.map((p) => (
                  <PlatformCard key={p.id} platform={p} onSelect={onSelect} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PlatformCard({
  platform,
  onSelect,
}: {
  platform: Platform;
  onSelect: (id: string) => void;
}) {
  const { Icon } = platform;
  return (
    <button
      type="button"
      onClick={() => onSelect(platform.id)}
      className="group flex items-center gap-3 rounded-xl border bg-white p-3 text-left transition-all hover:-translate-y-px hover:shadow-[0_6px_18px_-8px_rgba(15,19,28,0.15)]"
      style={{ borderColor: "var(--hairline)" }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--brand-blue)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--hairline)";
      }}
    >
      <span
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg [&>svg]:h-5 [&>svg]:w-5"
        style={{ background: "var(--surface-soft)" }}
      >
        <Icon />
      </span>
      <div className="min-w-0">
        <div className="text-[14px] font-semibold" style={{ color: "var(--ink-900)" }}>
          {platform.name}
        </div>
        <div
          className="mt-0.5 line-clamp-1 text-[12px]"
          style={{ color: "var(--ink-500)" }}
        >
          {platform.description}
        </div>
      </div>
    </button>
  );
}
