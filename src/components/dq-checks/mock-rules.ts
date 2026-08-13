export const DIMENSIONS = [
  "Validity",
  "Completeness",
  "Accuracy",
  "Consistency",
  "Uniqueness",
  "Referential integrity",
  "Format and range",
] as const;

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

const SUGGESTION_MAP: { keywords: string[]; dimension: Dimension; expectation: string; pattern: string }[] = [
  {
    keywords: ["email"],
    dimension: "Validity",
    expectation: "expect_column_values_to_match_regex",
    pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
  },
  {
    keywords: ["phone"],
    dimension: "Validity",
    expectation: "expect_column_values_to_match_regex",
    pattern: "^\\+?1?[-. ]?\\(?\\d{3}\\)?[-. ]?\\d{3}[-. ]?\\d{4}$",
  },
  {
    keywords: ["null", "missing", "required", "complete"],
    dimension: "Completeness",
    expectation: "expect_column_values_to_not_be_null",
    pattern: "not_null",
  },
  {
    keywords: ["unique", "duplicate", "dedupe"],
    dimension: "Uniqueness",
    expectation: "expect_column_values_to_be_unique",
    pattern: "unique",
  },
  {
    keywords: ["between", "range", "min", "max", "greater", "less"],
    dimension: "Format and range",
    expectation: "expect_column_values_to_be_between",
    pattern: "min=0, max=100",
  },
  {
    keywords: ["exists", "reference", "foreign", "lookup"],
    dimension: "Referential integrity",
    expectation: "expect_column_values_to_be_in_set",
    pattern: "in_set(reference_table.key)",
  },
];

export function suggestFromDescription(text: string) {
  const lower = text.toLowerCase();
  const hit = SUGGESTION_MAP.find((s) => s.keywords.some((k) => lower.includes(k)));
  return (
    hit ?? {
      dimension: "Validity" as Dimension,
      expectation: "expect_column_values_to_match_regex",
      pattern: "^.+$",
    }
  );
}
