# Customer Web Portal

B2B order management portal for chemical product logistics — built with
**Next.js 16.1.6**, TypeScript, Tailwind CSS, and shadcn/ui.

## Overview

Multi-role portal for managing purchase orders through a **header-level PO
workflow**, from customer submission to vessel departure. One header equals one
PO, with product-detail rows stored beneath it. Designed for UBE company group.

> Note: this folder still targets a Next.js migration, but the workflow,
> permissions, routes, and admin features documented below are updated to match
> the current MVP implementation in this repository.

## Folder Layout

- `requirements/` functional requirements split into `workflow/`, `pages/`,
  `domain/`, and `blueprint/`
- `database/` logical schema, SQL Server schema, Prisma models, and seed
  artifacts
- `instructions/` AI/copilot instruction files for implementation agents
- `designs/` visual design references, screenshots, and prompt-ready style docs
- `project/` current MVP source-file map for extracting real behavior, seed
  inputs, and migration references

Each major folder has its own local `README.md` so another AI agent can enter
that section directly without scanning the whole docs pack.

## Documentation Map

Use the files in this order when feeding requirements to another AI agent or
project:

1. `FINAL-HANDOFF.md` Use as the final handoff checklist and packaging guide.
2. `README.md` Use as the entry point and quick scope summary.
3. `requirements/workflow/WORKFLOW-AND-PERMISSIONS.md` Use for roles, route
   access, status transitions, action rules, and business constraints.
4. `requirements/pages/MENU-FLOWS.md` Use for sidebar/menu scope after the step
   pages are collapsed into Orders.
5. `requirements/pages/ORDERS-WORKSPACE.md` Use for the unified Orders module,
   step zones, enable/disable rules, and per-role interactions inside the single
   order workspace.
6. `requirements/domain/ORDER-STRUCTURE.md` Use for the required PO-header /
   product-line structure and the recommended SQL Server naming map.
7. `requirements/domain/MASTER-DATA-REFERENCE.md` Use for master entities,
   template ownership, and relationship rules.
8. `database/DATABASE-SCHEMA.md` Use for logical backend persistence design,
   table structure, keys, and indexes.
9. `database/DATABASE-SCHEMA-SQLSERVER.md` Use when the target backend is SQL
   Server and table/column naming should follow SQL Server best practice.
10. `database/MASTER-DATA-SEED.json` Use when exact master/reference seed parity
    is required from the current MVP implementation.
11. `database/schema.prisma.example` Use for the generic Prisma-oriented
    reference.
12. `database/schema.sqlserver.prisma` Use for the SQL Server-oriented Prisma
    reference with recommended physical names.
13. `database/schema.sqlserver.ddl.sql` Use for the concrete T-SQL DDL reference
    with `CREATE TABLE`, constraints, and indexes.
14. `database/seed.sqlserver.sql` Use for the concrete T-SQL seed reference for
    master data, templates, and workflow permission presets.
15. `requirements/blueprint/Objective.md` Use for high-level implementation
    blueprint and project setup context.
16. `requirements/blueprint/ORDERS-WORKSPACE-CHECKLIST.md` Use for the detailed
    implementation checklist of the unified Orders workspace.
17. `project/CURRENT-MVP-FILE-MAP.md` Use for the list of current source files
    that still matter when extracting behavior or seed data from this repo.
18. `project/source/SOURCE-SNAPSHOT.md` Use when consuming the bundled source
    snapshot that now lives inside `docs-for-nextjs/`.
19. `instructions/copilot-instructions.md` Use only as AI coding guidance once
    requirements are already understood.
20. `instructions/workflow-skill.instructions.md` Use as a focused workflow
    skill reference for agent behavior on order pages.
21. `designs/DESIGN.md` Use for the shared visual system and design tokens.
22. `designs/ORDER-SCREEN-PROMPT.md` Use for the order-page style prompt derived
    from the reference screenshots.

## Recommended AI Read Order

If an AI only has time to read a few files, this is the minimum useful set:

- `FINAL-HANDOFF.md`
- `README.md`
- `requirements/workflow/WORKFLOW-AND-PERMISSIONS.md`
- `requirements/pages/MENU-FLOWS.md`
- `requirements/pages/ORDERS-WORKSPACE.md`
- `requirements/domain/ORDER-STRUCTURE.md`
- `requirements/domain/MASTER-DATA-REFERENCE.md`
- `database/DATABASE-SCHEMA-SQLSERVER.md`
- `database/schema.sqlserver.ddl.sql`
- `database/seed.sqlserver.sql`
- `database/MASTER-DATA-SEED.json`
- `project/CURRENT-MVP-FILE-MAP.md`
- `project/source/SOURCE-SNAPSHOT.md`

Read `requirements/blueprint/Objective.md` after that when the implementation
needs UI details, examples, or seed-data expansion.

## Final Package

For final delivery into another project or another AI workspace, package these
three layers together:

1. Final handoff and requirement docs in this folder
2. Database artifacts generated under `docs-for-nextjs/database/`
3. Bundled MVP source files under `project/source/`

That combination preserves both the target design and the current working MVP
behavior that still needs to be mined during migration.

The bundled `project/source/` snapshot also contains the important root project
docs (`README.md`, `PROJECT_WORKING_GUIDE.md`, `COMPLIANCE.md`, `UPDATES.md`)
for historical and working-context reference.

For `scripts/`, keep the two generation scripts as part of the handoff pack,
keep `parse_si_csv.py` only as an optional migration helper, and ignore the
transient `.txt` parser outputs.

## Generated Artifacts

- `database/MASTER-DATA-SEED.json` is generated from the live seed constants in
  `store.ts` via `node ./scripts/export_docs_seed.mjs`.
- `database/schema.prisma.example` is the concrete backend schema reference
  matching the logical model in `database/DATABASE-SCHEMA.md`.
- `database/schema.sqlserver.prisma` is the SQL Server-oriented reference schema
  with PascalCase physical names and SQL Server naming best practices.
- `database/schema.sqlserver.ddl.sql` is the SQL Server T-SQL reference script
  with tables, constraints, and indexes.
- `database/seed.sqlserver.sql` is the SQL Server seed script generated from
  `database/MASTER-DATA-SEED.json` via
  `node ./scripts/export_sqlserver_seed.mjs`.

## Tech Stack

- **Next.js 16.1.6** (App Router, recommended defaults)
- **TypeScript** (strict)
- **Tailwind CSS v4** + **shadcn/ui**
- **tnks-data-table** for full-option operational data tables
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

| Username    | Password   | Role                              |
| ----------- | ---------- | --------------------------------- |
| `trader1`   | `password` | Main Trader (creates orders)      |
| `ubejp1`    | `password` | UBE Japan (submit lines)          |
| `sale1`     | `password` | Sale (price approval + PO review) |
| `sale_mgr1` | `password` | Sale Manager (final PO approval)  |
| `cs1`       | `password` | Customer Service (ETD + docs)     |
| `admin`     | `password` | Admin (full access)               |

## Features

### Order Workflow (Header-Level)

Each PO header independently progresses through a **7-step workflow**:

```
DRAFT
  └─[SUBMIT_LINE: TRADER / UEC_SALE / TSL_SALE]──▶ CREATED
    └─[APPROVE_LINE: TSL_SALE + price input]──▶ APPROVED
      └─[SET_ETD: TSL_CS] + Gen PO PDF + SI PDF──▶ WAIT_SALE_UEC_APPROVE_PO
        └─[APPROVE_SALE_PO: UEC_SALE] review PDF + confirm──▶ WAIT_MGR_UEC_APPROVE_PO
          └─[APPROVE_MGR_PO: UEC_MANAGER]──▶ VESSEL_SCHEDULED
            └─[UPLOAD_FINAL_DOCS: TSL_CS]──▶ VESSEL_DEPARTED
```

### Pages

| Page            | Route               | Access                                                      |
| --------------- | ------------------- | ----------------------------------------------------------- |
| Login           | `/login`            | All                                                         |
| Dashboard       | `/`                 | All                                                         |
| Orders          | `/orders`           | All                                                         |
| Create Order    | `/orders/create`    | Permitted users (not in sidebar; accessed from Orders page) |
| Order Detail    | `/orders/[orderNo]` | All                                                         |
| Admin           | `/admin`            | ADMIN                                                       |
| PO/SI Templates | `/po-si-templates`  | ADMIN                                                       |
| Master Data     | `/master-data`      | ADMIN                                                       |
| Logs            | `/logs`             | ADMIN                                                       |
| Clear Data      | `/clear-data`       | ADMIN                                                       |

Next-project requirement: step-specific work previously split across Sale
Review, Manager Approve, and CS must be consolidated into the Orders module. See
`requirements/pages/ORDERS-WORKSPACE.md` for the unified step-zone model.

### Key Capabilities

- **Multi-role access control** (RBAC) with configurable permission matrix
- **Company ownership metadata** — `companyId` is stored on users and orders,
  but current MVP visibility is enforced by ship-to access, not company-level
  filtering
- **Granular ship-to access** — per-user shipTo restrictions
- **Document management** — upload, generate, and download by document type at
  the PO-header level
- **PDF generation** — auto-generate PO + Shipping Instruction PDFs
- **Single Orders workspace** — complete all workflow steps inside Order detail
  using separate zones per step instead of separate step menus
- **Full-option operational tables** — use `tnks-data-table` for the main order
  grids and product-line tables
- **PO/SI template management** — admin-maintained template masters by Ship-To
- **CRM simulation** — async integration callback with quotation number
- **Activity & notification logs** — log every workflow step plus important
  save/edit actions, with both email and in-app notification tracking
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
    admin/
    po-si-templates/
    master-data/
    logs/
    clear-data/
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
- Actual ETD required before moving to PO review
- `Shipping Document` + `BL` both required before completion
- All workflow steps must be visible inside the Orders workspace even when not
  yet active; future-step zones stay disabled until reached
- Headers and product lines remain editable until `APPROVE_SALE_PO` completes
- Headers can only be deleted while status is `DRAFT`
- All actions require passing `canUserRunHeaderAction()` permission check
- All workflow actions and important save/edit events are logged to activity log

## Development Notes

- **Data persistence**: Zustand persists to localStorage — no backend required
  for MVP
- **Clear data**: `/clear-data` is admin-only and clears transactional data only
  (orders, logs, notifications, integration logs, current session); users,
  companies, master data, PO/SI templates, and permission presets are preserved
- **Scheduled checks**: Run automatically on every login to flag urgent ASAP
  orders for CS
- **See `requirements/blueprint/Objective.md`** for full feature spec, data
  models, and task breakdown
- **See `requirements/pages/MENU-FLOWS.md`** for menu-by-menu page
  responsibilities and UI labels
- **See `instructions/copilot-instructions.md`** for coding conventions used by
  the AI agent

## Section Indexes

- `requirements/README.md` section map for all requirement docs
- `database/README.md` database and artifact map
- `instructions/README.md` AI instruction map
- `designs/README.md` design/style map
