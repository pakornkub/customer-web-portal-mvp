# Order Screen Prompt

Use this prompt when generating the Next.js order screen.

## Prompt

Design a Next.js order-management screen using shadcn/ui components and Tailwind
CSS, styled in a clean Japanese enterprise logistics aesthetic based on the
reference screenshots in this folder.

Requirements:

- The page must feel simple, practical, and highly structured, not flashy.
- The primary business object is one PO header with product-detail rows below
  it. Workflow, documents, approvals, and shipment state belong to the header.
- Keep the visual language close to the screenshots: blue utility sidebar, blue
  top action bar, white form surface, thin gray dividers, compact labels, dense
  table layout, and restrained spacing.
- Use shadcn/ui components first: `Sidebar` pattern, `Button`, `Card`, `Input`,
  `Select`, `Checkbox`, `RadioGroup`, `Tabs`, `Badge`, `Separator`,
  `ScrollArea`, and `Dialog` where needed.
- Use `tnks-data-table` for the operational header list and product-line grid
  when advanced table features are needed.
- Adapt shadcn components so they look closer to an enterprise export-management
  system rather than default shadcn aesthetics.
- Preserve a timeline component for order progress, but make it subtle and
  integrated into the layout: compact horizontal timeline on desktop, stacked
  vertical timeline on mobile.
- The timeline should visually align with the form and table rather than looking
  like a separate marketing widget.
- The form area should prioritize scanning speed: grouped sections, narrow label
  columns, clear field alignment, and low visual noise.
- The product-line table should look operational and spreadsheet-like, with soft
  zebra or section tinting only if needed.
- The page should remain responsive and usable on tablet/mobile while keeping
  the desktop-first enterprise feel.
- Avoid glossy Apple marketing treatment on this page; instead use Apple-like
  restraint only in spacing discipline, color control, and typography polish.

Visual direction:

- Primary blue: `#0B83C9`
- Darker utility blue: `#086AA3`
- Pale page background: `#F7FAFC`
- Card/form background: `#FFFFFF`
- Border color: `#D7E1EA`
- Primary text: `#163247`
- Secondary text: `#5C7385`
- Table header tint: `#EDF4FA`
- Timeline inactive: `#C7D6E2`
- Timeline active: `#0B83C9`

Typography:

- Use a neutral sans stack suitable for enterprise UI.
- Keep headings medium-weight, not oversized.
- Labels and helper text should be compact and crisp.
- Prefer tabular numbers where possible in operational fields.

Layout rules:

- Left sidebar fixed on desktop.
- Main content uses one dominant white workspace with thin section separators.
- Header actions stay in a compact row near the top of the content area.
- Form sections should resemble operational panels: header strip, field grid,
  detail table, shipment section, container section.
- The timeline should sit near the top of the content or directly above the
  detail table.

Interaction rules:

- Buttons are rectangular with slight radius, not pill-heavy.
- Inputs are compact with clear focus states and no oversized padding.
- Table actions should be icon-led but restrained.
- Use color sparingly: blue for navigation, active state, search, and key
  actions only.

Output target:

- Build the page for Next.js App Router.
- Use Tailwind utility classes and shadcn/ui primitives.
- Keep the code modular so the same design can support Orders list, Create
  Order, and the unified Order Detail workspace with all workflow step zones.

## Notes For AI

- Do not clone the screenshot literally.
- Translate the screenshot into a cleaner modern implementation while preserving
  the same operational mood.
- The result should feel like a modernized export management system, not a
  startup dashboard.
