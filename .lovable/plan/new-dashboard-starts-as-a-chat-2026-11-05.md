# New dashboard starts as a chat

## What changes
Clicking **New dashboard** on Data health no longer shows a name box. It opens a new dashboard setup in the chat panel, like Claude's "new scheduled task":

1. **Prefilled prompt** — the chat box opens filled with: "Help me build a new dashboard. Ask me which data assets to monitor, what my goal is, and anything else you need, then build it." The cursor sits at the end so you can edit or just press Enter.
2. **Agent asks its questions** in one reply, numbered, with short examples:
   1. **Which data assets should it watch?** e.g. a domain (Finance), specific tables (customers, contacts), or a connector.
   2. **What's the goal?** e.g. catch failed checks before month-end close, watch connector freshness, track duplicates.
   3. **Who is it for?** Just you, or shared with your team.
   4. **How often should it refresh?** e.g. daily at 7:00 AM, or with every scheduled run.
   Ends with: "Once I have those, I'll build it."
3. **You answer in plain words** (one message or several). The agent asks only for what's still missing, then summarizes back what it will build and asks to confirm.
4. **On "Yes"** the dashboard is created and named from your answers (e.g. "Finance close readiness"), selected in the dropdown, and the right panel shows its stats. The setup conversation stays in that dashboard's chat.
5. **Cancel** — while setting up, a small "Cancel" link next to the dropdown drops the draft and returns to the previous dashboard.

While setting up, the right panel shows a light placeholder ("Your dashboard will appear here") that fills in with the answers as they're understood (assets, goal, audience, refresh) — no stats yet.

## Out of scope
- Real AI: replies stay scripted like the rest of the app's chats, recognizing domains/tables/goals by keywords.
- Editing an existing dashboard's setup later (you can still ask the chat to add/remove cards).

## Technical details
- `data-health-page.tsx`: replace the inline name form with a `setup` state (`{ prevId, answers }`); "New dashboard" enters setup mode and renders a `DashboardSetupSplit` instead of `DashboardSplit`.
- Setup chat uses `ScopedChat` with an `initialInput` (new optional prop in `workspace/primitives.tsx`) for the prefilled prompt; reply function is a small state machine extracting `assets / goal / audience / refresh` from text against domain and table names in `mock-ops.ts`, then a confirm step.
- On confirm, extend `CustomDashboard` with `assets`, `goal`, `audience`, `refresh` and the setup turns; save via the existing `useLocalStore` key, set active, and seed that dashboard's thread with the setup turns.
- Placeholder right panel: a new small `DashboardDraftPanel` listing captured answers.
- Verify in the preview: New dashboard → prompt prefilled → Enter → four questions → answer → confirm → dashboard appears in dropdown with its panel.
