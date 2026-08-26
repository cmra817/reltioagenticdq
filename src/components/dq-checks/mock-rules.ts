import { DQ_DIMENSIONS } from "@/components/dq-dimensions";

export const DIMENSIONS = DQ_DIMENSIONS;

export type Dimension = (typeof DIMENSIONS)[number];

export type Creator = { kind: "reltio" } | { kind: "me" } | { kind: "team"; name: string };

export type Rule = {
  id: string;
  name: string;
  dimension: Dimension;
  description: string;
  creator: Creator;
  columns: number;
  passRate: number;
  expectation: string;
  pattern: string;
  threshold: number;
};

export function creatorLabel(c: Creator) {
  if (c.kind === "reltio") return "Reltio";
  if (c.kind === "me") return "You";
  return c.name;
}

export const MOCK_RULES: Rule[] = [
  {
    id: "r1",
    name: "Email Format Validation",
    dimension: "Validity",
    description: "Validates email addresses using a standard regex pattern.",
    creator: { kind: "reltio" },
    columns: 12,
    passRate: 94,
    expectation: "expect_column_values_to_match_regex",
    pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
    threshold: 5,
  },
  {
    id: "r2",
    name: "Email Completeness Check",
    dimension: "Completeness",
    description: "Ensures email fields have less than 10% null values.",
    creator: { kind: "reltio" },
    columns: 12,
    passRate: 97,
    expectation: "expect_column_values_to_not_be_null",
    pattern: "not_null",
    threshold: 10,
  },
  {
    id: "r3",
    name: "Email Uniqueness Check",
    dimension: "Uniqueness",
    description: "Validates that email addresses are unique within scope.",
    creator: { kind: "me" },
    columns: 8,
    passRate: 91,
    expectation: "expect_column_values_to_be_unique",
    pattern: "unique",
    threshold: 1,
  },
  {
    id: "r4",
    name: "Phone Number Format (US)",
    dimension: "Validity",
    description: "Validates US phone numbers including extensions.",
    creator: { kind: "me" },
    columns: 6,
    passRate: 88,
    expectation: "expect_column_values_to_match_regex",
    pattern: "^\\+?1?[-. ]?\\(?\\d{3}\\)?[-. ]?\\d{3}[-. ]?\\d{4}(\\s?x\\d+)?$",
    threshold: 5,
  },
  {
    id: "r5",
    name: "SSN Format Validation",
    dimension: "Format and range",
    description: "Validates SSNs in ###-##-#### format.",
    creator: { kind: "team", name: "M. Gordon" },
    columns: 4,
    passRate: 99,
    expectation: "expect_column_values_to_match_regex",
    pattern: "^\\d{3}-\\d{2}-\\d{4}$",
    threshold: 1,
  },
  {
    id: "r6",
    name: "Credit Score Range",
    dimension: "Accuracy",
    description: "Validates credit scores are within 300 to 850.",
    creator: { kind: "reltio" },
    columns: 3,
    passRate: 96,
    expectation: "expect_column_values_to_be_between",
    pattern: "min=300, max=850",
    threshold: 2,
  },
  {
    id: "r7",
    name: "Customer ID Referential Check",
    dimension: "Referential integrity",
    description: "Every order customer_id must exist in the customers dimension.",
    creator: { kind: "team", name: "A. Rivera" },
    columns: 5,
    passRate: 92,
    expectation: "expect_column_values_to_be_in_set",
    pattern: "in_set(customers.customer_id)",
    threshold: 0,
  },
  {
    id: "r8",
    name: "Updated After Created",
    dimension: "Consistency",
    description: "updated_at must never precede created_at on the same record.",
    creator: { kind: "me" },
    columns: 14,
    passRate: 99,
    expectation: "expect_column_pair_values_a_to_be_greater_than_b",
    pattern: "updated_at >= created_at",
    threshold: 1,
  },
  {
    id: "r9",
    name: "Country Code ISO List",
    dimension: "Validity",
    description: "Country must be a valid ISO 3166-1 alpha-2 code.",
    creator: { kind: "reltio" },
    columns: 7,
    passRate: 93,
    expectation: "expect_column_values_to_be_in_set",
    pattern: "in_set(ISO_3166_1_ALPHA_2)",
    threshold: 2,
  },
  {
    id: "r10",
    name: "Order Total Non-Negative",
    dimension: "Format and range",
    description: "Order totals must be zero or greater to avoid revenue skew.",
    creator: { kind: "team", name: "J. Park" },
    columns: 2,
    passRate: 100,
    expectation: "expect_column_values_to_be_between",
    pattern: "min=0",
    threshold: 0,
  },
];

export type Suggestion = {
  dimension: Dimension;
  expectation: string;
  pattern: string;
  threshold: number;
  name: string;
  column?: string;
};

const KNOWN_COLUMNS = [
  "phone_number",
  "phone",
  "email",
  "email_address",
  "ssn",
  "customer_id",
  "order_id",
  "user_id",
  "created_at",
  "updated_at",
  "country",
  "country_code",
  "zip",
  "postal_code",
  "credit_score",
  "order_total",
  "amount",
  "state",
  "city",
  "first_name",
  "last_name",
];

/** Best-effort column extraction from a natural-language rule description. */
function extractColumn(text: string): string | undefined {
  const lower = text.toLowerCase();

  // Explicit: `column_name column`, "column X", quoted or backticked names.
  const quoted = text.match(/[`"']([A-Za-z_][A-Za-z0-9_]*)[`"']/);
  if (quoted) return quoted[1].toLowerCase();

  const labeled = lower.match(/(?:column|field|attribute)\s+([a-z_][a-z0-9_]*)/);
  if (labeled) return labeled[1];

  const trailing = lower.match(/([a-z_][a-z0-9_]*)\s+(?:column|field|attribute)/);
  if (trailing) return trailing[1];

  // Snake_case token anywhere is almost certainly a column.
  const snake = lower.match(/\b([a-z]+(?:_[a-z0-9]+)+)\b/);
  if (snake) return snake[1];

  // Known column words, including two-word forms ("phone number").
  const normalized = lower.replace(/[^a-z0-9]+/g, "_");
  const hit = KNOWN_COLUMNS.find((c) => normalized.includes(c));
  return hit;
}

function titleize(column?: string) {
  if (!column) return "";
  return column
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Intent-first suggestion: the *constraint* (not null, unique, range…) wins over
 * the column's data type, so "make sure phone_number is not null" becomes a
 * completeness rule instead of a phone regex.
 */
export function suggestFromDescription(text: string): Suggestion {
  const lower = ` ${text.toLowerCase()} `;
  const column = extractColumn(text);
  const label = titleize(column);
  const subject = label || "Column";
  const has = (...words: string[]) => words.some((w) => lower.includes(w));

  // 1) Completeness — highest priority intent.
  if (
    has("not null", "non-null", "not be null", "isn't null", "is not empty", "no nulls", "never null", "required", "must be present", "must have", "missing", "complete")
  ) {
    return {
      dimension: "Completeness",
      expectation: "expect_column_values_to_not_be_null",
      pattern: "not_null",
      threshold: 0,
      name: `${subject} Completeness Check`,
      column,
    };
  }

  // 2) Uniqueness.
  if (has("unique", "no duplicate", "duplicates", "dedupe", "distinct", "primary key")) {
    return {
      dimension: "Uniqueness",
      expectation: "expect_column_values_to_be_unique",
      pattern: "unique",
      threshold: 0,
      name: `${subject} Uniqueness Check`,
      column,
    };
  }

  // 3) Referential integrity.
  if (has("must exist", "exists in", "reference", "referential", "foreign key", "lookup", "in the set", "one of")) {
    return {
      dimension: "Referential integrity",
      expectation: "expect_column_values_to_be_in_set",
      pattern: `in_set(reference_table.${column ?? "key"})`,
      threshold: 0,
      name: `${subject} Referential Check`,
      column,
    };
  }

  // 4) Range / numeric bounds — pull explicit numbers when present.
  if (has("between", "range", "greater", "less", "at least", "at most", "minimum", "maximum", " min ", " max ", "non-negative", "not negative", "positive")) {
    const nums = (text.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
    const pattern =
      nums.length >= 2
        ? `min=${Math.min(...nums)}, max=${Math.max(...nums)}`
        : nums.length === 1
        ? has("less", "at most", "maximum", " max ")
          ? `max=${nums[0]}`
          : `min=${nums[0]}`
        : "min=0";
    return {
      dimension: "Format and range",
      expectation: "expect_column_values_to_be_between",
      pattern,
      threshold: 1,
      name: `${subject} Range Check`,
      column,
    };
  }

  // 5) Consistency between two columns.
  if (has("after", "before", "greater than created", "consistent", "match the", "same as")) {
    return {
      dimension: "Consistency",
      expectation: "expect_column_pair_values_a_to_be_greater_than_b",
      pattern: "updated_at >= created_at",
      threshold: 1,
      name: `${subject} Consistency Check`,
      column,
    };
  }

  // 6) Format/validity — pick the pattern from the column's data type.
  const formats: { keywords: string[]; pattern: string; dimension: Dimension; label: string }[] = [
    {
      keywords: ["email"],
      pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
      dimension: "Validity",
      label: "Email Format",
    },
    {
      keywords: ["phone"],
      pattern: "^\\+?1?[-. ]?\\(?\\d{3}\\)?[-. ]?\\d{3}[-. ]?\\d{4}$",
      dimension: "Validity",
      label: "Phone Format",
    },
    {
      keywords: ["ssn", "social security"],
      pattern: "^\\d{3}-\\d{2}-\\d{4}$",
      dimension: "Format and range",
      label: "SSN Format",
    },
    {
      keywords: ["zip", "postal"],
      pattern: "^\\d{5}(-\\d{4})?$",
      dimension: "Format and range",
      label: "Postal Code Format",
    },
    {
      keywords: ["url", "website", "link"],
      pattern: "^https?://[^\\s]+$",
      dimension: "Validity",
      label: "URL Format",
    },
    {
      keywords: ["uuid", "guid"],
      pattern: "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$",
      dimension: "Validity",
      label: "UUID Format",
    },
    {
      keywords: ["date", "timestamp"],
      pattern: "^\\d{4}-\\d{2}-\\d{2}$",
      dimension: "Format and range",
      label: "Date Format",
    },
    {
      keywords: ["country"],
      pattern: "in_set(ISO_3166_1_ALPHA_2)",
      dimension: "Validity",
      label: "Country Code",
    },
  ];

  const fmt = formats.find((f) => f.keywords.some((k) => lower.includes(k)));
  if (fmt) {
    return {
      dimension: fmt.dimension,
      expectation:
        fmt.pattern.startsWith("in_set")
          ? "expect_column_values_to_be_in_set"
          : "expect_column_values_to_match_regex",
      pattern: fmt.pattern,
      threshold: 5,
      name: `${fmt.label} Validation`,
      column,
    };
  }

  return {
    dimension: "Validity",
    expectation: "expect_column_values_to_match_regex",
    pattern: "^.+$",
    threshold: 5,
    name: subject === "Column" ? "Custom Validity Rule" : `${subject} Validity Check`,
    column,
  };
}

