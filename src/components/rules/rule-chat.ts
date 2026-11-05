import { ME, RULE_TYPES, type Rule, type RuleType, type Severity } from "@/lib/mock-ops";

/** Sent automatically when "New rule" is clicked, so there is nothing to type. */
export const START_PROMPT = "Help me create a rule. Ask me what should be true about my data.";

export const START_QUESTION =
  "Sure. What should be true about your data? Describe it in plain words and I'll draft the rule, test it on real rows, and show it on the right so you can fine-tune it.\n\nFor example:\n• Order totals are never negative\n• No two customers share the same email\n• Shipments arrive within 6 hours of the order";

export type EditableKey =
  | "name"
  | "description"
  | "type"
  | "severity"
  | "threshold"
  | "appliesWhen";

export const FIELD_LABEL: Record<EditableKey, string> = {
  name: "name",
  description: "definition",
  type: "type",
  severity: "severity",
  threshold: "rows allowed to fail",
  appliesWhen: "conditions",
};

const KEYS = Object.keys(FIELD_LABEL) as EditableKey[];

/** Which editable fields differ between two versions of a rule. */
export function changedKeys(a: Rule, b: Rule): EditableKey[] {
  return KEYS.filter((k) => a[k] !== b[k]);
}

function detectType(t: string): RuleType {
  if (/duplicate|unique|same email|share the same/i.test(t)) return "Uniqueness";
  if (/null|missing|empty|blank|required|filled/i.test(t)) return "Completeness";
  if (/late|fresh|stale|arriv|refresh|delay|within \d+ ?(hour|minute|day)/i.test(t))
    return "Freshness";
  if (/match|reconcil|consisten|same as|agree/i.test(t)) return "Consistency";
  return "Validity";
}

function capitalize(text: string): string {
  const t = text.trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function nameFrom(text: string): string {
  const cleaned = text
    .replace(/^(please\s+)?(check|make sure|ensure|verify)( that)?\s+/i, "")
    .replace(/[.!?]+$/, "")
    .trim();
  const short = cleaned.length > 60 ? `${cleaned.slice(0, 57)}…` : cleaned;
  return capitalize(short);
}

/** A first draft from a plain-language description. */
export function draftFrom(text: string): Rule {
  return {
    id: `r-${Date.now()}`,
    name: nameFrom(text),
    description: capitalize(text.replace(/[.!?]+$/, "")) + ".",
    type: detectType(text),
    severity: "Medium",
    owner: ME,
    status: "Draft",
    scope: "Yours",
    threshold: 0,
    appliesWhen: "",
    versions: [],
  };
}

export type ChatEdit = { draft: Rule; changed: EditableKey[]; message: string };

/**
 * Reads a change request ("make it high severity", "allow 2% to fail", "only
 * check active customers", "call it …") and applies it to the draft. Returns
 * null when nothing in the message maps to a field.
 */
export function applyChatEdit(draft: Rule, text: string): ChatEdit | null {
  const t = text.trim();
  const next: Rule = { ...draft };
  const notes: string[] = [];
  const changed: EditableKey[] = [];
  const mark = (k: EditableKey) => {
    if (!changed.includes(k)) changed.push(k);
  };

  const rename = t.match(/(?:call it|rename(?: it)?(?: to)?|name it)\s+["“]?(.+?)["”]?\s*$/i);
  if (rename) {
    next.name = capitalize(rename[1]);
    mark("name");
    notes.push(`Renamed it to "${next.name}".`);
  }

  const sev = t.match(/\b(low|medium|high)\b/i);
  if (sev && /severity|important|critical|priority|make it|set it/i.test(t) && !rename) {
    const s = capitalize(sev[1].toLowerCase()) as Severity;
    if (s !== next.severity) {
      next.severity = s;
      mark("severity");
      notes.push(`Set severity to ${s}.`);
    }
  }

  const pct = t.match(/(\d+(?:\.\d+)?)\s*%/);
  if (pct && /allow|toler|threshold|fail|loosen|looser|relax|tighten|up to|at most/i.test(t)) {
    const n = Number.parseFloat(pct[1]);
    if (n !== next.threshold) {
      next.threshold = n;
      mark("threshold");
      notes.push(`Now ${n}% of rows may fail.`);
    }
  } else if (
    /zero tolerance|no failures|strictest|nothing should fail|no rows? (?:may|can|should) fail/i.test(
      t,
    )
  ) {
    if (next.threshold !== 0) {
      next.threshold = 0;
      mark("threshold");
      notes.push("No rows may fail now.");
    }
  }

  const condition = t.match(/\bonly (?:check|apply|when|for|if)\s+(.+?)[.!?]?\s*$/i);
  if (condition) {
    next.appliesWhen = capitalize(condition[1]);
    mark("appliesWhen");
    notes.push(`It now only checks rows where: ${next.appliesWhen}.`);
  } else if (/(remove|clear|drop) (the )?(condition|filter)/i.test(t) && next.appliesWhen) {
    next.appliesWhen = "";
    mark("appliesWhen");
    notes.push("Removed the condition, so it checks every row.");
  }

  const type = RULE_TYPES.find((x) => new RegExp(`\\b${x}\\b`, "i").test(t));
  if (type && /type|make it|treat|switch/i.test(t) && !rename && type !== next.type) {
    next.type = type;
    mark("type");
    notes.push(`Changed the type to ${type}.`);
  }

  const definition = t.match(
    /(?:change|update|reword|redefine)\s+(?:the\s+)?(?:definition|description)\s+(?:to|so (?:that )?it says)\s+(.+)$/i,
  );
  if (definition) {
    next.description = capitalize(definition[1].replace(/[.!?]+$/, "")) + ".";
    mark("description");
    notes.push("Updated the definition.");
  }

  if (changed.length === 0) return null;
  return { draft: next, changed, message: notes.join(" ") };
}
