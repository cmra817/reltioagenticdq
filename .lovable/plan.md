

# "Create New Domain" Modal

When the user clicks **Create new domain** in the topbar's `+ New` dropdown, open a centered modal that lets them name a new domain and confirm. Layout/content follow the wireframe; styling matches the rest of the app (Reltio blue accents, hairline borders, soft shadow, Inter type scale).

## Trigger

In `src/components/agentflow-topbar.tsx`, the existing `NewMenu` dropdown's **Create new domain** item currently just closes the menu. Change it to:
1. Close the dropdown.
2. Open the new `CreateDomainDialog` (local `useState` in `AgentflowTopbar`).

The **Add new dataset** item stays a no-op for now.

## Dialog visual spec

Use the existing `@/components/ui/dialog` primitives (already in the project) so we get the overlay, focus trap, Escape-to-close, and the built-in `X` close button "for free" — that matches the wireframe's top-right close.

- Width: `max-w-[560px]`, `rounded-2xl`, white background, `border` in `var(--hairline)`, shadow `0 24px 60px rgba(15,23,42,0.18)`.
- Padding: `px-10 pt-12 pb-10`.
- Content stack, centered text:
  - **Title** (`DialogTitle`): "Let's get you started with a new domain" — 22px, `font-semibold`, `var(--ink-900)`, `text-center`.
  - **Description** (`DialogDescription`): "A domain is your team's corner of the data catalog — a curated space for the assets that matter to you." — 14px, `var(--ink-500)`, `text-center`, `max-w-[440px] mx-auto`, `mt-3`.
  - Spacer `mt-8`.
  - **Input**: full-width, `h-12`, `rounded-lg`, `border` in `var(--hairline)`, placeholder "Name your domain", 15px text, focus border `var(--brand-blue)` + faint focus ring `0 0 0 3px rgba(67,134,250,0.15)`. Reuse `@/components/ui/input` and override height/radius via className.
  - Spacer `mt-10`.
  - **Footer** (`DialogFooter` overridden to `justify-center`): single primary button **Get started**, filled `var(--brand-blue)`, white text, `h-11 px-8 rounded-lg`, `font-medium`, hover slightly darker (`brightness-95`). Disabled (50% opacity, `cursor-not-allowed`) when the input is empty/whitespace.

The default Radix `X` close button from `DialogContent` already sits top-right and matches the wireframe — no custom close button needed.

## Behavior

- Local state inside `CreateDomainDialog`: `const [name, setName] = useState("")`.
- Pressing **Enter** in the input triggers **Get started** when `name.trim()` is non-empty.
- On submit (this turn): just close the dialog and reset `name` — no persistence, no toast, no sidebar update yet. We'll wire it into the sidebar's `DomainPill` domain list in a follow-up turn.
- Closing the dialog (X, overlay click, Escape, or successful submit) resets `name` to `""`.

## Component changes

New file: `src/components/create-domain-dialog.tsx`
- Props: `{ open: boolean; onOpenChange: (open: boolean) => void; onCreate?: (name: string) => void; }`.
- Renders the `Dialog` / `DialogContent` / `DialogHeader` / `DialogTitle` / `DialogDescription` / `Input` / `DialogFooter` / `Button` tree described above.

Edit: `src/components/agentflow-topbar.tsx`
- Import `useState` (if not already), the new `CreateDomainDialog`.
- Lift dialog open state into `AgentflowTopbar` (or co-locate with `NewMenu` and pass a callback). Simpler: keep `NewMenu` self-contained — add `const [domainOpen, setDomainOpen] = useState(false)` inside `NewMenu`, render `<CreateDomainDialog open={domainOpen} onOpenChange={setDomainOpen} />` as a sibling of the menu, and have the **Create new domain** item call `setOpen(false); setDomainOpen(true);`.

## Out of scope (this turn)

- Persisting the new domain into the sidebar `DomainPill` list (currently local state in that component — needs lifting in a follow-up).
- Validation beyond "non-empty after trim" (e.g., uniqueness, length cap, allowed characters).
- Wiring **Add new dataset** to its own modal/flow.
- Success toast / animation.

