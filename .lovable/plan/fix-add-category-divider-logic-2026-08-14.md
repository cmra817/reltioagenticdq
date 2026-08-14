# Fix "Add category" divider logic

## Problem

The "+ Add category" strip only exists in two places: between two already-existing categories, and at the very bottom of the canvas. There is nothing between widget rows inside a category, so hovering the vertical gap between rows does nothing — which is why it feels random.

## What changes

1. Insertion points between every widget row
   - Inside each category, a hidden hover strip sits above each row of widgets (except the first row) and after the last row.
   - Clicking it creates a new category at that point: rows from that point down move into the new category, rows above stay in the current one.
   - Existing between-category and end-of-canvas insertion points keep working.

2. Bigger, cleaner hit area
   - The strip becomes a taller hover zone (~24px) that is fully invisible until hovered, then reveals the hairline and the "+ Add category" pill.
   - Neighbouring rows keep their spacing, so the layout does not visibly shift.

3. New category defaults
   - Created with an editable placeholder title ("New category"), expanded, deletable, and renameable exactly like today.

## Technical notes

- `src/components/data-health/dashboard-grid.tsx`
  - Compute row boundaries per category by walking the section's layout items in order and grouping them by their resolved grid row (using the existing column-span/breakpoint logic already used for rendering).
  - Render `AddCategoryDivider` at each row boundary inside `SectionGrid`, passing the index of the first item on the row below.
  - Increase the divider's height and keep opacity-0 → group-hover opacity-100 for both the hairline and the pill; use negative margins so added height does not change grid rhythm.
- `src/components/data-health/DataHealthWidgets.tsx`
  - Extend the add-section handler to accept a split point (`sectionId` + first item to move) and reassign `sectionId` on the moved layout items, preserving their order, spans, and positions.
  - Applies to both personal and org-default modes, and is included in publish/reset like existing section changes.
