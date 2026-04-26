# Menu Flows

This file is the menu-by-menu operating guide for the next-project menu scope.

Use this when another AI agent or project needs to understand:

- which menu labels the user actually sees in the sidebar
- what each page is responsible for
- what data each page reads or mutates
- which rules or side effects are tied to each page

## Scope Notes

- The next project collapses step-specific workflow menus into Orders.
- Separate menus for sale review, manager approval, and CS workflow execution
  are removed from the target design.
- Admin/support menus remain separate.
- Workflow permissions are still governed by
  `requirements/workflow/WORKFLOW-AND-PERMISSIONS.md`.
- Master/reference structures are still governed by
  `requirements/domain/MASTER-DATA-REFERENCE.md`.
- Detailed unified-order behavior lives in
  `requirements/pages/ORDERS-WORKSPACE.md`.

## Cross-Cutting Rules

- Non-admin users only see PO headers allowed by ship-to visibility.
- Status-changing header actions must pass `canUserRunHeaderAction()`.
- `ADMIN` bypasses the header permission matrix.
- Document visibility depends on `allowedDocumentTypes`, except `ADMIN`.
- Pages outside the sidebar still matter operationally: login, create order,
  edit order, and order detail.

## Quick Map

| UI Label / Page | Route                   | Sidebar | Access                                                  | Primary Purpose                                                           |
| --------------- | ----------------------- | ------- | ------------------------------------------------------- | ------------------------------------------------------------------------- |
| Login           | `/login`                | No      | All unauthenticated users                               | Sign in and initialize scheduled checks                                   |
| Dashboard       | `/`                     | Yes     | All authenticated users                                 | Overall operational snapshot for visible PO headers                       |
| Orders          | `/orders`               | Yes     | All authenticated users                                 | Main entry point for listing, creating, importing, and opening PO headers |
| Create Order    | `/orders/create`        | No      | Users with `canCreateOrder = true`                      | Build new order header + lines                                            |
| Edit Order      | `/orders/edit/:orderNo` | No      | Users with `canCreateOrder = true` and editable headers | Modify an existing PO header and its product lines                        |
| Order Detail    | `/orders/:orderNo`      | No      | All authenticated users with visible headers            | Review one PO in the unified order workspace                              |
| PO/SI Templates | `/po-si-templates`      | Yes     | `ADMIN`                                                 | Maintain PDF template defaults by ship-to                                 |
| Configuration   | `/master-data`          | Yes     | `ADMIN`                                                 | Maintain companies and other master data sets                             |
| User Management | `/admin`                | Yes     | `ADMIN`                                                 | Maintain users, permission matrix, and presets                            |
| System Logs     | `/logs`                 | Yes     | `ADMIN`                                                 | Read activity, notification, and integration logs                         |
| Clear Data      | `/clear-data`           | Yes     | `ADMIN`                                                 | Reset transactional demo data only                                        |

## Sidebar Menus

### Dashboard

- Purpose: show a quick operational overview for only the headers visible to the
  current user.
- Data shown: status summary cards, urgent ASAP headers with ETA within 30 days,
  and recent PO headers.
- Main actions: search/filter within the dashboard widgets and jump into order
  flows.
- Rules: data must respect header visibility and ship-to access.

### Orders

- Purpose: main working list for all visible PO headers.
- Data shown: PO header summary, product-line counts, search/filter results, and
  row-level actions.
- Main actions: open order detail, go to create order, import CSV sample data,
  and delete eligible draft-only headers.
- Rules:
  - Main listing grid should use full-option `tnks-data-table`.
  - Create button is not in the sidebar.
  - Delete is only allowed while header status is `DRAFT`.
  - Workflow execution continues inside order detail instead of separate step
    pages.

### Orders As Unified Workflow Workspace

- Purpose: commercial review, UEC sale review, manager approval, and CS
  execution all happen inside the Orders module.
- Data shown:
  - all workflow zones on one order page
  - current-step controls enabled by status and role
  - future-step zones visible but disabled
  - prior-step data visible in read-only mode
- Main actions:
  - run commercial review inside the order page
  - review/generated PO inside the order page
  - complete manager approval inside the order page
  - run CS ETD/PDF/document steps inside the order page
- Rules:
  - See `requirements/pages/ORDERS-WORKSPACE.md` for the full zone behavior.
  - Do not create sidebar entries for these steps in the next project.

### PO/SI Templates

- Purpose: maintain default content blocks used by PDF generation.
- Data shown: two admin tabs, one for PO templates and one for SI templates,
  keyed by `shipToId`.
- Main actions: create, edit, and delete template records.
- Rules: one active PO template and one active SI template should exist per
  ship-to.

### Configuration

- Purpose: maintain master/reference data used across forms and workflows.
- Data shown: tabs for companies, ship-tos, destinations, terms, grades, and
  group sale types.
- Main actions: CRUD each master set and map ship-tos to group sale type plus
  destination lists.
- Rules: destination choices in transactional forms depend on the selected
  ship-to mapping maintained here.

### User Management

- Purpose: maintain access control and workflow policy.
- Data shown:
  - User list and user edit controls.
  - Header permission matrix.
  - System/custom permission presets.
- Main actions:
  - Create, edit, and delete users.
  - Maintain `canCreateOrder`, ship-to access, and allowed document types.
  - Lock/unlock the permission matrix.
  - Apply, save, load, or reset permission presets.
- Rules: matrix changes affect all workflow action gating immediately.

### System Logs

- Purpose: operational traceability and troubleshooting.
- Data shown:
  - Integration logs
  - Activity logs
  - Notification logs
- Main actions: inspect audit history and follow workflow events.
- Rules: read-only admin page.

### Clear Data

- Purpose: reset demo transactional state without destroying masters.
- Data shown: clear explanation of what will be deleted versus preserved.
- Main actions: confirm destructive action and clear transactional data.
- Rules:
  - Deletes current session user, orders, activity logs, notification logs, and
    integration logs.
  - Preserves users, companies, master data, PO/SI templates, and permission
    presets.
  - Redirects back to login after completion.

## Non-Sidebar Pages

### Login

- Purpose: mock sign-in for the MVP.
- Main actions: enter username/password and authenticate.
- Rules: current MVP validates username only, then sets `currentUser` and runs
  `runScheduledChecks()`.

### Create Order

- Purpose: create a new PO header with one or many product lines.
- Main actions:
  - Add/remove/duplicate/reorder product lines.
  - Select ship-to, destination, term, ETD/ETA, and ASAP flag at header level.
  - Enter product rows beneath the header.
  - Save draft or submit the whole header.
  - Import rows from CSV.
- Rules:
  - User must have `canCreateOrder = true`.
  - `poNo` is unique per header.
  - At least one product line is required.
  - If `asap` is false, at least one of requested ETD or ETA is required.
  - Destination list depends on ship-to.
  - Important save events create activity logs.

### Edit Order

- Purpose: update an existing PO header while preserving header-level workflow
  rules.
- Main actions: same form surface as create, but loaded with existing data.
- Rules:
  - Header fields and product lines remain editable until `APPROVE_SALE_PO`
    completes.
  - After that point, general editing is locked but later workflow actions may
    still add their own controlled fields.

### Order Detail

- Purpose: inspect one PO header and run the full workflow inside a single
  workspace.
- Data shown: header summary, product-line table, status badges, documents, and
  all step zones.
- Main actions:
  - Download available documents.
  - Run header actions appropriate to the current status.
  - Review generated PDF state and shipping information.
- Rules:
  - Product-line table should use full-option `tnks-data-table` when the screen
    requires advanced grid behavior.
  - Visible actions depend on header status and the active permission matrix.
  - Future-step zones remain visible but disabled until reachable.

## Read Next

- For workflow transitions and permission rules, read
  `requirements/workflow/WORKFLOW-AND-PERMISSIONS.md`.
- For unified order workspace rules, read
  `requirements/pages/ORDERS-WORKSPACE.md`.
- For detailed page implementation checklists, read
  `requirements/blueprint/Objective.md`.
- For master data ownership and relationships, read
  `requirements/domain/MASTER-DATA-REFERENCE.md`.
