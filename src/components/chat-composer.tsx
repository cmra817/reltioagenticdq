import { useState } from "react";
import { MicIcon, SendIcon } from "./brand-icons";

export function ChatComposer() {
  const [value, setValue] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setValue("");
      }}
      className="flex items-center gap-3 rounded-full border bg-white px-5 py-2.5"
      style={{
        borderColor: "var(--hairline)",
        boxShadow: "var(--shadow-input)",
      }}
    >
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Ask AgentFlow..."
        className="h-10 flex-1 bg-transparent text-[15px] outline-none placeholder:text-[color:var(--ink-100)]"
        style={{ color: "var(--ink-900)" }}
      />
      <button
        type="button"
        aria-label="Voice input"
        className="flex h-10 w-10 items-center justify-center rounded-full text-[color:var(--ink-500)] transition-colors hover:bg-[color:var(--surface-soft)]"
      >
        <MicIcon size={18} />
      </button>
      <button
        type="submit"
        aria-label="Send"
        className="flex h-10 w-10 items-center justify-center rounded-full text-white transition-transform hover:scale-105"
        style={{
          background: "linear-gradient(135deg, var(--brand-blue-bright), var(--brand-blue))",
          boxShadow: "0 6px 16px -4px rgba(67,134,250,0.5)",
        }}
      >
        <SendIcon size={18} />
      </button>
    </form>
  );
}
