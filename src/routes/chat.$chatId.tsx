import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { ChatWindow } from "@/components/chat/chat-window";
import { useChatThreads } from "@/components/chat/chat-context";

type ChatSearch = { q?: string };

export const Route = createFileRoute("/chat/$chatId")({
  validateSearch: (search: Record<string, unknown>): ChatSearch => ({
    q: typeof search.q === "string" ? search.q : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Chat — Data Quality" },
      {
        name: "description",
        content:
          "Chat with the assistant about profiling results, anomalies, data quality checks, and run schedules.",
      },
      { property: "og:title", content: "Chat — Data Quality" },
      {
        property: "og:description",
        content: "Ask the assistant about profiling, anomalies, DQ checks, and schedules.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ChatPage,
});

function ChatPage() {
  return (
    <AppShell hideDock>
      <ChatBody />
    </AppShell>
  );
}

function ChatBody() {
  const { chatId } = Route.useParams();
  const { q } = Route.useSearch();
  const navigate = useNavigate();
  const { getThread, createThread, saveMessages } = useChatThreads();
  const thread = getThread(chatId);

  useEffect(() => {
    if (!thread) createThread({ id: chatId });
  }, [thread, chatId, createThread]);

  // The seed prompt lives in the URL only until it is sent.
  useEffect(() => {
    if (!q) return;
    const timer = setTimeout(() => {
      void navigate({ to: "/chat/$chatId", params: { chatId }, search: {}, replace: true });
    }, 400);
    return () => clearTimeout(timer);
  }, [q, chatId, navigate]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ChatWindow
        key={chatId}
        chatId={chatId}
        initialMessages={thread?.messages ?? []}
        onMessagesChange={(messages) => saveMessages(chatId, messages)}
        autoSendText={q}
        suggestions={[
          "Which tables have active anomalies right now?",
          "Explain the fill-rate drop on customers.email",
          "Recommend DQ checks for a new orders table",
        ]}
      />
    </div>
  );
}
