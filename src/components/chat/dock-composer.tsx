import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowUp } from "lucide-react";
import { newChatId, titleFromText, useChatThreads } from "./chat-context";
import { useDomainState } from "../domain-context";
import { ALL_DOMAINS } from "@/lib/mock-ops";

/** Docked prompt box shown at the bottom of every main page. */
export function DockComposer() {
  const navigate = useNavigate();
  const { createThread } = useChatThreads();
  const { domains, selected, allDomains, setAllDomains, selectDomain } = useDomainState();
  const scopeDomain = allDomains ? undefined : selected;
  const [value, setValue] = useState("");

  function start() {
    const text = value.trim();
    if (!text) return;
    // Consistency questions open the scripted investigation thread — saved like any chat.
    if (/consisten/i.test(text)) {
      const investigationId = newChatId();
      createThread({
        id: investigationId,
        title: titleFromText(text),
        kind: "investigation",
        domain: scopeDomain,
      });
      setValue("");
      void navigate({
        to: "/investigate/consistency",
        search: { q: text, thread: investigationId },
      });
      return;
    }
    const id = newChatId();
    createThread({ id, domain: scopeDomain });
    setValue("");
    void navigate({ to: "/chat/$chatId", params: { chatId: id }, search: { q: text } });
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-6 pb-5">
      <form
        className="pointer-events-auto mx-auto flex w-full max-w-2xl items-end gap-2 rounded-2xl border bg-white/95 p-2 pl-4 backdrop-blur"
        style={{ borderColor: "var(--hairline)", boxShadow: "0 12px 32px rgba(15,23,42,0.10)" }}
        onSubmit={(e) => {
          e.preventDefault();
          start();
        }}
      >
        <div className="flex min-w-0 flex-1 flex-col">
          <textarea
            rows={1}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                start();
              }
            }}
            placeholder="Ask about your data…"
            className="max-h-32 flex-1 resize-none bg-transparent py-2 text-[14px] outline-none"
            style={{ color: "var(--ink-900)" }}
          />
          <label
            className="mb-1 flex items-center gap-1.5 text-[12px]"
            style={{ color: "var(--ink-500)" }}
          >
            <span>Scope</span>
            <select
              value={allDomains ? ALL_DOMAINS : selected}
              onChange={(e) =>
                e.target.value === ALL_DOMAINS ? setAllDomains(true) : selectDomain(e.target.value)
              }
              aria-label="Chat scope"
              className="rounded-md px-1.5 py-0.5 text-[12px] font-medium"
              style={{ background: "var(--surface-soft)", color: "var(--ink-700)" }}
            >
              <option value={ALL_DOMAINS}>All domains</option>
              {domains.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button
          type="submit"
          disabled={!value.trim()}
          aria-label="Start chat"
          className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white transition-opacity disabled:opacity-40"
          style={{ background: "var(--brand-blue)" }}
        >
          <ArrowUp size={16} />
        </button>
      </form>
    </div>
  );
}
