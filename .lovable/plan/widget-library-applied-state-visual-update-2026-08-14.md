# Widget Library — Applied State Visual Update

## Goal
Improve the visual distinction between "Apply" and "Applied" widgets in the Widget Library modal so already-applied widgets no longer look like clickable buttons.

## Current state
`src/components/data-health/WidgetLibraryModal.tsx` renders a single button in each widget card footer. When the widget is already applied, the button is disabled and shows centered "Applied" text in the brand-blue color, which looks very similar to the active "Apply" button.

## Changes
1. In `WidgetLibraryModal.tsx`, conditionally render the footer action:
   - If not applied: keep the existing outlined "Apply" button.
   - If applied: render a left‑aligned green text label with a checkmark icon and the word "Applied".
2. Use the existing app green token (`var(--success)`) for the text/icon so it matches the design system.
3. Keep the "Clone" button visible for applied widgets so users can still duplicate them.
4. Do not change the card layout, filters, search, or any other behavior.

## Acceptance
- Applied widgets show a left‑aligned green checkmark + "Applied" text instead of a button.
- Non‑applied widgets still show the "Apply" button.
- Clone button remains available for all widgets.
- No visual regressions in the rest of the modal.
