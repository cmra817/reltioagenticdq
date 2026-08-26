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
  /** GX expectation function name, e.g. expect_column_values_to_not_be_null. */
  expectation?: string;
  /** Pattern / expression the expectation evaluates. */
  pattern?: string;
  /** Authored failure threshold, in percent. */
  threshold?: number;
};

export type CheckLogic = { expectation: string; pattern: string; threshold: number };

/**
 * Resolves the expectation / pattern / threshold for a check. Explicit values on the
 * check win; otherwise they're inferred from the rule name and dimension so every
 * check — including Reltio-managed ones — can render a full detail panel.
 */
export function checkLogic(check: Check): CheckLogic {
  if (check.expectation && check.pattern) {
    return {
      expectation: check.expectation,
      pattern: check.pattern,
      threshold: check.threshold ?? 0,
    };
  }
  const name = check.rule.toLowerCase();
  let expectation = "expect_column_values_to_match_regex";
  let pattern = check.pattern ?? "not_null";
  let threshold = check.threshold ?? 0;

  if (name.includes("not null") || name.includes("is required")) {
    expectation = "expect_column_values_to_not_be_null";
    pattern = "not_null";
    threshold = check.threshold ?? 0;
  } else if (name.includes("unique")) {
    expectation = "expect_column_values_to_be_unique";
    pattern = "unique";
    threshold = check.threshold ?? 0;
  } else if (name.includes("allowed values") || name.includes("iso list") || name.includes("in set")) {
    expectation = "expect_column_values_to_be_in_set";
    pattern = `in_set(${check.field})`;
    threshold = check.threshold ?? 1;
  } else if (name.includes("range") || name.includes("non-negative") || name.includes("between")) {
    expectation = "expect_column_values_to_be_between";
    pattern = name.includes("non-negative") ? "min=0" : "min=p05, max=p95";
    threshold = check.threshold ?? 2;
  } else if (name.includes("format") || name.includes("matches")) {
    expectation = "expect_column_values_to_match_regex";
    pattern = check.pattern ?? `regex(${check.field})`;
    threshold = check.threshold ?? 5;
  } else if (name.includes(">=") || name.includes("in the past")) {
    expectation = "expect_column_pair_values_a_to_be_greater_than_b";
    pattern = check.pattern ?? name;
    threshold = check.threshold ?? 0;
  } else {
    expectation = check.expectation ?? "expect_column_values_to_not_be_null";
    pattern = check.pattern ?? "not_null";
  }

  return { expectation, pattern, threshold };
}


const RELTIO: Creator = { kind: "reltio" };

const customersChecks: Omit<Check, "id">[] = [
  {
    rule: "customer_id is not null",
    description: "Primary key must never be null, nulls break joins and dedupe logic",
    dimension: "Completeness",
    field: "customer_id",
    creator: RELTIO,
  },
  {
    rule: "customer_id is unique",
    description: "Detect duplicate customer IDs that cause fan out in downstream joins",
    dimension: "Uniqueness",
    field: "customer_id",
    creator: RELTIO,
  },
  {
    rule: "Email is not null",
    description: "Email is required for account recovery and communications",
    dimension: "Completeness",
    field: "email",
    creator: RELTIO,
  },
  {
    rule: "Email matches valid format",
    description: 'Validate email pattern, flag missing "@", invalid TLDs, and whitespaces',
    dimension: "Validity",
    field: "email",
    creator: RELTIO,
  },
  {
    rule: "Last name is not null",
    description: "Last name is required for billing and compliance records",
    dimension: "Completeness",
    field: "last_name",
    creator: RELTIO,
  },
  {
    rule: "First name is not null",
    description: "First name is required for personalized communications",
    dimension: "Completeness",
    field: "first_name",
    creator: RELTIO,
  },
  {
    rule: "Email is unique",
    description: "Each account should map to a single email to prevent duplicate identities",
    dimension: "Uniqueness",
    field: "email",
    creator: RELTIO,
  },
  {
    rule: "Phone matches E.164 format",
    description: "Phone numbers should follow international format with country code",
    dimension: "Validity",
    field: "phone",
    creator: RELTIO,
  },
  {
    rule: "Country code is in ISO list",
    description: "Country must be a valid ISO 3166-1 alpha-2 code",
    dimension: "Validity",
    field: "country",
    creator: RELTIO,
  },
  {
    rule: "Created_at is not null",
    description: "Account creation timestamp required for cohort analysis",
    dimension: "Completeness",
    field: "created_at",
    creator: RELTIO,
  },
  {
    rule: "Created_at is in the past",
    description: "Future-dated created_at values indicate clock skew or backfill bugs",
    dimension: "Validity",
    field: "created_at",
    creator: RELTIO,
  },
  {
    rule: "Updated_at >= created_at",
    description: "Updated timestamp must never precede creation timestamp",
    dimension: "Consistency",
    field: "updated_at",
    creator: RELTIO,
  },
  {
    rule: "Segment in allowed values",
    description: "Segment should be one of: enterprise, mid-market, smb, consumer",
    dimension: "Validity",
    field: "segment",
    creator: RELTIO,
  },
  {
    rule: "Row count within expected range",
    description: "Detect sudden drops or spikes in row count vs. recent history",
    dimension: "Consistency",
    field: "(table)",
    creator: RELTIO,
  },
];

const ordersChecks: Omit<Check, "id">[] = [
  {
    rule: "order_id is not null",
    description: "Primary key must never be null on the order grain",
    dimension: "Completeness",
    field: "order_id",
    creator: RELTIO,
  },
  {
    rule: "order_id is unique",
    description: "Duplicate order IDs cause double-counted revenue downstream",
    dimension: "Uniqueness",
    field: "order_id",
    creator: RELTIO,
  },
  {
    rule: "customer_id is not null",
    description: "Every order must reference a valid customer for attribution",
    dimension: "Completeness",
    field: "customer_id",
    creator: RELTIO,
  },
  {
    rule: "Order total is non-negative",
    description: "Negative totals usually indicate refund records mixed into the orders table",
    dimension: "Validity",
    field: "order_total",
    creator: RELTIO,
  },
  {
    rule: "Status in allowed values",
    description: "Status must be one of: pending, paid, shipped, delivered, cancelled, refunded",
    dimension: "Validity",
    field: "status",
    creator: RELTIO,
  },
  {
    rule: "Order date is not null",
    description: "Order date drives every time-series aggregation downstream",
    dimension: "Completeness",
    field: "order_date",
    creator: RELTIO,
  },
  {
    rule: "Order total within historical range",
    description: "Detect anomalous order totals compared to recent averages",
    dimension: "Consistency",
    field: "order_total",
    creator: RELTIO,
  },
];

function genericChecks(assetName: string): Omit<Check, "id">[] {
  return [
    {
      rule: "Primary key is not null",
      description: "Primary key must never be null, nulls break joins and dedupe logic",
      dimension: "Completeness",
      field: "id",
      creator: RELTIO,
    },
    {
      rule: "Primary key is unique",
      description: "Duplicate keys cause fan out and double counting downstream",
      dimension: "Uniqueness",
      field: "id",
      creator: RELTIO,
    },
    {
      rule: "Created_at is not null",
      description: "Creation timestamp is required for time-based partitioning",
      dimension: "Completeness",
      field: "created_at",
      creator: RELTIO,
    },
    {
      rule: "Updated_at is not null",
      description: "Updated timestamp is required to detect stale records",
      dimension: "Completeness",
      field: "updated_at",
      creator: RELTIO,
    },
    {
      rule: "Row count within expected range",
      description: "Detect sudden drops or spikes in row count vs. recent history",
      dimension: "Consistency",
      field: "(table)",
      creator: RELTIO,
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
