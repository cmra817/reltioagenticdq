import * as React from "react";
import { ArrowUp, Lock } from "lucide-react";
import { useDomainState } from "@/components/domain-context";
import { useProjects } from "@/lib/projects-store";
import { ALL_DOMAINS } from "@/lib/mock-ops";

export type PromptDomainControl = {
  /** A domain name or ALL_DOMAINS. */
  value: string;
  onChange?: (value: string) => void;
  locked?: boolean;
};
export type PromptProjectControl = {
  value: string;
  onChange: (id: string) => void;
};

/** Domain-agnostic surfaces (rules, dashboards) always prompt across All domains. */
export const ALL_DOMAINS_FIXED: PromptDomainControl = { value: ALL_DOMAINS, locked: true };

export interface PromptBoxProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (text: string) => void;
  placeholder?: string;
  /** Leave unset to follow the app-wide domain selection. */
  domain?: PromptDomainControl;
  /** Leave unset to keep the project choice local to this box. */
  project?: PromptProjectControl;
  rows?: number;
  autoFocus?: boolean;
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
  busy?: boolean;
  onStop?: () => void;
  /** Small chip before the text, e.g. the column being asked about. */
  leading?: React.ReactNode;
  className?: string;
}

const card = { borderColor: "var(--hairline)" } as const;
const selectCls =
  "rounded-full border bg-white px-2.5 py-1 text-[12.5px] outline-none focus:border-[color:var(--brand-blue)]";

/** The one prompt box used everywhere: Domain and Project selectors above the text. */
export function PromptBox({
  value,
  onChange,
  onSubmit,
  placeholder = "Ask Reltio…",
  domain,
  project,
  rows = 2,
  autoFocus,
  textareaRef,
  busy,
  onStop,
  leading,
  className,
}: PromptBoxProps) {
  const global = useDomainState();
  const { projects } = useProjects();
  const [localProject, setLocalProject] = React.useState("");

  const domainValue =
    domain?.value ?? (global.allDomains ? ALL_DOMAINS : global.selected);
  const setDomain =
    domain?.onChange ??
    ((v: string) => (v === ALL_DOMAINS ? global.setAllDomains(true) : global.selectDomain(v)));
  const locked = !!domain?.locked;
  const all = domainValue === ALL_DOMAINS;
  const projectValue = project?.value ?? localProject;
  const setProject = project?.onChange ?? setLocalProject;
  const options = projects.filter((p) => p.domain === domainValue);

  const send = () => {
    if (busy || !value.trim()) return;
    onSubmit(value);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        send();
      }}
      className={`flex flex-col gap-1 rounded-2xl border bg-white/95 px-3 py-2.5 backdrop-blur ${className ?? ""}`}
      style={{ borderColor: "var(--hairline)", boxShadow: "0 12px 32px rgba(15,23,42,0.08)" }}
    >
      <div
        className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12.5px]"
        style={{ color: "var(--ink-500)" }}
      >
        {locked ? (
          <span
            className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1"
            style={{ ...card, background: "var(--surface-soft)", color: "var(--ink-900)" }}
            title="The domain is set for this screen."
          >
            <Lock size={12} aria-hidden="true" />
            Domain: {domainValue}
          </span>
        ) : (
          <label className="flex items-center gap-2">
            Domain
            <select
              value={domainValue}
              onChange={(e) => setDomain(e.target.value)}
              className={selectCls}
              style={{ ...card, color: "var(--ink-900)" }}
            >
              {global.domains.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
              <option value={ALL_DOMAINS}>{ALL_DOMAINS}</option>
            </select>
          </label>
        )}
        {!all && (
          <label className="flex items-center gap-2">
            Project
            <select
              value={projectValue}
              onChange={(e) => setProject(e.target.value)}
              className={selectCls}
              style={{ ...card, color: "var(--ink-900)" }}
            >
              <option value="">None</option>
              {options.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <div className="flex items-start gap-2">
        {leading}
        <textarea
          ref={textareaRef}
          value={value}
          autoFocus={autoFocus}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={rows}
          aria-label={placeholder}
          placeholder={placeholder}
          className="min-h-[24px] flex-1 resize-none bg-transparent text-[13.5px] outline-none"
          style={{ color: "var(--ink-900)" }}
        />
      </div>
      <div className="flex items-center justify-end">
        {busy && onStop ? (
          <button
            type="button"
            onClick={onStop}
            aria-label="Stop response"
            className="flex h-8 w-8 items-center justify-center rounded-full"
            style={{ background: "var(--ink-900)" }}
          >
            <span className="block h-3 w-3 rounded-sm" style={{ background: "#fff" }} />
          </button>
        ) : (
          <button
            type="submit"
            aria-label="Send"
            disabled={busy || !value.trim()}
            className="flex h-8 w-8 items-center justify-center rounded-full text-white disabled:opacity-40"
            style={{ background: "var(--brand-blue)" }}
          >
            <ArrowUp size={15} />
          </button>
        )}
      </div>
    </form>
  );
}
