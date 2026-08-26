import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/** Chart card rendered inside a chat bubble — bordered and contained so it reads
 * as generated in response to a question, not pulled from the dashboard. */
export function ChatChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="mt-3 w-full max-w-[520px] rounded-xl border bg-white p-3"
      style={{ borderColor: "var(--hairline)" }}
    >
      <div className="text-[12px] font-semibold" style={{ color: "var(--ink-900)" }}>
        {title}
      </div>
      {subtitle && (
        <div className="mt-0.5 text-[11px]" style={{ color: "var(--ink-500)" }}>
          {subtitle}
        </div>
      )}
      <div className="mt-2">{children}</div>
    </div>
  );
}

const FAILURES_BY_TABLE = [
  { table: "dim_customer", value: 62 },
  { table: "dim_account", value: 21 },
  { table: "fct_orders_daily", value: 11 },
  { table: "Other", value: 6 },
];

export function ConsistencyFailuresByTableChart() {
  return (
    <ResponsiveContainer width="100%" height={150}>
      <BarChart
        data={FAILURES_BY_TABLE}
        layout="vertical"
        margin={{ top: 4, right: 28, bottom: 4, left: 4 }}
        barCategoryGap={8}
      >
        <XAxis type="number" hide domain={[0, 70]} />
        <YAxis
          type="category"
          dataKey="table"
          width={112}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11, fill: "var(--ink-500)" }}
        />
        <Tooltip
          formatter={(v: number) => [`${v}% of failures`, ""]}
          contentStyle={{
            fontSize: 12,
            borderRadius: 8,
            borderColor: "var(--hairline)",
          }}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} label={{ position: "right", fontSize: 11, fill: "var(--ink-500)", formatter: (v: number) => `${v}%` }}>
          {FAILURES_BY_TABLE.map((d) => (
            <Cell key={d.table} fill={d.table === "dim_customer" ? "var(--brand-red)" : "var(--brand-blue-bright)"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** 30 days of daily pass rate: flat ~95% until Aug 14, then down to ~60%. */
const PASS_RATE_TREND = Array.from({ length: 30 }, (_, i) => {
  const day = i + 1;
  const label = `Aug ${day}`;
  const jitter = ((i * 37) % 7) / 10;
  if (day < 14) return { label, day, rate: Number((94.6 + jitter).toFixed(1)) };
  if (day === 14) return { label, day, rate: 78.4 };
  return { label, day, rate: Number((59.5 + jitter).toFixed(1)) };
});

export function DimCustomerFailureTrendChart() {
  return (
    <ResponsiveContainer width="100%" height={170}>
      <LineChart data={PASS_RATE_TREND} margin={{ top: 16, right: 12, bottom: 4, left: -12 }}>
        <CartesianGrid stroke="var(--hairline)" vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          interval={6}
          tick={{ fontSize: 10, fill: "var(--ink-500)" }}
        />
        <YAxis
          domain={[40, 100]}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 10, fill: "var(--ink-500)" }}
          tickFormatter={(v: number) => `${v}%`}
        />
        <Tooltip
          formatter={(v: number) => [`${v}% pass rate`, ""]}
          contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: "var(--hairline)" }}
        />
        <ReferenceLine
          x="Aug 14"
          stroke="var(--brand-red)"
          strokeDasharray="3 3"
          label={{ value: "Schema sync", position: "top", fontSize: 10, fill: "var(--brand-red)" }}
        />
        <Line
          type="monotone"
          dataKey="rate"
          stroke="var(--brand-blue)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
