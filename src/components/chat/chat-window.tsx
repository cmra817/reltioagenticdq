import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage, type ChatStatus } from "ai";
import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { toast } from "sonner";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";

export function ChatWindow({
  chatId,
  initialMessages,
  onMessagesChange,
  suggestions = [],
  followUps = [],
  onIntercept,
  emptyTitle = "How can I help with your data?",
  emptySubtitle = "Ask about profiling results, anomalies, DQ checks, or schedules.",
  compact = false,
  autoSendText,
  renderPrompt,
  hidePrompt,
}: {
  chatId: string;
  initialMessages: UIMessage[];
  onMessagesChange?: (messages: UIMessage[]) => void;
  suggestions?: string[];
  /** Chips shown under the transcript, e.g. the next step of a scripted demo. */
  followUps?: string[];
  /** Return an assistant reply to answer locally instead of calling the model. */
  onIntercept?: (text: string) => string | null | undefined;
  emptyTitle?: string;
  emptySubtitle?: string;
  compact?: boolean;
  autoSendText?: string;
  /** Optional custom prompt renderer; receives the same controls used by the default composer. */
  renderPrompt?: (controls: {
    input: string;
    setInput: (value: string) => void;
    submit: (text: string) => void;
    status: ChatStatus;
    busy: boolean;
    stop: () => void;
    textareaRef: RefObject<HTMLTextAreaElement | null>;
  }) => ReactNode;
  /** When true, the default prompt footer is not rendered (use with renderPrompt or an external composer). */
  hidePrompt?: boolean;
}) {
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat" }), []);
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const autoSentRef = useRef<string | null>(null);
  // Snapshot the persisted transcript once per chat so re-renders never reset the chat.
  const seedRef = useRef<{ id: string; messages: UIMessage[] }>({
    id: chatId,
    messages: initialMessages,
  });
  if (seedRef.current.id !== chatId) seedRef.current = { id: chatId, messages: initialMessages };
  const hadHistory = seedRef.current.messages.length > 0;

  const { messages, sendMessage, setMessages, status, stop } = useChat({
    id: chatId,
    messages: seedRef.current.messages,
    transport,
    onError: (error) => {
      toast.error(error.message || "The assistant could not respond. Please try again.");
    },
  });

  // Persistence callback kept in a ref so an inline parent callback can't loop the effect.
  const persistRef = useRef(onMessagesChange);
  persistRef.current = onMessagesChange;
  const lastPersistedRef = useRef("");

  // Persist the transcript whenever it actually changes.
  useEffect(() => {
    if (messages.length === 0) return;
    const last = messages[messages.length - 1];
    const signature = `${messages.length}:${last.id}:${status}:${JSON.stringify(last.parts).length}`;
    if (lastPersistedRef.current === signature) return;
    lastPersistedRef.current = signature;
    persistRef.current?.(messages);
  }, [messages, status]);

  // Keep the composer focused for normal chat use.
  useEffect(() => {
    if (status === "ready") textareaRef.current?.focus();
  }, [status, chatId]);

  // A chat opened from the docked composer sends its seed prompt once.
  useEffect(() => {
    if (!autoSendText) return;
    if (autoSentRef.current === autoSendText) return;
    if (hadHistory) return;
    autoSentRef.current = autoSendText;
    void sendMessage({ text: autoSendText });
  }, [autoSendText, hadHistory, sendMessage]);

  const busy = status === "submitted" || status === "streaming";

  function submit(text: string) {
    const value = text.trim();
    if (!value || busy) return;
    setInput("");

    const scripted = onIntercept?.(value);
    if (scripted) {
      const stamp = Date.now();
      setMessages((prev) => [
        ...prev,
        { id: `u-${stamp}`, role: "user", parts: [{ type: "text", text: value }] },
        { id: `a-${stamp}`, role: "assistant", parts: [{ type: "text", text: scripted }] },
      ]);
      return;
    }

    void sendMessage({ text: value });
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <Conversation className="min-h-0 flex-1">
        <ConversationContent
          className={
            compact
              ? "mx-auto w-full max-w-full px-4 py-4"
              : `mx-auto w-full max-w-3xl px-6 py-6 ${messages.length > 0 ? "min-h-full justify-end" : ""}`
          }
        >
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div
                className={`font-semibold ${compact ? "text-[15px]" : "text-[20px]"}`}
                style={{ color: "var(--ink-900)" }}
              >
                {emptyTitle}
              </div>
              <p className="mt-1.5 max-w-sm text-[13px]" style={{ color: "var(--ink-500)" }}>
                {emptySubtitle}
              </p>
              {suggestions.length > 0 && (
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => submit(s)}
                      className="rounded-full border px-3 py-1.5 text-left text-[12px] transition-colors hover:bg-[color:var(--surface-soft)]"
                      style={{ borderColor: "var(--hairline)", color: "var(--ink-700)" }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {messages.map((message) => {
            const reasoning = message.parts
              .filter((p) => p.type === "reasoning")
              .map((p) => ("text" in p ? p.text : ""))
              .join("\n")
              .trim();
            const text = message.parts
              .map((p) => (p.type === "text" ? p.text : ""))
              .join("")
              .trim();

            return (
              <Message from={message.role} key={message.id}>
                <MessageContent
                  className={message.role === "user" ? "" : "bg-transparent p-0"}
                  style={
                    message.role === "user"
                      ? { background: "var(--brand-blue)", color: "#fff" }
                      : { color: "var(--ink-900)" }
                  }
                >
                  {message.role === "assistant" && reasoning && (
                    <details className="mb-2 rounded-lg border px-3 py-2" style={{ borderColor: "var(--hairline)" }}>
                      <summary className="cursor-pointer text-[12px] font-medium" style={{ color: "var(--ink-500)" }}>
                        Thinking
                      </summary>
                      <div className="mt-2 whitespace-pre-wrap text-[12px]" style={{ color: "var(--ink-500)" }}>
                        {reasoning}
                      </div>
                    </details>
                  )}
                  {text ? (
                    message.role === "assistant" ? (
                      <MessageResponse className="text-[14px]">{text}</MessageResponse>
                    ) : (
                      <span className="whitespace-pre-wrap text-[14px]">{text}</span>
                    )
                  ) : null}
                </MessageContent>
              </Message>
            );
          })}

          {messages.length > 0 && followUps.length > 0 && !busy && (
            <div className="flex flex-wrap justify-end gap-2 px-1 pb-1">
              {followUps.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => submit(s)}
                  className="rounded-full border px-3 py-1.5 text-left text-[12px] transition-colors hover:bg-[color:var(--surface-soft)]"
                  style={{ borderColor: "var(--hairline)", color: "var(--ink-700)" }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}


          {status === "submitted" && (
            <div className="px-1 py-2">
              <Shimmer className="text-[13px]">Thinking…</Shimmer>
            </div>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {renderPrompt && (
        <div className="shrink-0">{renderPrompt({ input, setInput, submit, status, busy, stop, textareaRef })}</div>
      )}

      {!hidePrompt && !renderPrompt && (
        <div className={compact ? "p-3" : "px-6 py-4"}>
          <div className={compact ? "" : "mx-auto w-full max-w-3xl"}>
            <PromptInput
              onSubmit={(_message, event) => {
                event.preventDefault();
                submit(input);
              }}
            >
              <PromptInputTextarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your data…"
              />
              <PromptInputFooter className="justify-end">
                <PromptInputSubmit status={status} disabled={!input.trim() && !busy} onStop={stop} />
              </PromptInputFooter>
            </PromptInput>
          </div>
        </div>
      )}
    </div>
  );
}
