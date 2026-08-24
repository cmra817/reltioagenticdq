# Bring back AgentFlow chat

The previous chat code is no longer in the project (no chat components, routes, or wizard assistant panel remain), so this rebuilds the experience from scratch on top of the current shell.

## Experience

1. **Prompt box at the bottom of every page** — a slim, centered composer docked at the bottom of the app shell on Data health, Explore, DQ checks, Incidents, and table detail pages. Hidden inside the Add dataset wizard and any other full-page modal. Placeholder is context-aware (e.g. "Ask AgentFlow about Finance Sales Data…"). Submitting creates a new chat, stores the first message, and navigates to that chat's page.
2. **Chat page** — `/chat/$chatId` inside the normal app shell: transcript above, composer at the bottom, streamed assistant answers with a thinking indicator, and a domain-aware system prompt so answers reference the selected domain, its tables, checks, and schedules.
3. **Right panel on the wizard** — the Apply checks and Schedule steps regain an "AgentFlow" assistant column on the right where users can prompt in natural language ("weekly on Monday at 6am", "add a null check on order_id"). The assistant replies in the panel; applying its suggestion to the step's state stays a follow-up (the panel starts conversational only, matching the earlier prototype behaviour).
4. **+ New menu** — "New chat" is added back as the first item in the sidebar's + New menu, above Add new dataset / Create new domain. It opens a fresh chat page.
5. **Recent chats** — a section in the left sidebar under the primary nav listing the most recent chats by auto-generated title (first user message, trimmed), newest first, with the active chat highlighted, a "New chat" affordance, and hover delete/rename. Capped at ~8 visible with a "Show all" expansion.

Chats are threaded, each with its own URL, and persist in this browser (localStorage), same pattern as created assets today.

## Technical notes

- `src/components/chat/chat-context.tsx` — localStorage-backed store (`{ id, title, createdAt, updatedAt, messages }`), idempotent hydration guarded by `typeof window`, actions: create, append, rename, delete, list. Provider mounted in `app-shell.tsx` alongside the existing providers.
- `src/routes/api/chat.ts` — streaming server route using the Lovable AI Gateway Responses API with `openai/gpt-5.6-sol` (streaming, reasoning on, `store: false`), returning a UI message stream. `LOVABLE_API_KEY` stays server-side; gateway 402/429/403 errors surface as toasts rather than fake assistant replies.
- Client uses AI SDK `useChat` with `DefaultChatTransport` pointed at `/api/chat`, keyed by `chatId`; messages render via `message.parts`. Persist completed turns into the localStorage store.
- Chat surface built from AI Elements primitives (conversation, message, prompt-input, shimmer) installed via the shadcn registry, then restyled with the existing Reltio tokens (`--brand-blue`, `--hairline`, `--ink-*`) so it matches the app rather than the default look.
- `src/components/chat/dock-composer.tsx` — the bottom prompt box, rendered once in the app shell; suppressed when a wizard/full-page modal is open (shell-level flag) and on `/chat/*` where the page owns its own composer.
- `src/components/chat/wizard-chat-panel.tsx` — the wizard right column, sharing the same message rendering and transport but with its own ephemeral (non-persisted) session per step.
- Requires enabling Lovable AI (`LOVABLE_API_KEY`) and adding `ai`, `@ai-sdk/react`, `@ai-sdk/openai` packages. No database changes.
