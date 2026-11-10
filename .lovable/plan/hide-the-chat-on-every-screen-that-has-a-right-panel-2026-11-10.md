# Hide the chat on every screen that has a right panel

Rule: wherever a chat sits next to a right panel, there is always a "Hide chat" icon at the top right of the chat. Hiding it gives the panel the full width and shows a "Show chat" icon at the top left of the panel, plus the small floating prompt box (as on Dashboards: you type, a short answer floats up, then fades). It works the same everywhere.

## Where it's missing today

| Screen | Today | After |
|---|---|---|
| Domain chat / table page (`/domain`) | No way to hide | Hide/show + floating prompt |
| Project chat | No way to hide | Hide/show + floating prompt |
| Rule | Only once a draft exists | Always |
| Job | "Show chat" only after the first message | Always |
| Dashboard chat | Only when the dashboard is expanded | Always, minimized panel too |
| Add asset (agentic) | Already has it | Unchanged; checked for consistency |

## How it behaves

- The icon position, tooltip text ("Hide chat" / "Show chat") and floating prompt are identical on every screen.
- Hidden or shown resets when you open a different item; it does not carry over between screens.
- Small screens (panel stacks below the chat): the hide icon still works and the panel takes the full width.
- Questions sent from the panel while the chat is hidden (auto prompts) show their answer in the floating card instead of reopening the chat.

## Technical details

- Move hide/show into the shared `SplitWorkspace`: it shows the Hide toggle whenever a panel exists, renders the "Show chat" toggle at the panel's top left when collapsed, and takes the open state either from the screen (controlled) or keeps its own. Remove the per-screen "Show chat" placements so there's one copy.
- Domain and Projects screens pass their existing chat thread to `FloatingPrompt`.
- Drop the conditions in rule, job and dashboard screens that hide the toggle.
- Record the rule in root `AGENTS.md`; verify each screen in the preview (hide, type in floating prompt, show again).
