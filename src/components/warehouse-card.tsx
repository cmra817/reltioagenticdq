import { BigQueryIcon, DatabricksIcon, RedshiftIcon, SnowflakeIcon } from "./brand-icons";

type Warehouse = "Databricks" | "Snowflake" | "BigQuery" | "Redshift";

const iconMap: Record<Warehouse, React.ReactNode> = {
  Databricks: <DatabricksIcon />,
  Snowflake: <SnowflakeIcon />,
  BigQuery: <BigQueryIcon />,
  Redshift: <RedshiftIcon />,
};

export function WarehouseCard({ name }: { name: Warehouse }) {
  return (
    <button
      type="button"
      className="group flex aspect-square w-full min-w-0 flex-col items-center justify-center gap-2 rounded-2xl border bg-white transition-all hover:-translate-y-0.5 sm:h-[112px] sm:w-[112px] sm:aspect-auto"
      style={{
        borderColor: "var(--hairline)",
        boxShadow: "0 1px 2px rgba(14,14,37,0.04)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "var(--shadow-card)";
        e.currentTarget.style.borderColor = "rgba(67,134,250,0.35)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 1px 2px rgba(14,14,37,0.04)";
        e.currentTarget.style.borderColor = "var(--hairline)";
      }}
    >
      <div className="flex h-9 w-9 items-center justify-center">{iconMap[name]}</div>
      <span className="text-[13px] font-semibold" style={{ color: "var(--ink-900)" }}>
        {name}
      </span>
    </button>
  );
}

export function WarehouseRow() {
  const items: Warehouse[] = ["Databricks", "Snowflake", "BigQuery", "Redshift"];
  return (
    <div
      className="inline-block rounded-2xl p-3"
      style={{ background: "var(--surface-soft)" }}
    >
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {items.map((w) => (
          <WarehouseCard key={w} name={w} />
        ))}
      </div>
    </div>
  );
}
