export type ConnectedColumn = {
  id: string;
  source: string;
  table: string;
  column: string;
  samples: string[];
};

const emailish = (domain: string, names: string[]) => names.map((n) => `${n}@${domain}`);

export const CONNECTED_COLUMNS: ConnectedColumn[] = [
  {
    id: "snowflake.customers.email",
    source: "snowflake",
    table: "customers",
    column: "email",
    samples: [
      ...emailish("reltio.com", ["molly.gordon", "j.park", "a.rivera"]),
      "not-an-email",
      "missing@tld",
      "s.chen@example.co",
    ],
  },
  {
    id: "snowflake.customers.phone",
    source: "snowflake",
    table: "customers",
    column: "phone",
    samples: ["+1-415-555-0132", "4155550199", "(415) 555-0110", "phone n/a", "+44 20 7946 0958"],
  },
  {
    id: "databricks.leads.contact_email",
    source: "databricks",
    table: "leads",
    column: "contact_email",
    samples: [
      "lead1@acme.io",
      "lead2@acme.io",
      "bad email@acme",
      "hello@sub.domain.org",
      "",
      "team@corp.io",
    ],
  },
  {
    id: "databricks.leads.company_domain",
    source: "databricks",
    table: "leads",
    column: "company_domain",
    samples: ["acme.io", "corp.io", "http://bad", "sub.domain.org", "example.co"],
  },
  {
    id: "salesforce.accounts.billing_email",
    source: "salesforce",
    table: "accounts",
    column: "billing_email",
    samples: [
      "ap@acme.io",
      "billing@corp.io",
      "billing at example",
      "finance@example.co",
      "invoices@reltio.com",
    ],
  },
  {
    id: "salesforce.accounts.billing_postal_code",
    source: "salesforce",
    table: "accounts",
    column: "billing_postal_code",
    samples: ["94107", "10001-2345", "ABC123", "60614", "9410"],
  },
  {
    id: "salesforce.contacts.mobile_phone",
    source: "salesforce",
    table: "contacts",
    column: "mobile_phone",
    samples: ["+1-206-555-0111", "2065550122", "unknown", "+1-206-555-0133", "206.555.0144"],
  },
  {
    id: "snowflake.orders.order_id",
    source: "snowflake",
    table: "orders",
    column: "order_id",
    samples: ["ORD-000129", "ORD-000130", "000131", "ORD-000132", "ord-000133"],
  },
];

export const HAS_CONNECTED_SOURCES = CONNECTED_COLUMNS.length > 0;

export function searchColumns(query: string, limit = 6): ConnectedColumn[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const scored = CONNECTED_COLUMNS.map((c) => {
    const col = c.column.toLowerCase();
    let score = -1;
    if (col === q) score = 0;
    else if (col.startsWith(q)) score = 1;
    else if (col.includes(q)) score = 2;
    else if (`${c.source} ${c.table}`.toLowerCase().includes(q)) score = 3;
    return { c, score };
  })
    .filter((s) => s.score >= 0)
    .sort((a, b) => a.score - b.score);
  return scored.slice(0, limit).map((s) => s.c);
}
