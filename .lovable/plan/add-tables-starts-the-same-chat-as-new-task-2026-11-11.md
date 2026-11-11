# Add tables starts the same chat as New task

## What changes
Clicking **+ Add tables** on a domain's Tables tab opens the same chat setup as **+ New task**, worded for tables:

1. The chat opens with "Add tables to <domain>" already sent. It's saved right away in Recents under that domain, as "Add tables: <domain>", and can be picked up again later.
2. If the chat is on All domains, the agent first asks "Which domain are these tables for?" and shows one button per domain.
3. The agent asks the same three things as New task: which tables, any specific checks (it also recommends some), and how often to run them.
4. The plan opens in the right panel: tables grouped by warehouse, the checks for each table, and the schedule. You can edit it there or in the chat.
5. The button reads **Add tables**. Clicking it adds the tables to the domain and creates a task that runs those checks on that schedule. You then land on that task's chat, which opens with "Tell me about the … task".

Nothing else changes: + New task works as before, and so do setups already in Recents.

## Technical details
- `AgenticAddAssetModal`: add a setup purpose `"tables"` and reuse the task path (`isTask` becomes "task or tables"): the auto-start effect, the domain then details stages, and `startDrafting`. It differs only in the start prompt, the domain question, the header ("Add tables · <domain>") and the confirm label.
- On confirm with `"tables"`: call `buildAssets` (tables added to the domain), then the existing `onTaskComplete` (creates the Schedule and opens its thread).
- `SetupSessionProvider`: accept the new purpose. The Recents label uses "Add tables:" for it.
- Domain panel: the + Add tables button calls `setup.openNew(inDomain, "tables")`.
- Update the scheduled/domain AGENTS.md rule to say Add tables shares the task setup flow.
