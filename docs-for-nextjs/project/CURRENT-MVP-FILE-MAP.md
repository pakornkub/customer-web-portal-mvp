# Current MVP File Map

This file lists the current repository files that are still important during the
Next.js migration.

Use it when another AI needs to know which real source files to inspect after it
has already read the target requirements.

Bundled copies of these files now exist under `project/source/` so the docs pack
is self-contained.

## Priority Rule

- Requirement docs define the target design.
- Current source files provide implementation details and live seed data.
- Use the bundled copies under `project/source/` for handoff and offline AI
  reading.
- When they conflict, prefer the docs in `docs-for-nextjs/`.

## Bundled Root Docs

| File                       | Why It Matters                                                                | Migration Note                                                                              |
| -------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `README.md`                | Captures the current app bootstrap/readme context plus UI governance notes    | Useful background only; not a target requirement document                                   |
| `PROJECT_WORKING_GUIDE.md` | Summarizes current design, flow, and business rules from the team perspective | Good behavioral reference, but newer `docs-for-nextjs/` requirements still win on conflicts |
| `COMPLIANCE.md`            | Historical compliance/status report against an older MVP framing              | Keep as audit/history context only                                                          |
| `UPDATES.md`               | Historical code-baseline update log and divergence notes                      | Keep as implementation-history context only                                                 |

## Core Runtime Files

| File           | Why It Matters                                                                                      | Migration Note                                                                                                                         |
| -------------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `App.tsx`      | Current route map, protected-route logic, and legacy step-page access rules                         | Use to locate current page surfaces; do not carry the `/review`, `/mgr-approve`, `/cs` route model into the next project               |
| `store.ts`     | Current Zustand state, seed data, visibility helpers, permission matrix, and export-doc seed source | Critical reference file; current workflow is still line-oriented in places, so translate into the documented header-level target model |
| `types.ts`     | Current enums, interfaces, document types, and PDF snapshot shapes                                  | Use to extract field names and document types, but normalize to the next-project header model                                          |
| `index.tsx`    | Current app bootstrap entry                                                                         | Useful only for understanding the existing Vite shell                                                                                  |
| `package.json` | Current runtime dependencies and library choices                                                    | Use to discover dependencies worth preserving in the Next.js project                                                                   |

## Shared UI Components

| File                                | Why It Matters                                                                         | Migration Note                                                                          |
| ----------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `components/Layout.tsx`             | Current sidebar labels, top-level navigation, theme behavior, and auth shell layout    | Mine menu naming and layout intent, then convert step pages into Orders-only navigation |
| `components/PdfGenerationModal.tsx` | Current ETD/PDF generation UI and the data collected before generating PO/SI documents | High-value reference for the CS zone inside the unified Orders workspace                |
| `components/StatusBadge.tsx`        | Current status label rendering and color logic                                         | Reuse status wording while adapting to the next-project design system                   |
| `components/ActionIconButton.tsx`   | Current compact action-button pattern                                                  | Optional UI reference only                                                              |

## Workflow Pages

| File                     | Why It Matters                                                                        | Migration Note                                          |
| ------------------------ | ------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `pages/Login.tsx`        | Current authentication flow and startup behavior                                      | Keep only as behavioral reference                       |
| `pages/Dashboard.tsx`    | Current operational summary, urgency, and recent-order patterns                       | Rebuild in Next.js, preserving business meaning         |
| `pages/Orders.tsx`       | Current main listing, search, filter, and draft-delete behavior                       | Primary reference for the next `/orders` page           |
| `pages/CreateOrder.tsx`  | Current create/edit order form, validation behavior, line management, and import flow | Primary reference for the next create/edit experience   |
| `pages/OrderDetail.tsx`  | Current detail page, action handling, and document surface                            | Primary reference for the unified order workspace       |
| `pages/SaleReview.tsx`   | Current commercial review and PO review behavior                                      | Mine logic only; fold into the unified Orders workspace |
| `pages/MgrApprove.tsx`   | Current manager-approval behavior                                                     | Mine logic only; fold into the unified Orders workspace |
| `pages/CSDashboard.tsx`  | Current ETD, PDF generation, and final-document behavior                              | Mine logic only; fold into the unified Orders workspace |
| `pages/Admin.tsx`        | Current user management and permission-matrix behavior                                | Primary reference for admin/policy migration            |
| `pages/MasterData.tsx`   | Current master-data CRUD behavior                                                     | Primary reference for master maintenance                |
| `pages/POSITemplate.tsx` | Current PO/SI template maintenance behavior                                           | Primary reference for template admin screens            |
| `pages/Logs.tsx`         | Current activity, integration, and notification log behavior                          | Primary reference for log views and audit grouping      |
| `pages/ClearData.tsx`    | Current transactional-reset behavior                                                  | Reference for the admin-only destructive utility        |

## Utilities And Business Helpers

| File                     | Why It Matters                                | Migration Note                                                            |
| ------------------------ | --------------------------------------------- | ------------------------------------------------------------------------- |
| `utils/poPdf.ts`         | Actual client-side PO/SI PDF generation logic | High-value migration source; preserve logic while reorganizing APIs/types |
| `utils/statusLabel.ts`   | Status-to-label mapping                       | Preserve terminology consistency                                          |
| `utils/alertMessages.ts` | Centralized user-facing alert copy            | Optional source for wording parity                                        |
| `utils/swal.ts`          | SweetAlert wrappers and confirm behavior      | Reference when replacing or wrapping confirm flows in Next.js             |

## Data Inputs And Samples

| File                             | Why It Matters                      | Migration Note                           |
| -------------------------------- | ----------------------------------- | ---------------------------------------- |
| `sample/order-import-sample.csv` | Example CSV shape for order import  | Keep for import testing parity           |
| `data/PO_Format(PO).csv`         | Reference PO-related field layout   | Supports template/PDF mapping checks     |
| `data/PO_Format(SI).csv`         | Reference SI-related field layout   | Supports SI template/PDF mapping checks  |
| `data/Template_PO/`              | Generated/exported PO template PDFs | Keep as reference design/template assets |
| `data/Template_SI/`              | Generated/exported SI template PDFs | Keep as reference design/template assets |

## Artifact Generation Scripts

| File                                | Why It Matters                                                                  | Migration Note                                                               |
| ----------------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `scripts/export_docs_seed.mjs`      | Generates `docs-for-nextjs/database/MASTER-DATA-SEED.json` from live store data | Re-run whenever master data changes in the MVP                               |
| `scripts/export_sqlserver_seed.mjs` | Generates `docs-for-nextjs/database/seed.sqlserver.sql` from seed JSON          | Re-run after the docs seed changes                                           |
| `scripts/parse_si_csv.py`           | Extracts SI template-like records from `data/PO_Format(SI).csv`                 | Optional helper for reconstructing SI template mappings; not part of runtime |

## Scripts Folder Classification

| Path                                | Classification   | Why                                                        |
| ----------------------------------- | ---------------- | ---------------------------------------------------------- |
| `scripts/export_docs_seed.mjs`      | Required         | Part of the docs seed-generation pipeline                  |
| `scripts/export_sqlserver_seed.mjs` | Required         | Part of the SQL Server seed-generation pipeline            |
| `scripts/parse_si_csv.py`           | Optional helper  | Useful when tracing SI template values from raw CSV source |
| `scripts/parse_stderr.txt`          | Transient output | Debug/log artifact only                                    |
| `scripts/si_err.txt`                | Transient output | Debug/log artifact only                                    |
| `scripts/si_output.txt`             | Transient output | Debug/log artifact only                                    |

## Scripts Folder Notes

- The `.mjs` files are the only scripts that directly support the final docs
  pack.
- `parse_si_csv.py` hardcodes the current `data/PO_Format(SI).csv` path and is
  intended as a local extraction utility, not a reusable runtime module.
- The `.txt` files under `scripts/` are outputs from prior parsing/debug runs
  and should not be treated as requirement inputs.

## High-Value Reading Order From The Current Repo

1. `project/source/store.ts`
2. `project/source/types.ts`
3. `project/source/pages/CreateOrder.tsx`
4. `project/source/pages/OrderDetail.tsx`
5. `project/source/pages/Orders.tsx`
6. `project/source/components/PdfGenerationModal.tsx`
7. `project/source/utils/poPdf.ts`
8. `project/source/pages/SaleReview.tsx`
9. `project/source/pages/MgrApprove.tsx`
10. `project/source/pages/CSDashboard.tsx`

## Files That Are Not Source-Of-Truth For The Migration

- older or historical bundled root docs when they conflict with the new
  `docs-for-nextjs/` requirement pack
- `dist/` build output
- `node_modules/`
- transient parser outputs under `scripts/` such as `parse_stderr.txt`,
  `si_err.txt`, and `si_output.txt`
- `store.ts.bak` backup file
