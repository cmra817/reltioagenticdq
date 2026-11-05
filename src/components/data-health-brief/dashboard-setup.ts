/**
 * Scripted setup agent for a new dashboard. It reads plain-language answers,
 * keeps what it understood, asks only for what's missing, then confirms.
 */
export type SetupAnswers = {
  assets: string[];
  domain: string | null;
  goal: string | null;
  audience: string | null;
  refresh: string | null;
};

export const EMPTY_ANSWERS: SetupAnswers = {
  assets: [],
  domain: null,
  goal: null,
  audience: null,
  refresh: null,
};

export const SETUP_PROMPT =
  "Help me build a new dashboard. Ask me which data assets to monitor, what my goal is, and anything else you need, then build it.";

export const SETUP_QUESTIONS = `Happy to build that. A few quick questions:

1. Which data assets should it watch? For example, a domain (Finance), specific tables (customers, contacts), or a connector (Salesforce).
2. What's the goal? For example, catch failed checks before month-end close, watch connector freshness, or track duplicates.
3. Who is it for? Just you, or shared with your team.
4. How often should it refresh? For example, daily at 7:00 AM, or with every scheduled run.

Once I have those, I'll build it.`;

const TABLES = [
  "customers",
  "contacts",
  "accounts",
  "invoices",
  "orders",
  "payments",
  "gl_entries",
  "vendors",
  "shipments",
  "products",
  "web_forms",
  "partner_lists",
];
const CONNECTORS = ["Salesforce", "Snowflake", "NetSuite", "BigQuery", "Databricks", "Workday"];

const GOALS: { re: RegExp; label: string; name: string }[] = [
  { re: /close|month[- ]end|quarter/i, label: "Catch failed checks before month-end close", name: "close readiness" },
  { re: /fresh|stale|late|connector|sync/i, label: "Watch connector freshness", name: "freshness watch" },
  { re: /dup/i, label: "Track duplicate records", name: "duplicates watch" },
  { re: /complete|missing|null|empty/i, label: "Track missing values", name: "completeness" },
  { re: /fail|check|broke|error/i, label: "Catch failed checks early", name: "check failures" },
];

export function parseAnswers(text: string, prev: SetupAnswers, domains: string[]): SetupAnswers {
  const next: SetupAnswers = { ...prev, assets: [...prev.assets] };
  const lower = text.toLowerCase();

  const domain = domains.find((d) => lower.includes(d.toLowerCase()));
  if (domain) next.domain = domain;
  for (const t of TABLES) if (lower.includes(t) && !next.assets.includes(t)) next.assets.push(t);
  for (const c of CONNECTORS)
    if (lower.includes(c.toLowerCase()) && !next.assets.includes(c)) next.assets.push(c);

  const goal = GOALS.find((g) => g.re.test(text));
  if (goal) next.goal = goal.label;
  else {
    const m = text.match(/(?:goal is|i want to|so (?:that )?i can|to make sure)\s+([^.]+)/i);
    if (m) next.goal = m[1].trim().replace(/^./, (c) => c.toUpperCase());
  }

  if (/just me|only me|myself|me only|personal|private/i.test(text)) next.audience = "Just you";
  else if (/team|share|everyone|shared|stewards/i.test(text)) next.audience = "Shared with your team";

  const time = text.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
  if (/every (scheduled )?run|each run|scheduled run/i.test(text)) next.refresh = "With every scheduled run";
  else if (/hourly|every hour/i.test(text)) next.refresh = "Hourly";
  else if (/weekly|every week|monday/i.test(text))
    next.refresh = time ? `Weekly at ${fmtTime(time)}` : "Weekly";
  else if (/daily|every day|morning|each day/i.test(text) || time)
    next.refresh = time ? `Daily at ${fmtTime(time)}` : "Daily at 7:00 AM";

  return next;
}

function fmtTime(m: RegExpMatchArray) {
  return `${m[1]}:${m[2] ?? "00"} ${m[3].toUpperCase()}`;
}

export function hasAssets(a: SetupAnswers) {
  return a.domain !== null || a.assets.length > 0;
}

export function missing(a: SetupAnswers): string[] {
  const out: string[] = [];
  if (!hasAssets(a)) out.push("Which data assets should it watch? A domain, tables, or a connector.");
  if (!a.goal) out.push("What's the goal? For example, catch failed checks before close.");
  if (!a.audience) out.push("Who is it for? Just you, or shared with your team.");
  if (!a.refresh) out.push("How often should it refresh? For example, daily at 7:00 AM.");
  return out;
}

export function assetsLabel(a: SetupAnswers) {
  return [a.domain ? `${a.domain} domain` : null, ...a.assets].filter(Boolean).join(", ");
}

export function dashboardName(a: SetupAnswers) {
  const g = GOALS.find((x) => x.label === a.goal);
  const subject = a.domain ?? (a.assets[0] ? a.assets[0] : "Data");
  const pretty = subject.charAt(0).toUpperCase() + subject.slice(1);
  return `${pretty} ${g?.name ?? "watch"}`;
}

export function summary(a: SetupAnswers) {
  return `Here's what I'll build:

• Name: ${dashboardName(a)}
• Watches: ${assetsLabel(a)}
• Goal: ${a.goal}
• For: ${a.audience}
• Refreshes: ${a.refresh}

Should I build it? Say yes, or tell me what to change.`;
}

export const isYes = (q: string) =>
  /^(y|yes|yep|yeah|sure|ok|okay|go|do it|build it|looks good|sounds good|confirm)\b/i.test(q.trim());
