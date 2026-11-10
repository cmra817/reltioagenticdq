import type { RefObject } from "react";
import type { ChatStatus } from "ai";
import { PromptBox } from "./prompt-box";

interface ChatPromptBoxProps {
  input: string;
  setInput: (value: string) => void;
  submit: (text: string) => void;
  status: ChatStatus;
  busy: boolean;
  stop: () => void;
  textareaRef?: RefObject<HTMLTextAreaElement | null>;
  placeholder?: string;
}

/** Bottom-of-chat placement of the shared PromptBox. */
export function ChatPromptBox({
  input,
  setInput,
  submit,
  status,
  stop,
  textareaRef,
  placeholder = "Ask Reltio…",
}: ChatPromptBoxProps) {
  const streaming = status === "submitted" || status === "streaming";
  return (
    <div className="px-6 pb-5">
      <div className="mx-auto w-full max-w-3xl">
        <PromptBox
          value={input}
          onChange={setInput}
          onSubmit={submit}
          placeholder={placeholder}
          textareaRef={textareaRef}
          busy={streaming}
          onStop={stop}
        />
      </div>
    </div>
  );
}
