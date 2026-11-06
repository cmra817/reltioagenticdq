import { ALL_DOMAINS, type DashboardDef } from "@/lib/mock-ops";
import { BY_SOURCE, FAILURE_SHARE, NEAR_MISSES, RQ, RQ_BAD } from "@/lib/record-quality";

/* A dashboard's chat is one conversation per dashboard per day. */

const VIEW_PREFIX = "dashboard-view-";
const SEP = "__";

export function dayKey(d = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export const dashboardViewId = (dashId: string, day = dayKey()) =>
  `${VIEW_PREFIX}${dashId}${SEP}${day}`;

export function parseViewId(threadId: string): { dashId: string; day: string } | undefined {
  if (!threadId.startsWith(VIEW_PREFIX)) return undefined;
  const rest = threadId.slice(VIEW_PREFIX.length);
  const at = rest.lastIndexOf(SEP);
  if (at < 1) return undefined;
  return { dashId: rest.slice(0, at), day: rest.slice(at + SEP.length) };
}

/* The question sent for the person when they select something on the page. */

const PREFIX = "Let's discuss: ";
export const discussPrompt = (topic: string) => `${PREFIX}${topic}`;
export const topicFrom = (text: string): string | undefined =>
  text.startsWith(PREFIX) ? text.slice(PREFIX.length) : undefined;

/* Scripted answers (stand-in for the agent). */

export function recordReply(q: string): string {
  if (/source|where|worst/i.test(q)) {
    return "partner_lists is the worst at 55% good, but it is small. web_forms is 71.4% good across 140,300 records, so it holds the most bad records (about 40,100).";
  }
  if (/fast|quick|90|win|fix/i.test(q)) {
    return "Fix Email first: about 14,200 records fail on email alone, worth +2.9 points. Phone adds +2.4 and Role +1.9. Those three together get you from 78.4% to about 85.7%.";
  }
  if (/email/i.test(q)) {
    return "Of the bad records, 41% fail on Email. Valid is the weakest check at 91.2%, ahead of Distinct at 94.8% and Complete at 96.4%.";
  }
  if (/trend|week|down|drop|change/i.test(q)) {
    return "Good records climbed from 74.1% to 80.4% over the month, then slipped to 78.4% over the last week, right after a partner_lists import.";
  }
  return "Of 482,300 contacts, 378,100 are good (78.4%) and 104,200 are bad. Email and Phone cause most of the failures. Ask me about a source, an attribute, or the quickest way to reach 90%.";
}

const n = (v: number) => v.toLocaleString("en-US");

function answerMine(topic: string): string {
  const fail = /^Why records fail on (.+)$/.exec(topic);
  if (fail) {
    const row = FAILURE_SHARE.find((f) => f.attribute === fail[1]);
    if (!row || row.attribute === "Email") return recordReply("email");
    const fix = NEAR_MISSES.find((m) => m.attribute === row.attribute);
    return `${row.attribute} is why ${row.pct}% of bad records fail, about ${n(Math.round((RQ_BAD * row.pct) / 100))} records.${
      fix
        ? ` About ${n(fix.records)} of them fail on ${row.attribute} alone, so fixing it turns those good.`
        : ""
    }`;
  }
  const fix = /^Fix (.+)$/.exec(topic);
  if (fix) {
    const m = NEAR_MISSES.find((x) => x.attribute === fix[1]);
    return m
      ? `Fixing ${m.attribute} turns about ${n(m.records)} bad records good, worth +${((m.records / RQ.total) * 100).toFixed(1)} points toward your ${RQ.targetPct}% target.`
      : recordReply("fix");
  }
  const src = /^Source: (.+)$/.exec(topic);
  if (src) {
    const s = BY_SOURCE.find((x) => x.source === src[1]);
    return s
      ? `${s.source} is ${s.goodPct}% good across ${n(s.records)} records. Its steward is ${s.steward}. Your target is ${RQ.targetPct}%.`
      : recordReply("source");
  }
  if (/attribute and check/i.test(topic)) {
    return "Valid is the weakest check at 91.2%, ahead of Distinct at 94.8% and Complete at 96.4%. Email and Phone fail most often.";
  }
  if (/30 days/i.test(topic)) return recordReply("trend");
  if (/good and bad/i.test(topic)) return recordReply("");
  return recordReply(topic);
}

/** Answers a "Let's discuss: …" question about one thing on a dashboard. */
export function answerTopic(dash: DashboardDef, topic: string): string {
  if (dash.id === "mine") {
    const i = dash.briefing.indexOf(topic);
    if (i === 0) return recordReply("trend");
    if (i === 1) return recordReply("email");
    if (i === 2) return recordReply("fix");
    return answerMine(topic);
  }
  const where = dash.scope === ALL_DOMAINS ? "across your domains" : `in ${dash.scope}`;
  return `On ${topic}: compared with yesterday, one more check failed and two recovered ${where}. Nothing new broke outside the findings in today's brief. Want me to list the failing checks?`;
}
