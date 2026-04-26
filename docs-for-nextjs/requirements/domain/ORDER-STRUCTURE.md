# Order Structure

This file defines the **target order structure for the next project**.

The current MVP code in this repository still uses the older model where one
header contains many PO workflow lines. The next project must replace that with
the structure below.

Use this file when you need to answer either of these questions:

- What is the required business object shape for the next project?
- Which fields belong on the PO header versus the product lines?

## 1. Required Target Structure

The next project must use a **PO Header + Product Line** model.

- One header represents exactly **one PO**.
- There is **no parent order layer above the PO header**.
- Workflow, approval, documents, ETD, shipment data, and action-driven fields
  all live on the header.
- Child lines under that header are product rows only.
- Product lines do not have independent workflow statuses.

## 2. Required Header Shape

### `OrderHeader`

`OrderHeader` is now the operational unit of the workflow.

| Field            | Type                     | Meaning                                        |
| ---------------- | ------------------------ | ---------------------------------------------- |
| `id`             | string                   | Internal identifier                            |
| `poNo`           | string                   | Business PO number, one header per PO          |
| `orderDate`      | string                   | Header date                                    |
| `companyId`      | string                   | Company ownership code                         |
| `shipToId`       | string                   | Ship-to code                                   |
| `destinationId`  | string                   | Destination code                               |
| `termId`         | string                   | Shipping/commercial term                       |
| `status`         | `OrderHeaderStatus`      | Canonical workflow status for the whole header |
| `requestETD`     | string?                  | Requested ETD                                  |
| `requestETA`     | string?                  | Requested ETA                                  |
| `price`          | number?                  | Approved commercial price                      |
| `currency`       | string?                  | Currency code                                  |
| `otherRequested` | string?                  | Free-text request                              |
| `saleNote`       | string?                  | Commercial note                                |
| `quotationNo`    | string?                  | CRM quotation number                           |
| `asap`           | boolean                  | Urgent flag                                    |
| `actualETD`      | string?                  | Final ETD set during CS step                   |
| `clearanceDate`  | string?                  | Optional clearance date                        |
| `feederVessel`   | string?                  | Feeder vessel detail                           |
| `motherVessel`   | string?                  | Mother vessel detail                           |
| `vesselCompany`  | string?                  | Vessel company detail                          |
| `forwarder`      | string?                  | Forwarder detail                               |
| `vesselEtd`      | string?                  | Vessel ETD                                     |
| `vesselEta`      | string?                  | Vessel ETA                                     |
| `note`           | string?                  | General header note                            |
| `pdfSnapshot`    | `PdfGenerationSnapshot?` | Persisted PO/SI snapshot data                  |
| `documents`      | `OrderDocument[]`        | Workflow and shipping documents for the header |
| `products`       | `OrderProductLine[]`     | Product rows under this PO header              |
| `createdBy`      | string                   | Username of creator                            |
| `updatedBy`      | string                   | Username of last updater                       |
| `createdAt`      | string                   | Audit timestamp                                |
| `updatedAt`      | string                   | Audit timestamp                                |

## 3. Required Product Line Shape

### `OrderProductLine`

Child lines are product-detail rows only.

| Field         | Type    | Meaning                                                       |
| ------------- | ------- | ------------------------------------------------------------- |
| `id`          | string  | Product line identifier                                       |
| `headerId`    | string  | FK to the PO header                                           |
| `lineNo`      | number  | Display/order sequence                                        |
| `productId`   | string? | Product master reference if a dedicated product master exists |
| `gradeId`     | string? | Product grade reference retained from current MVP             |
| `productName` | string? | Display name if UI stores explicit product text               |
| `qty`         | number  | Quantity for this product row                                 |
| `unit`        | string? | Optional unit of measure                                      |
| `remark`      | string? | Product-specific remark                                       |
| `createdAt`   | string  | Audit timestamp                                               |
| `updatedAt`   | string  | Audit timestamp                                               |

Notes:

- Product rows no longer store workflow status.
- Product rows no longer store shipping workflow fields such as ETD, quotation,
  vessel data, or documents.
- Minimum product-level continuity from the current MVP is `gradeId` + `qty`.

## 4. Required Document Shape

### `OrderDocument`

Primary workflow documents are attached to the header.

| Field        | Type           | Meaning                 |
| ------------ | -------------- | ----------------------- |
| `id`         | string         | Document identifier     |
| `type`       | `DocumentType` | Document type           |
| `filename`   | string         | File name               |
| `dataUrl`    | string?        | Optional inline payload |
| `uploadedBy` | string         | Username of uploader    |
| `uploadedAt` | string         | Audit timestamp         |

## 5. Workflow Ownership Rules

### Status ownership

- `status` lives on the header.
- The old header summary status is removed.
- The old line status becomes the new header status.
- Product lines inherit the header lifecycle but do not control it.

### Action ownership

- `SUBMIT_LINE`, `APPROVE_LINE`, `SET_ETD`, `APPROVE_SALE_PO`, `APPROVE_MGR_PO`,
  and `UPLOAD_FINAL_DOCS` now operate on the header.
- Any workflow step that adds data must write that data to the header.
- Timeline and approval state must be rendered from header status only.

### Document ownership

- PO PDF and Shipping Instruction PDF are header documents.
- Final shipping documents are header documents.
- Product lines do not drive document completion.

## 6. Editability Rules

- Header fields and product lines are editable in:
  - `DRAFT`
  - `CREATED`
  - `APPROVED`
  - `WAIT_SALE_UEC_APPROVE_PO`
- The record becomes workflow-locked immediately after `APPROVE_SALE_PO`
  succeeds.
- After the first JP approve step, only controlled step-specific updates are
  allowed by later workflow actions.

## 7. Recommended SQL Server Naming

Recommended conventions:

- Use `dbo` schema.
- Use singular PascalCase table names.
- Use PascalCase column names.
- Use `...Code` for stable business codes from the MVP.
- Use `...Id` for internal identifiers.
- Avoid reserved or ambiguous object names such as `Order`, `User`, and
  `Timestamp`.

## 8. Naming Map

| Business Meaning    | Recommended SQL Server Name | Notes                                  |
| ------------------- | --------------------------- | -------------------------------------- |
| PO header           | `dbo.OrderHeader`           | One row per PO                         |
| Product line        | `dbo.OrderLine`             | Child rows are product rows only       |
| Header documents    | `dbo.OrderHeaderDocument`   | Primary workflow document table        |
| `poNo`              | `PurchaseOrderNumber`       | Core business identifier               |
| `status`            | `OrderHeaderStatusCode`     | Old line status moved to header        |
| `shipToId`          | `ShipToCode`                | Business code                          |
| `destinationId`     | `DestinationCode`           | Business code                          |
| `termId`            | `TermCode`                  | Business code                          |
| `price`             | `Price`                     | Commercial field on header             |
| `currency`          | `CurrencyCode`              | Commercial field on header             |
| `gradeId`           | `GradeCode`                 | Product-line attribute                 |
| `qty`               | `Quantity`                  | Product-line quantity                  |
| `asap`              | `IsAsap`                    | Boolean naming convention              |
| `requestETD`        | `RequestedEtd`              | Header-level requested ETD             |
| `requestETA`        | `RequestedEta`              | Header-level requested ETA             |
| `actualETD`         | `ActualEtd`                 | Header-level final ETD                 |
| `otherRequested`    | `OtherRequestedText`        | Header-level free text                 |
| `timestamp` in logs | `OccurredAt`                | Avoid SQL Server `timestamp` confusion |

## 9. Recommended SQL Server Physical Split

### `dbo.OrderHeader`

Header-level workflow and shipping data:

- `OrderHeaderId`
- `PurchaseOrderNumber`
- `OrderDate`
- `CompanyCode`
- `ShipToCode`
- `DestinationCode`
- `TermCode`
- `OrderHeaderStatusCode`
- `RequestedEtd`
- `RequestedEta`
- `Price`
- `CurrencyCode`
- `OtherRequestedText`
- `SaleNote`
- `QuotationNumber`
- `IsAsap`
- `ActualEtd`
- `ClearanceDate`
- `FeederVesselName`
- `MotherVesselName`
- `VesselCompanyName`
- `ForwarderName`
- `VesselEtd`
- `VesselEta`
- `OrderNote`
- `PdfSnapshotJson`
- `CreatedByUserName`
- `UpdatedByUserName`
- `CreatedAt`
- `UpdatedAt`

### `dbo.OrderLine`

Product-level rows only:

- `OrderLineId`
- `OrderHeaderId`
- `LineNumber`
- `ProductCode` or `GradeCode`
- `ProductName`
- `Quantity`
- `UnitCode`
- `RemarkText`
- `CreatedAt`
- `UpdatedAt`

### `dbo.OrderHeaderDocument`

- `OrderHeaderDocumentId`
- `OrderHeaderId`
- `DocumentTypeCode`
- `FileName`
- `StorageUrl`
- `DataUrl`
- `UploadedByUserName`
- `UploadedAt`

## Read Next

- For the workflow rules, read
  `requirements/workflow/WORKFLOW-AND-PERMISSIONS.md`.
- For the logical relational design, read `database/DATABASE-SCHEMA.md`.
- For SQL Server-specific physical names, read
  `database/DATABASE-SCHEMA-SQLSERVER.md`.
- For menu-level behavior, read `requirements/pages/MENU-FLOWS.md`.
