# Workflow And Permissions

This file is the AI-friendly source of truth for workflow, roles, page access,
status transitions, notifications, and business rules for the **next project
requirement set**.

Use this file first when implementing:

- route protection
- page authorization
- header action handling
- status transitions
- notifications and logs

For menu-by-menu page responsibilities and the actual sidebar labels, read
`requirements/pages/MENU-FLOWS.md` after this file.

For detailed zone behavior inside the order page, read
`requirements/pages/ORDERS-WORKSPACE.md` after this file.

## Scope

- Workflow is **header-level**.
- One header equals one PO.
- One header contains many product lines.
- Product lines do not have independent workflow statuses.
- The old derived order progress status is removed.

## Roles

| Role           | Purpose                                               |
| -------------- | ----------------------------------------------------- |
| `MAIN_TRADER`  | Creates and edits draft PO headers                    |
| `UBE_JAPAN`    | Reviews generated PO in the sale-review stage         |
| `SALE`         | Inputs price and approves commercial review           |
| `SALE_MANAGER` | Final PO approval before CS finalization              |
| `CS`           | Sets ETD, generates PDFs, uploads final shipping docs |
| `ADMIN`        | Full access, bypasses permission matrix               |

## User Groups

| User Group    | Main Use                                |
| ------------- | --------------------------------------- |
| `TRADER`      | Submit draft PO headers                 |
| `UEC_SALE`    | Approve PO after CS generates documents |
| `TSL_SALE`    | Price approval for created headers      |
| `UEC_MANAGER` | Manager approval after PO review        |
| `TSL_CS`      | ETD setup and final document completion |
| `ADMIN`       | Administrative bypass                   |

## Page Access

| Page            | Route               | Allowed Roles                                |
| --------------- | ------------------- | -------------------------------------------- |
| Login           | `/login`            | All                                          |
| Dashboard       | `/`                 | All authenticated users                      |
| Orders          | `/orders`           | All authenticated users                      |
| Create Order    | `/orders/create`    | Users with `canCreateOrder = true`           |
| Order Detail    | `/orders/[orderNo]` | All authenticated users with visible headers |
| Admin           | `/admin`            | `ADMIN`                                      |
| PO/SI Templates | `/po-si-templates`  | `ADMIN`                                      |
| Master Data     | `/master-data`      | `ADMIN`                                      |
| Logs            | `/logs`             | `ADMIN`                                      |
| Clear Data      | `/clear-data`       | `ADMIN`                                      |

## Unified Orders Workspace Requirement

- The next project must execute commercial review, UEC sale review, manager
  approval, and CS workflow steps inside the Orders module.
- Do not create separate step pages for `/review`, `/mgr-approve`, or `/cs` in
  the target implementation.
- `Order Detail` becomes the single workflow workspace for one PO header.
- Step zones remain visible even before they are active.
- Zones for future steps remain disabled until the header reaches the required
  status.
- Role restrictions still apply inside the single page; visibility does not mean
  editability.

## Workflow Statuses

### Header status

| Status                     | Meaning                                               |
| -------------------------- | ----------------------------------------------------- |
| `DRAFT`                    | Draft PO header, still editable                       |
| `CREATED`                  | Submitted and waiting sale price approval             |
| `APPROVED`                 | Sale-approved header with price/currency set          |
| `WAIT_SALE_UEC_APPROVE_PO` | CS generated PO/SI and PO is waiting UEC sale review  |
| `WAIT_MGR_UEC_APPROVE_PO`  | PO approved by UEC sale, waiting manager approval     |
| `VESSEL_SCHEDULED`         | Manager approved PO, waiting final shipping documents |
| `VESSEL_DEPARTED`          | Final docs complete and shipment closed               |

## Canonical Transition Flow

Legacy action codes may be retained for compatibility, but they now execute at
the header level.

```text
DRAFT
  -> SUBMIT_LINE -> CREATED
  -> APPROVE_LINE -> APPROVED
  -> SET_ETD -> WAIT_SALE_UEC_APPROVE_PO
  -> APPROVE_SALE_PO -> WAIT_MGR_UEC_APPROVE_PO
  -> APPROVE_MGR_PO -> VESSEL_SCHEDULED
  -> UPLOAD_FINAL_DOCS -> VESSEL_DEPARTED
```

## Header Action Matrix

### Standard preset

| Action              | From                       | To                         | Allowed User Groups              |
| ------------------- | -------------------------- | -------------------------- | -------------------------------- |
| `SUBMIT_LINE`       | `DRAFT`                    | `CREATED`                  | `TRADER`, `UEC_SALE`, `TSL_SALE` |
| `APPROVE_LINE`      | `CREATED`                  | `APPROVED`                 | `TSL_SALE`                       |
| `SET_ETD`           | `APPROVED`                 | `WAIT_SALE_UEC_APPROVE_PO` | `TSL_CS`                         |
| `APPROVE_SALE_PO`   | `WAIT_SALE_UEC_APPROVE_PO` | `WAIT_MGR_UEC_APPROVE_PO`  | `UEC_SALE`                       |
| `APPROVE_MGR_PO`    | `WAIT_MGR_UEC_APPROVE_PO`  | `VESSEL_SCHEDULED`         | `UEC_MANAGER`                    |
| `UPLOAD_FINAL_DOCS` | `VESSEL_SCHEDULED`         | `VESSEL_DEPARTED`          | `TSL_CS`                         |

### Strict preset

Same as Standard, except `SUBMIT_LINE` is limited to `TRADER` only.

### Enforcement rules

- Every status-changing action must pass `canUserRunHeaderAction()`.
- `ADMIN` bypasses the header permission matrix.
- The permission matrix can be edited, locked, reset, and saved as custom
  presets from the admin page.

## Action-Level Rules

### `SUBMIT_LINE`

- Only applies to `DRAFT` headers.
- Submit acts on the whole PO header, not on individual product lines.
- The header must contain at least one product line before submission.
- There is no separate `UBE_APPROVED` intermediate status.

### `APPROVE_LINE`

- Header must be `CREATED`.
- `price > 0` is mandatory on the header.
- `currency` is stored on the header.
- `saleNote` may be saved on the header before status change.
- CRM simulation waits about `1800ms`.
- After the wait, the header stores `quotationNo` in the format `QT-XXXXXX`.
- Integration logs receive `PENDING` then `SUCCESS` entries.
- CS receives both email and in-app notifications.

### `SET_ETD`

- Header must be `APPROVED`.
- `actualETD` is mandatory.
- CS opens `PdfGenerationModal` before confirming.
- Action generates both `PO_PDF` and `SHIPPING_INSTRUCTION_PDF`.
- Generated PDFs are attached to the header.
- PDFs auto-download only if the current user has access to those document
  types.
- Header moves to `WAIT_SALE_UEC_APPROVE_PO`.

### `APPROVE_SALE_PO`

- Header must be `WAIT_SALE_UEC_APPROVE_PO`.
- Reviewer opens or downloads the PO PDF before confirmation.
- On success, header moves to `WAIT_MGR_UEC_APPROVE_PO`.
- This is the lock point for general editing.
- `SALE_MANAGER` receives both email and in-app notifications.

### `APPROVE_MGR_PO`

- Header must be `WAIT_MGR_UEC_APPROVE_PO`.
- On success, header moves to `VESSEL_SCHEDULED`.
- CS receives both email and in-app notifications.

### `UPLOAD_FINAL_DOCS`

- Header must be `VESSEL_SCHEDULED`.
- `Shipping Document` and `BL` are both required before completion.
- Uploading a document of the same type replaces the previous one.
- Final documents are stored on the header.
- On success, header moves to `VESSEL_DEPARTED`.

## Document Rules

### Uploadable document types

- `Shipping Document`
- `BL`
- `Invoice`
- `COA`

### Auto-generated document types

- `PO_PDF`
- `SHIPPING_INSTRUCTION_PDF`

### Access rules

- `ADMIN` can access all document types.
- Other users can only access document types listed in `allowedDocumentTypes`.

## Visibility Rules

- Non-admin users only see headers that pass
  `canUserAccessShipTo(user, shipToId)`.
- `shipToAccess = ALL` means all ship-to records are visible.
- `shipToAccess = SELECTED` means only `allowedShipToIds` are visible.
- A header hidden by ship-to restriction is hidden entirely together with its
  product rows.
- Visibility remains ship-to based. `companyId` is stored on users and headers,
  but visibility is not enforced at company level.

## Logging And Notifications

- Every workflow transition must write an `ActivityLog` entry.
- Important save/edit events must also write an `ActivityLog` entry.
- Important save/edit examples include draft save, commercial field changes, PDF
  generation, document replacement, and approval decisions.
- CRM simulation writes `IntegrationLog` entries.
- Every workflow step that sends email must also write an in-app notification.
- `NotificationLog` must capture both `email` and `system` deliveries.
- No additional log table is required; use richer action names and detail text
  to distinguish workflow, edit, document, notification, and system events.

## Scheduled Checks

- `runScheduledChecks()` runs on every login.
- It checks for headers where:
  - status is `APPROVED`
  - `asap = true`
  - `requestETA` is within the next 30 days
- Matching headers create:
  - one CS notification
  - one system activity log entry

## Edit And Delete Constraints

- Header fields and product lines are editable until `APPROVE_SALE_PO` is
  completed.
- Headers in `DRAFT`, `CREATED`, `APPROVED`, and `WAIT_SALE_UEC_APPROVE_PO`
  remain editable.
- After status becomes `WAIT_MGR_UEC_APPROVE_PO`, general field editing is
  locked.
- Late-stage workflow actions may still write their own controlled fields.
- Headers can only be deleted while status is `DRAFT`.

## Clear Data Behavior

- `/clear-data` is an admin-only utility page.
- It clears transactional data only:
  - current session user
  - orders
  - activity logs
  - notification logs
  - integration logs
- It does not clear:
  - users
  - companies
  - master data
  - PO/SI templates
  - permission presets

## Read Next

- For menu-by-menu page behavior and current sidebar labels, read
  `requirements/pages/MENU-FLOWS.md`.
- For the unified order workspace rules, read
  `requirements/pages/ORDERS-WORKSPACE.md`.
- For master data structure and ownership, read
  `requirements/domain/MASTER-DATA-REFERENCE.md`.
- For future backend table design, read `database/DATABASE-SCHEMA.md`.
