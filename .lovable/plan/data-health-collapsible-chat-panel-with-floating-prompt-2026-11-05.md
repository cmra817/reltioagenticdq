# Data health: collapsible chat panel with floating prompt

Same behavior the agentic "Add data asset" flow already uses when its chat is collapsed; reuse that pattern.

## What the user sees
1. **Hide chat button** — a panel icon (as in the screenshot) in the top-right of the chat panel header. Tooltip: "Hide chat".
2. **Chat hidden** — the stats panel (workspace) expands to the full width beside the left menu.
3. **Show chat button** — the same panel icon sits at the left edge of the workspace header. Tooltip: "Show chat". Clicking it brings the chat back at its normal width, with the full conversation intact.
4. **Floating prompt** — while the chat is hidden, a single-line translucent prompt box floats at the bottom center of the workspace.
   - After you send, your question shows above it with a "thinking" indicator.
   - The reply appears as a floating card above the prompt. It closes when you dismiss it, start typing a new question, or reopen the chat.
   - Messages sent from the floating prompt go into the same conversation, so they appear when the chat is reopened.
5. Each dashboard remembers its own conversation. The hidden or shown state stays the same when you switch dashboards.

## Technical details
- Lift the `ScopedChat` turn state for each dashboard into `data-health-page.tsx` (a `useChatTurns` hook in `workspace/primitives.tsx`), so the docked chat and the floating prompt share one thread.
- `SplitWorkspace` gets optional `collapsed` / `onToggle` props. When collapsed, it hides the center column and the aside fills the row. The hide button goes in the chat header, and the show button goes top-left in the panel.
- Add a `FloatingPrompt` component that copies the logic of the `AgenticAddAssetModal` collapsed pill (lines ~815–935): `showAsk`, `showReply` driven by `seenUpTo`, and dismiss.
- Use the `PanelLeft`/`PanelRight` lucide icons to match the screenshot. Every button gets an aria-label and keyboard focus ring.
- Other pages that use `SplitWorkspace` stay unchanged, because the new props are opt-in.
- Check with Playwright: hide, check the full-width panel, send from the floating prompt, see the reply, reopen, and confirm the message is in the thread.
