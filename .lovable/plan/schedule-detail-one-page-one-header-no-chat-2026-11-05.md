# Schedule detail: one page, one header, no chat

Rework the schedule page (`/scheduled?schedule=…`) to follow the reference screenshot: one page instead of a chat panel plus a workspace panel.

## Layout

```text
Schedules / Finance daily checks  v                    (breadcrumb row)
-----------------------------------------------------------------------
Finance daily checks                         [Run now]  Active (o)
Finance · DQ checks · Owner Carina · Next run: tomorrow at 2:00 AM
-----------------------------------------------------------------------
Run history (left, ~45%)          | What will run   (right, ~55%)
  Failed  2 of 14 checks   2h ago |   tables by warehouse, checks,
  Passed  0 of 14 checks   1d ago |   Add tables / Add check, remove
  ...                             | When will it run
                                  |   Profiling / DQ checks time rows
```

- **One shared header** across the whole page: breadcrumb ("Schedules / name"), then the schedule name, a short meta line, and Run now + the Active toggle on the right. The header inside the plan section goes away.
- **Left group, Run history:** the existing run list as a plain list (status, checks result, time). Clicking a run still opens it.
- **Right group, task details:** the same "What will run" and "When will it run" sections as Add data asset's plan, still edited inline — just shown as sections on the page, not as a separate panel.
- **No chat:** the chat box, suggestions and chat thread are removed from this page.
- The page scrolls as one; content is centered with a max width like the screenshot.

## Technical details

- `src/components/scheduled/schedule-view.tsx`: drop `SplitWorkspace` and `ScopedChat` (and the `reply` function). Render a page header (breadcrumb button back to Schedules, h1, tags/meta, Switch + PrimaryButton) and a two-column grid below (`lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]`, stacking on narrow screens).
- Right column renders `PlanView` with no `title`/`subtitle`/`headerActions`, so it shows only its sections. If PlanView still renders an empty header bar or relies on full-height panel layout, add a small `bare` prop to suppress its header and let it size to content. Dialogs (Add tables, rule modal) keep anchoring to the right column's relative wrapper.
- Agentic Add data asset is unchanged.
