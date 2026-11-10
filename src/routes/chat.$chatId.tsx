import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { useChatThreads } from "@/components/chat/chat-context";
import { DOMAIN_CHATS_KEY, type SavedDomainChat } from "@/components/domain/domain-screen";
import { useDomainState } from "@/components/domain-context";

type ChatSearch = { q?: string };

// Every chat renders on one page (/domain). This route only forwards older links.
export const Route = createFileRoute("/chat/$chatId")({
  validateSearch: (search: Record<string, unknown>): ChatSearch => ({
    q: typeof search.q === "string" ? search.q : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Chat — Data Quality" },
      { name: "description", content: "Chat with the assistant about your data quality." },
      { property: "og:title", content: "Chat — Data Quality" },
      { property: "og:description", content: "Chat with the assistant about your data quality." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ChatRedirect,
});

function ChatRedirect() {
  const { chatId } = Route.useParams();
  const { q } = Route.useSearch();
  const navigate = useNavigate();
  const { getThread } = useChatThreads();
  const { selectDomain } = useDomainState();

  useEffect(() => {
    const thread = getThread(chatId);
    let store: Record<string, SavedDomainChat> = {};
    try {
      store = JSON.parse(window.localStorage.getItem(DOMAIN_CHATS_KEY) ?? "{}");
    } catch {
      /* corrupt storage: start over */
    }
    if (!store[chatId] && thread && thread.messages.length > 0) {
      // Move an older chat's messages onto the shared chat page.
      store[chatId] = {
        domain: thread.domain,
        turns: thread.messages.map((m, i) => ({
          id: i,
          role: m.role === "user" ? "user" : "agent",
          text: m.parts
            .map((p) => (p.type === "text" ? p.text : ""))
            .join("")
            .trim(),
        })),
      };
      window.localStorage.setItem(DOMAIN_CHATS_KEY, JSON.stringify(store));
    }
    if (store[chatId]) {
      void navigate({ to: "/domain", search: { thread: chatId }, replace: true });
      return;
    }
    if (thread?.domain) selectDomain(thread.domain);
    void navigate({
      to: "/domain",
      search: { all: thread?.domain ? undefined : true, n: chatId, q },
      replace: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]);

  return <AppShell activeNav="none" hideDock>{null}</AppShell>;
}
