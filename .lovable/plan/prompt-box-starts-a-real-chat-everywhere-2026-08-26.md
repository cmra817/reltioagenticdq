# Prompt box starts a real chat everywhere

Typing in the prompt box at the bottom of any page should start a chat that looks and behaves exactly like one started from "+ New → New chat": a full chat page, saved under Recent chats, with a prompt box at the bottom.

## What changes

1. Unified new-chat behavior
   - Any prompt typed in the page dock creates a thread, navigates to that thread's page, and sends the first message — same page, same layout, same suggestions as a chat started from "+ New".
   - The thread title comes from the first message, so it shows immediately under Recent chats.

2. Consistency investigation keeps its script, but is now saved
   - Prompts mentioning "consistency" still open the scripted investigation thread.
   - That thread is now created as a real chat thread, so it appears under Recent chats and can be reopened from the sidebar.
   - It gets the same bottom prompt box; after the scripted turns finish, follow-up questions continue as a normal conversation in that same thread.

3. Chat page layout polish
   - Transcript sits in a centered, readable column that anchors to the bottom of the conversation instead of floating at the top of an empty page.
   - Assistant replies render as styled markdown (headings, lists, spacing) rather than plain unformatted lines; user messages stay as the filled bubble.
   - Prompt box becomes fluid: same visual style (soft lavender fill, rounded corners, shadow) but it matches the transcript column width instead of a fixed 736px block, with proper padding so messages never hide behind it.

## Technical notes

- `dock-composer.tsx`: create and persist a thread for the consistency path too, then navigate to `/investigate/consistency` with that thread id in search params.
- `investigate.consistency.tsx` / `investigation-thread.tsx`: accept a thread id, persist the scripted turns via `saveMessages`, render the shared `ChatPromptBox` in the footer, and hand off to the normal chat send path once the script ends.
- `chat.$chatId.tsx`: replace the fixed `pb-[164px]` + absolute 736px composer with a flex column where the composer is the bottom row constrained to the same `max-w-3xl` content width.
- `chat-window.tsx`: bottom-anchor the conversation content and route assistant text through the AI Elements `MessageResponse` markdown renderer.
- `chat-prompt-box.tsx`: keep the given colors/shadow/radius, drop fixed width/height in favor of full-width with a min-height.
