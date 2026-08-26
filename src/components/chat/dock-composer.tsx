import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowUp } from "lucide-react";
import { newChatId, useChatThreads } from "./chat-context";

/** Docked prompt box shown at the bottom of every main page. */
export function DockComposer() {
  const navigate = useNavigate();
  const { createThread } = useChatThreads();
  const [value, setValue] = useState("");

  function start() {
    const text = value.trim();
    if (!text) return;
    // Consistency questions open the scripted investigation thread.
    if (/consisten/i.test(text)) {
      setValue("");
      void navigate({ to: "/investigate/consistency", search: { q: text } });
      return;
    }
    const id = newChatId();
    createThread({ id });
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
