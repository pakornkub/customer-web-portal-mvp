# Orders Workspace

This file defines the **single Orders workspace** requirement for the next
project.

Use this file when implementing the main order module, because all workflow
steps that used to be separated into step-specific menus must now finish inside
Orders.

## Scope

- The next project must not expose separate workflow menus for sale review,
  manager approve, or CS step execution.
- Workflow execution is consolidated into the Orders module.
- The primary working surface is the order detail workspace for one PO header.
- All step zones are visible on the same page, even if the current header has
  not reached that step yet.
- Zones for future steps are disabled until the header reaches the required
  status.

## Route Model

Required routes for the next project:

- `/orders` main list and search page
- `/orders/create` create a new PO header
- `/orders/[orderNo]` unified order workspace and detail page
- `/orders/[orderNo]/edit` optional edit entry, or redirect into the same
  workspace in edit mode

Removed step-specific routes from the next-project requirement:

- `/review`
- `/mgr-approve`
- `/cs`

## Workspace Layout

The unified order workspace should be split into persistent zones in this order:

1. Header summary zone
2. Product lines zone
3. Workflow timeline zone
4. Commercial review zone
5. CS ETD and PDF generation zone
6. UEC sale PO review zone
7. Manager approval zone
8. Final shipping documents zone
9. Activity, integration, and notification history zone

All zones remain visible on the page so users can understand the full process at
a glance.

## Zone Visibility And Disable Rules

### General rule

- Every zone is visible regardless of current header status.
- Current-step zones are enabled when both status and role allow action.
- Past-step zones become read-only but remain visible with their saved values.
- Future-step zones remain disabled with clear disabled state and helper text.

### Disable logic

- If the header has not reached the required status for a zone, all inputs and
  action buttons in that zone are disabled.
- If the role does not have permission for that step, the zone is still shown
  but action controls remain disabled.
- `ADMIN` may bypass workflow permission checks, but disabled-state visuals for
  future steps should still communicate the canonical progression.

## Step Zones

### Zone 1: Header Summary

- Always visible
- Shows PO number, company, ship-to, destination, term, requested ETD/ETA, ASAP
  flag, quotation number, and current status
- Contains high-level edit affordances while the header is still editable

### Zone 2: Product Lines

- Always visible
- Uses `tnks-data-table` when advanced table behavior is needed
- Shows all product rows even if later workflow steps are active
- Product editing follows the same edit lock as the header

### Zone 3: Workflow Timeline

- Always visible
- Shows all statuses from `DRAFT` through `VESSEL_DEPARTED`
- Highlights current step and completed steps
- Future steps are visibly disabled/inactive

### Zone 4: Commercial Review

- Visible at all times
- Enabled when status is `CREATED` and role has sale approval access
- Contains price, currency, sale note, draft save, and approve action

### Zone 5: CS ETD And PDF Generation

- Visible at all times
- Enabled when status is `APPROVED` and role has CS access
- Contains `actualETD`, PDF generation entry point, and generated document
  summary

### Zone 6: UEC Sale PO Review

- Visible at all times
- Enabled when status is `WAIT_SALE_UEC_APPROVE_PO`
- Contains PO PDF review/open action and approve-to-manager action

### Zone 7: Manager Approval

- Visible at all times
- Enabled when status is `WAIT_MGR_UEC_APPROVE_PO`
- Contains final PO approval controls and audit summary

### Zone 8: Final Shipping Documents

- Visible at all times
- Enabled when status is `VESSEL_SCHEDULED`
- Contains upload controls for `Shipping Document`, `BL`, `Invoice`, and `COA`
- Completion action remains disabled until both `Shipping Document` and `BL`
  exist

### Zone 9: Logs And Notifications

- Always visible
- Shows activity logs, integration logs, and notification history for the
  current PO header
- Should make workflow traceability possible without leaving the Orders module

## Edit Rules Inside The Workspace

- Header fields and product lines are editable through these statuses:
  - `DRAFT`
  - `CREATED`
  - `APPROVED`
  - `WAIT_SALE_UEC_APPROVE_PO`
- General editing locks immediately after `APPROVE_SALE_PO` succeeds.
- Later step zones may still write their own controlled fields after the main
  edit lock, such as manager approval or final document upload.

## Role Behavior Inside A Single Page

- `MAIN_TRADER` primarily creates and edits header/product data before later
  approvals
- `SALE` uses the same page to review commercial fields and approve the header
- `UBE_JAPAN` uses the same page to review generated PO content
- `SALE_MANAGER` uses the same page for manager approval
- `CS` uses the same page for ETD, PDF generation, and final shipping docs
- `ADMIN` can inspect all zones and perform administrative override actions if
  permitted by policy

## Table Requirements

- The order list page should use `tnks-data-table`
- The product-line zone should use `tnks-data-table` when sorting, filtering,
  row actions, or pinned columns are needed
- Step-zone sublists should use the same table component family for consistency

## Read Next

- For overall menu scope, read `requirements/pages/MENU-FLOWS.md`.
- For status transitions and permission rules, read
  `requirements/workflow/WORKFLOW-AND-PERMISSIONS.md`.
- For the detailed build checklist, read
  `requirements/blueprint/ORDERS-WORKSPACE-CHECKLIST.md`.
