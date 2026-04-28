## Step 2 — Apply checks

Build out the placeholder Step 2 into a full "Apply checks" experience that mirrors the Step 1 layout (left content area + right AgentFlow chat panel already provided by the modal shell).

### Layout

```text
┌────────────────────────────────────────────────────┬──────────────┐
│ Sub-header: "Apply data quality checks"            │              │
├────────────────────────────────────────────────────┤              │
│ Tabs: [ customers (14) ] [ orders (7) ]   +Add ▸  │  AgentFlow   │
├────────────────────────────────────────────────────┤  chat panel  │
│ Checks table for the active tab:                   │  (existing)  │
│  ☑ Rule | Description | DQ dimension | Field       │              │
│  ☑ customer_id is not null  …  Completeness  …     │              │
│  ☑ customer_id is unique    …  Uniqueness    …     │              │
│  …                                                 │              │
└────────────────────────────────────────────────────┴──────────────┘
```

The right AgentFlow panel already lives at the modal level, so Step 2 only needs to render the left content. The modal's existing header (Cancel / Back / Continue) stays — the final Continue button label already reads `Add N assets`.

### What gets built

**1. New file: `src/components/add-dataset/Step2ApplyChecks.tsx`**

- Props: `selected: Set<string>` (the asset keys carried over from Step 1).
- Derives the list of selected assets from `WAREHOUSES` + `selected` keys (parse `connId::schema::asset`).
- Tabs across the top — one per selected table, label = `name (checkCount)`. Active tab styled with a bottom underline using `var(--brand-blue)`, inactive in `var(--ink-500)`.
- A "+ Add checks" pill on the far right of the tab strip (visual only for now, matches the wireframe's blue chip).
- Below the tabs, a checks table with columns: **Rule**, **Description**, **DQ dimension**, **Field applied**.
- Each row has a checkbox (controlled, default checked). Toggling updates local state so the tab counts can update live.
- A small lightning-bolt badge in the top-right of the card matches the wireframe accent.

**2. Mock checks generator: `src/components/add-dataset/mock-checks.ts`**

- Exports `generateChecks(assetName: string): Check[]` returning a deterministic set of suggested checks per asset (seeded from the asset name so two tabs always show different recommendations).
- `Check` type: `{ id, rule, description, dimension: 'Completeness'|'Uniqueness'|'Validity'|'Consistency'|'Timeliness', field }`.
- Hand-curated examples for `dim_customers`, `fct_orders_daily`, plus a generic fallback that uses common patterns (`*_id is not null`, `*_id is unique`, `email matches valid format`, `created_at is not null`, etc.) so any selected asset gets a plausible list.

**3. Modal wiring: `src/components/add-dataset/AddDatasetModal.tsx`**

- Replace `Step2Placeholder` with `<Step2ApplyChecks selected={selected} />`.
- Remove the now-unused placeholder component.

**4. AgentFlow step-aware intro: `src/components/add-dataset/AgentChatPanel.tsx`**

- Accept a new `step: number` prop from the modal.
- When `step === 1`, seed an additional agent message summarizing the Step 2 context (mirrors the wireframe copy):
  - "Based on the N tables you selected, I've analyzed the column names and data types."
  - "I recommend starting with X data quality checks across your tables. I've automatically selected these for you based on common validation patterns."
  - Bulleted breakdown: `customers: 14 checks`, `orders: 7 checks`, etc.
  - "Would you like to see details on why I recommended specific checks, or are you ready to proceed to profiling?"
- The existing Step 1 keyword handling (`freshness`, `recommend`, etc.) is preserved for `step === 0`.
- The modal passes `step={step}` to `<AgentChatPanel>`.

### Visual conventions (matches existing components)

- Card chrome: white bg, `1px solid var(--hairline)`, `rounded-2xl`.
- Row separators: bottom border `var(--hairline)`.
- Checkbox: native `<input type="checkbox">` styled with `accent-color: var(--brand-blue)` (same approach used elsewhere in this folder).
- Tab underline: 2px `var(--brand-blue)`; inactive tabs use `var(--ink-500)`.
- Lightning badge: small yellow square in the card's top-right corner (purely decorative).

### Out of scope (intentionally)

- Persisting checks anywhere — purely local state for now.
- The "+ Add checks" button opening a real picker — visual only, no handler.
- Editing rule descriptions or field mappings.
- Actually running the chat-driven check explanations beyond the seeded intro message.
