# One new-chat page for "New chat" and domains

## What changes for you
- **New chat** and clicking a domain open the same page: the domain chat page.
  - Clicking a domain opens it scoped to that domain.
  - **New chat** opens it scoped to **All domains**. You can switch the scope before your first message.
- On an empty chat, the "Chat" intro, the suggestions and the prompt box (with the Scope and Project pickers) sit together in the middle of the chat area. After the first message, the prompt box moves to the bottom.
- The right panel is the same everywhere: it starts minimized with the brief, health score, the three lowest tables, and the Tables and Projects rows. Expand opens Overview / Tables / Checks.
- Chats you start this way still show up in Recents, grouped by domain (or under All domains), and reopen on the same page.
- The older chat page and its separate right panel stop being used. Existing links to old chats (Recents, search, Scheduled's "ask" buttons) open on the new page, so nothing is lost.

## Technical details
- `agentflow-sidebar.tsx`: "New chat" navigates to `/domain?all=true` (a fresh `DomainWorkspace` gets a new thread id), instead of `/chat/$chatId`.
- `domain-screen.tsx` / `ScopedChat`: when `thread.turns.length === 0`, render header + suggestions + composer (with `composerTop`) vertically centered as one group, mirroring the empty-state layout in `chat-window.tsx`; otherwise keep the bottom-docked composer.
- Support a `q` search param on `/domain` to auto-send a seed prompt (needed by Scheduled and search entry points that currently use `/chat/$chatId?q=`).
- `routes/chat.$chatId.tsx`: becomes a redirect. Threads with kind `domain` go to `/domain?thread=<id>`; legacy generic chats are migrated into `agentflow.domain-chats.v1` (messages mapped to turns, domain kept) and then redirected, so one page renders every chat.
- Update callers that build `/chat/$chatId` links (`search-dialog.tsx`, `scheduled-screen.tsx`, `data-health-page.tsx` non-dashboard uses) to the `/domain` form.
- `ScopeRail`/`ScopePanel` (`scope-rail.tsx`) and `ScopePicker` become unused; remove them.
- Update the AGENTS.md rules for `/chat/$chatId` and the domain page to say there is one chat page.
