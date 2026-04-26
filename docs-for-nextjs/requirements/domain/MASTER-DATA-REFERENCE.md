# Master Data Reference

This file defines the master data domains that must exist in the target project.
It is intended to be the AI-friendly source of truth for:

- master data schema
- master data ownership
- relationships between masters
- where each master is used in the workflow

## Scope

In the current MVP, master data is split across two top-level areas:

- `companies`
- `masterData` bundle in the Zustand store

For a future backend project, treat both as part of the same master-data
requirement set.

## Master Data Domains

| Domain             | Current Type          | Primary Key | Purpose                                               |
| ------------------ | --------------------- | ----------- | ----------------------------------------------------- |
| Customer Companies | `CustomerCompany`     | `id`        | Company ownership for users and orders                |
| Group Sale Types   | `GroupSaleTypeRecord` | `id`        | Ship-to classification such as Overseas or Domestic   |
| Destinations       | `MasterDataRecord`    | `id`        | Destination choices per line and per ship-to mapping  |
| Terms              | `MasterDataRecord`    | `id`        | Shipping/commercial terms used per line               |
| Grades             | `MasterDataRecord`    | `id`        | Product grade choices used per line                   |
| Ship-Tos           | `ShipToRecord`        | `id`        | Available ship-to entities selectable per line        |
| PO Templates       | `PoTemplate`          | `id`        | Default PO PDF content keyed by ship-to               |
| SI Templates       | `SiTemplate`          | `id`        | Default Shipping Instruction content keyed by ship-to |

## Core Interfaces

### CustomerCompany

| Field  | Type   | Required | Notes                                             |
| ------ | ------ | -------- | ------------------------------------------------- |
| `id`   | string | Yes      | Stable company code such as `C001` or `AG-UBE-JP` |
| `name` | string | Yes      | Human-readable company name                       |

### MasterDataRecord

| Field  | Type   | Required | Notes                                    |
| ------ | ------ | -------- | ---------------------------------------- |
| `id`   | string | Yes      | Stable code used by forms and references |
| `name` | string | Yes      | Human-readable label                     |

### GroupSaleTypeRecord

| Field  | Type                     | Required | Notes                  |
| ------ | ------------------------ | -------- | ---------------------- |
| `id`   | `OVERSEAS` or `DOMESTIC` | Yes      | Enum-backed identifier |
| `name` | string                   | Yes      | Display label          |

### ShipToRecord

| Field            | Type            | Required | Notes                                 |
| ---------------- | --------------- | -------- | ------------------------------------- |
| `id`             | string          | Yes      | Stable ship-to code                   |
| `name`           | string          | Yes      | Display name                          |
| `groupSaleType`  | `GroupSaleType` | Yes      | Categorization of ship-to             |
| `destinationIds` | string[]        | Yes      | Allowed destinations for this ship-to |

### PoTemplate

| Field                 | Type            | Required | Notes                               |
| --------------------- | --------------- | -------- | ----------------------------------- |
| `id`                  | string          | Yes      | Internal template identifier        |
| `shipToId`            | string          | Yes      | One template set per ship-to        |
| `toBlock`             | text            | Yes      | Multi-line TO block                 |
| `consigneeNotify`     | text            | Yes      | Multi-line consignee / notify block |
| `agent`               | text            | No       | Agent text block                    |
| `endUser`             | text            | No       | End-user text block                 |
| `termsOfPayment`      | text            | No       | Payment terms                       |
| `packingInstructions` | text            | No       | Packing instruction text            |
| `confirmBy`           | text            | No       | Multi-line signatory block          |
| `createdAt`           | datetime string | Yes      | Audit field                         |
| `updatedAt`           | datetime string | Yes      | Audit field                         |

### SiTemplate

`SiTemplate` is intentionally richer because the PDF output varies by ship-to.
All fields below are part of the requirement set even if some ship-to patterns
use only a subset.

| Field                | Type            | Required | Notes                              |
| -------------------- | --------------- | -------- | ---------------------------------- |
| `id`                 | string          | Yes      | Internal template identifier       |
| `shipToId`           | string          | Yes      | One SI template per ship-to        |
| `attn`               | text            | No       | ATTN block                         |
| `from`               | text            | No       | FROM block                         |
| `poNumberHeader`     | text            | No       | Header label for PO reference      |
| `no2Header`          | text            | No       | Optional second reference label    |
| `no2`                | text            | No       | Optional second reference value    |
| `materialCodeHeader` | text            | No       | Material code label                |
| `materialCode`       | text            | No       | Material code value                |
| `noteUnderMaterial`  | text            | No       | Note displayed under material code |
| `user`               | text            | No       | User label/value                   |
| `country`            | text            | No       | Country label/value                |
| `shipper`            | text            | No       | Shipper block                      |
| `feederVessel`       | text            | No       | Default feeder vessel              |
| `motherVessel`       | text            | No       | Default mother vessel              |
| `vesselCompany`      | text            | No       | Vessel company                     |
| `forwarder`          | text            | No       | Forwarder                          |
| `portOfLoading`      | text            | No       | Port of loading                    |
| `consignee`          | text            | No       | Multi-line consignee block         |
| `blType`             | text            | No       | BL type                            |
| `freeTime`           | text            | No       | Free time                          |
| `courierAddress`     | text            | No       | Courier address                    |
| `eoriNo`             | text            | No       | EORI number                        |
| `bookingNo`          | text            | No       | Booking reference                  |
| `notifyParty`        | text            | No       | Notify party                       |
| `alsoNotify1`        | text            | No       | Additional notify line 1           |
| `alsoNotify2`        | text            | No       | Additional notify line 2           |
| `deliverTo`          | text            | No       | Deliver-to block                   |
| `requirements`       | text            | No       | Requirements block                 |
| `note`               | text            | No       | General note line 1                |
| `note2`              | text            | No       | General note line 2                |
| `note3`              | text            | No       | General note line 3                |
| `description`        | text            | No       | Description section                |
| `underDescription`   | text            | No       | Text below description             |
| `shippingMark`       | text            | No       | Multi-line shipping mark           |
| `belowSignature`     | text            | No       | Signature footer note              |
| `createdAt`          | datetime string | Yes      | Audit field                        |
| `updatedAt`          | datetime string | Yes      | Audit field                        |

## Relationships

### Master-to-master relationships

- `ShipToRecord.groupSaleType -> GroupSaleTypeRecord.id`
- `ShipToRecord.destinationIds[] -> Destinations.id`
- `PoTemplate.shipToId -> ShipToRecord.id`
- `SiTemplate.shipToId -> ShipToRecord.id`

### Master-to-transaction relationships

- `User.companyId -> CustomerCompany.id`
- `User.allowedShipToIds[] -> ShipToRecord.id`
- `Order.companyId -> CustomerCompany.id`
- `OrderItem.shipToId -> ShipToRecord.id`
- `OrderItem.destinationId -> Destinations.id`
- `OrderItem.termId -> Terms.id`
- `OrderItem.gradeId -> Grades.id`

## Usage By Feature

| Feature                  | Masters Used                                                       |
| ------------------------ | ------------------------------------------------------------------ |
| Login / user permissions | Companies, Ship-Tos, allowed document types                        |
| Create Order             | Ship-Tos, Destinations, Terms, Grades, Companies                   |
| Order Detail             | Ship-Tos, Destinations, Terms, Grades                              |
| CS Dashboard             | Ship-Tos, Grades, PO Templates, SI Templates                       |
| PDF Generation           | Ship-Tos, PO Templates, SI Templates, Destinations                 |
| Admin user management    | Companies, Ship-Tos                                                |
| Master Data page         | Companies, Group Sale Types, Destinations, Terms, Grades, Ship-Tos |
| PO/SI Templates page     | Ship-Tos, PO Templates, SI Templates                               |

## Validation Rules

### Companies

- `id` must be unique.
- `name` should be human-readable and stable.

### Group sale types

- Only enum-backed values are valid in the current MVP: `OVERSEAS`, `DOMESTIC`.

### Destinations, Terms, Grades

- Each record requires stable `id` and `name`.
- IDs are referenced by transactions, so they should not be changed casually.

### Ship-Tos

- `id` must be unique.
- `groupSaleType` is required.
- `destinationIds` may contain one or many destination references.
- Every destination id in `destinationIds` must exist in the destination master.

### PO/SI templates

- Each template must reference a valid `shipToId`.
- Recommended rule for backend implementation: one active PO template and one
  active SI template per ship-to.
- Template fields should be stored as multi-line text where line breaks matter
  for PDF rendering.

## Admin Ownership

All master data and templates are currently admin-maintained.

### Admin-managed CRUD surfaces

- `/master-data`
  - companies
  - group sale types
  - destinations
  - terms
  - grades
  - ship-tos
- `/po-si-templates`
  - PO templates
  - SI templates

## Seed Data Requirements

The target project should preserve the ability to seed the following datasets:

- companies
- group sale types
- destinations
- terms
- grades
- ship-tos
- PO templates
- SI templates
- default header permission presets

### Current canonical seed sources in this repo

These are the implementation sources currently holding the full seed payload:

- `INITIAL_COMPANIES` in `store.ts`
- `INITIAL_SHIP_TO_MAPPINGS` in `store.ts`
- `INITIAL_MASTER.groupSaleTypes` in `store.ts`
- `INITIAL_MASTER.destinations` in `store.ts`
- `INITIAL_MASTER.terms` in `store.ts`
- `INITIAL_MASTER.grades` in `store.ts`
- `INITIAL_MASTER.poTemplates` in `store.ts`
- `INITIAL_MASTER.siTemplates` in `store.ts`

If exact row-for-row seed parity is required in the next project, migrate from
those source constants directly in addition to following this reference.

For AI-friendly handoff or automated migration work, prefer the generated
`database/MASTER-DATA-SEED.json` artifact in this docs pack. It is produced
directly from the current `store.ts` seed constants by
`scripts/export_docs_seed.mjs`.

## Implementation Guidance For AI

- Keep master data tables normalized.
- Do not hardcode ship-to, destination, term, or grade labels directly into UI
  components.
- Treat template fields as content data, not code constants.
- Build forms so `destinationId` is filtered by the selected `shipToId`.
- Keep template storage editable by admins without code changes.

## Read Next

- For workflow rules, read `requirements/workflow/WORKFLOW-AND-PERMISSIONS.md`.
- For future backend table design, read `database/DATABASE-SCHEMA.md`.
- For exact seed payload transfer, read `database/MASTER-DATA-SEED.json`.
