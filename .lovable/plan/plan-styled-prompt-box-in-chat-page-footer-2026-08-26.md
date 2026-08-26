# Plan: Styled Prompt Box in Chat Page Footer

## Goal
Add a styled prompt/composer box fixed to the footer of the full-page chat (`/chat/$chatId`) using the exact design values provided.

## What will change
- `src/routes/chat.$chatId.tsx`: replace the inline `ChatWindow` usage with a layout that keeps the transcript in the upper area and renders a new absolute-positioned prompt box at the bottom.
- A new component (or inline section) for the chat-page prompt box with the provided styling:
  - `position: absolute`
  - `width: 736px`, `height: 136px`
  - `left: 214px`, `top: 755px` (translated to a centered-anchored, responsive equivalent inside the chat main area)
  - `background: #E3E3F2`
  - `border: 1px solid rgba(0, 0, 204, 0.14)`
  - `box-shadow: 0px -2px 20px -10px rgba(67, 67, 112, 0.15), 0px 24px 48px -16px rgba(67, 67, 112, 0.5)`
  - `border-radius: 16px`
  - `padding: 8px`, `gap: 8px`, flex column, align-items flex-start

## Implementation approach
1. Create a chat-specific footer prompt box component that wraps the existing AI Elements `PromptInput` primitives so chat submission, streaming status, stop, and auto-focus continue to work.
2. Apply the exact CSS values via inline styles/Tailwind arbitrary values.
3. In `chat.$chatId.tsx`, render the chat transcript above and the new absolute prompt box at the bottom of the main area. Keep `hideDock` behavior so the global dock composer does not overlap.
4. Preserve all existing chat behavior: seed prompt (`q` search param), persistence via `useChatThreads`, suggestions, and `onIntercept`.

## Out of scope
- No changes to the dock composer used on other pages.
- No changes to the investigation thread route.
- No backend or chat API changes.
