# Customer Web Portal

B2B order management portal for chemical product logistics — built with
**Next.js 16.1.6**, TypeScript, Tailwind CSS, and shadcn/ui.

## Overview

Multi-role portal for managing purchase orders through a **line-level approval
workflow**, from customer submission to vessel departure. Designed for UBE
company group.

## Tech Stack

- **Next.js 16.1.6** (App Router, recommended defaults)
- **TypeScript** (strict)
- **Tailwind CSS v4** + **shadcn/ui**
- **Zustand** (state + localStorage persistence)
- **React Hook Form** + **Zod** (form validation)
- **lucide-react** (icons)
- **sweetalert2** (confirm dialogs)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Test Credentials

| Username  | Password   | Role                          |
| --------- | ---------- | ----------------------------- |
| `trader1` | `password` | Main Trader (creates orders)  |
| `ubejp1`  | `password` | UBE Japan (first approval)    |
| `sale1`   | `password` | Sale (price + final approval) |
| `cs1`     | `password` | Customer Service (ETD + docs) |
| `admin`   | `password` | Admin (full access)           |

## Features

### Order Workflow (Line-Level)

Each order line independently progresses through:

```
DRAFT → CREATED → UBE_APPROVED → APPROVED → VESSEL_SCHEDULED → RECEIVED_ACTUAL_PO → VESSEL_DEPARTED
```

### Pages

| Page         | Route               | Access          |
| ------------ | ------------------- | --------------- |
| Login        | `/login`            | All             |
| Dashboard    | `/`                 | All             |
| Orders       | `/orders`           | All             |
| Create Order | `/orders/create`    | Permitted users |
| Order Detail | `/orders/[orderNo]` | All             |
| Sale Review  | `/review`           | SALE, ADMIN     |
| CS Dashboard | `/cs`               | CS, ADMIN       |
| Admin        | `/admin`            | ADMIN           |
| Master Data  | `/master-data`      | ADMIN           |
| Logs         | `/logs`             | ADMIN           |

### Key Capabilities

- **Multi-role access control** (RBAC) with configurable permission matrix
- **Multi-company tenancy** — users see only their company's orders
- **Granular ship-to access** — per-user shipTo restrictions
- **Document management** — upload, generate, and download by document type
- **PDF generation** — auto-generate PO + Shipping Instruction PDFs
- **CRM simulation** — async integration callback with quotation number
- **Activity & notification logs** — full audit trail
- **Dark mode** support
- **Admin-configurable permission matrix** with preset support (STANDARD /
  STRICT)

## Project Structure

```
app/
  (auth)/login/          ← login page
  (portal)/              ← protected pages with sidebar layout
    page.tsx             ← dashboard
    orders/...
    review/
    cs/
    admin/
    master-data/
    logs/
components/
  layout/                ← Sidebar, TopBar
  shared/                ← StatusBadge, ConfirmDialog, etc.
  ui/                    ← shadcn/ui components
store/
  index.ts               ← Zustand store
  types.ts               ← all types/enums
  defaults.ts            ← seed data
  selectors.ts           ← pure helpers
utils/
  poPdf.ts
  shippingInstructionPdf.ts
  statusLabel.ts
  permissions.ts
```

## Business Rules

- Price > 0 required before sale approval
- Actual ETD required before marking vessel scheduled
- `Shipping Document` + `BL` both required before completing a line
- Lines past DRAFT are locked for editing
- All actions require passing `canUserRunLineAction()` permission check
- All workflow actions are logged to activity log

## Development Notes

- **Data persistence**: Zustand persists to localStorage — no backend required
  for MVP
- **Reset data**: Use the `/clear-data` page to reset all state to initial seed
  data
- **Scheduled checks**: Run automatically on every login to flag urgent ASAP
  orders for CS
- **See `Objective.md`** for full feature spec, data models, and task breakdown
- **See `copilot-instructions.md`** for coding conventions used by the AI agent
