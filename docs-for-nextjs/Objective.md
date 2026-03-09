# Objective.md — Customer Web Portal (Next.js)

> เอกสารนี้คือ source of truth สำหรับสร้างโปรเจค **Customer Web Portal** ใหม่
> ด้วย Next.js โดยใช้กับ GitHub Copilot coding agent

---

## 🎯 Project Overview

ระบบ **Customer Web Portal** เป็น internal B2B portal สำหรับจัดการ **Order แบบ
Header + Line** (1 order มีหลาย line items) โดยแต่ละ line มี workflow แยก
ไปจนถึงการปิดงานขนส่ง (Vessel Departed) ระบบรองรับหลาย roles, หลาย company
(multi-tenant) และมี permission matrix ที่ Admin กำหนดได้

**Business domain**: Chemical product order management (UBE company group)

---

## 🏗️ Target Tech Stack

| Layer          | Technology                                                      |
| -------------- | --------------------------------------------------------------- |
| Framework      | Next.js 16.1.6 (App Router) — created with recommended defaults |
| Language       | TypeScript 5.x (strict mode)                                    |
| UI             | Tailwind CSS v4 + shadcn/ui (latest)                            |
| Icons          | lucide-react                                                    |
| State          | Zustand 5.x (persist to localStorage)                           |
| Forms          | React Hook Form 7.x + Zod 4.x                                   |
| Auth           | Mock credential auth (no external provider, MVP)                |
| Data           | In-memory + localStorage (no backend DB, MVP)                   |
| PDF Generation | jsPDF 2.x (client-side)                                         |
| Routing        | Next.js App Router (file-based)                                 |
| Theme          | Dark mode via Tailwind `dark:` class strategy                   |
| Alerts         | sweetalert2 11.x                                                |
| ID generation  | nanoid 5.x                                                      |

---

## 📦 Package Dependencies

> โปรเจคสร้างด้วย `create-next-app` แบบ recommended defaults (TypeScript,
> ESLint, Tailwind CSS, App Router) — agent ต้อง install เพิ่มเติมดังนี้

### Install commands

```bash
# Core UI components
npx shadcn@latest init
# เลือก: Default style, Slate base color, CSS variables: yes

# shadcn/ui components ที่ต้องใช้
npx shadcn@latest add button input label select textarea badge
npx shadcn@latest add dialog alert-dialog tabs table card
npx shadcn@latest add dropdown-menu separator tooltip
npx shadcn@latest add alert checkbox scroll-area

# State management
npm install zustand

# Forms & validation
npm install react-hook-form @hookform/resolvers zod

# Icons
npm install lucide-react

# Alerts / confirm dialogs
npm install sweetalert2

# PDF generation
npm install jspdf
npm install --save-dev @types/jspdf

# ID generation
npm install nanoid
```

### `package.json` dependencies (expected result)

```json
{
  "dependencies": {
    "next": "16.1.6",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "zustand": "^5.0.0",
    "react-hook-form": "^7.55.0",
    "@hookform/resolvers": "^5.0.0",
    "zod": "^4.0.0",
    "lucide-react": "^0.475.0",
    "sweetalert2": "^11.0.0",
    "jspdf": "^2.5.0",
    "nanoid": "^5.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "eslint": "^9.0.0",
    "eslint-config-next": "16.1.6"
  }
}
```

### `tsconfig.json` — required settings

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### `next.config.ts` — recommended

```ts
import type { NextConfig } from 'next';
const nextConfig: NextConfig = {};
export default nextConfig;
```

---

## 📁 Folder Structure (Target)

```
app/
  (auth)/
    login/page.tsx
  (portal)/
    layout.tsx               ← main layout with sidebar
    page.tsx                 ← dashboard
    orders/
      page.tsx               ← orders list
      create/page.tsx        ← create order
      [orderNo]/
        page.tsx             ← order detail
        edit/page.tsx        ← edit order
    review/page.tsx          ← sale review
    cs/page.tsx              ← CS dashboard
    admin/page.tsx           ← user management + permission matrix
    master-data/page.tsx     ← master data CRUD
    logs/page.tsx            ← activity / notification / integration logs
    clear-data/page.tsx      ← reset store (dev/demo only)
components/
  layout/
    Sidebar.tsx
    TopBar.tsx
    Layout.tsx
  ui/                        ← shadcn/ui components (generated)
  shared/
    StatusBadge.tsx
    ActionIconButton.tsx
    ConfirmDialog.tsx
store/
  index.ts                   ← Zustand store
  types.ts                   ← all TypeScript types/enums
  defaults.ts                ← initial data (users, companies, master data)
  selectors.ts               ← pure selector functions
utils/
  poPdf.ts                   ← PO PDF generator
  shippingInstructionPdf.ts  ← Shipping Instruction PDF generator
  statusLabel.ts             ← human-readable status labels
  permissions.ts             ← permission helper functions
```

---

## 👤 Roles & User Groups

### Roles (Route-level access)

| Role          | Description                         |
| ------------- | ----------------------------------- |
| `ADMIN`       | Full access to all pages and data   |
| `MAIN_TRADER` | Customer/Trader — creates orders    |
| `UBE_JAPAN`   | UBE Japan — first approval step     |
| `SALE`        | Sale team — second approval + price |
| `CS`          | Customer Service — ETD + final docs |

### User Groups (Action-level permission)

| UserGroup | Maps to Roles |
| --------- | ------------- |
| `TRADER`  | MAIN_TRADER   |
| `UBE`     | UBE_JAPAN     |
| `SALE`    | SALE          |
| `CS`      | CS            |
| `ADMIN`   | ADMIN         |

---

## 📊 Data Models

### User

```typescript
interface User {
  id: string;
  username: string;
  role: Role;
  userGroup: UserGroup;
  companyId: string;
  canCreateOrder: boolean;
  shipToAccess: 'ALL' | 'SELECTED';
  allowedShipToIds: string[];
  allowedDocumentTypes: DocumentType[];
}
```

### Order

```typescript
interface Order {
  orderNo: string; // auto-generated e.g. "ORD-2026-001"
  orderDate: string; // ISO date
  note: string;
  status: OrderProgressStatus;
  quotationNo?: string; // filled by CRM callback simulation
  companyId: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  actualETD?: string;
  items: OrderItem[];
  documents: OrderDocument[];
  saleNote?: string;
}
```

### OrderItem (= Line)

```typescript
interface OrderItem {
  id: string;
  poNo: string;
  shipToId: string;
  status: OrderLineStatus;
  destinationId: string;
  termId: string;
  requestETD: string;
  requestETA: string;
  gradeId: string;
  qty: number;
  price?: number;
  currency?: string;
  otherRequested?: string;
  saleNote?: string;
  quotationNo?: string;
  asap: boolean;
  actualETD?: string;
  documents: OrderDocument[];
}
```

### OrderDocument

```typescript
interface OrderDocument {
  id: string;
  type: DocumentType;
  filename: string;
  dataUrl?: string;
  uploadedBy: string;
  uploadedAt: string;
}
```

### Supporting Models

```typescript
interface CustomerCompany {
  id: string;
  name: string;
}
interface MasterDataRecord {
  id: string;
  name: string;
  customerCompanyIds: string[];
}
interface ShipToRecord extends MasterDataRecord {
  groupSaleType: GroupSaleType;
}
interface IntegrationLog {
  id: string;
  orderNo: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  message: string;
  timestamp: string;
}
interface NotificationLog {
  id: string;
  message: string;
  timestamp: string;
  role: Role;
  type: 'email' | 'system';
}
interface ActivityLog {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  details: string;
}
interface LineActionPermission {
  action: LineAction;
  fromStatus: OrderLineStatus;
  toStatus: OrderLineStatus;
  allowedUserGroups: UserGroup[];
}
```

---

## 🔢 Enums

```typescript
enum Role {
  UBE_JAPAN,
  MAIN_TRADER,
  CS,
  SALE,
  ADMIN
}

enum UserGroup {
  TRADER,
  UBE,
  SALE,
  CS,
  ADMIN
}

enum OrderLineStatus {
  DRAFT,
  CREATED,
  UBE_APPROVED,
  APPROVED,
  VESSEL_SCHEDULED,
  RECEIVED_ACTUAL_PO,
  VESSEL_DEPARTED
}

enum OrderProgressStatus {
  CREATE,
  IN_PROGRESS,
  COMPLETE
}

enum DocumentType {
  SHIPPING_DOC = 'Shipping Document',
  BL = 'BL',
  INVOICE = 'Invoice',
  COA = 'COA',
  PO_PDF = 'PO_PDF',
  SHIPPING_INSTRUCTION_PDF = 'SHIPPING_INSTRUCTION_PDF'
}

enum LineAction {
  SUBMIT_LINE,
  UBE_APPROVE_LINE,
  APPROVE_LINE,
  SET_ETD,
  MARK_RECEIVED_PO,
  UPLOAD_FINAL_DOCS
}

enum GroupSaleType {
  OVERSEAS,
  DOMESTIC
}
```

---

## 🏷️ Status Labels

Define in `utils/statusLabel.ts` — used in badges, tables, and headings.

### OrderLineStatus Labels

```ts
export const LINE_STATUS_LABELS: Record<OrderLineStatus, string> = {
  [OrderLineStatus.DRAFT]: 'Draft',
  [OrderLineStatus.CREATED]: 'Created',
  [OrderLineStatus.UBE_APPROVED]: 'UBE Approved',
  [OrderLineStatus.APPROVED]: 'Confirmed', // Sale-approved label
  [OrderLineStatus.VESSEL_SCHEDULED]: 'Vessel Scheduled',
  [OrderLineStatus.RECEIVED_ACTUAL_PO]: 'PO Received',
  [OrderLineStatus.VESSEL_DEPARTED]: 'Vessel Departed'
};
```

### OrderProgressStatus Labels

```ts
export const ORDER_STATUS_LABELS: Record<OrderProgressStatus, string> = {
  [OrderProgressStatus.CREATE]: 'New',
  [OrderProgressStatus.IN_PROGRESS]: 'In Progress',
  [OrderProgressStatus.COMPLETE]: 'Complete'
};
```

### LineAction Labels (for activity log display)

```ts
export const ACTION_LABELS: Record<LineAction, string> = {
  [LineAction.SUBMIT_LINE]: 'Submit Line',
  [LineAction.UBE_APPROVE_LINE]: 'UBE Approve',
  [LineAction.APPROVE_LINE]: 'Sale Approve',
  [LineAction.SET_ETD]: 'Set ETD',
  [LineAction.MARK_RECEIVED_PO]: 'Generate PO',
  [LineAction.UPLOAD_FINAL_DOCS]: 'Upload & Complete'
};
```

### DocumentType Labels (for dropdown display)

```ts
export const DOC_TYPE_LABELS: Record<DocumentType, string> = {
  [DocumentType.SHIPPING_DOC]: 'Shipping Document',
  [DocumentType.BL]: 'Bill of Lading (BL)',
  [DocumentType.INVOICE]: 'Invoice',
  [DocumentType.COA]: 'Certificate of Analysis (COA)',
  [DocumentType.PO_PDF]: 'Purchase Order (PO)',
  [DocumentType.SHIPPING_INSTRUCTION_PDF]: 'Shipping Instruction'
};

// Document types that can be manually uploaded (exclude auto-generated)
export const UPLOADABLE_DOC_TYPES: DocumentType[] = [
  DocumentType.SHIPPING_DOC,
  DocumentType.BL,
  DocumentType.INVOICE,
  DocumentType.COA
];
```

แต่ละ line มี status แยกกัน ผ่าน 6 steps:

```
DRAFT
  ├─[SUBMIT_LINE by TRADER/SALE]──▶ CREATED
  │    └─[UBE_APPROVE_LINE by UBE]──▶ UBE_APPROVED
  └─[SUBMIT_LINE by UBE]──▶ UBE_APPROVED  ← UBE bypasses CREATED
       └─[APPROVE_LINE by SALE]──▶ APPROVED
            └─[SET_ETD by CS]──▶ VESSEL_SCHEDULED
                 └─[MARK_RECEIVED_PO by CS/TRADER]──▶ RECEIVED_ACTUAL_PO
                      └─[UPLOAD_FINAL_DOCS by CS]──▶ VESSEL_DEPARTED
```

> **UBE Shortcut Rule**: When a user with `userGroup === UserGroup.UBE` submits
> a DRAFT line, the line status goes directly to `UBE_APPROVED`, skipping
> `CREATED`. Normal TRADER/SALE users go DRAFT → CREATED → (UBE approves) →
> UBE_APPROVED.

**OrderProgressStatus** (computed):

- `CREATE` = all lines are DRAFT
- `IN_PROGRESS` = mixed statuses
- `COMPLETE` = all lines are VESSEL_DEPARTED

### Step Detail & Business Rules

| Step                 | Action              | Pre-condition                                               | Side Effects                                                                                                                    |
| -------------------- | ------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Submit (TRADER/SALE) | `SUBMIT_LINE`       | Line is DRAFT, userGroup ≠ UBE                              | Line → CREATED. Notify SALE via mock email, activity log                                                                        |
| Submit (UBE)         | `SUBMIT_LINE`       | Line is DRAFT, userGroup === UBE                            | Line → UBE_APPROVED directly (skip CREATED). Activity log                                                                       |
| UBE Approve          | `UBE_APPROVE_LINE`  | Line is CREATED                                             | Line → UBE_APPROVED. Activity log                                                                                               |
| Sale Approve         | `APPROVE_LINE`      | Line is UBE_APPROVED + `price > 0`                          | CRM simulation (await ~1.8s) → sets `quotationNo` (format: `QT-XXXXXX` 6 random digits), notifies CS + UBE_JAPAN                |
| Set ETD              | `SET_ETD`           | Line is APPROVED + actualETD provided                       | Notify UBE_JAPAN via mock email, activity log                                                                                   |
| Generate PO          | `MARK_RECEIVED_PO`  | Line is VESSEL_SCHEDULED                                    | Auto-generate PO PDF + SI PDF, attach to line docs. **Auto-download both PDFs** (if user has `allowedDocumentTypes` permission) |
| Upload & Depart      | `UPLOAD_FINAL_DOCS` | Line is RECEIVED_ACTUAL_PO + has `Shipping Document` + `BL` | Uploaded docs replace same-type existing docs. Notify customer (mock), activity log, line → VESSEL_DEPARTED                     |

---

## 🔐 Permission System

### Line Action Permission Matrix

- Stored as `LineActionPermission[]` in state
- Each entry: `{ action, fromStatus, toStatus, allowedUserGroups[] }`
- **ADMIN bypasses all matrix checks**
- Admin can edit, lock/unlock, and save custom presets

### Presets

**STANDARD preset** (default):

- SUBMIT_LINE: TRADER + UBE + SALE
- UBE_APPROVE_LINE: UBE
- APPROVE_LINE: SALE
- SET_ETD: CS
- MARK_RECEIVED_PO: TRADER
- UPLOAD_FINAL_DOCS: CS

**STRICT preset**:

- SUBMIT_LINE: TRADER only
- Everything else same as STANDARD except MARK_RECEIVED_PO: CS

### Data Visibility Rules

- Non-ADMIN: only see orders where `order.companyId === user.companyId`
- Non-ADMIN: only see lines where `canUserAccessShipTo(user, line.shipToId)` =
  true
  - `shipToAccess === 'ALL'` → see all
  - `shipToAccess === 'SELECTED'` → only `allowedShipToIds` list

### Document Access Rules

- Users can only download documents in their `allowedDocumentTypes` list
- ADMIN can access all document types
- `PO_PDF` and `SHIPPING_INSTRUCTION_PDF` are auto-generated, not manually
  uploadable
- Upload UI should only show uploadable types (SHIPPING_DOC, BL, INVOICE, COA)

---

## 📋 Pages (Task Breakdown)

### TASK-01: Project Setup & Infrastructure

- [ ] Use the already-created Next.js 16.1.6 project (created with
      `create-next-app` recommended defaults: TypeScript, ESLint, Tailwind CSS,
      App Router, no src/ directory, import alias `@/*`)
- [ ] Run all install commands from the **Package Dependencies** section above
- [ ] Run `npx shadcn@latest init` and add all required shadcn/ui components
- [ ] Create folder structure exactly as defined in **Folder Structure** section
- [ ] Add global typography utility classes to `app/globals.css` (see UI
      Guidelines)
- [ ] Configure dark mode for **Tailwind v4**: add
      `@custom-variant dark (&:is(.dark *));` to **`app/globals.css`** (Tailwind
      v4 no longer uses `tailwind.config.js` — dark mode is CSS-first). The
      `globals.css` header should be:
  ```css
  @import 'tailwindcss';
  @custom-variant dark (&:is(.dark *));
  ```
- [ ] Apply `dark` class to `<html>` via the root layout reacting to
      `store.theme` (see Dark Mode Implementation in UI Guidelines)
- [ ] Create `store/types.ts` with all TypeScript interfaces and enums (exact
      values from **Data Models** + **Enums** sections)
- [ ] Create `store/defaults.ts` with exact seed data (see **Initial Seed Data**
      section)
- [ ] Create `store/selectors.ts` with `getVisibleOrdersForUser`,
      `canUserRunLineAction`, `canUserAccessShipTo`, `deriveOrderProgressStatus`
- [ ] Create `store/index.ts` — Zustand store with `persist` middleware (see
      **Store API** section for full actions list and hydration config)
- [ ] Create `utils/statusLabel.ts` with label map (see **Status Labels**
      section)
- [ ] Create `utils/swal.ts` — dark-aware sweetalert2 helper (see UI Guidelines
      → Dark Mode)
- [ ] Create `lib/utils.ts` with `cn()` helper (auto-generated by shadcn init —
      verify it exists)
- [ ] Verify `npm run build` passes with no TypeScript errors before moving to
      TASK-02

### TASK-02: Authentication

- [ ] Login page (`/login`) with username + password form
- [ ] Mock auth: find user by username in store. **Password is NOT validated**
      (any password is accepted) — intentional MVP simplification
- [ ] On success: set `currentUser`, call `runScheduledChecks()`, redirect to
      `/`
- [ ] On failure: show error ("Invalid username")
- [ ] After login: run `runScheduledChecks()` (notify CS of urgent ASAP orders)
- [ ] Protect routes based on role
- [ ] Logout clears `currentUser` in store
- [ ] Show test credentials on login page
- [ ] Redirect to dashboard on login success
- [ ] Redirect to `/login` if not authenticated

**Test users to seed:** | Username | Password | Role | Company |
|----------|----------|------|---------| | `trader1` | `password` | MAIN_TRADER
| C001 (UBE Thailand) | | `ubejp1` | `password` | UBE_JAPAN | AG-UBE-JP | |
`sale1` | `password` | SALE | (internal) | | `cs1` | `password` | CS |
(internal) | | `admin` | `password` | ADMIN | (all) | | `mizutani` | `password`
| UBE_JAPAN | AG-UBE-JP |

### TASK-03: Layout & Navigation

- [ ] Sidebar layout with collapsible menu (icon-only when collapsed)
- [ ] Top bar: current page title (breadcrumb), username + role badge, dark mode
      toggle, logout button
- [ ] Sidebar menu items shown per role (exact spec below)
- [ ] Active menu item highlighted
- [ ] Sidebar collapse state persisted in localStorage

**Sidebar menu per role:**

| Menu Item    | Route            | Icon              | Show condition            |
| ------------ | ---------------- | ----------------- | ------------------------- |
| Dashboard    | `/`              | `LayoutDashboard` | Always                    |
| Orders       | `/orders`        | `Package`         | Always                    |
| Create Order | `/orders/create` | `PlusCircle`      | `canCreateOrder === true` |
| Sale Review  | `/review`        | `ClipboardCheck`  | Role: SALE, ADMIN         |
| CS Dashboard | `/cs`            | `Ship`            | Role: CS, ADMIN           |
| Admin        | `/admin`         | `ShieldCheck`     | Role: ADMIN               |
| Master Data  | `/master-data`   | `Database`        | Role: ADMIN               |
| Logs         | `/logs`          | `ScrollText`      | Role: ADMIN               |
| Clear Data   | `/clear-data`    | `Trash2`          | Always (dev/demo tool)    |

**Role → visible menu summary:**

| Role        | Visible menus                                  |
| ----------- | ---------------------------------------------- |
| MAIN_TRADER | Dashboard, Orders, Create Order (if permitted) |
| UBE_JAPAN   | Dashboard, Orders                              |
| SALE        | Dashboard, Orders, Sale Review                 |
| CS          | Dashboard, Orders, CS Dashboard                |
| ADMIN       | All menus                                      |

### TASK-04: Dashboard (`/`)

- [ ] Summary cards: count of lines per `OrderLineStatus` (for visible lines)
- [ ] Urgent lines section: ASAP lines with ETA within 30 days, exclude
      VESSEL_DEPARTED
- [ ] Recent orders table: last 8 lines, sorted by orderDate desc
- [ ] Quick link to Create Order (if permitted)
- [ ] All data scoped to `getVisibleOrdersForUser`

**Status cards** (7 cards): DRAFT, CREATED, UBE_APPROVED, APPROVED (label:
"CONFIRMED"), VESSEL_SCHEDULED, RECEIVED_ACTUAL_PO, VESSEL_DEPARTED

### TASK-05: Orders List (`/orders`)

- [ ] Table of all visible orders
- [ ] Columns: Order No, Date, Company, Status badge, Line count, Actions
- [ ] Search by order no / company
- [ ] Filter by `OrderProgressStatus`
- [ ] Row click → order detail
- [ ] Create New Order button (if permitted)

### TASK-06: Create / Edit Order (`/orders/create`, `/orders/[orderNo]/edit`)

- [ ] Form: Order-level fields (note)
- [ ] Dynamic line items (add/remove/duplicate/move-up/move-down rows)
- [ ] Per line: poNo (must be unique within order), shipToId, destinationId,
      termId, requestETD, requestETA, gradeId, qty, asap, otherRequested
- [ ] Require: `asap === true` OR at least one of `requestETD` / `requestETA` is
      set (Zod cross-field refinement)
- [ ] `shipToId` dropdown filtered by user's allowed ship-tos
- [ ] Validate with Zod before submit
- [ ] **Selective submit**: row-level checkboxes. Only DRAFT-status lines are
      selectable. User must select ≥1 line to submit. Unselected DRAFT lines
      remain DRAFT.
- [ ] **UBE shortcut**: when submitting, if
      `currentUser.userGroup === UserGroup.UBE`, selected lines go to
      `UBE_APPROVED` (not `CREATED`)
- [ ] **Save Draft button**: saves all lines as DRAFT with no status change. No
      lines need to be selected.
- [ ] **Edit constraint**: lines past DRAFT are read-only (locked in the table
      but visible)
- [ ] Auto-generate `orderNo` on create (sequential format `ORD-{YYYY}-{NNN}`)
- [ ] CSV Import: accept `.csv` file, parse rows into line items, prefill form
      (see sample in `/sample/order-import-sample.csv`)

### TASK-07: Order Detail (`/orders/[orderNo]`)

- [ ] Order header info (orderNo, date, company, status, quotationNo, saleNote)
- [ ] Lines table with status badges
- [ ] Per-line action zone based on `canUserRunLineAction()`
- [ ] **Line actions** (show only when applicable):
  - Submit Line (DRAFT → CREATED)
  - UBE Approve (CREATED → UBE_APPROVED)
  - Sale Approve with price input (UBE_APPROVED → APPROVED)
  - Set ETD with date picker (APPROVED → VESSEL_SCHEDULED)
  - Generate PO (VESSEL_SCHEDULED → RECEIVED_ACTUAL_PO) → triggers PDF
    generation + download
  - Upload Final Docs (RECEIVED_ACTUAL_PO → VESSEL_DEPARTED)
- [ ] Per-line document list with download (filtered by `allowedDocumentTypes`)
- [ ] Confirm dialog before any status-changing action

### TASK-08: Sale Review (`/review`)

- [ ] List all lines with status `UBE_APPROVED` across all orders (for visible
      orders)
- [ ] Per line: PO No, Order No, Ship-To, Grade, Qty, Request ETD/ETA
- [ ] Inline price + currency input per line
- [ ] Sale note input per line
- [ ] Approve button with confirm dialog
- [ ] On approve: single `await sleep(1800)` simulating CRM API round-trip
- [ ] After await: set `quotationNo = 'QT-' + 6 random digits` (e.g.
      `QT-482917`); log SUCCESS to integrationLogs; notify CS (system) +
      UBE_JAPAN (email)
- [ ] Show spinner/disabled state on Approve button during the 1.8s wait
- [ ] **Save Draft** button (per line): persists price, currency, saleNote
      WITHOUT changing line status
- [ ] Restrict page to SALE + ADMIN

### TASK-09: CS Dashboard (`/cs`)

- [ ] **Stage 1 — Set ETD**: cards for lines with status `APPROVED`
  - Show: Order No, PO No, Ship-To, Grade, Qty, Request ETD, ASAP flag
  - Action: Set Actual ETD (date input + confirm)
- [ ] **Stage 2 — Finalize Shipping**: cards for lines with status
      `RECEIVED_ACTUAL_PO`
  - Show: line info + current uploaded docs list
  - Action: upload documents (type selector + file input, save draft)
  - Complete button: only enabled when `Shipping Document` + `BL` both present
- [ ] Restrict page to CS + ADMIN

### TASK-10: Admin Page (`/admin`)

**Tab 1: User Management**

- [ ] Table of all users
- [ ] Add new user (modal/inline form): username, password, role, userGroup,
      company, canCreateOrder, shipToAccess, allowedShipToIds,
      allowedDocumentTypes
- [ ] Edit user inline (per row)
- [ ] Delete user with confirm
- [ ] Company association

**Tab 2: Line Permission Matrix**

- [ ] Table showing each LineAction → fromStatus → toStatus → allowedUserGroups
      (checkboxes)
- [ ] Lock/Unlock matrix toggle
- [ ] Apply preset: STANDARD / STRICT
- [ ] Save current as named custom preset
- [ ] Apply saved custom preset
- [ ] Delete custom preset
- [ ] Reset to default

### TASK-11: Master Data (`/master-data`)

Tabs for each master data type:

- [ ] **Ship-Tos**: id, name, groupSaleType, customerCompanyIds (multi-select)
- [ ] **Destinations**: id, name, customerCompanyIds
- [ ] **Terms**: id, name, customerCompanyIds
- [ ] **Grades**: id, name, customerCompanyIds
- [ ] **Group Sale Types**: id (enum value), name
- [ ] Each tab: table + add row + delete row

### TASK-12: Logs Page (`/logs`)

Three tabs:

- [ ] **Integration Logs**: orderNo, status badge, message, timestamp
- [ ] **Activity Logs**: action, user, details, timestamp
- [ ] **Notification Logs**: role, type, message, timestamp
- [ ] Restrict to ADMIN

### TASK-13: PDF Generation

> **Library**: use `jsPDF` (import `{ jsPDF } from 'jspdf'`). All generation
> runs client-side only (`'use client'` context).

#### PO PDF Layout

```
┌──────────────────────────────────────────────────────────────────────┐
| PURCHASE ORDER                          PO No: {PO-YYYY-NNN}  |
| UBE (Thailand) Co., Ltd.                                       |
|----------------------------------------------------------------|
| Order No: {orderNo}          Order Date: {orderDate}           |
| Company:  {companyName}      Quotation No: {quotationNo}       |
|----------------------------------------------------------------|
| Ship To:  {shipToName}       Destination: {destinationName}    |
| Term:     {termName}         ETD: {requestETD}  ETA:{requestETA}|
|----------------------------------------------------------------|
| Item | Grade         | Qty (kg) | Unit Price | Currency | Total|
|  1   | {gradeName}   | {qty}    | {price}    | {currency}| ...  |
|----------------------------------------------------------------|
| Notes: {otherRequested}                                        |
| Sale Note: {saleNote}                                          |
└──────────────────────────────────────────────────────────────────────┘
```

**PO PDF fields:**

- Header: `"PURCHASE ORDER"`, company name `"UBE (Thailand) Co., Ltd."`
- PO No: auto-generate as `PO-{YYYY}-{sequence}` (e.g. `PO-2026-001`)
- Order No, Order Date, Company name (lookup from companies array), Quotation No
- Ship-To name (lookup from shipTos), Destination (lookup), Term (lookup)
- Request ETD, Request ETA
- Grade name (lookup), Qty, Unit Price, Currency, Total (qty × price)
- Notes (otherRequested), Sale Note
- Footer: `"Generated by UBE Portal on {datetime}"`

#### Shipping Instruction PDF Layout

```
┌──────────────────────────────────────────────────────────────────────┐
| SHIPPING INSTRUCTION                    SI No: {SI-YYYY-NNN}  |
| UBE (Thailand) Co., Ltd.                                       |
|----------------------------------------------------------------|
| Order No: {orderNo}          PO No: {poNo}                     |
| Shipper:  UBE (Thailand) Co., Ltd.                             |
| Consignee: {companyName}                                       |
|----------------------------------------------------------------|
| Ship To:  {shipToName}                                         |
| Destination: {destinationName}  Term: {termName}               |
| Requested ETD: {requestETD}     Requested ETA: {requestETA}    |
|----------------------------------------------------------------|
| Cargo Details:                                                 |
| Grade: {gradeName}    Quantity: {qty} kg                       |
| Packing: Standard industrial bags                              |
|----------------------------------------------------------------|
| Special Instructions: {otherRequested}                         |
└──────────────────────────────────────────────────────────────────────┘
```

**Implementation notes:**

- Use `jsPDF` A4 format, portrait
- Use `doc.setFont('helvetica')` for consistent rendering
- Add border box using `doc.rect()`
- Clamp long text with `doc.splitTextToSize(text, maxWidth)`
- Convert to base64 via `doc.output('datauristring')` → store as `dataUrl`
- Trigger download via: `doc.save(filename)`
- Generate both PDFs sequentially in the same action handler
- Filename format: `PO-{poNo}-{orderNo}.pdf` and `SI-{poNo}-{orderNo}.pdf`

### TASK-14: Scheduled Checks

- [ ] `runScheduledChecks()` runs on every login
- [ ] Iterate orders; for each order find lines where: `status === APPROVED` AND
      `asap === true` AND `requestETA` is within next 30 days
- [ ] If any such line found in an order: create one NotificationLog for CS role
      (type: `'email'`) + one ActivityLog entry (`action: 'Scheduled Alert'`,
      user: `'System'`)
- [ ] Dashboard `urgentLines` widget uses a broader filter (any non-DEPARTED
      status + asap + ETA within 30 days) — this is display-only, separate from
      the notification logic

### TASK-15: Clear Data Page (`/clear-data`)

- [ ] Button: "Reset All Data" with confirmation
- [ ] Calls `resetStore()` → resets to initial seed state
- [ ] For demo/dev use only

---

## 🎨 UI & Design Guidelines

> **Primary rule**: Use **shadcn/ui components first**. Only write custom
> components when shadcn/ui has no equivalent. Never use raw HTML `<button>`,
> `<input>`, `<select>` — always use the shadcn/ui counterpart.

---

### shadcn/ui Component Mapping

| UI Pattern            | Use shadcn/ui Component                                                | Notes                                                                    |
| --------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| All buttons           | `Button`                                                               | Use `variant`: `default`, `secondary`, `destructive`, `outline`, `ghost` |
| Text inputs           | `Input`                                                                | Always pair with `Label`                                                 |
| Dropdowns/select      | `Select` + `SelectTrigger` + `SelectContent` + `SelectItem`            |                                                                          |
| Textarea              | `Textarea`                                                             |                                                                          |
| Form field wrapper    | `FormField`, `FormItem`, `FormLabel`, `FormMessage` (from shadcn Form) | Used with React Hook Form                                                |
| Modal / confirm       | `Dialog` + `DialogContent`                                             | For complex modals                                                       |
| Destructive confirm   | `AlertDialog`                                                          | For delete / irreversible actions                                        |
| Status labels         | `Badge` (with custom className override)                               | See Status Color System below                                            |
| Role labels on TopBar | `Badge variant="outline"`                                              |                                                                          |
| Page tabs             | `Tabs` + `TabsList` + `TabsTrigger` + `TabsContent`                    |                                                                          |
| Data tables           | `Table` + `TableHeader` + `TableBody` + `TableRow` + `TableCell`       |                                                                          |
| Content cards         | `Card` + `CardHeader` + `CardContent` + `CardFooter`                   |                                                                          |
| Stat/summary cards    | `Card` with custom inner layout                                        |                                                                          |
| Tooltips              | `Tooltip` + `TooltipTrigger` + `TooltipContent`                        | On icon-only buttons                                                     |
| Dropdown menus        | `DropdownMenu`                                                         | User menu in TopBar                                                      |
| Dividers              | `Separator`                                                            |                                                                          |
| Inline alerts         | `Alert` + `AlertDescription`                                           | For permission denied, empty states                                      |
| Checkboxes            | `Checkbox`                                                             | Admin permission matrix, allowedDocumentTypes                            |
| Scrollable containers | `ScrollArea`                                                           | Long dropdowns, lists                                                    |

> **`cn()` utility** — shadcn/ui auto-generates `lib/utils.ts` with a `cn()`
> helper (`clsx` + `tailwind-merge`). Use it for all conditional class merging —
> never use template literals for Tailwind classes:
>
> ```ts
> import { cn } from '@/lib/utils';
> <div className={cn('base-class', condition && 'extra-class')} />
> ```

> **Custom components** (allowed when needed):
>
> - `StatusBadge` — wraps shadcn `Badge` with status-to-color mapping
> - `ActionIconButton` — wraps shadcn `Button variant="ghost" size="icon"` +
>   `Tooltip`
> - Sidebar nav items — custom `Link` wrapper with active state styling

---

### Theme System (shadcn/ui + Tailwind dark mode)

shadcn/ui uses **CSS variables** for all colors. Dark mode is automatic when
`class="dark"` is on `<html>`.

**How dark mode works in this project:**

1. `store/index.ts` holds `theme: 'light' | 'dark'`
2. Root client layout reads `theme` from store and applies
   `document.documentElement.classList`
3. All shadcn/ui components automatically switch via CSS variables
4. Custom Tailwind classes use `dark:` prefix for anything outside CSS variables

**shadcn/ui init config** (run during TASK-01 setup):

```
Style:       Default (not New York)
Base color:  Slate
CSS variables: Yes
```

This generates the following CSS variable structure in `globals.css`:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%; /* indigo */
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96.1%;
  --border: 214.3 31.8% 91.4%;
  --destructive: 0 84.2% 60.2%;
  --radius: 0.5rem;
}
.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --card: 222.2 84% 4.9%;
  --primary: 217.2 91.2% 59.8%;
  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;
  --border: 217.2 32.6% 17.5%;
}
```

**Rule**: Use CSS variable-based classes (`bg-background`, `text-foreground`,
`text-muted-foreground`, `bg-card`, `border-border`) for layout surfaces. Use
raw Tailwind color classes only for status colors and semantic accents.

---

### Dark Mode Implementation

**Root layout wiring** (`app/layout.tsx` or portal layout):

```tsx
'use client';
import { useStore } from '@/store';
import { useEffect } from 'react';

export default function RootLayout({ children }) {
  const { theme } = useStore();

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  return <html lang="en">{children}</html>;
}
```

**Theme toggle button** (in TopBar):

```tsx
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';

const { theme, toggleTheme } = useStore();
<Button variant="ghost" size="icon" onClick={toggleTheme}>
  {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
</Button>;
```

**sweetalert2 dark mode sync:**

```ts
// utils/swal.ts
import Swal from 'sweetalert2';

export const createSwal = (isDark: boolean) =>
  Swal.mixin({
    background: isDark ? '#0f172a' : '#ffffff',
    color: isDark ? '#f1f5f9' : '#0f172a',
    confirmButtonColor: '#4f46e5',
    cancelButtonColor: isDark ? '#334155' : '#e2e8f0'
  });
```

---

### Status Color System

#### StatusBadge component (`components/shared/StatusBadge.tsx`)

Uses shadcn `Badge` as base with className override. Must work in both light and
dark mode.

```tsx
import { Badge } from '@/components/ui/badge';
import { OrderLineStatus, OrderProgressStatus } from '@/store/types';

const LINE_STATUS_STYLES: Record<OrderLineStatus, string> = {
  DRAFT:
    'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
  CREATED:
    'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-800',
  UBE_APPROVED:
    'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/40 dark:text-cyan-300 dark:border-cyan-800',
  APPROVED:
    'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/40 dark:text-violet-300 dark:border-violet-800',
  VESSEL_SCHEDULED:
    'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800',
  RECEIVED_ACTUAL_PO:
    'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800',
  VESSEL_DEPARTED:
    'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800'
};

const ORDER_PROGRESS_STYLES: Record<OrderProgressStatus, string> = {
  CREATE:
    'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
  IN_PROGRESS:
    'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800',
  COMPLETE:
    'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800'
};

export const LineStatusBadge = ({ status }: { status: OrderLineStatus }) => (
  <Badge
    variant="outline"
    className={`font-medium text-xs ${LINE_STATUS_STYLES[status]}`}
  >
    {LINE_STATUS_LABELS[status]}
  </Badge>
);

export const OrderProgressBadge = ({
  status
}: {
  status: OrderProgressStatus;
}) => (
  <Badge
    variant="outline"
    className={`font-medium text-xs ${ORDER_PROGRESS_STYLES[status]}`}
  >
    {ORDER_STATUS_LABELS[status]}
  </Badge>
);
```

#### Integration Log Status Colors

```tsx
const INTEGRATION_STATUS_STYLES = {
  SUCCESS:
    'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  FAILED: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  PENDING:
    'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
};
```

---

### Icon Catalog (lucide-react)

Use these consistently everywhere in the app:

#### Status Icons

| Status / Concept     | Icon            |
| -------------------- | --------------- |
| DRAFT                | `FileEdit`      |
| CREATED              | `Send`          |
| UBE_APPROVED         | `ShieldCheck`   |
| APPROVED / Confirmed | `BadgeCheck`    |
| VESSEL_SCHEDULED     | `CalendarCheck` |
| RECEIVED_ACTUAL_PO   | `FileCheck`     |
| VESSEL_DEPARTED      | `Ship`          |
| COMPLETE / Done      | `CheckCircle2`  |
| Urgent / Warning     | `AlertCircle`   |

#### Action Icons

| Action       | Icon                   |
| ------------ | ---------------------- |
| Submit line  | `Send`                 |
| UBE Approve  | `ShieldCheck`          |
| Sale Approve | `BadgeCheck`           |
| Set ETD      | `CalendarCheck`        |
| Generate PO  | `FileCheck`            |
| Upload docs  | `Upload`               |
| Download     | `Download`             |
| Delete       | `Trash2`               |
| Edit         | `Pencil`               |
| Add / Create | `Plus` or `PlusCircle` |
| View detail  | `Eye`                  |
| Reset        | `RotateCcw`            |
| Lock         | `Lock`                 |
| Unlock       | `Unlock`               |
| Logout       | `LogOut`               |
| Settings     | `Settings`             |

#### Navigation Icons

| Page         | Icon              |
| ------------ | ----------------- |
| Dashboard    | `LayoutDashboard` |
| Orders       | `Package`         |
| Create Order | `PlusCircle`      |
| Sale Review  | `ClipboardCheck`  |
| CS Dashboard | `Ship`            |
| Admin        | `ShieldCheck`     |
| Master Data  | `Database`        |
| Logs         | `ScrollText`      |
| Clear Data   | `Trash2`          |

#### Notification / Log Type Icons

| Type                | Icon           |
| ------------------- | -------------- |
| Email notification  | `Mail`         |
| System notification | `Bell`         |
| Integration log     | `Plug`         |
| Activity log        | `Activity`     |
| Error / Failed      | `XCircle`      |
| Success             | `CheckCircle2` |
| Pending             | `Clock`        |
| Info                | `Info`         |

---

### Typography Classes (globals.css)

Use CSS variable-based colors so dark mode is automatic:

```css
/* app/globals.css — add after @tailwind directives */

@layer utilities {
  .ui-page-title {
    @apply text-2xl font-bold tracking-tight text-foreground;
  }

  .ui-page-subtitle {
    @apply text-sm text-muted-foreground mt-1;
  }

  .ui-section-title {
    @apply text-xs font-semibold uppercase tracking-widest text-muted-foreground;
  }

  .ui-subheader {
    @apply text-sm font-semibold text-foreground;
  }

  .ui-table-head {
    @apply text-xs font-semibold uppercase tracking-wider text-muted-foreground;
  }

  .ui-table-standard {
    @apply text-sm text-foreground;
  }

  .ui-form-label {
    @apply text-sm font-medium text-foreground;
  }

  .ui-form-helper {
    @apply text-xs text-muted-foreground mt-1;
  }

  .ui-form-error {
    @apply text-xs text-destructive mt-1;
  }

  .ui-kicker {
    @apply text-[10px] font-semibold uppercase tracking-widest text-muted-foreground;
  }

  .ui-micro-text {
    @apply text-xs text-muted-foreground;
  }
}
```

---

### Layout Specs

**Sidebar:**

- Width expanded: `256px` (`w-64`)
- Width collapsed: `64px` (`w-16`, icon only)
- Background: `bg-card` with `border-r border-border`
- Active nav item: `bg-primary/10 text-primary font-medium`
- Hover: `hover:bg-accent hover:text-accent-foreground`

**TopBar:**

- Height: `56px` (`h-14`)
- Background: `bg-card border-b border-border`
- Content: page title left, [theme toggle + user dropdown] right

**Main content area:**

- Padding: `p-6`
- Max width: none (full width within content area)

**Cards (stat cards on Dashboard):**

- Use shadcn `Card` component
- Hover: `hover:shadow-md transition-shadow`
- Stat number: `text-2xl font-bold text-foreground`
- Stat label: `ui-kicker` class

**Tables:**

- Use shadcn `Table` components
- Row hover: `hover:bg-muted/50`
- Striping: optional, prefer hover highlight only

---

### Form & Input Design Rules

- Always use shadcn `Form` + `FormField` + `FormItem` wrapper with React Hook
  Form
- Input height: default shadcn `h-10`
- Required field: add `*` to label wrapped in `text-destructive`
- Disabled/locked fields: use `disabled` prop on Input (shadcn handles styling
  automatically)
- Multi-select (e.g. allowedShipToIds): use multiple `Checkbox` items in a
  scrollable container, or shadcn `Command` + `Popover` pattern (combobox)
- Date inputs: use `<Input type="date">` (no external date picker library needed
  for MVP)

---

### General Design Rules

1. **shadcn/ui first** — never bypass shadcn/ui with raw HTML elements for
   interactive components
2. **Confirm all destructive/workflow actions** — use `AlertDialog` for delete,
   `Dialog` for workflow actions that are reversible-ish
3. **Every empty state** needs an icon (`PackageOpen`, `Inbox`, etc.) + helpful
   message + action button if applicable
4. **Loading states**: use `Button` with `disabled` + spinner icon
   (`Loader2 className="animate-spin"`) during async operations (CRM sim, PDF
   gen)
5. **ASAP flag** shown as `Badge variant="destructive"` with `AlertCircle` icon
6. **All pages** must start with `ui-page-title` + `ui-page-subtitle`
7. **Table columns** header cells use `ui-table-head`, body cells use
   `ui-table-standard`
8. **Responsive**: sidebar collapses on mobile, tables scroll horizontally on
   small screens (`overflow-x-auto`)

---

## 🌱 Initial Seed Data

> **Agent instruction**: สร้างไฟล์ `store/defaults.ts`
> แล้วใช้ข้อมูลข้างล่างทั้งหมดเป็น initial state

### Companies (9)

```ts
export const INITIAL_COMPANIES: CustomerCompany[] = [
  { id: 'C001', name: 'UBE Thailand' },
  { id: 'AG-UBE-JP', name: 'UBE Japan' },
  { id: 'AG-UBE-EU', name: 'UBE Europe' },
  { id: 'AG-UBE-SH', name: 'UBE Shanghai' },
  { id: 'AG-UBE-TW', name: 'UBE Taiwan' },
  { id: 'AG-UBE-US', name: 'UBE America' },
  { id: 'AG-MAR', name: 'Marubeni' },
  { id: 'AG-SHI', name: 'Shiraishi' },
  { id: 'AG-MIT', name: 'Mitsubishi' }
];
```

### Ship-Tos

```ts
export const INITIAL_SHIP_TOS: ShipToRecord[] = [
  {
    id: 'SHIP-MICHELIN',
    name: 'Michelin',
    customerCompanyIds: ['C001'],
    groupSaleType: GroupSaleType.OVERSEAS
  },
  {
    id: 'SHIP-MICHELIN-GOODYEAR-LATAM',
    name: 'Michelin, Goodyear, LATAM Local',
    customerCompanyIds: ['C001'],
    groupSaleType: GroupSaleType.OVERSEAS
  },
  {
    id: 'SHIP-CHINA-LOCAL-SAILUN-MAXTREK',
    name: 'China Local / Sailun, Maxtrek',
    customerCompanyIds: ['C001'],
    groupSaleType: GroupSaleType.OVERSEAS
  },
  {
    id: 'SHIP-OIA-NON-OIA',
    name: 'OIA / Non-OIA',
    customerCompanyIds: ['C001'],
    groupSaleType: GroupSaleType.OVERSEAS
  },
  {
    id: 'SHIP-DOMESTIC-TH',
    name: 'Domestic Thailand',
    customerCompanyIds: ['C001'],
    groupSaleType: GroupSaleType.DOMESTIC
  }
];
```

### Group Sale Types

```ts
export const INITIAL_GROUP_SALE_TYPES: GroupSaleTypeRecord[] = [
  { id: GroupSaleType.OVERSEAS, name: 'Overseas' },
  { id: GroupSaleType.DOMESTIC, name: 'Domestic' }
];
```

### Destinations

```ts
export const INITIAL_DESTINATIONS: MasterDataRecord[] = [
  { id: 'DEST-FRANCE', name: 'France', customerCompanyIds: ['C001'] },
  { id: 'DEST-USA', name: 'USA', customerCompanyIds: ['C001'] },
  { id: 'DEST-CHINA', name: 'China', customerCompanyIds: ['C001'] },
  {
    id: 'DEST-JAPAN',
    name: 'Japan',
    customerCompanyIds: ['C001', 'AG-UBE-JP']
  },
  { id: 'DEST-THAILAND', name: 'Thailand', customerCompanyIds: ['C001'] },
  { id: 'DEST-LATAM', name: 'Latin America', customerCompanyIds: ['C001'] }
];
```

### Terms

```ts
export const INITIAL_TERMS: MasterDataRecord[] = [
  { id: 'TERM-FOB', name: 'FOB', customerCompanyIds: ['C001'] },
  { id: 'TERM-CIF', name: 'CIF', customerCompanyIds: ['C001'] },
  { id: 'TERM-CFR', name: 'CFR', customerCompanyIds: ['C001'] },
  { id: 'TERM-EXW', name: 'EXW', customerCompanyIds: ['C001'] },
  { id: 'TERM-DDP', name: 'DDP', customerCompanyIds: ['C001'] }
];
```

### Grades

```ts
export const INITIAL_GRADES: MasterDataRecord[] = [
  { id: 'GRADE-1001A', name: 'UBE Nylon 1001A', customerCompanyIds: ['C001'] },
  { id: 'GRADE-1015B', name: 'UBE Nylon 1015B', customerCompanyIds: ['C001'] },
  { id: 'GRADE-1022B', name: 'UBE Nylon 1022B', customerCompanyIds: ['C001'] },
  { id: 'GRADE-2020B', name: 'UBE Nylon 2020B', customerCompanyIds: ['C001'] },
  { id: 'GRADE-5033B', name: 'UBE Nylon 5033B', customerCompanyIds: ['C001'] }
];
```

### Users (seed with hashed comparison — store plain for MVP demo)

```ts
// Password for all test users: "password"
export const INITIAL_USERS: User[] = [
  {
    id: 'user-001',
    username: 'trader1',
    role: Role.MAIN_TRADER,
    userGroup: UserGroup.TRADER,
    companyId: 'C001',
    canCreateOrder: true,
    shipToAccess: 'ALL',
    allowedShipToIds: [],
    allowedDocumentTypes: [
      DocumentType.SHIPPING_DOC,
      DocumentType.BL,
      DocumentType.INVOICE,
      DocumentType.COA,
      DocumentType.PO_PDF,
      DocumentType.SHIPPING_INSTRUCTION_PDF
    ]
  },
  {
    id: 'user-002',
    username: 'ubejp1',
    role: Role.UBE_JAPAN,
    userGroup: UserGroup.UBE,
    companyId: 'AG-UBE-JP',
    canCreateOrder: false,
    shipToAccess: 'ALL',
    allowedShipToIds: [],
    allowedDocumentTypes: [DocumentType.SHIPPING_DOC, DocumentType.BL]
  },
  {
    id: 'user-003',
    username: 'sale1',
    role: Role.SALE,
    userGroup: UserGroup.SALE,
    companyId: 'C001',
    canCreateOrder: false,
    shipToAccess: 'ALL',
    allowedShipToIds: [],
    allowedDocumentTypes: [
      DocumentType.SHIPPING_DOC,
      DocumentType.BL,
      DocumentType.INVOICE,
      DocumentType.COA
    ]
  },
  {
    id: 'user-004',
    username: 'cs1',
    role: Role.CS,
    userGroup: UserGroup.CS,
    companyId: 'C001',
    canCreateOrder: false,
    shipToAccess: 'ALL',
    allowedShipToIds: [],
    allowedDocumentTypes: [
      DocumentType.SHIPPING_DOC,
      DocumentType.BL,
      DocumentType.INVOICE,
      DocumentType.COA,
      DocumentType.PO_PDF,
      DocumentType.SHIPPING_INSTRUCTION_PDF
    ]
  },
  {
    id: 'user-005',
    username: 'admin',
    role: Role.ADMIN,
    userGroup: UserGroup.ADMIN,
    companyId: 'C001',
    canCreateOrder: true,
    shipToAccess: 'ALL',
    allowedShipToIds: [],
    allowedDocumentTypes: Object.values(DocumentType)
  },
  {
    id: 'user-006',
    username: 'mizutani',
    role: Role.UBE_JAPAN,
    userGroup: UserGroup.UBE,
    companyId: 'AG-UBE-JP',
    canCreateOrder: false,
    shipToAccess: 'ALL',
    allowedShipToIds: [],
    allowedDocumentTypes: [DocumentType.SHIPPING_DOC, DocumentType.BL]
  }
];

// Password validation in store login():
// All users share password "password" in MVP — compare directly
export const INITIAL_PASSWORDS: Record<string, string> = {
  trader1: 'password',
  ubejp1: 'password',
  sale1: 'password',
  cs1: 'password',
  admin: 'password',
  mizutani: 'password'
};
```

### Sample Orders (for demo — 2 orders with lines in various statuses)

```ts
export const INITIAL_ORDERS: Order[] = [
  {
    orderNo: 'ORD-2026-001',
    orderDate: '2026-02-10',
    note: 'Urgent shipment for Q1 customer',
    status: OrderProgressStatus.IN_PROGRESS,
    companyId: 'C001',
    createdBy: 'trader1',
    updatedBy: 'sale1',
    createdAt: '2026-02-10T08:00:00.000Z',
    updatedAt: '2026-02-12T10:00:00.000Z',
    items: [
      {
        id: 'line-001-1',
        poNo: 'PO-2026-001',
        shipToId: 'SHIP-MICHELIN',
        status: OrderLineStatus.APPROVED,
        destinationId: 'DEST-FRANCE',
        termId: 'TERM-CIF',
        requestETD: '2026-03-01',
        requestETA: '2026-03-20',
        gradeId: 'GRADE-1022B',
        qty: 20000,
        price: 2.5,
        currency: 'USD',
        asap: true,
        documents: []
      },
      {
        id: 'line-001-2',
        poNo: 'PO-2026-002',
        shipToId: 'SHIP-MICHELIN-GOODYEAR-LATAM',
        status: OrderLineStatus.CREATED,
        destinationId: 'DEST-LATAM',
        termId: 'TERM-FOB',
        requestETD: '2026-03-15',
        requestETA: '2026-04-10',
        gradeId: 'GRADE-1015B',
        qty: 10000,
        asap: false,
        documents: []
      }
    ],
    documents: []
  },
  {
    orderNo: 'ORD-2026-002',
    orderDate: '2026-02-20',
    note: '',
    status: OrderProgressStatus.CREATE,
    companyId: 'C001',
    createdBy: 'trader1',
    updatedBy: 'trader1',
    createdAt: '2026-02-20T09:00:00.000Z',
    updatedAt: '2026-02-20T09:00:00.000Z',
    items: [
      {
        id: 'line-002-1',
        poNo: 'PO-2026-003',
        shipToId: 'SHIP-CHINA-LOCAL-SAILUN-MAXTREK',
        status: OrderLineStatus.DRAFT,
        destinationId: 'DEST-CHINA',
        termId: 'TERM-CFR',
        requestETD: '2026-04-01',
        requestETA: '2026-04-25',
        gradeId: 'GRADE-1001A',
        qty: 25000,
        asap: false,
        documents: []
      }
    ],
    documents: []
  }
];
```

---

## �️ Store API (`store/index.ts`)

> Agent instruction: implement all state and actions below in a single Zustand
> store with `persist` middleware.

### State Shape

```ts
interface AppState {
  // Core
  theme: 'light' | 'dark';
  currentUser: User | null;
  users: User[];
  passwords: Record<string, string>; // { username: plaintext } — MVP only
  companies: CustomerCompany[];
  orders: Order[];

  // Logs
  integrationLogs: IntegrationLog[];
  notifications: NotificationLog[];
  activities: ActivityLog[];

  // Master data
  masterData: {
    destinations: MasterDataRecord[];
    terms: MasterDataRecord[];
    grades: MasterDataRecord[];
    shipTos: ShipToRecord[];
    groupSaleTypes: GroupSaleTypeRecord[];
  };

  // Permissions
  linePermissionMatrix: LineActionPermission[];
  linePermissionLocked: boolean;
  linePermissionCustomPresets: Array<{
    id: string;
    name: string;
    matrix: LineActionPermission[];
  }>;
}
```

### Actions (full list — implement all)

```ts
// Theme
toggleTheme: () => void;

// Auth
login: (username: string, password: string) => boolean;
logout: () => void;

// Orders
addOrder: (order: Order) => void;
updateOrder: (orderNo: string, updates: Partial<Order>) => void;
deleteOrder: (orderNo: string) => void;

// ⚠️ Critical: update a single line within an order
updateOrderLine: (orderNo: string, lineId: string, updates: Partial<OrderItem>) => void;
// Implementation:
// updateOrderLine: (orderNo, lineId, updates) => set(state => ({
//   orders: state.orders.map(o =>
//     o.orderNo !== orderNo ? o :
//     { ...o, items: o.items.map(item => item.id !== lineId ? item : { ...item, ...updates }) }
//   )
// }))

// ID / number generation
generateOrderNo: () => string;
// Returns next sequential: ORD-{YYYY}-{NNN padded to 3 digits}
// Algorithm: find existing orders for current year, increment max + 1
// Example: if ORD-2026-003 exists, next = ORD-2026-004

generateLineId: () => string;     // returns nanoid()
generateDocumentId: () => string; // returns nanoid()

// Logs
addActivity: (action: string, user: string, details: string) => void;
addNotification: (message: string, role: Role, type: 'email' | 'system') => void;
addIntegrationLog: (log: Omit<IntegrationLog, 'id' | 'timestamp'>) => void;

// Users
addUser: (user: Omit<User, 'id'>, password: string) => void;
updateUser: (userId: string, updates: Partial<Omit<User, 'id'>>) => void;
deleteUser: (userId: string) => void;

// Master data
updateMasterData: (type: 'destinations' | 'terms' | 'grades', data: MasterDataRecord[]) => void;
updateShipTos: (data: ShipToRecord[]) => void;
updateGroupSaleTypes: (data: GroupSaleTypeRecord[]) => void;
updateCompanies: (data: CustomerCompany[]) => void;

// Permission matrix
updateLinePermission: (action: LineAction, fromStatus: OrderLineStatus, updates: Pick<LineActionPermission, 'allowedUserGroups'>) => void;
setLinePermissionLocked: (locked: boolean) => void;
applyLinePermissionPreset: (preset: 'STANDARD' | 'STRICT') => void;
saveLinePermissionCustomPreset: (name: string) => boolean;  // false if name duplicate
applyLinePermissionCustomPreset: (presetId: string) => boolean;
deleteLinePermissionCustomPreset: (presetId: string) => void;
resetLinePermissionMatrix: () => void;

// Scheduled / system
runScheduledChecks: () => void;

// Dev
resetStore: () => void;  // resets entire state to initial seed
```

### Zustand Persist Config (`store/index.ts`)

**Critical for Next.js App Router** — must use `skipHydration: true` to prevent
SSR/client hydration mismatch:

```ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // ... state + actions
    }),
    {
      name: 'ube-portal-storage',
      storage: createJSONStorage(() => localStorage),
      skipHydration: true // ← REQUIRED for Next.js App Router
    }
  )
);
```

Then in the **root client layout** (`app/(portal)/layout.tsx`), call rehydrate
once:

```tsx
'use client';
import { useEffect } from 'react';
import { useStore } from '@/store';

export default function PortalLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const { theme } = useStore();

  useEffect(() => {
    // Rehydrate Zustand store from localStorage on client mount
    useStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    theme === 'dark'
      ? root.classList.add('dark')
      : root.classList.remove('dark');
  }, [theme]);

  // ... sidebar + topbar layout
}
```

> **Why**: Next.js renders on the server where `localStorage` doesn't exist.
> `skipHydration` prevents the store from trying to read localStorage on the
> server, then `rehydrate()` on the client picks it up after mount.

---

## �📝 Zod Schemas (Form Validation)

Define inline in each form component file.

### Create Order Form

```ts
import { z } from 'zod';

const orderLineSchema = z.object({
  poNo: z.string().min(1, 'PO No is required'),
  shipToId: z.string().min(1, 'Ship-To is required'),
  destinationId: z.string().min(1, 'Destination is required'),
  termId: z.string().min(1, 'Term is required'),
  gradeId: z.string().min(1, 'Grade is required'),
  qty: z.coerce.number().min(1, 'Quantity must be > 0'),
  requestETD: z.string().min(1, 'Request ETD is required'),
  requestETA: z.string().min(1, 'Request ETA is required'),
  asap: z.boolean().default(false),
  otherRequested: z.string().optional()
});

export const createOrderSchema = z.object({
  note: z.string().optional(),
  items: z.array(orderLineSchema).min(1, 'At least one line item is required')
});

export type CreateOrderFormValues = z.infer<typeof createOrderSchema>;
```

### Sale Approve Form (per line)

```ts
export const saleApproveSchema = z.object({
  price: z.coerce.number().min(0.01, 'Price must be greater than 0'),
  currency: z.string().min(1, 'Currency is required').default('USD'),
  saleNote: z.string().optional()
});

export type SaleApproveFormValues = z.infer<typeof saleApproveSchema>;
```

### Set ETD Form

```ts
export const setEtdSchema = z.object({
  actualETD: z.string().min(1, 'Actual ETD is required')
});

export type SetEtdFormValues = z.infer<typeof setEtdSchema>;
```

### Add User Form (Admin)

```ts
export const addUserSchema = z.object({
  username: z.string().min(2, 'Username must be at least 2 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.nativeEnum(Role),
  userGroup: z.nativeEnum(UserGroup),
  companyId: z.string().min(1, 'Company is required'),
  canCreateOrder: z.boolean().default(false),
  shipToAccess: z.enum(['ALL', 'SELECTED']).default('ALL'),
  allowedShipToIds: z.array(z.string()).default([]),
  allowedDocumentTypes: z.array(z.nativeEnum(DocumentType)).default([])
});

export type AddUserFormValues = z.infer<typeof addUserSchema>;
```

---

## 📝 Business Rules Quick Reference

1. `price > 0` required before APPROVE_LINE
2. `actualETD` required before SET_ETD
3. Both `Shipping Document` + `BL` required before UPLOAD_FINAL_DOCS
4. Urgent lines: `asap === true` AND ETA within 30 days AND NOT VESSEL_DEPARTED
5. Line edit: all fields locked when status > DRAFT
6. Document download: checked against `allowedDocumentTypes`
7. All actions must pass `canUserRunLineAction()` (ADMIN bypasses)
8. All sensitive actions logged to `activities`
9. OrderProgressStatus is always computed (derived), never stored directly
10. **UBE submit shortcut**: `userGroup === UBE` → DRAFT lines submit directly
    to `UBE_APPROVED`
11. **quotationNo format**: `QT-` + 6 random digits (e.g. `QT-482917`),
    generated during CRM simulation
12. **poNo uniqueness**: must be unique within the same order (cross-field Zod
    validation)
13. **MARK_RECEIVED_PO auto-downloads**: triggers browser download of PO PDF and
    SI PDF immediately (if user's `allowedDocumentTypes` includes them)
14. **Document upsert**: UPLOAD_FINAL_DOCS replaces existing documents of the
    same `DocumentType` (no duplicates per type)

---

## 🧪 Test Scenarios (Smoke Test per Role)

### As trader1 (MAIN_TRADER)

1. Login → run scheduled checks
2. Create new order with 2 lines
3. Submit 1 line
4. View order detail → confirm line status = CREATED

### As ubejp1 (UBE_JAPAN)

1. Login
2. Go to Order with CREATED line
3. UBE Approve line → status = UBE_APPROVED

### As sale1 (SALE)

1. Login → go to Sale Review
2. Find UBE_APPROVED line → enter price → Approve
3. Wait for CRM simulation → quotationNo appears

### As cs1 (CS)

1. Login
2. Go to CS Dashboard Stage 1 → find APPROVED line → set ETD
3. Go to Order Detail → Generate PO → download
4. Go to CS Dashboard Stage 2 → upload Shipping Doc + BL → Complete

### As admin

1. Login
2. Go to Admin → add user, change permission matrix
3. Go to Master Data → add new grade
4. Go to Logs → view all 3 tabs
