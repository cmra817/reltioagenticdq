import { useEffect, useMemo, useState } from "react";
import { Check, Eye, EyeOff, Search, X } from "lucide-react";
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

type View = "pick" | "configure" | "success";

export function NewConnectionModal({
  open,
  onOpenChange,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (platformId: string) => void;
}) {
  const [view, setView] = useState<View>("pick");
  const [platformId, setPlatformId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [connName, setConnName] = useState("");
  const [catalog, setCatalog] = useState("");
  const [schema, setSchema] = useState("");

  useEffect(() => {
    if (!open) {
      setQuery("");
      setView("pick");
      setPlatformId(null);
      setConnName("");
      setCatalog("");
      setSchema("");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const platform = useMemo(
    () => PLATFORMS.find((p) => p.id === platformId) ?? null,
    [platformId],
  );

  if (!open) return null;

  const title =
    view === "pick"
      ? "New connection"
      : view === "configure"
        ? `Connect to ${platform?.name ?? ""}`
        : "Successfully connected";

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center px-4"
      style={{ background: "rgba(15, 19, 28, 0.45)" }}
      onClick={() => onOpenChange(false)}
      role="dialog"
      aria-modal="true"
      aria-label={title}
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
            {title}
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

        {view === "pick" && (
          <PickView
            query={query}
            onQuery={setQuery}
            onPick={(id) => {
              setPlatformId(id);
              setView("configure");
            }}
          />
        )}

        {view === "configure" && platform && (
          <ConfigureView
            platform={platform}
            connName={connName}
            setConnName={setConnName}
            catalog={catalog}
            setCatalog={setCatalog}
            schema={schema}
            setSchema={setSchema}
            onCancel={() => onOpenChange(false)}
            onSave={() => setView("success")}
          />
        )}

        {view === "success" && platform && (
          <SuccessView
            platform={platform}
            connName={connName}
            catalog={catalog}
            schema={schema}
            onDone={() => {
              onSelect(platform.id);
              onOpenChange(false);
            }}
          />
        )}
      </div>
    </div>
  );
}

/* ---------- PICK ---------- */

function PickView({
  query,
  onQuery,
  onPick,
}: {
  query: string;
  onQuery: (v: string) => void;
  onPick: (id: string) => void;
}) {
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PLATFORMS;
    return PLATFORMS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q),
    );
  }, [query]);

  return (
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
            onChange={(e) => onQuery(e.target.value)}
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
          <div className="py-10 text-center text-[13px]" style={{ color: "var(--ink-500)" }}>
            No platforms match "{query}"
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {filtered.map((p) => (
              <PlatformCard key={p.id} platform={p} onSelect={onPick} />
            ))}
          </div>
        )}
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

/* ---------- CONFIGURE ---------- */

function ConfigureView({
  platform,
  connName,
  setConnName,
  catalog,
  setCatalog,
  schema,
  setSchema,
  onCancel,
  onSave,
}: {
  platform: Platform;
  connName: string;
  setConnName: (v: string) => void;
  catalog: string;
  setCatalog: (v: string) => void;
  schema: string;
  setSchema: (v: string) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const [showToken, setShowToken] = useState(false);
  const [tested, setTested] = useState(false);

  return (
    <>
      <div className="px-7 py-6">
        <div
          className="rounded-xl border p-6"
          style={{ borderColor: "var(--hairline)", background: "var(--surface-soft)" }}
        >
          <Field label="Connection Name" hint="Enter a unique name.">
            <Input
              placeholder="e.g. Research Documents"
              value={connName}
              onChange={(e) => setConnName(e.target.value)}
            />
          </Field>

          <div
            className="mt-6 mb-3 text-[11px] font-semibold uppercase tracking-wide"
            style={{ color: "var(--ink-500)" }}
          >
            Connection details
          </div>

          <div
            className="rounded-xl border bg-white p-5"
            style={{ borderColor: "var(--hairline)" }}
          >
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="Server hostname">
                <Input placeholder="e.g. dbc-1234.cloud.databricks.com" />
              </Field>
              <Field label="HTTP path">
                <Input placeholder="e.g. /sql/1.0/warehouses/abc123" />
              </Field>
            </div>

            <div className="mt-5">
              <Field
                label="Access token"
                hint="Personal access token from your Databricks user settings."
              >
                <div className="relative">
                  <Input
                    type={showToken ? "text" : "password"}
                    placeholder="Enter access token"
                    className="pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-md hover:bg-[color:var(--surface-soft)]"
                    style={{ color: "var(--ink-500)" }}
                    aria-label={showToken ? "Hide token" : "Show token"}
                  >
                    {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </Field>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="Catalog name">
                <Input
                  placeholder="Enter catalog name"
                  value={catalog}
                  onChange={(e) => setCatalog(e.target.value)}
                />
              </Field>
              <Field label="Schema name">
                <Input
                  placeholder="Enter schema name"
                  value={schema}
                  onChange={(e) => setSchema(e.target.value)}
                />
              </Field>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between gap-4">
            <p className="text-[12px]" style={{ color: "var(--ink-500)" }}>
              {tested ? (
                <span
                  className="inline-flex items-center gap-1.5 font-medium"
                  style={{ color: "#1f8a55" }}
                >
                  <Check size={14} /> Credentials verified — AgentFlow can reach{" "}
                  {platform.name}.
                </span>
              ) : (
                <>
                  Verify credentials before saving to confirm AgentFlow can reach{" "}
                  {platform.name}.
                </>
              )}
            </p>
            <button
              type="button"
              onClick={() => setTested(true)}
              className="h-9 shrink-0 rounded-full border px-4 text-[13px] font-medium transition-colors hover:bg-white"
              style={{ borderColor: "var(--hairline)", color: "var(--ink-900)" }}
            >
              Test connection
            </button>
          </div>
        </div>
      </div>

      <div
        className="flex items-center justify-end gap-3 border-t px-7 py-4"
        style={{ borderColor: "var(--hairline)" }}
      >
        <button
          type="button"
          onClick={onCancel}
          className="h-10 rounded-full px-5 text-[14px] font-medium transition-colors hover:bg-[color:var(--surface-soft)]"
          style={{ color: "var(--ink-700)" }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          className="h-10 rounded-full px-6 text-[14px] font-medium text-white transition-[filter]"
          style={{ background: "var(--brand-blue)" }}
          onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(0.95)")}
          onMouseLeave={(e) => (e.currentTarget.style.filter = "none")}
        >
          Save connection
        </button>
      </div>
    </>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div
        className="mb-1.5 text-[13px] font-semibold"
        style={{ color: "var(--ink-900)" }}
      >
        {label}
      </div>
      {children}
      {hint && (
        <div className="mt-1.5 text-[12px]" style={{ color: "var(--ink-500)" }}>
          {hint}
        </div>
      )}
    </div>
  );
}

function Input({
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`h-10 w-full rounded-lg border bg-white px-3 text-[14px] outline-none transition-shadow focus:shadow-[0_0_0_3px_rgba(67,134,250,0.15)] ${className}`}
      style={{ borderColor: "var(--hairline)", color: "var(--ink-900)" }}
    />
  );
}

/* ---------- SUCCESS ---------- */

function SuccessView({
  platform,
  onDone,
}: {
  platform: Platform;
  onDone: () => void;
}) {
  const { Icon } = platform;
  return (
    <>
      <div className="px-7 py-8">
        <div
          className="rounded-xl border p-8 text-center"
          style={{ borderColor: "var(--hairline)", background: "var(--surface-soft)" }}
        >
          <div className="flex justify-center">
            <span
              className="flex h-14 w-14 items-center justify-center rounded-full"
              style={{ background: "rgba(31, 138, 85, 0.12)", color: "#1f8a55" }}
            >
              <Check size={28} strokeWidth={2.5} />
            </span>
          </div>
          <div
            className="mt-5 text-[20px] font-semibold"
            style={{ color: "var(--ink-900)" }}
          >
            Connected to {platform.name}
          </div>
          <p
            className="mx-auto mt-2 max-w-md text-[13px]"
            style={{ color: "var(--ink-500)" }}
          >
            Your credentials were validated successfully. This connection is now available
            to agents and scheduled tasks.
          </p>

          <div
            className="mx-auto mt-6 flex max-w-md items-center justify-between gap-3 rounded-xl border bg-white p-3"
            style={{ borderColor: "var(--hairline)" }}
          >
            <div className="flex items-center gap-3">
              <span
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg [&>svg]:h-5 [&>svg]:w-5"
                style={{ background: "var(--surface-soft)" }}
              >
                <Icon />
              </span>
              <div className="text-left">
                <div
                  className="text-[14px] font-semibold"
                  style={{ color: "var(--ink-900)" }}
                >
                  {platform.name}
                </div>
                <div className="text-[12px]" style={{ color: "var(--ink-500)" }}>
                  Status: Active
                </div>
              </div>
            </div>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide"
              style={{ background: "rgba(31, 138, 85, 0.12)", color: "#1f8a55" }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: "#1f8a55" }}
              />
              Connected
            </span>
          </div>
        </div>
      </div>

      <div
        className="flex items-center justify-end border-t px-7 py-4"
        style={{ borderColor: "var(--hairline)" }}
      >
        <button
          type="button"
          onClick={onDone}
          className="h-10 rounded-full px-7 text-[14px] font-medium text-white transition-[filter]"
          style={{ background: "var(--brand-blue)" }}
          onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(0.95)")}
          onMouseLeave={(e) => (e.currentTarget.style.filter = "none")}
        >
          Done
        </button>
      </div>
    </>
  );
}
