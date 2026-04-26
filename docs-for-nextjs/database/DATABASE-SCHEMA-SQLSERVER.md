# Database Schema For SQL Server

This file is the **SQL Server physical naming reference** for the next backend
project.

It complements `database/DATABASE-SCHEMA.md`:

- `database/DATABASE-SCHEMA.md` stays as the logical relational design
- this file defines the recommended **SQL Server table and column names**

For concrete T-SQL scripts using these names, read
`database/schema.sqlserver.ddl.sql` for schema creation and
`database/seed.sqlserver.sql` for bootstrap data.

## Naming Principles

- Use schema `dbo`.
- Use singular PascalCase table names.
- Use PascalCase column names.
- Use `...Code` for business codes that already exist in the MVP data.
- Use `...Id` for row identifiers or internal IDs.
- Avoid reserved or overloaded object names:
  - use `AppUser` instead of `User`
  - use `OrderHeader` and `OrderLine` instead of `Order`
  - use `OccurredAt` instead of `Timestamp`
- Use descriptive names instead of abbreviations where practical:
  - `Quantity` instead of `Qty`
  - `PurchaseOrderNumber` instead of `PoNo`
  - `QuotationNumber` instead of `QuotationNo`

## Table Naming Map

| Logical Name In Current Docs     | Recommended SQL Server Table     |
| -------------------------------- | -------------------------------- |
| `customer_companies`             | `dbo.CustomerCompany`            |
| `users`                          | `dbo.AppUser`                    |
| `user_allowed_ship_tos`          | `dbo.UserShipToAccess`           |
| `user_allowed_document_types`    | `dbo.UserDocumentTypeAccess`     |
| `group_sale_types`               | `dbo.GroupSaleType`              |
| `destinations`                   | `dbo.Destination`                |
| `terms`                          | `dbo.ShippingTerm`               |
| `grades`                         | `dbo.ProductGrade`               |
| `ship_tos`                       | `dbo.ShipTo`                     |
| `ship_to_destinations`           | `dbo.ShipToDestinationMap`       |
| `po_templates`                   | `dbo.PoTemplate`                 |
| `si_templates`                   | `dbo.SiTemplate`                 |
| `orders`                         | `dbo.OrderHeader`                |
| `order_items`                    | `dbo.OrderLine`                  |
| `order_documents`                | `dbo.OrderHeaderDocument`        |
| `order_item_documents`           | `dbo.OrderLineDocument`          |
| `header_action_permissions`      | `dbo.HeaderActionPermission`     |
| `header_permission_presets`      | `dbo.HeaderPermissionPreset`     |
| `header_permission_preset_rules` | `dbo.HeaderPermissionPresetRule` |
| `app_settings`                   | `dbo.AppSetting`                 |
| `integration_logs`               | `dbo.IntegrationLog`             |
| `notification_logs`              | `dbo.NotificationLog`            |
| `activity_logs`                  | `dbo.ActivityLog`                |

## Reference And Access Tables

### `dbo.CustomerCompany`

| Column        | Notes                                      |
| ------------- | ------------------------------------------ |
| `CompanyCode` | PK, stable company code from MVP seed data |
| `CompanyName` | Display name                               |
| `CreatedAt`   | Audit timestamp                            |
| `UpdatedAt`   | Audit timestamp                            |

### `dbo.AppUser`

| Column             | Notes                                   |
| ------------------ | --------------------------------------- |
| `UserId`           | PK                                      |
| `UserName`         | Unique login name                       |
| `RoleCode`         | Route-level access enum                 |
| `UserGroupCode`    | Action-level access enum                |
| `CompanyCode`      | FK to `dbo.CustomerCompany.CompanyCode` |
| `CanCreateOrder`   | Create-order permission                 |
| `ShipToAccessMode` | `ALL` or `SELECTED`                     |
| `IsActive`         | Active flag                             |
| `CreatedAt`        | Audit timestamp                         |
| `UpdatedAt`        | Audit timestamp                         |

### `dbo.UserShipToAccess`

| Column       | Notes                         |
| ------------ | ----------------------------- |
| `UserId`     | FK to `dbo.AppUser.UserId`    |
| `ShipToCode` | FK to `dbo.ShipTo.ShipToCode` |

### `dbo.UserDocumentTypeAccess`

| Column             | Notes                      |
| ------------------ | -------------------------- |
| `UserId`           | FK to `dbo.AppUser.UserId` |
| `DocumentTypeCode` | Allowed document type      |

## Master Data Tables

### `dbo.GroupSaleType`

| Column              | Notes                 |
| ------------------- | --------------------- |
| `GroupSaleTypeCode` | PK, enum-backed value |
| `GroupSaleTypeName` | Display name          |

### `dbo.Destination`

| Column            | Notes           |
| ----------------- | --------------- |
| `DestinationCode` | PK              |
| `DestinationName` | Display name    |
| `CreatedAt`       | Audit timestamp |
| `UpdatedAt`       | Audit timestamp |

### `dbo.ShippingTerm`

| Column      | Notes           |
| ----------- | --------------- |
| `TermCode`  | PK              |
| `TermName`  | Display name    |
| `CreatedAt` | Audit timestamp |
| `UpdatedAt` | Audit timestamp |

### `dbo.ProductGrade`

| Column      | Notes           |
| ----------- | --------------- |
| `GradeCode` | PK              |
| `GradeName` | Display name    |
| `CreatedAt` | Audit timestamp |
| `UpdatedAt` | Audit timestamp |

### `dbo.ShipTo`

| Column              | Notes                                       |
| ------------------- | ------------------------------------------- |
| `ShipToCode`        | PK                                          |
| `ShipToName`        | Display name                                |
| `GroupSaleTypeCode` | FK to `dbo.GroupSaleType.GroupSaleTypeCode` |
| `CreatedAt`         | Audit timestamp                             |
| `UpdatedAt`         | Audit timestamp                             |

### `dbo.ShipToDestinationMap`

| Column            | Notes                                   |
| ----------------- | --------------------------------------- |
| `ShipToCode`      | FK to `dbo.ShipTo.ShipToCode`           |
| `DestinationCode` | FK to `dbo.Destination.DestinationCode` |

### `dbo.PoTemplate`

| Column                | Notes                                |
| --------------------- | ------------------------------------ |
| `PoTemplateId`        | PK                                   |
| `ShipToCode`          | Unique FK to `dbo.ShipTo.ShipToCode` |
| `ToBlock`             | Multi-line TO block                  |
| `ConsigneeNotify`     | Multi-line consignee/notify block    |
| `Agent`               | Agent text                           |
| `EndUser`             | End-user text                        |
| `TermsOfPayment`      | Terms of payment                     |
| `PackingInstructions` | Packing instructions                 |
| `ConfirmBy`           | Signatory block                      |
| `CreatedAt`           | Audit timestamp                      |
| `UpdatedAt`           | Audit timestamp                      |

### `dbo.SiTemplate`

Use PascalCase for all template columns. Examples:

- `SiTemplateId`
- `ShipToCode`
- `Attn`
- `FromBlock`
- `PoNumberHeader`
- `MaterialCodeHeader`
- `NoteUnderMaterial`
- `PortOfLoading`
- `NotifyParty`
- `UnderDescription`
- `ShippingMark`
- `BelowSignature`
- `CreatedAt`
- `UpdatedAt`

See `database/schema.sqlserver.prisma` for the exhaustive physical column list.

## Order Workflow Tables

### `dbo.OrderHeader`

| Column                  | Notes                                   |
| ----------------------- | --------------------------------------- |
| `OrderHeaderId`         | PK                                      |
| `PurchaseOrderNumber`   | Unique business PO number               |
| `OrderDate`             | Order date                              |
| `CompanyCode`           | FK to `dbo.CustomerCompany.CompanyCode` |
| `ShipToCode`            | FK to `dbo.ShipTo.ShipToCode`           |
| `DestinationCode`       | FK to `dbo.Destination.DestinationCode` |
| `TermCode`              | FK to `dbo.ShippingTerm.TermCode`       |
| `OrderHeaderStatusCode` | Workflow status for the whole PO        |
| `RequestedEtd`          | Requested ETD                           |
| `RequestedEta`          | Requested ETA                           |
| `Price`                 | Sale price                              |
| `CurrencyCode`          | Currency code                           |
| `OtherRequestedText`    | Optional free text                      |
| `SaleNote`              | Commercial note                         |
| `QuotationNumber`       | CRM quotation number                    |
| `IsAsap`                | Urgent flag                             |
| `ActualEtd`             | Final ETD set by CS                     |
| `ClearanceDate`         | Optional clearance date                 |
| `FeederVesselName`      | Vessel detail                           |
| `MotherVesselName`      | Vessel detail                           |
| `VesselCompanyName`     | Vessel detail                           |
| `ForwarderName`         | Forwarder detail                        |
| `VesselEtd`             | Optional vessel ETD                     |
| `VesselEta`             | Optional vessel ETA                     |
| `OrderNote`             | Header note                             |
| `PdfSnapshotJson`       | Persisted PO/SI snapshot JSON           |
| `CreatedByUserName`     | Username of creator                     |
| `UpdatedByUserName`     | Username of last updater                |
| `CreatedAt`             | Audit timestamp                         |
| `UpdatedAt`             | Audit timestamp                         |

Unique key: `(PurchaseOrderNumber)`

### `dbo.OrderLine`

| Column          | Notes                                 |
| --------------- | ------------------------------------- |
| `OrderLineId`   | PK                                    |
| `OrderHeaderId` | FK to `dbo.OrderHeader.OrderHeaderId` |
| `LineNumber`    | Sequence within the PO header         |
| `ProductCode`   | Optional product code                 |
| `GradeCode`     | FK to `dbo.ProductGrade.GradeCode`    |
| `ProductName`   | Optional display name                 |
| `Quantity`      | Requested quantity                    |
| `UnitCode`      | Optional unit of measure              |
| `RemarkText`    | Product-specific note                 |
| `CreatedAt`     | Audit timestamp                       |
| `UpdatedAt`     | Audit timestamp                       |

Unique key: `(OrderHeaderId, LineNumber)`

### `dbo.OrderHeaderDocument`

| Column                  | Notes                                 |
| ----------------------- | ------------------------------------- |
| `OrderHeaderDocumentId` | PK                                    |
| `OrderHeaderId`         | FK to `dbo.OrderHeader.OrderHeaderId` |
| `DocumentTypeCode`      | Document type                         |
| `FileName`              | File name                             |
| `StorageUrl`            | Storage location                      |
| `DataUrl`               | Optional inline payload               |
| `UploadedByUserName`    | Username of uploader                  |
| `UploadedAt`            | Audit timestamp                       |

Unique key: `(OrderHeaderId, DocumentTypeCode)`

### `dbo.OrderLineDocument`

Optional table only if the next project later needs product-line-specific
attachments.

| Column                | Notes                             |
| --------------------- | --------------------------------- |
| `OrderLineDocumentId` | PK                                |
| `OrderLineId`         | FK to `dbo.OrderLine.OrderLineId` |
| `DocumentTypeCode`    | Document type                     |
| `FileName`            | File name                         |
| `StorageUrl`          | Storage location                  |
| `UploadedByUserName`  | Username of uploader              |
| `UploadedAt`          | Audit timestamp                   |

## Workflow Permission Tables

### `dbo.HeaderActionPermission`

| Column                      | Notes                     |
| --------------------------- | ------------------------- |
| `HeaderActionCode`          | Part of logical key       |
| `FromOrderHeaderStatusCode` | Part of logical key       |
| `ToOrderHeaderStatusCode`   | Target status             |
| `AllowedUserGroupCode`      | One row per allowed group |

### `dbo.HeaderPermissionPreset`

| Column                     | Notes                      |
| -------------------------- | -------------------------- |
| `HeaderPermissionPresetId` | PK                         |
| `PresetName`               | Unique preset name         |
| `IsSystemPreset`           | True for STANDARD / STRICT |
| `CreatedAt`                | Audit timestamp            |
| `UpdatedAt`                | Audit timestamp            |

### `dbo.HeaderPermissionPresetRule`

| Column                      | Notes              |
| --------------------------- | ------------------ |
| `HeaderPermissionPresetId`  | FK to preset table |
| `HeaderActionCode`          | Rule action        |
| `FromOrderHeaderStatusCode` | Source status      |
| `ToOrderHeaderStatusCode`   | Target status      |
| `AllowedUserGroupCode`      | Allowed group      |

### `dbo.AppSetting`

| Column             | Notes                    |
| ------------------ | ------------------------ |
| `SettingKey`       | PK                       |
| `SettingValueJson` | Serialized setting value |

## Audit And Communication Tables

### `dbo.IntegrationLog`

| Column                  | Notes                                 |
| ----------------------- | ------------------------------------- |
| `IntegrationLogId`      | PK                                    |
| `OrderHeaderId`         | FK to `dbo.OrderHeader.OrderHeaderId` |
| `IntegrationTypeCode`   | Example: CRM                          |
| `IntegrationStatusCode` | Integration state                     |
| `MessageText`           | Log message                           |
| `OccurredAt`            | Event datetime                        |

### `dbo.NotificationLog`

| Column                 | Notes                                          |
| ---------------------- | ---------------------------------------------- |
| `NotificationLogId`    | PK                                             |
| `OrderHeaderId`        | Nullable FK to `dbo.OrderHeader.OrderHeaderId` |
| `MessageText`          | Notification body                              |
| `OccurredAt`           | Event datetime                                 |
| `TargetRoleCode`       | Target role                                    |
| `NotificationTypeCode` | `email` or `system`                            |
| `EventName`            | Workflow or edit event                         |

### `dbo.ActivityLog`

| Column                 | Notes                                          |
| ---------------------- | ---------------------------------------------- |
| `ActivityLogId`        | PK                                             |
| `OrderHeaderId`        | Nullable FK to `dbo.OrderHeader.OrderHeaderId` |
| `ActivityCategoryCode` | `WORKFLOW`, `EDIT`, `DOCUMENT`, etc            |
| `ActionName`           | Action label                                   |
| `ActorUserName`        | Actor username or system label                 |
| `OccurredAt`           | Event datetime                                 |
| `DetailText`           | Human-readable details                         |

## SQL Server-Specific Notes

- Avoid naming a datetime column `Timestamp` in SQL Server because `timestamp`
  is associated with `rowversion` semantics.
- If the next project adopts surrogate keys later, keep the current business
  identifiers as `...Code` or `PurchaseOrderNumber` columns with unique
  constraints.
- Keep `OrderHeader` and `OrderLine` separate because header status is the real
  source of workflow truth and child rows are product details only.

## Read Next

- For the current runtime object shape, read
  `requirements/domain/ORDER-STRUCTURE.md`.
- For the logical vendor-neutral design, read `database/DATABASE-SCHEMA.md`.
- For the concrete SQL Server Prisma reference, read
  `database/schema.sqlserver.prisma`.
- For concrete T-SQL `CREATE TABLE` statements, read
  `database/schema.sqlserver.ddl.sql`.
- For concrete master/template/preset seed inserts, read
  `database/seed.sqlserver.sql`.
