# Copilot Instructions — Customer Web Portal (Next.js)

> ไฟล์นี้ใช้เป็น workspace-level instructions สำหรับ GitHub Copilot
> วางไว้ที่ `.github/copilot-instructions.md` ในโปรเจคใหม่

---

## Project Context

This is a **Customer Web Portal** for order management with a line-level workflow.
Built with Next.js 16.1.6 App Router, TypeScript, Tailwind CSS, shadcn/ui, and Zustand.
It is a frontend-only MVP — all data lives in localStorage via Zustand persist.

Key reference document: `Objective.md` (contains full feature spec, data models, workflow rules, seed data, Zod schemas)

---

## Tech Stack Conventions

### Framework & Routing
- Use **Next.js 16.1.6 App Router** exclusively. Do NOT use Pages Router.
- Route groups: `(auth)` for login, `(portal)` for protected pages.
- Use `layout.tsx` for the protected portal layout (sidebar + topbar).
- Server Components by default; add `'use client'` only when needed (state, events, browser APIs).
- Client Components that use Zustand store MUST have `'use client'` at the top.

### Tailwind CSS v4
- **Tailwind v4 is CSS-first — there is no `tailwind.config.js`** for dark mode.
- Dark mode variant is configured in `app/globals.css`:
  ```css
  @import "tailwindcss";
  @custom-variant dark (&:is(.dark *));
  ```
- shadcn/ui `npx shadcn@latest init` sets this up automatically — verify it's present.
- Do NOT add a `tailwind.config.js` `darkMode: 'class'` entry — it's Tailwind v3 syntax.

### TypeScript
- Enable `strict: true` in `tsconfig.json`.
- All types and enums live in `store/types.ts` — never duplicate type definitions.
- Use `interface` for object shapes, `enum` for fixed value sets.
- Avoid `any`. Use `unknown` + type guards when type is truly unknown.
- Export all types/enums from `store/types.ts`.

### State Management (Zustand)
- Single store in `store/index.ts` using `create` + `persist` middleware.
- Storage key: `'ube-portal-storage'` (localStorage).
- **REQUIRED**: use `skipHydration: true` in persist config, then call `useStore.persist.rehydrate()` inside `useEffect` in the root portal layout. This prevents Next.js SSR/client hydration mismatch. See `Objective.md` Store API section for exact implementation.
- Pure selector functions (no side effects) go in `store/selectors.ts`.
- Initial/seed data goes in `store/defaults.ts`.
- The store holds: `currentUser`, `users`, `passwords`, `orders`, `companies`,
  `masterData`, `linePermissionMatrix`, `linePermissionLocked`,
  `linePermissionCustomPresets`, `notifications`, `activities`, `integrationLogs`.
- Computed values (e.g., `OrderProgressStatus`) are always derived, never stored.
- Always use `useStore` hook from client components to access state.
- See `Objective.md` **Store API** section for the full list of actions and their signatures — especially `updateOrderLine` which is required by every workflow step.

### Forms
- Use **React Hook Form** + **Zod** for all forms.
- Define Zod schemas in the same file as the form component.
- Use `zodResolver` from `@hookform/resolvers/zod`.
- Display field errors below each input using the `ui-form-error` class.
- Form labels use `ui-form-label` class.

### PDF Generation

- All PDF generation is in `utils/poPdf.ts` — **raw PDF 1.4 builder** (no jsPDF)
- All generation runs in `'use client'` context only
- Three exported functions:
  - `createPurchaseOrderPdfDataUrl(input: PoPdfInput): string`
  - `createShippingInstructionPdfDataUrl(input: PoPdfInput): string`
  - Two internal SI builders dispatched by `shipToId`:
    - `buildBridgestoneSI` → for `SHIP-BRIDGESTONE-POZNAN`
    - `buildCooperKunshanSI` → default (Cooper Kunshan)
- PDF data stored as base64 string in `OrderDocument.dataUrl`
- Trigger download: create `<a href={dataUrl} download={filename}>` and click programmatically
- `PoPdfInput` contains both base Order/Line fields AND all SI template fields (Bridgestone-specific + Cooper-specific) — see `Objective.md` TASK-13 for the complete type
- SI templates are pre-seeded in `masterData.siTemplates` keyed by `shipToId`
- The `PdfGenerationModal` component reads the matching template, pre-fills the form, and calls `onConfirm(poInput, siInput)` — the parent action handler generates and stores both PDFs

### ID Generation
- Use `nanoid` for generating unique IDs: `import { nanoid } from 'nanoid'`
- Use for: order IDs, line IDs, document IDs, log entry IDs

### UI Components — Priority Order

**Always try shadcn/ui first. Custom HTML elements for interactive UI are NOT acceptable.**

1. **shadcn/ui component** — use if one exists (Button, Input, Select, Dialog, AlertDialog, Badge, Tabs, Table, Card, Tooltip, DropdownMenu, Separator, Alert, AlertDescription, Form, FormField, FormItem, FormLabel, FormMessage, Checkbox, ScrollArea)
2. **Wrapped shadcn/ui** — when you need custom styling/behavior on top (e.g. `StatusBadge` wraps `Badge`)
3. **Custom Tailwind component** — only when no shadcn/ui equivalent exists

- Use `cn()` from `@/lib/utils` for ALL conditional class merging — never string template literals for Tailwind classes.

- Use **lucide-react** for all icons. See Icon Catalog in `Objective.md` for exact icon per action/status.
- Use `AlertDialog` for destructive/irreversible confirms. Use `Dialog` for workflow action modals.
- DO NOT use inline styles. Use Tailwind utility classes only.
- Avoid hardcoding font sizes/colors when a `ui-*` typography class exists.
- Use CSS variable-based color tokens (`bg-background`, `text-foreground`, `text-muted-foreground`, `bg-card`, `border-border`) for all layout surfaces. Raw Tailwind color classes only for status badges and semantic accents.
- ASAP flag: render as `<Badge variant="destructive">` with `AlertCircle` icon.

---

## File & Component Conventions

### File Naming
- Pages: `page.tsx` (Next.js App Router convention)
- Layouts: `layout.tsx`
- Components: PascalCase, e.g., `StatusBadge.tsx`, `OrderLineRow.tsx`
- Utilities: camelCase, e.g., `poPdf.ts`, `statusLabel.ts`
- Store files: `index.ts`, `types.ts`, `defaults.ts`, `selectors.ts`

### Component Structure
```tsx
'use client'; // only if needed

import React from 'react';
// imports grouped: react, next, external libs, internal store, internal components, types

export const MyComponent: React.FC<Props> = ({ prop1, prop2 }) => {
  // hooks at top
  // derived values with useMemo
  // handlers
  // return JSX
};
```

### Page Structure
Every page should follow this pattern:
```tsx
'use client';
import React from 'react';

export default function PageName() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="ui-page-title">Page Title</h1>
        <p className="ui-page-subtitle">Description</p>
      </div>
      {/* page content */}
    </div>
  );
}
```

---

## Typography Classes (Required)

These CSS utility classes MUST be defined in `app/globals.css` using `@layer utilities` with `@apply` and CSS variable-based tokens (see `Objective.md` UI Guidelines for exact implementation). They automatically adapt to dark mode via CSS variables.

| Class | Usage |
|-------|-------|
| `ui-page-title` | H1 of every page — `text-2xl font-bold text-foreground` |
| `ui-page-subtitle` | Subtitle under H1 — `text-sm text-muted-foreground` |
| `ui-section-title` | Section headers — uppercase, `text-muted-foreground` |
| `ui-subheader` | Sub-section or card header |
| `ui-table-head` | `<thead>` cells |
| `ui-table-standard` | `<tbody>` cells |
| `ui-form-label` | Input labels (same style as shadcn `Label`) |
| `ui-form-helper` | Helper/hint text under inputs |
| `ui-form-error` | Validation error — uses `text-destructive` |
| `ui-kicker` | Micro labels/tags |
| `ui-micro-text` | Very small supplementary text |

**Rule**: New pages MUST use `ui-page-title` + `ui-page-subtitle`. New tables MUST use
`ui-table-head` + `ui-table-standard`. New forms MUST use shadcn `FormLabel` or `ui-form-label`.

---

## Dark Mode Rules

- All layout surfaces MUST use CSS variable tokens: `bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`
- Status badge colors MUST include `dark:` variants (see StatusBadge in `Objective.md`)
- The `dark` class is applied to `<html>` by the root layout reacting to `store.theme`
- sweetalert2 dialogs MUST be initialized with the dark-aware `createSwal(isDark)` helper (see `Objective.md` Dark Mode Implementation)
- Loading spinner: always use `<Loader2 className="animate-spin" />` inside a disabled `Button`

---

## Permission & Access Patterns

### Route Protection
Wrap all portal routes or use middleware to check `currentUser` from store.
If no user → redirect to `/login`.
If wrong role → redirect to `/` (dashboard).

```tsx
// Middleware or layout-level check pattern
const { currentUser } = useStore();
if (!currentUser) redirect('/login');
if (roles && !roles.includes(currentUser.role)) redirect('/');
```

### Action Permission Check
Always use the `canUserRunLineAction` helper from selectors:
```ts
canUserRunLineAction(user, lineStatus, action, linePermissionMatrix)
// Returns true if user.role === ADMIN OR user's userGroup is in allowedUserGroups
```

### Data Visibility
Always filter orders with `getVisibleOrdersForUser(orders, currentUser)` before displaying.
Never show raw `orders` directly to non-admin users.

### Document Access
Check `user.allowedDocumentTypes.includes(doc.type)` before showing download button.
ADMIN always has access.

---

## Workflow Action Patterns

When implementing a line action:
1. Show confirm dialog (sweetalert2)
2. Check `canUserRunLineAction()` — reject if false
3. Validate pre-conditions (e.g., `price > 0`, `actualETD` present)
4. Update line status in store
5. Create activity log entry
6. Create notification log if applicable
7. If CRM step: simulate async delay + integration log
8. Show success toast/alert

---

## CRM Simulation Pattern

For the APPROVE_LINE action (Sale → CRM):
```ts
// Step 1: Simulate API call (2s)
addIntegrationLog({ orderNo, status: 'PENDING', message: 'Sending to CRM...' });
await sleep(2000);
addIntegrationLog({ orderNo, status: 'SUCCESS', message: 'CRM confirmed' });

// Step 2: Simulate callback (5s delay)
setTimeout(() => {
  const quotationNo = `QT-${Date.now()}`;
  updateOrder(orderNo, { quotationNo });
  addActivity('CRM_CALLBACK', 'CRM System', `Quotation ${quotationNo} received`);
  addNotification(`Quotation ${quotationNo} ready`, Role.MAIN_TRADER, 'email');
}, 5000);
```

---

## PDF Generation Pattern

For `SET_ETD` / CS Dashboard action:
1. Build `PoPdfInput` from order line + SI template fields (pre-filled via `PdfGenerationModal`)
2. Call `createPurchaseOrderPdfDataUrl(input)` → `poDataUrl` (string)
3. Call `createShippingInstructionPdfDataUrl(input)` → `siDataUrl` (string)
   - Internally dispatches to `buildBridgestoneSI` or `buildCooperKunshanSI` by `shipToId`
4. Attach both as `OrderDocument` records to the line via `updateOrderLine`
5. Trigger browser download: `<a href={dataUrl} download={filename}>`
6. Mark line as `WAIT_SALE_UEC_APPROVE_PO`

SI template master data is in `masterData.siTemplates`. Match by `shipToId`.
`PdfGenerationModal` handles pre-filling and returns `(poInput, siInput)` to the parent.

```ts
import {
  createPurchaseOrderPdfDataUrl,
  createShippingInstructionPdfDataUrl
} from '@/utils/poPdf';

const poDataUrl = createPurchaseOrderPdfDataUrl(siInput);
const siDataUrl = createShippingInstructionPdfDataUrl(siInput);

const triggerDownload = (dataUrl: string, filename: string) => {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.click();
};
triggerDownload(poDataUrl, `PO-${line.poNo}.pdf`);
triggerDownload(siDataUrl, `SI-${line.poNo}.pdf`);
```

---

## Scheduled Checks Pattern

Run `runScheduledChecks()` after every successful login:
```ts
const runScheduledChecks = () => {
  const now = new Date();
  const threshold = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  
  orders.forEach(order => {
    order.items.forEach(line => {
      if (line.status === OrderLineStatus.VESSEL_DEPARTED) return;
      if (!line.asap) return;
      const eta = new Date(line.requestETA);
      if (eta >= now && eta <= threshold) {
        // check for existing notification to avoid duplicates
        addNotification(`Urgent: ${order.orderNo} line ${line.poNo}`, Role.CS, 'system');
      }
    });
  });
};
```

---

## Dark Mode

- Dark mode is controlled by `theme: 'light' | 'dark'` in the Zustand store.
- The root layout applies/removes the `dark` class on `document.documentElement` whenever `theme` changes.
- **CSS variable tokens** (`bg-background`, `text-foreground`, etc.) handle dark mode automatically — no `dark:` prefix needed for these.
- Use `dark:` prefix only for status badge colors and semantic accent classes that are NOT CSS variable-based.
- sweetalert2 must use `createSwal(theme === 'dark')` helper (see `Objective.md`) — never call `Swal.fire()` directly.
- Full implementation pattern in `Objective.md` → Dark Mode Implementation section.

---

## Code Quality Rules

1. **No `any` type** — use proper types or `unknown` with guards
2. **No inline styles** — Tailwind only
3. **No hardcoded typography** — use `ui-*` classes
4. **shadcn/ui first** — no raw `<button>`, `<input>`, `<select>` for interactive UI
5. **No raw Tailwind colors on layout surfaces** — use CSS variable tokens
6. **Permission check before every action** — never skip `canUserRunLineAction`
7. **Confirm dialog for all state-changing workflow actions** — use `AlertDialog` (destructive) or `Dialog` (workflow)
8. **sweetalert2 via createSwal helper only** — never `Swal.fire()` directly
9. **Zod validation for all forms** — never trust raw form data
10. **Activity log for every workflow action** — `addActivity(action, user.username, details)`
11. **Computed status never persisted** — `OrderProgressStatus` is always derived
12. **Icon consistency** — follow the Icon Catalog in `Objective.md`

---

## Build Checklist (before completing any task)

- [ ] TypeScript: no type errors (`tsc --noEmit`)
- [ ] All new pages use `ui-page-title` + `ui-page-subtitle`
- [ ] All new tables use `ui-table-head` + `ui-table-standard` with shadcn `Table` components
- [ ] All new forms use shadcn `FormField`/`FormLabel` + Zod validation error messages
- [ ] No raw `<button>`, `<input>`, `<select>` — replaced with shadcn equivalents
- [ ] Layout surfaces use CSS variable tokens (not hardcoded slate/white/gray)
- [ ] Status badges use `LineStatusBadge` / `OrderProgressBadge` components
- [ ] Dark mode tested: toggle theme and verify all elements readable
- [ ] sweetalert2 calls go through `createSwal` helper
- [ ] Permission checks present on all action handlers
- [ ] Confirm dialogs on all status-changing actions
- [ ] Icons match the Icon Catalog in `Objective.md`
- [ ] Zustand store accessed only via `useStore` in `'use client'` components
- [ ] No `any` types introduced

---

## Initial Data Requirements

The store must be initialized with:
- 5–6 test users (one per role)
- 9 companies (see Objective.md)
- Ship-To records (at least 3, linked to C001)
- Sample destinations, terms, grades (3–5 each)
- Standard permission matrix as default
- 1–2 sample orders with lines in various statuses (for demo)
