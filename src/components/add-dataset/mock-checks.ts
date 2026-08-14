import type { DQDimension } from "@/components/dq-dimensions";
import type { Creator } from "@/components/dq-checks/mock-rules";

export type Dimension = DQDimension;

export type Check = {
  id: string;
  rule: string;
  description: string;
  dimension: Dimension;
  field: string;
  /** Who created or recommended this check. Defaults to Reltio for generated checks. */
  creator?: Creator;
};

const customersChecks: Omit<Check, "id">[] = [
  {
    rule: "customer_id is not null",
    description: "Primary key must never be null, nulls break joins and dedupe logic",
    dimension: "Completeness",
    field: "customer_id",
  },
  {
    rule: "customer_id is unique",
    description: "Detect duplicate customer IDs that cause fan out in downstream joins",
    dimension: "Uniqueness",
    field: "customer_id",
  },
  {
    rule: "Email is not null",
    description: "Email is required for account recovery and communications",
    dimension: "Completeness",
    field: "email",
  },
  {
    rule: "Email matches valid format",
    description: 'Validate email pattern, flag missing "@", invalid TLDs, and whitespaces',
    dimension: "Validity",
    field: "email",
  },
  {
    rule: "Last name is not null",
    description: "Last name is required for billing and compliance records",
    dimension: "Completeness",
    field: "last_name",
  },
  {
    rule: "First name is not null",
    description: "First name is required for personalized communications",
    dimension: "Completeness",
    field: "first_name",
  },
  {
    rule: "Email is unique",
    description: "Each account should map to a single email to prevent duplicate identities",
    dimension: "Uniqueness",
    field: "email",
  },
  {
    rule: "Phone matches E.164 format",
    description: "Phone numbers should follow international format with country code",
    dimension: "Validity",
    field: "phone",
  },
  {
    rule: "Country code is in ISO list",
    description: "Country must be a valid ISO 3166-1 alpha-2 code",
    dimension: "Validity",
    field: "country",
  },
  {
    rule: "Created_at is not null",
    description: "Account creation timestamp required for cohort analysis",
    dimension: "Completeness",
    field: "created_at",
  },
  {
    rule: "Created_at is in the past",
    description: "Future-dated created_at values indicate clock skew or backfill bugs",
    dimension: "Validity",
    field: "created_at",
  },
  {
    rule: "Updated_at >= created_at",
    description: "Updated timestamp must never precede creation timestamp",
    dimension: "Consistency",
    field: "updated_at",
  },
  {
    rule: "Segment in allowed values",
    description: "Segment should be one of: enterprise, mid-market, smb, consumer",
    dimension: "Validity",
    field: "segment",
  },
  {
    rule: "Row count within expected range",
    description: "Detect sudden drops or spikes in row count vs. recent history",
    dimension: "Consistency",
    field: "(table)",
  },
];

const ordersChecks: Omit<Check, "id">[] = [
  {
    rule: "order_id is not null",
    description: "Primary key must never be null on the order grain",
    dimension: "Completeness",
    field: "order_id",
  },
  {
    rule: "order_id is unique",
    description: "Duplicate order IDs cause double-counted revenue downstream",
    dimension: "Uniqueness",
    field: "order_id",
  },
  {
    rule: "customer_id is not null",
    description: "Every order must reference a valid customer for attribution",
    dimension: "Completeness",
    field: "customer_id",
  },
  {
    rule: "Order total is non-negative",
    description: "Negative totals usually indicate refund records mixed into the orders table",
    dimension: "Validity",
    field: "order_total",
  },
  {
    rule: "Status in allowed values",
    description: "Status must be one of: pending, paid, shipped, delivered, cancelled, refunded",
    dimension: "Validity",
    field: "status",
  },
  {
    rule: "Order date is not null",
    description: "Order date drives every time-series aggregation downstream",
    dimension: "Completeness",
    field: "order_date",
  },
  {
    rule: "Order total within historical range",
    description: "Detect anomalous order totals compared to recent averages",
    dimension: "Consistency",
    field: "order_total",
  },
];

function genericChecks(assetName: string): Omit<Check, "id">[] {
  return [
  {
    rule: "Primary key is not null",
    description: "Primary key must never be null, nulls break joins and dedupe logic",
    dimension: "Completeness",
    field: "id",
  },
  {
    rule: "Primary key is unique",
    description: "Duplicate keys cause fan out and double counting downstream",
    dimension: "Uniqueness",
    field: "id",
  },
  {
    rule: "Created_at is not null",
    description: "Creation timestamp is required for time-based partitioning",
    dimension: "Completeness",
    field: "created_at",
  },
  {
    rule: "Updated_at is not null",
    description: "Updated timestamp is required to detect stale records",
    dimension: "Completeness",
    field: "updated_at",
  },
  {
    rule: "Row count within expected range",
    description: "Detect sudden drops or spikes in row count vs. recent history",
    dimension: "Consistency",
    field: "(table)",
  },
  ];
}

export function generateChecks(assetName: string): Check[] {
  const lower = assetName.toLowerCase();
  let base: Omit<Check, "id">[];
  if (lower.includes("customer") || lower.includes("user")) {
    base = customersChecks;
  } else if (lower.includes("order") || lower.includes("revenue") || lower.includes("payment")) {
    base = ordersChecks;
  } else {
    base = genericChecks(assetName);
  }
  return base.map((c, i) => ({ ...c, id: `${assetName}-${i}` }));
}
