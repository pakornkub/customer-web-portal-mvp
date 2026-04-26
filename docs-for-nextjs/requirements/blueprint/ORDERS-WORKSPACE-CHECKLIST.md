# Orders Workspace Checklist

This file is the detailed implementation checklist for the **unified Orders
workspace**.

Use it after reading `requirements/pages/ORDERS-WORKSPACE.md`.

## Module Scope

- No separate Sale Review page
- No separate Manager Approve page
- No separate CS Dashboard page
- All step execution happens inside Orders

## Orders List (`/orders`)

- Build a full-option `tnks-data-table` for visible PO headers
- Show columns for PO No, date, company, ship-to, status, product-line count,
  and actions
- Support search by PO number and company
- Support filtering by header status
- Route row click into the unified order workspace
- Keep create action on this page, not as a sidebar item
- Allow delete only while status is `DRAFT`

## Create/Edit Entry

- Capture header fields first: `poNo`, `shipToId`, `destinationId`, `termId`,
  `requestETD`, `requestETA`, `asap`, `otherRequested`, `note`
- Manage product rows underneath the header
- Require at least one product row
- Filter destination options by selected ship-to
- Validate `asap === true` or at least one of requested ETD/ETA exists
- Save draft without status transition
- Submit the whole header instead of selective line submit

## Unified Order Workspace (`/orders/[orderNo]`)

- Keep all workflow zones visible on the page at all times
- Disable zones that belong to future steps
- Show saved values in completed zones as read-only context
- Apply role and status checks before enabling actions in any zone
- Keep product-line table visible throughout the workflow

## Zone Checklist

### Header Summary Zone

- Show PO number, date, company, ship-to, destination, term, requested ETD/ETA,
  status, quotation number, and note
- Show edit state clearly

### Product Lines Zone

- Render rows in `tnks-data-table` when advanced features are needed
- Support reorder/add/remove while editable
- Lock editing after `APPROVE_SALE_PO`

### Commercial Review Zone

- Enable only for `CREATED`
- Provide price, currency, and sale note inputs
- Support save draft with log entry
- Support approve action with CRM simulation

### CS ETD/PDF Zone

- Enable only for `APPROVED`
- Require `actualETD`
- Launch PDF generation flow
- Store and display generated PO/SI documents

### UEC Sale PO Review Zone

- Enable only for `WAIT_SALE_UEC_APPROVE_PO`
- Allow PDF open/download and approve action
- Lock general editing after success

### Manager Approval Zone

- Enable only for `WAIT_MGR_UEC_APPROVE_PO`
- Provide manager approve action and audit confirmation state

### Final Shipping Zone

- Enable only for `VESSEL_SCHEDULED`
- Allow document uploads by type
- Disable complete action until `Shipping Document` and `BL` exist

### Logs Zone

- Show activity logs
- Show integration logs
- Show notification history for both `email` and `system`

## Logging And Notifications

- Log every workflow transition
- Log important save/edit actions
- When email is sent, store matching in-app notification log too
- Keep logs accessible inside the order workspace without routing away

## Read Next

- `requirements/pages/ORDERS-WORKSPACE.md`
- `requirements/workflow/WORKFLOW-AND-PERMISSIONS.md`
- `requirements/domain/ORDER-STRUCTURE.md`
