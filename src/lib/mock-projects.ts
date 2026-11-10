/**
 * Prototype data for Projects: remediation efforts, one domain each.
 * Tables named here are illustrative.
 */

export type ProjectStatus = "Suggested" | "In progress" | "Validating" | "Done";
export const PROJECT_STATUSES: ProjectStatus[] = ["Suggested", "In progress", "Validating", "Done"];

export type Criterion = { text: string; current: string; target: string; met: boolean };
export type ProjectComment = { who: string; when: string; text: string };

export type Project = {
  id: string;
  /** A project belongs to exactly one domain. */
  domain: string;
  title: string;
  status: ProjectStatus;
  owner: string;
  daysOpen: number;
  suggestedByAgent: boolean;
  goal: string;
  tables: string[];
  criteria: Criterion[];
  comments: ProjectComment[];
};

export const BASE_PROJECTS: Project[] = [
  {
    id: "fin-ledger",
    domain: "Finance",
    title: "Ledger balance failures",
    status: "Suggested",
    owner: "Unassigned",
    daysOpen: 0,
    suggestedByAgent: true,
    goal: "The general ledger reconciles to source every night, so month-end close stops waiting on manual fixes.",
    tables: ["gl_entries", "invoices"],
    criteria: [
      { text: "Nights the ledger reconciles", current: "4 of 7", target: "7 of 7", met: false },
      { text: "Reconciliation rule on every Finance schedule", current: "1 of 2", target: "All", met: false },
    ],
    comments: [
      {
        who: "Agent",
        when: "Today 6:00am",
        text: "The ledger failed to reconcile on 3 of the last 7 nights. This looks lasting, so I suggest a project.",
      },
    ],
  },
  {
    id: "fin-negative",
    domain: "Finance",
    title: "Negative invoice amounts",
    status: "In progress",
    owner: "Maya R.",
    daysOpen: 6,
    suggestedByAgent: false,
    goal: "No invoice carries a negative amount unless it is a marked credit note.",
    tables: ["invoices", "ap_payments"],
    criteria: [
      { text: "Invoices with a negative amount", current: "0.4%", target: "0%", met: false },
      { text: "Credit notes are flagged", current: "Yes", target: "Yes", met: true },
    ],
    comments: [{ who: "Maya R.", when: "Nov 3", text: "Added the amounts rule to the nightly Finance schedule." }],
  },
  {
    id: "sc-stale",
    domain: "Supply Chain",
    title: "Stale supplier and inventory feeds",
    status: "Suggested",
    owner: "Unassigned",
    daysOpen: 0,
    suggestedByAgent: true,
    goal: "Supplier, purchase order and inventory feeds land daily again.",
    tables: ["suppliers", "purchase_orders", "inventory"],
    criteria: [
      { text: "Feeds updated daily", current: "0 of 3 days", target: "3 days in a row", met: false },
      { text: "Late-feed alert in place", current: "No", target: "Yes", met: false },
    ],
    comments: [
      {
        who: "Agent",
        when: "Today 6:00am",
        text: "inventory and purchase_orders have been stale for 3 days, and the supplier sweep only runs every 2 days, so it finds out too late.",
      },
    ],
  },
  {
    id: "sc-suppliers",
    domain: "Supply Chain",
    title: "Duplicate suppliers",
    status: "In progress",
    owner: "Lena K.",
    daysOpen: 9,
    suggestedByAgent: false,
    goal: "Each supplier appears once, so spend reports add up.",
    tables: ["suppliers"],
    criteria: [
      { text: "Duplicate rate", current: "2.1%", target: "1% or less", met: false },
      { text: "Duplicate rule on the supplier sweep", current: "Yes", target: "Yes", met: true },
    ],
    comments: [{ who: "Lena K.", when: "Yesterday", text: "Merging the 140 clearest duplicates this week." }],
  },
  {
    id: "sales-email",
    domain: "Sales",
    title: "Customer email validity",
    status: "Validating",
    owner: "Priya N.",
    daysOpen: 12,
    suggestedByAgent: false,
    goal: "Email validity on customers reaches 95% without adding duplicates.",
    tables: ["customers", "contacts"],
    criteria: [
      { text: "Email valid", current: "94.2%", target: "95% or more", met: false },
      { text: "Duplicate rate", current: "0.8%", target: "1% or less", met: true },
      { text: "Email rule on every intake schedule", current: "All", target: "All", met: true },
    ],
    comments: [{ who: "Agent", when: "Today 6:00am", text: "Email validity rose to 94.2%, up 1 point since Monday." }],
  },
  {
    id: "mkt-leads",
    domain: "Marketing",
    title: "Leads missing a source",
    status: "Validating",
    owner: "Ravi S.",
    daysOpen: 8,
    suggestedByAgent: false,
    goal: "Every lead has a source before campaigns report on it.",
    tables: ["leads", "web_events"],
    criteria: [
      { text: "Leads with a source", current: "98.8%", target: "99.5% or more", met: false },
      { text: "No campaign reports on unsourced leads", current: "Yes", target: "Yes", met: true },
    ],
    comments: [{ who: "Ravi S.", when: "Nov 4", text: "Backfill is running. 98.8% now." }],
  },
  {
    id: "cs-tickets",
    domain: "Customer Success",
    title: "Ticket categories missing",
    status: "Done",
    owner: "Dan K.",
    daysOpen: 14,
    suggestedByAgent: false,
    goal: "Every ticket has a category.",
    tables: ["tickets"],
    criteria: [
      { text: "Tickets with a category", current: "100%", target: "100%", met: true },
      { text: "Category rule in place", current: "Yes", target: "Yes", met: true },
    ],
    comments: [{ who: "Dan K.", when: "Oct 28", text: "Closed after seven clean days." }],
  },
];
