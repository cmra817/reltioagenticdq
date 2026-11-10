import { Lock } from "lucide-react";
import { ALL_DOMAINS } from "@/lib/mock-ops";

/**
 * Which domain a chat is about, chosen above the prompt box. It can be changed
 * until the first message is sent; after that it is locked, and looking at
 * another domain means starting a new chat.
 */
export function ScopePicker({
  scope,
  domains,
  locked,
  onChange,
}: {
  /** The domain, or ALL_DOMAINS. */
  scope: string;
  domains: string[];
  locked: boolean;
  onChange: (scope: string) => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-3xl items-center gap-2 px-1 pb-2 text-[12.5px]">
      {locked ? (
        <span
          className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1"
          style={{ borderColor: "var(--hairline)", background: "var(--surface-soft)", color: "var(--ink-900)" }}
          title="The scope is set for this chat. Start a new chat to look at another domain."
        >
          <Lock size={12} aria-hidden="true" />
          Scope: {scope} · locked
        </span>
      ) : (
        <label className="flex items-center gap-2" style={{ color: "var(--ink-500)" }}>
          Scope
          <select
            value={scope}
            onChange={(e) => onChange(e.target.value)}
            className="rounded-full border bg-white px-2.5 py-1 outline-none focus:border-[color:var(--brand-blue)]"
            style={{ borderColor: "var(--hairline)", color: "var(--ink-900)" }}
          >
            {domains.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
            <option value={ALL_DOMAINS}>{ALL_DOMAINS}</option>
          </select>
        </label>
      )}
      {!locked && (
        <span style={{ color: "var(--ink-500)" }}>Set before you send. It can't change afterward.</span>
      )}
    </div>
  );
}
