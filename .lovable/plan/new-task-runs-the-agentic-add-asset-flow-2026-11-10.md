# "+ New task" runs the agentic add-asset flow

Clicking **+ New task** opens the same agentic experience as adding a data asset: the same chat, the same "Your plan" workspace (tables grouped by warehouse, checks, when it runs), the same confirmation step and the same Step-by-step option. Only the start and the end change, because the result is a task in a domain.

## Flow

```text
+ New task
  -> chat opens, prompt already sent: "Set up a new task"
  -> Domain known?  no (All domains) -> agent: "Which domain is this task for?" + one chip per domain
                    yes              -> skip
  -> agent: "Sure, I can help you with that. Just let me know:
            (1) What tables you'd like to monitor
            (2) Are there any specific checks you'd like to run them against? I will also recommend some.
            (3) How often would you like to run this task."
     (chat only, no right panel yet: nothing has been created)
  -> user answers
  -> agent creates the task: the right panel opens with the plan (tables, chosen + recommended checks, schedule)
  -> user reviews and edits (chat or inline)
  -> Save task -> task is created under that domain and its task page opens
```

- **Domain:** taken from the domain selected in the side menu. With All domains, the agent asks first and nothing else happens until a domain is picked (chip or typed name). The chosen domain shows in the header next to the title and cannot change after that.
- **Tables offered:** only tables from the chosen domain.
- **Naming:** the agent suggests a name (for example "Daily checks — Finance"), editable in the plan before saving.
- **Finish button** reads **Save task** (instead of the asset flow's finish). Cancel returns to the Tasks page.
- **Recents:** an unfinished task setup is saved and listed under its domain as "New task: Finance", with the same setup icon as asset setups; opening it resumes where you left off. Once saved, it becomes the task's chat.
- The Add asset entry point keeps working exactly as today.

## Technical details

- Add a `purpose: "asset" | "task"` to setup sessions (`openNew(domain, purpose)`), stored on the session so resume knows which ending to use.
- `AgenticAddAssetModal` takes `purpose`: seeds the first user turn with the task prompt; when `domainName` is empty, queues a domain question before the normal script; title/labels and finish copy switch on purpose.
- On completion with `purpose: "task"`, convert the plan to a `Schedule` (tables, rule ids from the checks, cadence from the schedule section, `domain`) and add it via `ops-store`, then navigate to that task's chat. The task's chat gets the existing "Tell me about the … task" auto prompt.
- `scheduled-screen.tsx` "New task" calls `setup.openNew(selected, "task")` instead of starting a generic chat.
- Update `src/components/scheduled/AGENTS.md` and save the "a task always belongs to one domain" rule to memory.
