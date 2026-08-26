import { ArrowUp } from "lucide-react";
import { useRef, type FormEvent, type RefObject, type KeyboardEvent } from "react";
import type { ChatStatus } from "@ai-sdk/react";

interface ChatPromptBoxProps {
  input: string;
  setInput: (value: string) => void;
  submit: (text: string) => void;
  status: ChatStatus;
  busy: boolean;
  stop: () => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
}

export function ChatPromptBox({
  input,
  setInput,
  submit,
  status,
  busy,
  stop,
  textareaRef,
}: ChatPromptBoxProps) {
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    submit(input);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit(input);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-start gap-2 p-2"
      style={{
        boxSizing: "border-box",
        width: "736px",
        height: "136px",
        background: "#E3E3F2",
        border: "1px solid rgba(0, 0, 204, 0.14)",
        boxShadow:
          "0px -2px 20px -10px rgba(67, 67, 112, 0.15), 0px 24px 48px -16px rgba(67, 67, 112, 0.5)",
        borderRadius: "16px",
        zIndex: 2,
      }}
    >
      <textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask about your data…"
        className="w-full flex-1 resize-none bg-transparent px-2 py-1 text-[14px] outline-none"
        style={{ color: "var(--ink-900)" }}
      />
      <div className="flex w-full justify-end px-1 pb-1">
        {status === "submitted" || status === "streaming" ? (
          <button
            ref={buttonRef}
            type="button"
            onClick={() => stop()}
            aria-label="Stop response"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white transition-opacity hover:opacity-90"
            style={{ background: "var(--ink-900)" }}
          >
            <span className="block h-3 w-3 rounded-sm bg-white" />
          </button>
        ) : (
          <button
            ref={buttonRef}
            type="submit"
            disabled={!input.trim()}
            aria-label="Send message"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white transition-opacity disabled:opacity-40"
            style={{ background: "var(--brand-blue)" }}
          >
            <ArrowUp size={16} />
          </button>
        )}
      </div>
    </form>
  );
}
