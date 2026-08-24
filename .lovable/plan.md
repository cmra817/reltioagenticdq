# Contextual chat panel in the Add data asset wizard

The panel already exists and renders on Apply checks and Schedule. The only gap is the first step, Select data, which has no assistant column. This plan extends the existing panel to cover all three steps so the wizard has a consistent right-hand assistant.

## What changes

- Add the assistant column to step 1 (Select data), matching the width, header, and styling of the existing panel.
- Give step 1 its own context and suggestions, for example:
  - "Which tables should I monitor first?"
  - "Find customer tables in Snowflake"
  - "What does this table contain?"
- Keep the existing header subtitle pattern: a short line describing what the assistant helps with on that step.
- Keep each step's conversation separate, as it works today (new chat id per step context).

## Technical notes

- `src/components/chat/wizard-chat-panel.tsx`: widen the `context` union to include `"select"` and add its default suggestions, empty-state title, and subtitle.
- `src/components/add-dataset/AddDatasetModal.tsx`: render `<WizardChatPanel context="select" />` for `step === 0` alongside the existing step 1 and 2 cases.
- No changes to `ChatWindow`, the chat API route, or persistence.
