import { ALL_DOMAINS, trendFor, type DashboardDef } from "@/lib/mock-ops";
import type { ChatReply, ChatVisual } from "@/components/workspace/chat-visuals";
import {
  BY_SOURCE,
  FAILURE_SHARE,
  GOOD_TREND,
  NEAR_MISSES,
  RQ,
  RQ_BAD,
} from "@/lib/record-quality";

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
const ask = (topic: string) => discussPrompt(topic);

const trendVisual = (): ChatVisual => ({
  kind: "trend",
  title: "Good records, last 30 days",
  values: GOOD_TREND,
  startLabel: "30 days ago",
  endLabel: "Today",
  target: RQ.targetPct,
});

const failureBars = (): ChatVisual => ({
  kind: "bars",
  title: "Share of bad records that fail on each attribute",
  rows: FAILURE_SHARE.map((f) => ({
    label: f.attribute,
    value: f.pct,
    display: `${f.pct}% · ${n(Math.round((RQ_BAD * f.pct) / 100))}`,
    ask: ask(`Why records fail on ${f.attribute}`),
  })),
  max: 100,
});

const winBars = (): ChatVisual => ({
  kind: "bars",
  title: "Bad records that turn good if you fix one attribute",
  rows: NEAR_MISSES.map((m) => ({
    label: `Fix ${m.attribute}`,
    value: m.records,
    display: `+${n(m.records)} good`,
    ask: ask(`Fix ${m.attribute}`),
  })),
});

const sourceBars = (title: string, bad: boolean): ChatVisual => ({
  kind: "bars",
  title,
  rows: [...BY_SOURCE]
    .map((s) => ({
      label: s.source,
      value: bad ? Math.round(s.records * (1 - s.goodPct / 100)) : s.goodPct,
      display: bad
        ? `${n(Math.round(s.records * (1 - s.goodPct / 100)))} bad`
        : `${s.goodPct}% good`,
      ask: ask(`Source: ${s.source}`),
    }))
    .sort((a, b) => (bad ? b.value - a.value : a.value - b.value)),
  max: bad ? undefined : 100,
});

function answerMine(topic: string): ChatReply {
  const fail = /^Why records fail on (.+)$/.exec(topic);
  if (fail) {
    const row = FAILURE_SHARE.find((f) => f.attribute === fail[1]);
    if (!row || row.attribute === "Email") {
      return {
        text: `${recordReply("email")} Here is where the bad records sit by source.`,
        visual: sourceBars("Bad records by source", true),
      };
    }
    const fix = NEAR_MISSES.find((m) => m.attribute === row.attribute);
    return {
      text: `${row.attribute} is why ${row.pct}% of bad records fail, about ${n(Math.round((RQ_BAD * row.pct) / 100))} records.${
        fix
          ? ` About ${n(fix.records)} of them fail on ${row.attribute} alone, so fixing it turns those good.`
          : ""
      }`,
      visual: {
        kind: "stats",
        title: row.attribute,
        items: [
          { label: "Of bad records", value: `${row.pct}%` },
          { label: "Records", value: n(Math.round((RQ_BAD * row.pct) / 100)) },
          ...(fix
            ? [{ label: "Fixed alone", value: `+${n(fix.records)}`, note: "turn good" }]
            : []),
        ],
      },
    };
  }
  const fix = /^Fix (.+)$/.exec(topic);
  if (fix) {
    const m = NEAR_MISSES.find((x) => x.attribute === fix[1]);
    if (!m) return { text: recordReply("fix"), visual: winBars() };
    const pts = +((m.records / RQ.total) * 100).toFixed(1);
    return {
      text: `Fixing ${m.attribute} turns about ${n(m.records)} bad records good, worth +${pts} points toward your ${RQ.targetPct}% target.`,
      visual: {
        kind: "stats",
        title: `If you fix ${m.attribute}`,
        items: [
          { label: "Records turn good", value: n(m.records) },
          { label: "Good records", value: `${RQ.goodPct}% → ${+(RQ.goodPct + pts).toFixed(1)}%` },
          {
            label: "Still to target",
            value: `${+(RQ.targetPct - RQ.goodPct - pts).toFixed(1)} pts`,
          },
        ],
      },
    };
  }
  const src = /^Source: (.+)$/.exec(topic);
  if (src) {
    const s = BY_SOURCE.find((x) => x.source === src[1]);
    return {
      text: s
        ? `${s.source} is ${s.goodPct}% good across ${n(s.records)} records. Its steward is ${s.steward}. Your target is ${RQ.targetPct}%.`
        : recordReply("source"),
      visual: sourceBars("Good records by source", false),
    };
  }
  if (/attribute and check/i.test(topic)) {
    return {
      text: "Valid is the weakest check at 91.2%, ahead of Distinct at 94.8% and Complete at 96.4%. Email and Phone fail most often.",
      visual: {
        kind: "bars",
        title: "Pass rate by check",
        rows: [
          { label: "Valid", value: 91.2, display: "91.2%" },
          { label: "Distinct", value: 94.8, display: "94.8%" },
          { label: "Complete", value: 96.4, display: "96.4%" },
        ],
        max: 100,
      },
    };
  }
  if (/30 days/i.test(topic)) return { text: recordReply("trend"), visual: trendVisual() };
  if (/good and bad/i.test(topic)) {
    return {
      text: recordReply(""),
      visual: {
        kind: "stats",
        items: [
          {
            label: "Good records",
            value: `${RQ.goodPct}%`,
            note: `${n(RQ.total - RQ_BAD)} of ${n(RQ.total)}`,
          },
          { label: "Bad records", value: `${+(100 - RQ.goodPct).toFixed(1)}%`, note: n(RQ_BAD) },
          {
            label: "Target",
            value: `${RQ.targetPct}%`,
            note: `${+(RQ.targetPct - RQ.goodPct).toFixed(1)} pts to go`,
          },
        ],
      },
    };
  }
  return { text: recordReply(topic) };
}

/** Answers a "Let's discuss: …" question about one thing on a dashboard, with a chart that explains it. */
export function answerTopic(dash: DashboardDef, topic: string): ChatReply {
  if (dash.id === "mine") {
    const i = dash.briefing.indexOf(topic);
    if (i === 0) return { text: recordReply("trend"), visual: trendVisual() };
    if (i === 1) return { text: recordReply("email"), visual: failureBars() };
    if (i === 2) return { text: recordReply("fix"), visual: winBars() };
    return answerMine(topic);
  }
  const where = dash.scope === ALL_DOMAINS ? "across your domains" : `in ${dash.scope}`;
  return {
    text: `On ${topic}: compared with yesterday, one more check failed and two recovered ${where}. Nothing new broke outside the findings in today's brief. Want me to list the failing checks?`,
    visual: {
      kind: "trend",
      title: `${dash.name}, last 14 days`,
      values: trendFor(85, `${dash.id}|${topic}`),
      startLabel: "14 days ago",
      endLabel: "Today",
    },
  };
}
