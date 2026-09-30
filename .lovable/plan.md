# Agentic “Set it up step by step” uses the regular stepper

## Experience
- Keep the agentic opening screen and its **Set it up step by step** link unchanged.
- Clicking the link replaces the agentic chat screen with the existing three-step workflow: **Select data → Apply checks → Schedule**.
- Keep the app’s left navigation and top shell visible. The workflow fills only the main content area rather than taking over the full screen.
- Do not show a chat panel beside the stepper workflow.
- Preserve the regular workflow’s Back, Continue, and Finish setup behavior, including validation and completion.

## Reuse and consistency
- Reuse the existing stepper, table picker, check selection, schedule controls, recommended checks, custom checks, and completion logic rather than creating a second version.
- Add a shell-friendly presentation mode to the shared stepper workflow. The current regular **Add new dataset** flow keeps its existing full-screen presentation and chat panels.
- Reset stepper state when the agentic experience closes, and return to step one whenever the step-by-step path is opened again.

## Layout
- Position the stepper experience beside the fixed left navigation and below the app shell bar.
- Give the workflow one full-width scrolling content area, with no right-side plan or chat column.
- Adapt the existing header spacing for the smaller available canvas while retaining the domain context and step progress.

## Verification
- Verify the agentic opening screen switches to the stepper on click.
- Verify all three steps, Back/Continue, table and check state, schedule editing, and Finish setup.
- Verify the left navigation stays visible and usable, no chat panel appears, and the regular non-agentic workflow remains unchanged.
