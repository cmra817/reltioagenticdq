/**
 * Prototype numbers for the "good records" view: Marketing domain, Contact
 * entity. A record is good when every attribute passes every check that applies
 * to it. Stands in for the real record-level metric layer.
 */

export const RQ = {
  domain: "Marketing",
  entity: "Contact",
  total: 482_300,
  goodPct: 78.4,
  /** Share of records that must be good before the steward is comfortable. */
  targetPct: 90,
  lastWeekGoodPct: 80.1,
  updated: "Today, 6:00am",
};

export const RQ_GOOD = Math.round((RQ.total * RQ.goodPct) / 100);
export const RQ_BAD = RQ.total - RQ_GOOD;

export type CheckKind = "Complete" | "Valid" | "Distinct";
export const CHECK_KINDS: CheckKind[] = ["Complete", "Valid", "Distinct"];

/** Pass rate (%) per attribute and check. Missing means the check doesn't apply. */
export const ATTRIBUTE_GRID: { attribute: string; rates: Partial<Record<CheckKind, number>> }[] = [
  { attribute: "First name", rates: { Complete: 99.1, Valid: 98.8 } },
  { attribute: "Last name", rates: { Complete: 98.9, Valid: 98.5 } },
  { attribute: "Email", rates: { Complete: 96.4, Valid: 91.2, Distinct: 94.8 } },
  { attribute: "Phone", rates: { Complete: 88.7, Valid: 93.5, Distinct: 97.9 } },
  { attribute: "Address", rates: { Complete: 90.2, Valid: 92.6 } },
  { attribute: "Role", rates: { Complete: 84.5, Valid: 97.0 } },
  { attribute: "Company", rates: { Complete: 95.8, Valid: 96.4 } },
  { attribute: "Title", rates: { Complete: 86.3, Valid: 95.1 } },
];

/** Of the bad records, the share that failed at least one check on each attribute. */
export const FAILURE_SHARE: { attribute: string; pct: number }[] = [
  { attribute: "Email", pct: 41 },
  { attribute: "Phone", pct: 38 },
  { attribute: "Role", pct: 29 },
  { attribute: "Title", pct: 27 },
  { attribute: "Address", pct: 24 },
  { attribute: "Company", pct: 12 },
  { attribute: "Last name", pct: 7 },
  { attribute: "First name", pct: 6 },
];

/** Bad records that fail exactly one attribute: fix it and they become good. */
export const NEAR_MISSES: { attribute: string; records: number }[] = [
  { attribute: "Email", records: 14_200 },
  { attribute: "Phone", records: 11_800 },
  { attribute: "Role", records: 9_300 },
  { attribute: "Title", records: 6_700 },
];

/** Share of good records over the last 30 days, oldest first. */
export const GOOD_TREND: number[] = [
  74.1, 74.3, 74.2, 74.8, 75.0, 75.1, 75.6, 75.9, 76.2, 76.0, 76.4, 76.9, 77.3, 77.2, 77.8, 78.1,
  78.6, 79.0, 79.3, 79.5, 79.9, 80.2, 80.1, 80.4, 80.0, 79.8, 79.6, 79.6, 79.1, 78.4,
];

export const BY_SOURCE: { source: string; records: number; goodPct: number; steward: string }[] = [
  { source: "partner_lists", records: 41_200, goodPct: 55.0, steward: "Jonas Weber" },
  { source: "event_leads", records: 88_900, goodPct: 74.0, steward: "Priya Nair" },
  { source: "campaign_imports", records: 74_500, goodPct: 76.0, steward: "Jonas Weber" },
  { source: "web_forms", records: 140_300, goodPct: 71.4, steward: "You" },
  { source: "crm_sync", records: 137_400, goodPct: 96.7, steward: "You" },
];

export const BAD_SHARE_NOTE =
  "A bad record can fail on several attributes, so these percentages add up to more than 100%.";
