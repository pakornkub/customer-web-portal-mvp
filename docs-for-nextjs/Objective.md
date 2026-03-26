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
  poPdf.ts                   ← PO PDF + Shipping Instruction PDF generator (both in one file)
  statusLabel.ts             ← human-readable status labels
  permissions.ts             ← permission helper functions
```

---

## 👤 Roles & User Groups

### Roles (Route-level access)

| Role           | Description                                |
| -------------- | ------------------------------------------ |
| `ADMIN`        | Full access to all pages and data          |
| `MAIN_TRADER`  | Customer/Trader — creates orders           |
| `UBE_JAPAN`    | UBE Japan — can submit lines               |
| `TSL_SALE`     | SALE team — approve + price, review PO     |
| `SALE_MANAGER` | Sale Manager — final PO approval before CS |
| `CS`           | Customer Service — ETD + final docs        |

### User Groups (Action-level permission)

| UserGroup     | Maps to Roles |
| ------------- | ------------- |
| `TRADER`      | MAIN_TRADER   |
| `UEC_SALE`    | UBE_JAPAN     |
| `TSL_SALE`    | SALE          |
| `UEC_MANAGER` | SALE_MANAGER  |
| `TSL_CS`      | CS            |
| `ADMIN`       | ADMIN         |

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
}
interface ShipToRecord extends MasterDataRecord {
  groupSaleType: GroupSaleType;
  destinationIds: string[]; // destinations available for this ship-to (many-to-many via FK on ship-to side)
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

### SiTemplate (for PDF pre-fill)

```typescript
interface SiTemplate {
  id: string;
  shipToId: string;
  attn: string;
  from: string;
  // Bridgestone: "BS POLAND PO No.:"  |  Cooper: "UEG PO No."
  poNumberHeader: string;
  no2Header: string;        // Cooper: "Cooper NO.:"
  no2: string;
  materialCodeHeader: string;
  materialCode: string;
  noteUnderMaterial: string;
  user: string;
  country: string;
  shipper: string;
  feederVessel: string;
  motherVessel: string;
  vesselCompany: string;
  forwarder: string;
  portOfLoading: string;
  consignee: string;        // multi-line
  blType: string;
  freeTime: string;
  courierAddress: string;   // Bridgestone: "No need original courier."
  eoriNo: string;           // Bridgestone: EU customs EORI number
  bookingNo: string;
  notifyParty: string;
  alsoNotify1: string;
  alsoNotify2: string;
  deliverTo: string;        // Cooper: DELIVER TO address
  requirements: string;
  note: string;
  note2: string;
  note3: string;
  description: string;
  underDescription: string;
  shippingMark: string;     // multi-line
  belowSignature: string;
  createdAt: string;
  updatedAt: string;
}
```
```

---

## 🔢 Enums

```typescript
enum Role {
  UBE_JAPAN,
  MAIN_TRADER,
  TSL_CS,
  TSL_SALE,
  UEC_MANAGER,
  ADMIN
}

enum UserGroup {
  TRADER,
  UEC_SALE,
  TSL_SALE,
  UEC_MANAGER,
  TSL_CS,
  ADMIN
}

enum OrderLineStatus {
  DRAFT,
  CREATED,
  APPROVED,
  WAIT_SALE_UEC_APPROVE_PO,
  WAIT_MGR_UEC_APPROVE_PO,
  VESSEL_SCHEDULED,
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
  APPROVE_LINE,
  SET_ETD,
  APPROVE_SALE_PO,
  APPROVE_MGR_PO,
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
  [OrderLineStatus.APPROVED]: 'Confirmed',
  [OrderLineStatus.WAIT_SALE_UEC_APPROVE_PO]: 'Wait Sale UEC Approve PO',
  [OrderLineStatus.WAIT_MGR_UEC_APPROVE_PO]: 'Wait Mgr UEC Approve PO',
  [OrderLineStatus.VESSEL_SCHEDULED]: 'Wait Vessel Departure',
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
  [LineAction.APPROVE_LINE]: 'Sale Approve',
  [LineAction.SET_ETD]: 'Set ETD & Generate PO',
  [LineAction.APPROVE_SALE_PO]: 'Sale Review & Approve PO',
  [LineAction.APPROVE_MGR_PO]: 'Manager Approve PO',
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

แต่ละ line มี status แยกกัน ผ่าน 7 steps:

```
DRAFT
  └─[SUBMIT_LINE by TRADER/UEC_SALE/TSL_SALE]──▶ CREATED
       └─[APPROVE_LINE by TSL_SALE + price]──▶ APPROVED
            └─[SET_ETD by TSL_CS] + Gen PO PDF + SI PDF──▶ WAIT_SALE_UEC_APPROVE_PO
                 └─[APPROVE_SALE_PO by UEC_SALE] review PDF + confirm──▶ WAIT_MGR_UEC_APPROVE_PO
                      └─[APPROVE_MGR_PO by UEC_MANAGER]──▶ VESSEL_SCHEDULED
                           └─[UPLOAD_FINAL_DOCS by TSL_CS]──▶ VESSEL_DEPARTED
```

**OrderProgressStatus** (computed):

- `CREATE` = all lines are DRAFT
- `IN_PROGRESS` = mixed statuses
- `COMPLETE` = all lines are VESSEL_DEPARTED

### Step Detail & Business Rules

| Step               | Action              | Pre-condition                                             | Side Effects                                                                                                                                                     |
| ------------------ | ------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Submit             | `SUBMIT_LINE`       | Line is DRAFT                                             | Line → CREATED. Notify SALE via mock email, activity log                                                                                                         |
| Sale Approve       | `APPROVE_LINE`      | Line is CREATED + `price > 0`                             | CRM simulation (await ~1.8s) → sets `quotationNo` (format: `QT-XXXXXX` 6 random digits), notifies CS. Line → APPROVED                                            |
| Set ETD + Gen PO   | `SET_ETD`           | Line is APPROVED + actualETD provided                     | Auto-generate PO PDF + SI PDF, attach to line docs. **Auto-download both PDFs** (if user has `allowedDocumentTypes` permission). Line → WAIT_SALE_UEC_APPROVE_PO |
| Sale Review PO     | `APPROVE_SALE_PO`   | Line is WAIT_SALE_UEC_APPROVE_PO                          | Sale opens/reviews PO PDF, confirms. Line → WAIT_MGR_UEC_APPROVE_PO. Activity log                                                                                |
| Manager Approve PO | `APPROVE_MGR_PO`    | Line is WAIT_MGR_UEC_APPROVE_PO                           | Sale Manager reviews and approves. Line → VESSEL_SCHEDULED. Activity log                                                                                         |
| Upload & Depart    | `UPLOAD_FINAL_DOCS` | Line is VESSEL_SCHEDULED + has `Shipping Document` + `BL` | Uploaded docs replace same-type existing docs. Notify customer (mock), activity log, line → VESSEL_DEPARTED                                                      |

---

## 🔐 Permission System

### Line Action Permission Matrix

- Stored as `LineActionPermission[]` in state
- Each entry: `{ action, fromStatus, toStatus, allowedUserGroups[] }`
- **ADMIN bypasses all matrix checks**
- Admin can edit, lock/unlock, and save custom presets

### Presets

**STANDARD preset** (default):

- SUBMIT_LINE: TRADER + UEC_SALE + TSL_SALE
- APPROVE_LINE: TSL_SALE
- SET_ETD: TSL_CS
- APPROVE_SALE_PO: UEC_SALE
- APPROVE_MGR_PO: UEC_MANAGER
- UPLOAD_FINAL_DOCS: TSL_CS

**STRICT preset**:

- SUBMIT_LINE: TRADER only
- APPROVE_LINE: TSL_SALE
- SET_ETD: TSL_CS
- APPROVE_SALE_PO: UEC_SALE
- APPROVE_MGR_PO: UEC_MANAGER
- UPLOAD_FINAL_DOCS: TSL_CS

### Data Visibility Rules

- Non-ADMIN: only see lines where `canUserAccessShipTo(user, line.shipToId)` =
  true
  - `shipToAccess === 'ALL'` → see all lines
  - `shipToAccess === 'SELECTED'` → only lines whose `shipToId` is in
    `allowedShipToIds`
- Orders with zero visible lines are hidden from the user entirely
- **No company-level filter** — ship-to access is the sole visibility gate

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

**Test users to seed:**

| Username    | Password   | Role         | UserGroup    | Company             |
| ----------- | ---------- | ------------ | ------------ | ------------------- |
| `trader1`   | `password` | MAIN_TRADER  | TRADER       | C001 (UBE Thailand) |
| `ubejp1`    | `password` | UBE_JAPAN    | UBE          | AG-UBE-JP           |
| `sale1`     | `password` | SALE         | SALE         | (internal)          |
| `sale_mgr1` | `password` | SALE_MANAGER | SALE_MANAGER | (internal)          |
| `cs1`       | `password` | CS           | CS           | (internal)          |
| `admin`     | `password` | ADMIN        | ADMIN        | (all)               |

### TASK-03: Layout & Navigation

- [ ] Sidebar layout with collapsible menu (icon-only when collapsed)
- [ ] Top bar: current page title (breadcrumb), username + role badge, dark mode
      toggle, logout button
- [ ] Sidebar menu items shown per role (exact spec below)
- [ ] Active menu item highlighted
- [ ] Sidebar collapse state persisted in localStorage

**Sidebar menu per role:**

| Menu Item    | Route          | Icon              | Show condition                  |
| ------------ | -------------- | ----------------- | ------------------------------- |
| Dashboard    | `/`            | `LayoutDashboard` | Always                          |
| Orders       | `/orders`      | `Package`         | Always                          |
| Sale Review  | `/review`      | `ClipboardCheck`  | Role: SALE, SALE_MANAGER, ADMIN |
| Mgr Approve  | `/mgr-approve` | `BadgeCheck`      | Role: SALE_MANAGER, ADMIN       |
| CS Dashboard | `/cs`          | `Ship`            | Role: CS, ADMIN                 |
| Admin        | `/admin`       | `ShieldCheck`     | Role: ADMIN                     |
| Master Data  | `/master-data` | `Database`        | Role: ADMIN                     |
| Logs         | `/logs`        | `ScrollText`      | Role: ADMIN                     |
| Clear Data   | `/clear-data`  | `Trash2`          | Always (dev/demo tool)          |

**Role → visible menu summary:**

| Role         | Visible menus                               |
| ------------ | ------------------------------------------- |
| MAIN_TRADER  | Dashboard, Orders                           |
| UBE_JAPAN    | Dashboard, Orders                           |
| SALE         | Dashboard, Orders, Sale Review              |
| SALE_MANAGER | Dashboard, Orders, Sale Review, Mgr Approve |
| CS           | Dashboard, Orders, CS Dashboard             |
| ADMIN        | All menus                                   |

### TASK-04: Dashboard (`/`)

- [ ] Summary cards: count of lines per `OrderLineStatus` (for visible lines)
- [ ] Urgent lines section: ASAP lines with ETA within 30 days, exclude
      VESSEL_DEPARTED
- [ ] Recent orders table: last 8 lines, sorted by orderDate desc
- [ ] Quick link to Create Order (if permitted)
- [ ] All data scoped to `getVisibleOrdersForUser`

**Status cards** (7 cards): DRAFT, CREATED, APPROVED (label: "Confirmed"),
WAIT_SALE_UEC_APPROVE_PO, WAIT_MGR_UEC_APPROVE_PO, VESSEL_SCHEDULED,
VESSEL_DEPARTED

### TASK-05: Orders List (`/orders`)

- [ ] Table of all visible orders
- [ ] Columns: Order No, Date, Company, Status badge, Line count, Actions
- [ ] Search by order no / company
- [ ] Filter by `OrderProgressStatus`
- [ ] Row click → order detail
- [ ] Create New Order button (if permitted, accessible from this page — **not**
      via sidebar)
- [ ] **Delete order** only allowed when `OrderProgressStatus === CREATE` (all
      lines still DRAFT); button disabled with tooltip otherwise

### TASK-06: Create / Edit Order (`/orders/create`, `/orders/[orderNo]/edit`)

- [ ] Form: Order-level fields (note)
- [ ] Dynamic line items (add/remove/duplicate/move-up/move-down rows)
- [ ] Per line: poNo (must be unique within order), shipToId, destinationId,
      termId, requestETD, requestETA, gradeId, qty, asap, otherRequested
- [ ] Require: `asap === true` OR at least one of `requestETD` / `requestETA` is
      set (Zod cross-field refinement)
- [ ] `shipToId` dropdown filtered by user's allowed ship-tos
      (`canUserAccessShipTo`)
- [ ] `destinationId` dropdown filtered by selected Ship-To's `destinationIds` —
      when `shipToId` changes, reset `destinationId` to empty
- [ ] `termId`, `gradeId` dropdowns show **all records** (no filter)
- [ ] Validate with Zod before submit
- [ ] **Selective submit**: row-level checkboxes. Only DRAFT-status lines are
      selectable. User must select ≥1 line to submit. Unselected DRAFT lines
      remain DRAFT.
- [ ] **UBE shortcut**: when submitting, if
      `currentUser.userGroup === UserGroup.UEC_SALE`, selected lines go to
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
  - Sale Approve with price + currency input (CREATED → APPROVED)
  - Set ETD with date picker (APPROVED → WAIT_SALE_UEC_APPROVE_PO) →
    **auto-generate PO PDF + SI PDF** + auto-download
  - Sale Review PO: button to open PO PDF + confirm (WAIT_SALE_UEC_APPROVE_PO →
    WAIT_MGR_UEC_APPROVE_PO)
  - Manager Approve PO: review + approve (WAIT_MGR_UEC_APPROVE_PO →
    VESSEL_SCHEDULED)
  - Upload Final Docs (VESSEL_SCHEDULED → VESSEL_DEPARTED)
- [ ] Per-line document list with download (filtered by `allowedDocumentTypes`)
- [ ] Confirm dialog before any status-changing action

### TASK-08: Sale Review (`/review`)

Page has two distinct sections, each with its own section header and item count
badge:

**Section 1 — Line Confirm** (indigo theme)

- [ ] List all lines with status `CREATED` across all orders (for visible
      orders)
- [ ] Section header: "Line Confirm — Waiting Sale Review" + count badge
- [ ] Per line: PO No, Order No, Ship-To, Grade, Qty, Request ETD/ETA
- [ ] Inline price + currency input per line
- [ ] Sale note input per line
- [ ] Approve button with confirm dialog
- [ ] On approve: single `await sleep(1800)` simulating CRM API round-trip
- [ ] After await: set `quotationNo = 'QT-' + 6 random digits` (e.g.
      `QT-482917`); log SUCCESS to integrationLogs; notify CS (system)
- [ ] Show spinner/disabled state on Approve button during the 1.8s wait
- [ ] **Save Draft** button (per line): persists price, currency, saleNote
      WITHOUT changing line status

**Section 2 — PO Review** (amber theme)

- [ ] List all lines with status `WAIT_SALE_UEC_APPROVE_PO` across all visible
      orders
- [ ] Section header: "PO Review — Waiting Sale Approval" + count badge
- [ ] Per line: PO No, Ship-To, Qty, Price, ETD, link to download PO PDF
- [ ] **Approve PO** button with confirm dialog → line →
      `WAIT_MGR_UEC_APPROVE_PO`; notify `SALE_MANAGER` (email); activity log
- [ ] Show spinner/disabled state on Approve button during processing

- [ ] Restrict page to SALE + SALE_MANAGER + ADMIN
- [ ] Empty state shows when **both** sections have no items

### TASK-09: CS Dashboard (`/cs`)

- [ ] **Stage 1 — Set ETD**: cards for lines with status `APPROVED`
  - Show: Order No, PO No, Ship-To, Grade, Qty, Request ETD, ASAP flag
  - Action: Set Actual ETD (date input + confirm) → auto-generates PO PDF + SI
    PDF + auto-download → line → WAIT_SALE_UEC_APPROVE_PO
- [ ] **Stage 2 — Finalize Shipping**: cards for lines with status
      `VESSEL_SCHEDULED`
  - Show: line info + current uploaded docs list
  - Action: upload documents (type selector + file input, save draft)
  - Complete button: only enabled when `Shipping Document` + `BL` both present
- [ ] Restrict page to CS + ADMIN

### TASK-08b: Mgr Approve (`/mgr-approve`)

- [ ] List all lines with status `WAIT_MGR_UEC_APPROVE_PO` across all visible
      orders
- [ ] Per line: PO No, Order No, Ship-To, Grade, Qty, ETD, link/button to open
      PO PDF
- [ ] Approve button with confirm dialog → line → VESSEL_SCHEDULED. Activity log
- [ ] Restrict page to SALE_MANAGER + ADMIN

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

- [ ] **Ship-Tos**: id, name, groupSaleType, destinationIds (multi-select from
      available destinations)
- [ ] **Destinations**: id, name
- [ ] **Terms**: id, name
- [ ] **Grades**: id, name
- [ ] **Group Sale Types**: id (enum value), name
- [ ] Each tab: table + add row + delete row

### TASK-12: Logs Page (`/logs`)

Three tabs:

- [ ] **Integration Logs**: orderNo, status badge, message, timestamp
- [ ] **Activity Logs**: action, user, details, timestamp
- [ ] **Notification Logs**: role, type, message, timestamp
- [ ] Restrict to ADMIN

### TASK-13: PDF Generation

> **Engine**: Raw PDF 1.4 builder (no external jsPDF library). All generation
> lives in `utils/poPdf.ts` and runs client-side only (`'use client'` context).
> The file exports three functions consumed by the app.

#### Exported Functions

```ts
// Generate PO PDF, returns base64 data-URI string
createPurchaseOrderPdfDataUrl(input: PoPdfInput): string

// Generate Shipping Instruction PDF, dispatches to correct builder by shipToId
createShippingInstructionPdfDataUrl(input: PoPdfInput): string

// Two internal SI builders (not exported directly):
// buildBridgestoneSI(input)  — for SHIP-BRIDGESTONE-POZNAN
// buildCooperKunshanSI(input) — for SHIP-COOPER-KUNSHAN
```

#### SI Dispatch Logic

```ts
// Dispatcher in createShippingInstructionPdfDataUrl:
if (input.shipToId === 'SHIP-BRIDGESTONE-POZNAN') {
  pages = buildBridgestoneSI(input);
} else {
  pages = buildCooperKunshanSI(input);  // default / Cooper Kunshan
}
```

#### PDF Page Constants

```
A4: 595 × 842 pt
Left margin (L):  40
Right margin (R): 555
Content width:    515
Char-width coeff (CW): 0.52  (Helvetica estimate)
Font: Helvetica (built-in PDF font)
```

#### `PoPdfInput` Type (complete)

```ts
type PoPdfInput = {
  // === Order / Line data ===
  orderNo: string;
  orderDate?: string;
  poNo: string;
  shipToId: string;
  destinationId: string;
  termId: string;
  gradeId: string;
  qty: number;
  price?: number;
  currency?: string;
  requestETD?: string;
  actualETD?: string;

  // === PO Template fields ===
  poToBlock?: string;            // multi-line TO: block
  poConsigneeNotify?: string;    // multi-line CONSIGNEE & NOTIFY
  poTermsOfPayment?: string;
  poPackingInstructions?: string;
  poConfirmBy?: string;          // multi-line: "Name\nTitle\nCompany"
  destinationName?: string;      // resolved destination display name
  poGradeCode?: string;          // e.g. "VCR" from "VCR412"
  poGradeDescription?: string;   // full grade description

  // === SI Template fields (shared) ===
  siAttn?: string;
  siFrom?: string;
  siUser?: string;
  siCountry?: string;
  siShipper?: string;
  siFeederVessel?: string;
  siMotherVessel?: string;
  siVesselCompany?: string;
  siForwarder?: string;
  siPortOfLoading?: string;
  siConsignee?: string;          // multi-line consignee block
  siBlType?: string;
  siFreeTime?: string;
  siRequirements?: string;
  siNote?: string;
  siNote2?: string;
  siNote3?: string;
  siDescription?: string;
  siUnderDescription?: string;
  siShippingMark?: string;       // multi-line mark lines
  siBelowSignature?: string;

  // === Bridgestone Poznan-specific SI fields ===
  siPoNumberHeader?: string;     // e.g. "BS POLAND PO No.:"
  siBookingNo?: string;
  siCourierAddress?: string;     // note shown under CONSIGNEE
  siEoriNo?: string;             // EU customs EORI number
  siNotifyParty?: string;        // NOTIFY PARTY content

  // === Cooper Kunshan-specific SI fields ===
  siDeliverTo?: string;          // DELIVER TO address (3-col middle column)
  siNo2Header?: string;          // 2nd ref number label e.g. "Cooper NO.:"
  siNo2?: string;                // 2nd ref number value
  siMaterialCodeHeader?: string; // e.g. "Material Code"
  siMaterialCode?: string;       // shown inside SHIPPING MARK box
  siNoteUnderMaterial?: string;  // note below material code
};
```

#### Bridgestone SI Layout (y-coordinate map, top→bottom)

```
Letterhead: y=817/806/795   UBE logo: y=813
Date right-aligned: y=783   Title: y=771   Divider: y=762

ATTN/FROM block: y=750/737/724/712   Divider: y=702

CONTRACT NO. + BS PO No.: y=690   (LV=130, LVR=372)
USER: y=676   COUNTRY: y=662   SHIPPER: y=648
Divider: y=638

SHIPPING MARK box: x=270→555, top=634, bottom=476 (4-sided)

FEEDER VESSEL (wrapTC): y=627   maxW=112
MOTHER VESSEL (wrapTC): y=601   maxW=112
VESSEL COMPANY (wrapTC): y=575  maxW=112
FORWARDER: y=549   ETD: y=535   ETA: y=521
Divider: y=472

PORT + FREE TIME: y=460   DESTINATION + D/T: y=446
Divider: y=437

BOOKING NO.: y=425   Light divider: y=415

CONSIGNEE AND / NOTIFY: y=403/391   (values from y=403, step=-13, max 5 lines)
COURIER ADDRESS (long label): label x=40, value x=170, y=340
EORI No.: y=326
Divider: y=316

NOTIFY PARTY: y=304   Light divider: y=294
REQUIREMENTS: y=282 (3 lines)   Light divider: y=244
NOTES 4 lines: from y=232 step=-13 (8.5pt)
Divider: y=192

GRADE TABLE header: y=181   data: y=162
Divider: y=138
SIGNATURE line: y=120   below-sig: y=108
```

**Key layout variables:**
```ts
const LV = 130;    // label→value split x for most left-col rows
const LVR = 372;   // right-col value x for BS POLAND PO No. field
```

**Word-wrap helper** (`wrapTC`) — used for FEEDER/MOTHER/VESSEL COMPANY:
- Splits text at last word boundary that fits within `maxW`
- Renders overflow on `y-13` (next line)
- Each wrapTC row is spaced **26pt** from the next to allow for wrap overflow

#### Cooper Kunshan SI Layout

Uses a different layout with headers, a 3-column reference section, and an embedded material code in the shipping mark box. Key differences:
- 3-col row: `UEG PO No.` / `Cooper NO.` / `MATERIAL CODE`
- `SHIPPING MARK` box includes `DELIVER TO` and `Material Code` info
- Has `NOTIFY PARTY` and `ALSO NOTIFY` rows
- No BOOKING NO., COURIER ADDRESS, or EORI sections

#### Usage in Action Handler

```ts
import {
  createPurchaseOrderPdfDataUrl,
  createShippingInstructionPdfDataUrl
} from '@/utils/poPdf';

// In SET_ETD / CS action handler:
const poDataUrl = createPurchaseOrderPdfDataUrl(siInput);
const siDataUrl = createShippingInstructionPdfDataUrl(siInput);

// Attach to line documents:
updateOrderLine(orderNo, line.id, {
  documents: [
    { id: nanoid(), type: DocumentType.PO_PDF, filename: `PO-${poNo}.pdf`, dataUrl: poDataUrl, ... },
    { id: nanoid(), type: DocumentType.SHIPPING_INSTRUCTION_PDF, filename: `SI-${poNo}.pdf`, dataUrl: siDataUrl, ... }
  ]
});
```

#### Master Template Storage (`SiTemplate`)

SI templates are stored in `masterData.siTemplates` in the Zustand store.
Each template is keyed by `shipToId`. The `PdfGenerationModal` reads the
matching template and pre-fills the form fields before PDF generation.

```ts
interface SiTemplate {
  id: string;
  shipToId: string;
  attn: string;
  from: string;
  poNumberHeader: string;   // BS: "BS POLAND PO No.:", Cooper: "UEG PO No."
  no2Header: string;        // Cooper: "Cooper NO.:"
  no2: string;
  materialCodeHeader: string;
  materialCode: string;
  noteUnderMaterial: string;
  user: string;
  country: string;
  shipper: string;
  feederVessel: string;
  motherVessel: string;
  vesselCompany: string;
  forwarder: string;
  portOfLoading: string;
  consignee: string;        // multi-line
  blType: string;
  freeTime: string;
  courierAddress: string;   // Bridgestone: "No need original courier."
  eoriNo: string;           // Bridgestone: "PL782205233400000"
  bookingNo: string;
  notifyParty: string;
  alsoNotify1: string;
  alsoNotify2: string;
  deliverTo: string;        // Cooper: consignee address
  requirements: string;
  note: string;
  note2: string;
  note3: string;
  description: string;
  underDescription: string;
  shippingMark: string;     // multi-line
  belowSignature: string;
  createdAt: string;
  updatedAt: string;
}
```

**Pre-seeded templates** (in `store.ts` initial state):
- `SIT-BRIDGESTONE-POZNAN` → `shipToId: 'SHIP-BRIDGESTONE-POZNAN'`
- `SIT-COOPER-KUNSHAN` → `shipToId: 'SHIP-COOPER-KUNSHAN'`

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
    id: 'SHIP-AV-THOMAS',
    name: 'A.V. THOMAS & CO.LTD',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-COCHIN']
  },
  {
    id: 'SHIP-ALERON-VIETNAM',
    name: 'ALERON VIETNAM FOOTWEAR LIMITED',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-HAIPHONG']
  },
  {
    id: 'SHIP-ALL-WELLS',
    name: 'ALL WELLS INTERNATIONAL CO.,LTD',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CAT-LAI-HCM']
  },
  {
    id: 'SHIP-ALPHA-POLYMER-DN',
    name: 'ALPHA-POLYMER CO., LTD. (Dong Nai Bonded)',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CAT-LAI-HCM']
  },
  {
    id: 'SHIP-ALPHA-POLYMER-TW',
    name: 'ALPHA-POLYMER CO.,LTD (Whaleship Taiwan)',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-TAICHUNG']
  },
  {
    id: 'SHIP-ANNORA-VIETNAM',
    name: 'ANNORA VIETNAM FOOTWEAR LIMITED',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-HAIPHONG']
  },
  {
    id: 'SHIP-AURORA-VIETNAM',
    name: 'AURORA VIETNAM INDUSTRIAL FOOTWEAR CO., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-HAIPHONG']
  },
  {
    id: 'SHIP-BALKRISHNA',
    name: 'BALKRISHNA INDUSTRIES LIMITED',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-NHAVA-SHEVA']
  },
  {
    id: 'SHIP-BOEHLE',
    name: 'BOEHLE CHEMICALS',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CALUMET-CITY']
  },
  {
    id: 'SHIP-BRIDGESTONE-TIANJIN',
    name: 'BRIDGESTONE (TIANJIN) TIRE CO., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-BEIJING-AIRPORT']
  },
  {
    id: 'SHIP-BRIDGESTONE-WUXI',
    name: 'BRIDGESTONE (WUXI) TIRE CO., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-SHANGHAI']
  },
  {
    id: 'SHIP-BRIDGESTONE-JAPAN',
    name: 'Bridgestone Corporation',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-TOKYO']
  },
  {
    id: 'SHIP-BRIDGESTONE-MEXICO',
    name: 'BRIDGESTONE DE MEXICO, S.A. DE C.V.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-MANZANILLO']
  },
  {
    id: 'SHIP-BRIDGESTONE-BRASIL',
    name: 'BRIDGESTONE DO BRASIL',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-SANTOS']
  },
  {
    id: 'SHIP-BRIDGESTONE-WILSON',
    name: 'BRIDGESTONE FIRESTONE NT WILSON PLANT',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-WILSON']
  },
  {
    id: 'SHIP-BRIDGESTONE-INDIA',
    name: 'BRIDGESTONE INDIA PRIVATE LIMITED',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-NHAVA-SHEVA']
  },
  {
    id: 'SHIP-BRIDGESTONE-POZNAN',
    name: 'BRIDGESTONE POZNAN SP/ZO.O.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-GDYNIA']
  },
  {
    id: 'SHIP-BRIDGESTONE-SA',
    name: 'BRIDGESTONE SA (PTY) LTD',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-PORT-ELIZABETH']
  },
  {
    id: 'SHIP-BRIDGESTONE-TAIWAN',
    name: 'BRIDGESTONE TAIWAN CO., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-KEELUNG']
  },
  {
    id: 'SHIP-BRIDGESTONE-TATABANYA',
    name: 'BRIDGESTONE TATABANYA MANUFACTURING LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-HAMBURG']
  },
  {
    id: 'SHIP-BRIDGESTONE-VIETNAM',
    name: 'BRIDGESTONE VIETNAM',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-HAIPHONG']
  },
  {
    id: 'SHIP-BRISA',
    name: 'BRISA BRIDGESTONE SABANCI LASTIK SANAYI VE TICARET A.S.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-GEBZE']
  },
  {
    id: 'SHIP-CEAT-KELANI',
    name: 'CEAT KELANI INTERNATIONAL TYRES PVT LTD',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-COLOMBO']
  },
  {
    id: 'SHIP-CEAT',
    name: 'CEAT LIMITED',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CHENNAI', 'DEST-NHAVA-SHEVA']
  },
  {
    id: 'SHIP-CHENG-SHIN-XIAMEN',
    name: 'CHENG SHIN RUBBER (XIAMEN) IND.,LTD',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-XIAMEN']
  },
  {
    id: 'SHIP-CHENG-SHIN-TW',
    name: 'CHENG SHIN RUBBER IND. CO., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-TAICHUNG']
  },
  {
    id: 'SHIP-CHENG-SHIN-VN',
    name: 'CHENG SHIN RUBBER (VIETNAM) IND. CO., LTD',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CAT-LAI-HCM']
  },
  {
    id: 'SHIP-CHENG-SHIN-SHANGHAI',
    name: 'CHENG SHIN TIRE & RUBBER (CHINA) CO., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-SHANGHAI']
  },
  {
    id: 'SHIP-CHENG-SHIN-CHONGQING',
    name: 'CHENG SHIN TIRE & RUBBER (CHONGQING) CO.,LTD',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CHONGQING']
  },
  {
    id: 'SHIP-CHENG-SHIN-XIAMEN2',
    name: 'CHENG SHIN TIRE (XIAMEN) CO., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-XIAMEN']
  },
  {
    id: 'SHIP-CHENGSHIN-TW',
    name: 'CHENGSHIN RUBBER TAIWAN',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-TAICHUNG']
  },
  {
    id: 'SHIP-CHINH-DUONG',
    name: 'CHINH DUONG ONE MEMBER CO.,LTD',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CAT-LAI-HCM']
  },
  {
    id: 'SHIP-CHUN-XIANG',
    name: 'CHUN XIANG RUBBER PLASTIC PRODUCT CO., LTD',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CAT-LAI-HCM']
  },
  {
    id: 'SHIP-ANTHAI',
    name: 'CONG TY TNHH CONG NGHE CAO SU ANTHAI VIETNAM',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CAT-LAI-HCM']
  },
  {
    id: 'SHIP-CREATIVE-SOURCE',
    name: 'CONG TY TNHH CREATIVE SOURCE VIET NAM',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-HAIPHONG']
  },
  {
    id: 'SHIP-VIET-SIEU',
    name: 'CONG TY TNHH SX TM VIET SIEU',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CAT-LAI-HCM']
  },
  {
    id: 'SHIP-CONTINENTAL-STOECKEN',
    name: 'CONTINENTAL AG STOECKEN',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-HANNOVER', 'DEST-KOPER']
  },
  {
    id: 'SHIP-CONTINENTAL-AACHEN',
    name: 'CONTINENTAL AG WERK AACHEN',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-AACHEN']
  },
  {
    id: 'SHIP-CONTINENTAL-ROMANIA',
    name: 'Continental Automotive Products S.R.L.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-TIMISOARA']
  },
  {
    id: 'SHIP-CONTINENTAL-BARUM',
    name: 'Continental Barum s.r.o.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-OTROKOVICE']
  },
  {
    id: 'SHIP-CONTINENTAL-FRANCE',
    name: 'CONTINENTAL FRANCE SAS',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-SARREGUEMINES']
  },
  {
    id: 'SHIP-CONTINENTAL-INDIA',
    name: 'CONTINENTAL INDIA PRIVATE LIMITED',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-NHAVA-SHEVA']
  },
  {
    id: 'SHIP-CONTINENTAL-KORBACH',
    name: 'CONTINENTAL KORBACH',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-KORBACH']
  },
  {
    id: 'SHIP-CONTINENTAL-MABOR',
    name: 'Continental Mabor Industria de Pneus, S.A.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-LOUSADO']
  },
  {
    id: 'SHIP-CONTINENTAL-AMERICAS',
    name: 'CONTINENTAL TIRE THE AMERICAS, LLC',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-MT-VERNON']
  },
  {
    id: 'SHIP-CONTINENTAL-CHINA',
    name: 'CONTINENTAL TIRES (CHINA) CO.,LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-SHANGHAI']
  },
  {
    id: 'SHIP-CONTINENTAL-SLOVAKIA',
    name: 'CONTINENTAL TIRES SLOVAKIA, S.R.O.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-KOPER', 'DEST-PUCHOV']
  },
  {
    id: 'SHIP-CONTINENTAL-MALAYSIA',
    name: 'CONTINENTAL TYRE AS MALAYSIA SDN. BHD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-ALOR-SETAR']
  },
  {
    id: 'SHIP-CONTINENTAL-ZA',
    name: 'CONTINENTAL TYRE SOUTH AFRICA PTY LTD',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-PORT-ELIZABETH']
  },
  {
    id: 'SHIP-COOPER-SERBIA',
    name: 'COOPER TIRE AND RUBBER COMPANY SERBIA',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-KRUSEVAC']
  },
  {
    id: 'SHIP-COOPER-KUNSHAN',
    name: 'COOPER (KUNSHAN) TIRE CO.,LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-SHANGHAI']
  },
  {
    id: 'SHIP-DONA-PACIFIC',
    name: 'DONA PACIFIC (VIETNAM) CO.,LTD',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CAT-LAI-HCM']
  },
  {
    id: 'SHIP-DONA-VICTOR',
    name: 'DONA VICTOR FOOTWEAR COMPANY LIMITED',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CAT-LAI-HCM']
  },
  {
    id: 'SHIP-DG-CHUNXIANG',
    name: 'Dongguan Chunxiang Rubber and Plastic Product Co., Ltd.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-SHATIAN']
  },
  {
    id: 'SHIP-DG-YUECHUAN',
    name: 'DONGGUAN CITY YUECHUAN CHEMICAL CO., LTD',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-SHATIAN']
  },
  {
    id: 'SHIP-DG-GLUN',
    name: 'DONGGUAN G-LUN RUBBER & PLASTIC CO., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: [
      'DEST-HUANGPU',
      'DEST-JIAOXIN',
      'DEST-SHATIAN',
      'DEST-TAIPING',
      'DEST-YANTIAN'
    ]
  },
  {
    id: 'SHIP-DG-HERRY',
    name: 'DONGGUAN HERRY PLASTIC AND RUBBER TECHNOLOGY CO., LTD',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-SHATIAN']
  },
  {
    id: 'SHIP-DG-JIAYUE',
    name: 'DONGGUAN JIAYUE RUBBER AND PLASTIC MATERIAL TECHNOLOGY CO., LTD',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-TAIPING']
  },
  {
    id: 'SHIP-DG-LAAYOUNE',
    name: 'DONGGUAN LAAYOUNE CHEMICAL CO., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-HUANGPU', 'DEST-TAIPING', 'DEST-XIAMEN']
  },
  {
    id: 'SHIP-DG-QIHANG',
    name: 'Dongguan Qihang Rubber & Plastic Co., LTD',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-SHATIAN']
  },
  {
    id: 'SHIP-DG-SUNKIU',
    name: 'DONGGUAN SUN KIU SHOES CO.,LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-TAIPING']
  },
  {
    id: 'SHIP-DG-YINGFENG',
    name: 'DONGGUAN YINGFENG RUBBER CO., LTD',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-TAIPING']
  },
  {
    id: 'SHIP-DG-YINGTAI',
    name: 'DONGGUAN YINGTAI COMMERCE CO.,LTD',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-TAIPING', 'DEST-XIAMEN']
  },
  {
    id: 'SHIP-DOUBLESTAR',
    name: 'DOUBLESTAR DONGFENG TYRE CO., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-QINGDAO']
  },
  {
    id: 'SHIP-DUONG-PHAT',
    name: 'DUONG PHAT IMPORT AND EXPORT SERVICES TRADING COMPANY LIMITED',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CAT-LAI-HCM']
  },
  {
    id: 'SHIP-EAST-WIND-INDIA',
    name: 'EAST WIND FOOTWEAR COMPANY LIMITED (INDIA)',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CHENNAI', 'DEST-KATTUPALLI']
  },
  {
    id: 'SHIP-ETERNAL-PROWESS',
    name: 'ETERNAL PROWESS',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CAT-LAI-HCM']
  },
  {
    id: 'SHIP-EVER-POWER',
    name: 'EVER POWER INTERNATIONAL CO.,LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-SIHANOUKVILLE']
  },
  {
    id: 'SHIP-FAIRWAY',
    name: 'FAIRWAY ENTERPRISES COMPANY LIMITED',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CHENNAI', 'DEST-KATTUPALLI']
  },
  {
    id: 'SHIP-FEET-BIT',
    name: 'FEET BIT INTERNATIONAL COMPANY LIMITED',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-HONG-KONG']
  },
  {
    id: 'SHIP-FUJIAN-LIFENG',
    name: 'FUJIAN LIFENG FOOTWEAR INDUSTRIAL DEVELOPMENT CO., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-MAWEI-FUZHOU']
  },
  {
    id: 'SHIP-FUJIAN-SANFENG',
    name: 'FUJIAN SAN FENG FOOTWEAR CO., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-MAWEI-FUZHOU', 'DEST-XIAMEN']
  },
  {
    id: 'SHIP-FUJIAN-XIEFENG',
    name: 'FUJIAN XIEFENG FOOTWEAR CO., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-MAWEI-FUZHOU']
  },
  {
    id: 'SHIP-GEE-HORN',
    name: 'GEE HORN INTERNATIONAL CO.,LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-KEELUNG']
  },
  {
    id: 'SHIP-GEM-TREADS',
    name: 'GEM TREADS PRIVATE LIMITED',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-COCHIN']
  },
  {
    id: 'SHIP-GEMCO',
    name: 'GEMCO RUBBER PRIVATE LIMITED',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-COCHIN']
  },
  {
    id: 'SHIP-GOODYEAR-DALIAN',
    name: 'GOODYEAR DALIAN TIRE CO., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-DALIAN', 'DEST-QINGDAO']
  },
  {
    id: 'SHIP-GOODYEAR-BRASIL',
    name: 'GOODYEAR DO BRASIL PRODUTOS DE BORRACHA LTDA.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-SANTOS']
  },
  {
    id: 'SHIP-GOODYEAR-SAVA',
    name: 'GOODYEAR DUNLOP SAVA TIRES',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-KRANJ']
  },
  {
    id: 'SHIP-GOODYEAR-AMIENS',
    name: 'GOODYEAR DUNLOP TIRES AMIENS SUD',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-AMIENS']
  },
  {
    id: 'SHIP-GOODYEAR-GERMANY',
    name: 'GOODYEAR DUNLOP TIRES GERMANY GMBH',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: [
      'DEST-FRANKFURT',
      'DEST-HAMBURG',
      'DEST-HANAU',
      'DEST-FURSTENWALDE'
    ]
  },
  {
    id: 'SHIP-GOODYEAR-BELGIUM',
    name: 'GOODYEAR DUNLOP TIRES OPERATIONS s.a.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-ANTWERP']
  },
  {
    id: 'SHIP-GOODYEAR-FULDA',
    name: 'GOODYEAR FULDA TIRES GERMANY',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-FRANKFURT', 'DEST-FULDA']
  },
  {
    id: 'SHIP-GOODYEAR-TURKEY',
    name: 'GOODYEAR LASTIKLERI T.A.S.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-GEMLIK']
  },
  {
    id: 'SHIP-GOODYEAR-SERBIA',
    name: 'Goodyear Serbia, d. o. o.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-KRUSEVAC']
  },
  {
    id: 'SHIP-GOODYEAR-USA',
    name: 'GOODYEAR TIRE AND RUBBER COMPANY',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-DALLAS', 'DEST-LAWTON']
  },
  {
    id: 'SHIP-GRAND-GAIN',
    name: 'GRAND GAIN FOOTWEAR MANUFACTURING CO.,LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CAT-LAI-HCM']
  },
  {
    id: 'SHIP-GUANGZHOU-ZHANGMOSHI',
    name: 'GUANGZHOU ZHANGMOSHI INTERNATIONAL TRADING CO., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-HUANGPU']
  },
  {
    id: 'SHIP-GUORONG',
    name: 'GUORONG (QINGYUAN) RUBBER INDUSTRY CO., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-HUANGPU', 'DEST-QINGYUAN']
  },
  {
    id: 'SHIP-HAIAN',
    name: 'HAIAN RUBBER GROUP CO., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-XIAMEN']
  },
  {
    id: 'SHIP-HANSUK',
    name: 'HANSUK INTERNATIONAL LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-BUSAN']
  },
  {
    id: 'SHIP-HENGDASHENG',
    name: 'HENGDASHENG TOYO TIRE (ZHANGJIAGANG) CO., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-ZHANGJIAGANG']
  },
  {
    id: 'SHIP-HOA-THANH',
    name: 'HOA THANH COMPANY LIMITED',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-HAIPHONG']
  },
  {
    id: 'SHIP-HUA-SHEN',
    name: 'HUA SHEN VIETNAM COMPANY LIMITED',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CAT-LAI-HCM']
  },
  {
    id: 'SHIP-HWASEUNG-RACH-GIA',
    name: 'HWASEUNG RACH GIA COMPANY LIMITED',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CAT-LAI-HCM']
  },
  {
    id: 'SHIP-JINAN-ZHONGTIAN',
    name: 'Jinan Zhongtian New Materials Co., Ltd.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-QINGDAO']
  },
  {
    id: 'SHIP-JIUCHENG',
    name: 'JIUCHENG INDUSTRIAL (VN) LIMITED COMPANY',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CAT-LAI-HCM']
  },
  {
    id: 'SHIP-KASAN',
    name: 'KASAN CORPORATION (MALAYSIA) SDN BHD',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-KUALA-LUMPUR']
  },
  {
    id: 'SHIP-KENDA-CHINA',
    name: 'KENDA RUBBER (CHINA) CO., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-SHANGHAI']
  },
  {
    id: 'SHIP-KENDA-INDONESIA',
    name: 'KENDA RUBBER (INDONESIA)',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-JAKARTA']
  },
  {
    id: 'SHIP-KENDA-TIANJIN',
    name: 'KENDA RUBBER (TIANJIN) CO., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-TIANJIN']
  },
  {
    id: 'SHIP-KENDA-VIETNAM',
    name: 'KENDA RUBBER (VIETNAM) CO., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CAT-LAI-HCM']
  },
  {
    id: 'SHIP-KENDA-TW',
    name: 'KENDA RUBBER IND CO., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-TAICHUNG']
  },
  {
    id: 'SHIP-LAAYOUNE-IND',
    name: 'LAAYOUNE INDUSTRIAL CO.,LIMITED',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-TAIPING']
  },
  {
    id: 'SHIP-LAC-TY',
    name: 'LAC TY II COMPANY LIMITED',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CAT-LAI-HCM']
  },
  {
    id: 'SHIP-LOTUS-FOOTWEAR',
    name: 'LOTUS FOOTWEAR ENTERPRISES',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CHENNAI', 'DEST-KATTUPALLI']
  },
  {
    id: 'SHIP-MFP-SIMASTOCK',
    name: 'M.F.P. Michelin P/C Simastock',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-LE-HAVRE']
  },
  {
    id: 'SHIP-MFP-THIANT',
    name: 'M.F.P. Michelin P/C Simastock Thiant',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-LE-HAVRE']
  },
  {
    id: 'SHIP-MAXXIS-INDIA',
    name: 'MAXXIS RUBBER INDIA PRIVATE LIMITED',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-ICD-SANAND']
  },
  {
    id: 'SHIP-MICHELIN-HOMBURG',
    name: 'MICHELIN HOMBURG (HBG)',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-ROTTERDAM']
  },
  {
    id: 'SHIP-MICHELIN-POLAND',
    name: 'MICHELIN POLAND (OLS)',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-WARSAW-AIRPORT']
  },
  {
    id: 'SHIP-MICHELIN-SHENYANG',
    name: 'MICHELIN SHENYANG TIRE CO.(SHY)',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-DALIAN']
  },
  {
    id: 'SHIP-MRF',
    name: 'MRF TYRE',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CHENNAI', 'DEST-KATTUPALLI']
  },
  {
    id: 'SHIP-NANKANG-CHINA',
    name: 'NANKANG RUBBER TIRE',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-ZHANGJIAGANG']
  },
  {
    id: 'SHIP-NANKANG-TW',
    name: 'NANKANG RUBBER TIRE CORP., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-KEELUNG']
  },
  {
    id: 'SHIP-NGU-HAN',
    name: 'NGU HAN TRANSPORT SERVICE CO., LTD',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CAT-LAI-HCM']
  },
  {
    id: 'SHIP-NINH-BINH',
    name: 'NINH BINH - VIETNAM CHUNGJYE SHOES MANUFA',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-HAIPHONG']
  },
  {
    id: 'SHIP-BRIDGESTONE-INDONESIA',
    name: 'P.T. BRIDGESTONE TIRE INDONESIA',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-JAKARTA']
  },
  {
    id: 'SHIP-PHOENIX',
    name: 'PHOENIX COMPOUNDING TECHNOLOGY',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-HAMBURG', 'DEST-WALTERSHAUSEN']
  },
  {
    id: 'SHIP-PIRELLI-GERMANY',
    name: 'PIRELLI DEUTSCHLAND GMBH',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-OBERNBURG']
  },
  {
    id: 'SHIP-PIRELLI-MEXICO',
    name: 'Pirelli Neumaticos S.A. de C.V.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-MANZANILLO']
  },
  {
    id: 'SHIP-PT-ALNU',
    name: 'PT. ALNU SPORTING GOODS INDONESIA',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-SEMARANG']
  },
  {
    id: 'SHIP-PT-BOOSAN',
    name: 'PT. BOOSAN SARANG',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-JAKARTA']
  },
  {
    id: 'SHIP-PT-GAJAH',
    name: 'PT. GAJAH TUNGGAL TBK.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-JAKARTA']
  },
  {
    id: 'SHIP-PT-KUMKANG',
    name: 'PT. KUM KANG TECH INDONESIA',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-JAKARTA']
  },
  {
    id: 'SHIP-PT-SEONGSAN',
    name: 'PT. SEONGSAN INTERNATIONAL',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-JAKARTA']
  },
  {
    id: 'SHIP-PT-HWASEUNG',
    name: 'PT. HWA SEUNG INDONESIA',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-JAKARTA']
  },
  {
    id: 'SHIP-QD-FUHUA',
    name: 'QINGDAO FREE TRADE ZONE FUHUA INTERNATIONAL TRADING CO.,LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: [
      'DEST-HUANGPU',
      'DEST-HUMEN',
      'DEST-NANSHA',
      'DEST-QINGDAO',
      'DEST-SHANGHAI',
      'DEST-TAIPING',
      'DEST-XIAMEN'
    ]
  },
  {
    id: 'SHIP-QD-GERUI',
    name: 'Qingdao Ge Rui Da Rubber Co., Ltd',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-QINGDAO']
  },
  {
    id: 'SHIP-QD-HUAWU',
    name: 'QINGDAO HUAWU RUBBER & PLASTIC CO.,LTD',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-QINGDAO']
  },
  {
    id: 'SHIP-QD-RONGYUE',
    name: 'Qingdao Rongyue Import And Export Co., Ltd.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-SHANGHAI']
  },
  {
    id: 'SHIP-QD-YUEYOU',
    name: 'QINGDAO YUEYOU INTERNATIONAL TRADE CO.,LTD',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-QINGDAO']
  },
  {
    id: 'SHIP-RDC',
    name: 'RDC Srl',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-GENOA']
  },
  {
    id: 'SHIP-ROLL-SPORT',
    name: 'ROLL SPORT VIETNAM FOOTWEAR LIMITED',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-HAIPHONG']
  },
  {
    id: 'SHIP-RUBBER-MIX',
    name: 'RUBBER MIX S.A.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-SAN-ANTONIO-CHILE']
  },
  {
    id: 'SHIP-MICHELIN-ITALIANA',
    name: 'S.P.A. MICHELIN ITALIANA (CNO)',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-GENOA']
  },
  {
    id: 'SHIP-SAILUN-VIETNAM',
    name: 'SAILUN (VIETNAM) CO., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CAT-LAI-HCM']
  },
  {
    id: 'SHIP-SAMIL-TONG',
    name: 'SAMIL TONG SANG VINA CO.,LTD',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CAT-LAI-HCM']
  },
  {
    id: 'SHIP-SANTEC',
    name: 'SANTEC TRADING AGENCY',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CHATTOGRAM']
  },
  {
    id: 'SHIP-SHANDONG-DURATTI',
    name: 'Shandong Duratti Rubber Co., Ltd.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-QINGDAO']
  },
  {
    id: 'SHIP-SHANGHAI-MICHELIN',
    name: 'SHANGHAI MICHELIN TIRE CO., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-SHANGHAI']
  },
  {
    id: 'SHIP-SHINIMEX',
    name: 'SHINIMEX II CO., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CAT-LAI-HCM']
  },
  {
    id: 'SHIP-SHYANG-TA',
    name: 'SHYANG TA CO.,LTD',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CAT-LAI-HCM']
  },
  {
    id: 'SHIP-SINTEX',
    name: 'SINTEX CHEMICAL CORP.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CAT-LAI-HCM']
  },
  {
    id: 'SHIP-SUCCESS-PROSPERITY',
    name: 'SUCCESS PROSPERITY SHOE MATERIAL COMPANY',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CAT-LAI-HCM']
  },
  {
    id: 'SHIP-SUMITOMO-CHANGSHU',
    name: 'SUMITOMO RUBBER (CHANGSHU) CO.,LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-SHANGHAI']
  },
  {
    id: 'SHIP-SUMITOMO-HUNAN',
    name: 'SUMITOMO RUBBER (HUNAN) CO. LTD',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-SHANGHAI']
  },
  {
    id: 'SHIP-SUMITOMO-BRASIL',
    name: 'SUMITOMO RUBBER DO BRASIL LTDA.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-PARANAGUA']
  },
  {
    id: 'SHIP-SUMITOMO-ZA',
    name: 'SUMITOMO RUBBER SOUTH AFRICA (PTY) LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-DURBAN']
  },
  {
    id: 'SHIP-SUZHOU-YOKOHAMA',
    name: 'SUZHOU YOKOHAMA TIRE CO., LTD',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-SHANGHAI']
  },
  {
    id: 'SHIP-TAN-HOA-THANH',
    name: 'TAN HOA THANH COMMERCIAL PRODUCTION CO.,LTD',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CAT-LAI-HCM']
  },
  {
    id: 'SHIP-TAN-THANH-HOA',
    name: 'TAN THANH HOA LONG AN TRADING AND MANUFACTURING CO.,LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CAT-LAI-HCM']
  },
  {
    id: 'SHIP-INHERITANCE-KH',
    name: 'THE INHERITANCE (CAMBODIA) CO.,LTD',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-SIHANOUKVILLE']
  },
  {
    id: 'SHIP-THIEN-VINH',
    name: 'THIEN VINH INTERNATIONAL CO., LTD',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CAT-LAI-HCM']
  },
  {
    id: 'SHIP-THUAN-ICH',
    name: 'THUAN ICH SHOES MATERIAL COMPANY LIMITED',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-HAIPHONG']
  },
  {
    id: 'SHIP-TIRE-DEBICA',
    name: 'TIRE COMPANY DEBICA S.A.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-DEBICA']
  },
  {
    id: 'SHIP-TITAN-MANILA',
    name: 'Titan Rubber Industrial Mfg Corporation',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-MANILA']
  },
  {
    id: 'SHIP-TORTUGA',
    name: 'TORTUGA PRODUTOS DE BORRACHA LTDA',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-PARANAGUA']
  },
  {
    id: 'SHIP-TOYO-NA',
    name: 'TOYO TIRE NORTH AMERICA MANUFACTURING INC.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CRANDALL', 'DEST-SAVANNAH', 'DEST-WHITE']
  },
  {
    id: 'SHIP-TOYO-MALAYSIA',
    name: 'TOYO TYRE MALAYSIA SDN. BHD',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-KAMUNTING', 'DEST-PENANG']
  },
  {
    id: 'SHIP-TVS',
    name: 'TVS SRICHAKRA LIMITED',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-TUTICORIN']
  },
  {
    id: 'SHIP-UBE-ELASTOMER',
    name: 'UBE Elastomer Co. Ltd.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-TOKYO']
  },
  {
    id: 'SHIP-UBE-MEXICO',
    name: 'UBE MEXICO S. de R.L. de C.V.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-MANZANILLO']
  },
  {
    id: 'SHIP-MICHELIN-CHOLET',
    name: 'USINE MICHELIN DE CHOLET (CHO)',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-LE-HAVRE']
  },
  {
    id: 'SHIP-VICTORY-SPORTS-DG',
    name: 'VICTORY SPORTS GOODS CO.,LTD. (DONGGUAN)',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-SHATIAN']
  },
  {
    id: 'SHIP-VIET-NAM-VICTORY',
    name: 'VIET NAM VICTORY SPORTS TECHNOLOGY COMPANY LIMITED',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-HAIPHONG']
  },
  {
    id: 'SHIP-VIETNAM-DONA',
    name: 'VIETNAM DONA STANDARD FOOTWEAR CO., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CAT-LAI-HCM']
  },
  {
    id: 'SHIP-VIETNAM-NAM-HA',
    name: 'VIETNAM NAM HA FOOTWEAR COMPANY LIMITED',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CAT-LAI-HCM']
  },
  {
    id: 'SHIP-VINH-LONG',
    name: 'VINH LONG FOOTWEAR CO., LTD',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CAT-LAI-HCM']
  },
  {
    id: 'SHIP-WEILINA',
    name: 'WEILINA VIET NAM FOOTWEAR COMPANY LIMITED',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-HAIPHONG']
  },
  {
    id: 'SHIP-WELLOFF',
    name: 'WELLOFF INTERNATIONAL TRADING (SHANGHAI) CO.,LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-XIAMEN']
  },
  {
    id: 'SHIP-XIAMEN-HUAHE',
    name: 'XIAMEN HUAHE IMPORT AND EXPORT CO.,LTD',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-JIAOXIN']
  },
  {
    id: 'SHIP-XIAMEN-KUOCHENG',
    name: 'XIAMEN KUOCHENG RUBBER CO., LTD',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-NINGBO', 'DEST-SHATIAN', 'DEST-XIAMEN']
  },
  {
    id: 'SHIP-YOKOHAMA-INDIA',
    name: 'YOKOHAMA INDIA PRIVATE LIMITED',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-NHAVA-SHEVA']
  },
  {
    id: 'SHIP-YOKOHAMA-USA',
    name: 'YOKOHAMA TIRE MANUFACTURING',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-NEW-ORLEANS', 'DEST-WEST-POINT']
  },
  {
    id: 'SHIP-YOKOHAMA-PH',
    name: 'YOKOHAMA TIRE PHILIPPINES, INC.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-SUBIC']
  },
  {
    id: 'SHIP-YOKOHAMA-VN',
    name: 'YOKOHAMA TYRE VIETNAM INC. (YTVI)',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-VSIP']
  },
  {
    id: 'SHIP-YU-QING',
    name: 'YU QING ENTERPRISE CO.,LTD',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-CAT-LAI-HCM']
  },
  {
    id: 'SHIP-ZW-RUBBER',
    name: 'Z AND W RUBBER CO., LTD',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-HUANGPU']
  },
  {
    id: 'SHIP-ZHONGCE',
    name: 'ZHONGCE RUBBER GROUP CO., LTD.',
    groupSaleType: GroupSaleType.OVERSEAS,
    destinationIds: ['DEST-NINGBO']
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
  // Vietnam
  { id: 'DEST-HAIPHONG', name: 'Haiphong, Vietnam' },
  { id: 'DEST-CAT-LAI-HCM', name: 'Cat Lai, Ho Chi Minh, Vietnam' },
  { id: 'DEST-VSIP', name: 'VSIP, Vietnam' },
  // China
  { id: 'DEST-SHANGHAI', name: 'Shanghai, China' },
  { id: 'DEST-XIAMEN', name: 'Xiamen, China' },
  { id: 'DEST-QINGDAO', name: 'Qingdao, China' },
  { id: 'DEST-HUANGPU', name: 'Huangpu, China' },
  { id: 'DEST-TAIPING', name: 'Taiping, China' },
  { id: 'DEST-SHATIAN', name: 'Shatian, China' },
  { id: 'DEST-JIAOXIN', name: 'Jiaoxin, China' },
  { id: 'DEST-YANTIAN', name: 'Yantian, China' },
  { id: 'DEST-NINGBO', name: 'Ningbo, China' },
  { id: 'DEST-TIANJIN', name: 'Tianjin, China' },
  { id: 'DEST-MAWEI-FUZHOU', name: 'Mawei, Fuzhou, China' },
  { id: 'DEST-DALIAN', name: 'Dalian, China' },
  { id: 'DEST-ZHANGJIAGANG', name: 'Zhangjiagang, China' },
  { id: 'DEST-CHONGQING', name: 'Chongqing, China' },
  { id: 'DEST-QINGYUAN', name: 'Qingyuan, China' },
  { id: 'DEST-BEIJING-AIRPORT', name: 'Beijing Airport, China' },
  { id: 'DEST-NANSHA', name: 'Nansha, China' },
  { id: 'DEST-HUMEN', name: 'Humen, China' },
  // India
  { id: 'DEST-NHAVA-SHEVA', name: 'Nhava Sheva, India' },
  { id: 'DEST-CHENNAI', name: 'Chennai, India' },
  { id: 'DEST-COCHIN', name: 'Cochin, India' },
  { id: 'DEST-KATTUPALLI', name: 'Kattupalli, India' },
  { id: 'DEST-TUTICORIN', name: 'Tuticorin, India' },
  { id: 'DEST-ICD-SANAND', name: 'ICD Sanand, India' },
  // Japan
  { id: 'DEST-TOKYO', name: 'Tokyo, Japan' },
  // Taiwan
  { id: 'DEST-TAICHUNG', name: 'Taichung, Taiwan' },
  { id: 'DEST-KEELUNG', name: 'Keelung, Taiwan' },
  // Korea
  { id: 'DEST-BUSAN', name: 'Busan, Korea' },
  // Southeast Asia
  { id: 'DEST-JAKARTA', name: 'Jakarta, Indonesia' },
  { id: 'DEST-SEMARANG', name: 'Semarang, Indonesia' },
  { id: 'DEST-KUALA-LUMPUR', name: 'Kuala Lumpur, Malaysia' },
  { id: 'DEST-KAMUNTING', name: 'Kamunting, Perak, Malaysia' },
  { id: 'DEST-ALOR-SETAR', name: 'Alor Setar, Malaysia' },
  { id: 'DEST-PENANG', name: 'Penang, Malaysia' },
  { id: 'DEST-SUBIC', name: 'Subic, Philippines' },
  { id: 'DEST-MANILA', name: 'North Harbour, Manila, Philippines' },
  { id: 'DEST-SIHANOUKVILLE', name: 'Sihanoukville, Cambodia' },
  { id: 'DEST-HONG-KONG', name: 'Hong Kong' },
  // South Asia
  { id: 'DEST-COLOMBO', name: 'Colombo, Sri Lanka' },
  { id: 'DEST-CHATTOGRAM', name: 'Chattogram, Bangladesh' },
  // Germany
  { id: 'DEST-HAMBURG', name: 'Hamburg, Germany' },
  { id: 'DEST-HANNOVER', name: 'Hannover, Germany' },
  { id: 'DEST-FRANKFURT', name: 'Frankfurt Airport, Germany' },
  { id: 'DEST-AACHEN', name: 'Aachen, Germany' },
  { id: 'DEST-KORBACH', name: 'Korbach, Germany' },
  { id: 'DEST-FULDA', name: 'Fulda, Germany' },
  { id: 'DEST-OBERNBURG', name: 'Obernburg, Germany' },
  { id: 'DEST-WALTERSHAUSEN', name: 'Waltershausen, Germany' },
  { id: 'DEST-FURSTENWALDE', name: 'Fuerstenwalde, Germany' },
  { id: 'DEST-HANAU', name: 'Hanau, Germany' },
  // France
  { id: 'DEST-AMIENS', name: 'Amiens, France' },
  { id: 'DEST-LE-HAVRE', name: 'Le Havre, France' },
  { id: 'DEST-SARREGUEMINES', name: 'Sarreguemines, France' },
  // Other Europe
  { id: 'DEST-ROTTERDAM', name: 'Rotterdam, Netherlands' },
  { id: 'DEST-ANTWERP', name: 'Antwerp (Beveren), Belgium' },
  { id: 'DEST-GENOA', name: 'Genoa, Italy' },
  { id: 'DEST-GDYNIA', name: 'Gdynia, Poland' },
  { id: 'DEST-WARSAW-AIRPORT', name: 'Warsaw Airport, Poland' },
  { id: 'DEST-DEBICA', name: 'Debica, Poland' },
  { id: 'DEST-TIMISOARA', name: 'Timisoara, Romania' },
  { id: 'DEST-OTROKOVICE', name: 'Otrokovice, Czech Republic' },
  { id: 'DEST-PUCHOV', name: 'Puchov, Slovakia' },
  { id: 'DEST-KOPER', name: 'Koper, Slovenia' },
  { id: 'DEST-KRANJ', name: 'Kranj, Slovenia' },
  { id: 'DEST-KRUSEVAC', name: 'Krusevac, Serbia' },
  { id: 'DEST-GEBZE', name: 'Gebze, Turkey' },
  { id: 'DEST-GEMLIK', name: 'Gemlik, Turkey' },
  { id: 'DEST-LOUSADO', name: 'Lousado, Portugal' },
  // Africa
  { id: 'DEST-PORT-ELIZABETH', name: 'Port Elizabeth, South Africa' },
  { id: 'DEST-DURBAN', name: 'Durban, South Africa' },
  // USA
  { id: 'DEST-CALUMET-CITY', name: 'Calumet City, IL, USA' },
  { id: 'DEST-MT-VERNON', name: 'Mt. Vernon, IL, USA' },
  { id: 'DEST-WILSON', name: 'Wilson, NC, USA' },
  { id: 'DEST-LAWTON', name: 'Lawton, OK, USA' },
  { id: 'DEST-DALLAS', name: 'Dallas (DFW), TX, USA' },
  { id: 'DEST-CRANDALL', name: 'Crandall, GA, USA' },
  { id: 'DEST-SAVANNAH', name: 'Savannah, GA, USA' },
  { id: 'DEST-WHITE', name: 'White, GA, USA' },
  { id: 'DEST-NEW-ORLEANS', name: 'New Orleans, LA, USA' },
  { id: 'DEST-WEST-POINT', name: 'West Point, USA' },
  // Mexico & Latin America
  { id: 'DEST-MANZANILLO', name: 'Manzanillo, Mexico' },
  { id: 'DEST-SANTOS', name: 'Santos, Brazil' },
  { id: 'DEST-PARANAGUA', name: 'Paranagua, Brazil' },
  { id: 'DEST-SAN-ANTONIO-CHILE', name: 'San Antonio, Chile' }
];
```

### Terms

```ts
export const INITIAL_TERMS: MasterDataRecord[] = [
  { id: 'CFR', name: 'CFR' },
  { id: 'CIF', name: 'CIF' },
  { id: 'CIP', name: 'CIP' },
  { id: 'CPT', name: 'CPT' },
  { id: 'DAP', name: 'DAP' },
  { id: 'DAT', name: 'DAT' },
  { id: 'DPU', name: 'DPU' },
  { id: 'EXW', name: 'EXW' },
  { id: 'FCA', name: 'FCA' },
  { id: 'FOB', name: 'FOB' }
];
```

### Grades

```ts
export const INITIAL_GRADES: MasterDataRecord[] = [
  { id: 'BR150', name: 'UBEPOL BR150' },
  { id: 'BR150B', name: 'UBEPOL BR150B' },
  { id: 'BR150GN', name: 'UBEPOL BR150GN' },
  { id: 'BR150L', name: 'UBEPOL BR150L' },
  { id: 'BR150LGN', name: 'UBEPOL BR150LGN' },
  { id: 'BR360B', name: 'UBEPOL BR360B' },
  { id: 'VCR412', name: 'UBEPOL VCR412' },
  { id: 'VCR617', name: 'UBEPOL VCR617' },
  { id: 'X-200', name: 'X-200' }
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
    userGroup: UserGroup.UEC_SALE,
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
    userGroup: UserGroup.TSL_SALE,
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
    userGroup: UserGroup.TSL_CS,
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
    userGroup: UserGroup.UEC_SALE,
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

## 🗄️ Store API (`store/index.ts`)

> Agent instruction: implement all state and actions below in a single Zustand
> store with `persist` middleware.

### Selector: `getVisibleOrdersForUser`

```ts
// store/selectors.ts
export const getVisibleOrdersForUser = (
  orders: Order[],
  user: User | null
): Order[] => {
  if (!user) return [];
  if (user.role === Role.ADMIN) return orders;

  return orders
    .map((order) => {
      const visibleItems = order.items.filter((item) =>
        canUserAccessShipTo(user, item.shipToId)
      );
      if (visibleItems.length === 0) return null;
      return {
        ...order,
        items: visibleItems,
        status: deriveOrderProgressStatus(visibleItems)
      };
    })
    .filter((o): o is Order => Boolean(o));
};
// ⚠️ No companyId check — ship-to access is the sole visibility gate
```

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
