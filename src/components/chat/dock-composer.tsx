import { PromptBox } from "@/components/chat/prompt-box";
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
      <div className="pointer-events-auto mx-auto w-full max-w-2xl">
        <PromptBox value={value} onChange={setValue} onSubmit={start} rows={1} />
      </div>
    </div>
  );
}
