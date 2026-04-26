# Final Handoff

This file is the final handoff guide for moving the current MVP into the next
project.

Use this file first when another AI agent or developer needs the smallest
complete package of requirements, schema references, and source-file anchors.

## What To Copy Into The Next Project Context

### 1. Required docs bundle

Keep these docs together as the source-of-truth requirement pack:

- `README.md`
- `requirements/workflow/WORKFLOW-AND-PERMISSIONS.md`
- `requirements/pages/MENU-FLOWS.md`
- `requirements/pages/ORDERS-WORKSPACE.md`
- `requirements/domain/ORDER-STRUCTURE.md`
- `requirements/domain/MASTER-DATA-REFERENCE.md`
- `requirements/blueprint/Objective.md`
- `requirements/blueprint/ORDERS-WORKSPACE-CHECKLIST.md`
- `database/DATABASE-SCHEMA.md`
- `database/DATABASE-SCHEMA-SQLSERVER.md`
- `database/schema.sqlserver.ddl.sql`
- `database/seed.sqlserver.sql`
- `database/MASTER-DATA-SEED.json`
- `instructions/copilot-instructions.md`
- `instructions/workflow-skill.instructions.md`
- `designs/DESIGN.md`
- `designs/ORDER-SCREEN-PROMPT.md`

### 2. Bundled current-project source files

These MVP reference files are now bundled inside:

- `project/source/`

They still matter during migration because they contain working behavior, field
names, seed values, generation logic, and template assets:

- `README.md`
- `PROJECT_WORKING_GUIDE.md`
- `COMPLIANCE.md`
- `UPDATES.md`
- `App.tsx`
- `store.ts`
- `types.ts`
- `index.tsx`
- `package.json`
- `components/Layout.tsx`
- `components/PdfGenerationModal.tsx`
- `components/StatusBadge.tsx`
- `components/ActionIconButton.tsx`
- `pages/Login.tsx`
- `pages/Dashboard.tsx`
- `pages/Orders.tsx`
- `pages/CreateOrder.tsx`
- `pages/OrderDetail.tsx`
- `pages/SaleReview.tsx`
- `pages/MgrApprove.tsx`
- `pages/CSDashboard.tsx`
- `pages/Admin.tsx`
- `pages/MasterData.tsx`
- `pages/POSITemplate.tsx`
- `pages/Logs.tsx`
- `pages/ClearData.tsx`
- `utils/poPdf.ts`
- `utils/statusLabel.ts`
- `utils/alertMessages.ts`
- `utils/swal.ts`
- `sample/order-import-sample.csv`
- `data/PO_Format(PO).csv`
- `data/PO_Format(SI).csv`
- `data/Template_PO/`
- `data/Template_SI/`
- `scripts/export_docs_seed.mjs`
- `scripts/export_sqlserver_seed.mjs`
- `scripts/parse_si_csv.py` when SI template reconstruction or CSV-to-template
  tracing is needed

For the detailed purpose of each source file, read
`project/CURRENT-MVP-FILE-MAP.md`.

Use the bundled copies under `project/source/` as the handoff pack. Keep the
original project files in place so the current MVP remains runnable.

Interpret the bundled root docs this way:

- `README.md` is the current-project operational/readme snapshot
- `PROJECT_WORKING_GUIDE.md` is a useful team-facing behavior summary
- `COMPLIANCE.md` and `UPDATES.md` are historical/current-state references, not
  target-design source-of-truth

### 3. Scripts folder handling

Treat `scripts/` in three groups:

- Keep as required generation scripts:
  - `scripts/export_docs_seed.mjs`
  - `scripts/export_sqlserver_seed.mjs`
- Keep as optional migration helper:
  - `scripts/parse_si_csv.py`
- Do not treat as source-of-truth:
  - `scripts/parse_stderr.txt`
  - `scripts/si_err.txt`
  - `scripts/si_output.txt`

Interpretation:

- The two `.mjs` scripts are part of the docs/database artifact pipeline.
- `parse_si_csv.py` is a one-off extraction helper for deriving SI template
  content from `data/PO_Format(SI).csv`; it is useful for tracing or rebuilding
  template seed content, but it is not part of the target runtime.
- The `.txt` files in `scripts/` are transient outputs/logs and should not be
  copied as migration requirements.

## Critical Interpretation Rules

- The docs under `docs-for-nextjs/` are the target design for the next project.
- The bundled current MVP source files under `project/source/` are reference
  material, not the target architecture.
- If current source code conflicts with the new docs, prefer the new docs.
- The biggest intentional difference is workflow UI shape:
  - current MVP still has separate `/review`, `/mgr-approve`, and `/cs` pages
  - next project must collapse those steps into the unified Orders workspace
- Another intentional difference is the data model direction:
  - current MVP still exposes line-level workflow constructs in `store.ts` and
    `types.ts`
  - next project must implement the header-level PO model described in
    `requirements/domain/ORDER-STRUCTURE.md` and database docs

## Minimum Read Order

If time is limited, read in this order:

1. `README.md`
2. `requirements/workflow/WORKFLOW-AND-PERMISSIONS.md`
3. `requirements/pages/ORDERS-WORKSPACE.md`
4. `requirements/domain/ORDER-STRUCTURE.md`
5. `database/DATABASE-SCHEMA-SQLSERVER.md`
6. `project/CURRENT-MVP-FILE-MAP.md`
7. `project/source/store.ts`
8. `project/source/types.ts`
9. `project/source/pages/CreateOrder.tsx`
10. `project/source/pages/OrderDetail.tsx`
11. `project/source/components/PdfGenerationModal.tsx`
12. `project/source/utils/poPdf.ts`

## Generation Commands

Regenerate database/reference artifacts from the current project when needed:

- `node ./scripts/export_docs_seed.mjs`
- `node ./scripts/export_sqlserver_seed.mjs`

Optional helper for SI template extraction research:

- `python ./scripts/parse_si_csv.py`

## Done Criteria For The Migration Pack

The pack is complete when all of the following are true:

- Requirements describe Orders as the only workflow menu
- Database docs and seed artifacts match the current master data set
- AI instructions point to the new unified Orders model
- The bundled `project/source/` snapshot is available for behavior tracing
