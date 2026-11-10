import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ChatWindow } from "@/components/chat/chat-window";
import { ChatPromptBox } from "@/components/chat/chat-prompt-box";
import { useChatThreads } from "@/components/chat/chat-context";
import { ScopePicker } from "@/components/chat/scope-picker";
import { useDomainState } from "@/components/domain-context";
import { ScopePanel, ScopeRail } from "@/components/domain/scope-rail";
import { SplitWorkspace } from "@/components/workspace/primitives";
import { ALL_DOMAINS } from "@/lib/mock-ops";

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
    <AppShell activeNav="none" hideDock>
      <ChatBody />
    </AppShell>
  );
}

function ChatBody() {
  const { chatId } = Route.useParams();
  const { q } = Route.useSearch();
  const navigate = useNavigate();
  const { getThread, createThread, saveMessages, setThreadDomain } = useChatThreads();
  const { domains } = useDomainState();
  const thread = getThread(chatId);
  // The chat is about one domain (or all). It is chosen before the first message, then locked.
  const scope = thread?.domain && domains.includes(thread.domain) ? thread.domain : ALL_DOMAINS;
  const locked = (thread?.messages.length ?? 0) > 0;
  // The right panel starts minimized; expanding it opens Overview or Tables.
  const [expanded, setExpanded] = useState(false);
  const [tab, setTab] = useState<"overview" | "tables">("overview");

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
      <SplitWorkspace
        panelLabel={`${scope} summary`}
        panelWidth={expanded ? "59vw" : 320}
        center={
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
            renderPrompt={(controls) => (
              <>
                <div className="px-6 pt-1">
                  <ScopePicker
                    scope={scope}
                    domains={domains}
                    locked={locked}
                    onChange={(next) =>
                      setThreadDomain(chatId, next === ALL_DOMAINS ? undefined : next)
                    }
                  />
                </div>
                <ChatPromptBox {...controls} />
              </>
            )}
          />
        }
        panel={
          expanded ? (
            <ScopePanel
              scope={scope}
              tab={tab}
              onTab={setTab}
              onMinimize={() => setExpanded(false)}
            />
          ) : (
            <ScopeRail
              scope={scope}
              onExpand={() => setExpanded(true)}
              onOpenTables={() => {
                setTab("tables");
                setExpanded(true);
              }}
            />
          )
        }
      />
    </div>
  );
}
