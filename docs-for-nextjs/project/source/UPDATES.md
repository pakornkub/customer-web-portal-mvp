# System Updates & Improvements (Current Code Baseline)

## Overview

เอกสารฉบับนี้อัปเดตให้ตรงกับโค้ดปัจจุบันใน branch/workspace ณ ตอนนี้ โดยยึด
implementation จริงเป็นหลัก (ไม่อ้างสเปกเก่าที่ยังไม่ได้ merge)

---

## ✅ Current Implemented Scope

### 1) Role & Access Model

- ใช้ roles: `ADMIN`, `MAIN_TRADER`, `UBE_JAPAN`, `SALE`, `CS`
- ใช้ `UserGroup` แยกจาก Role เพื่อควบคุม permission ระดับ action
- มีการควบคุมสิทธิ์ `canCreateOrder`, `shipToAccess`, `allowedShipToIds`,
  `allowedDocumentTypes`

### 2) Workflow Engine (Line-based)

- ใช้สถานะแบบ line-level ผ่าน `OrderLineStatus`:
  - `DRAFT`, `CREATED`, `APPROVED`, `VESSEL_SCHEDULED`, `RECEIVED_ACTUAL_PO`,
    `VESSEL_DEPARTED`
- ใช้สถานะภาพรวม order ผ่าน `OrderProgressStatus`:
  - `CREATE`, `IN_PROGRESS`, `COMPLETE`
- มี matrix สำหรับกำหนดว่า user group ไหนทำ action ไหนได้
  - `SUBMIT_LINE`, `APPROVE_LINE`, `SET_ETD`, `MARK_RECEIVED_PO`,
    `UPLOAD_FINAL_DOCS`

### 3) Admin / Configuration (Current)

- หน้า `User Management` รองรับ:
  - เพิ่ม/ลบ user
  - แก้ไข profile user รายแถว (group, company, create-order flag, ship-to,
    document types)
  - ตั้งค่า line permission matrix
  - preset matrix: `STANDARD`, `STRICT`, และ custom presets
  - lock/unlock matrix และ reset matrix
- หน้า `Master Data` รองรับ:
  - `shipTos`, `groupSaleTypes`, `destinations`, `terms`, `grades`
  - add/delete record ตาม tab
  - ship-to ผูกกับ sale group
  - company scope แบบ multi-select

### 4) Store / State Management

- Zustand + persist (`ube-portal-storage-v4`)
- มีฟังก์ชันสำคัญ:
  - order visibility ตาม company + ship-to access
  - line action permission checks
  - scheduled checks แจ้งเตือนกรณี ASAP + ETA ใกล้ถึงกำหนด
  - activity log / integration log / notification log

---

## 📦 Current Data Model Snapshot

### User

```typescript
interface User {
  id: string;
  username: string;
  role: Role;
  userGroup: UserGroup;
  companyId: string;
  canCreateOrder: boolean;
  shipToAccess: 'ALL' | 'SELECTED';
  allowedShipToIds: string[];
  allowedDocumentTypes: DocumentType[];
}
```

### Order

```typescript
interface Order {
  orderNo: string;
  orderDate: string;
  note: string;
  status: OrderProgressStatus;
  companyId: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  documents: OrderDocument[];
}
```

### OrderItem

```typescript
interface OrderItem {
  id: string;
  poNo: string;
  shipToId: string;
  status: OrderLineStatus;
  destinationId: string;
  termId: string;
  requestETD: string;
  requestETA: string;
  gradeId: string;
  qty: number;
  price?: number;
  currency?: string;
  asap: boolean;
  documents: OrderDocument[];
}
```

---

## 🧪 Build & Health Status

- `npm run build` ผ่าน ณ วันที่อัปเดตเอกสาร
- ไม่มี TypeScript diagnostics จาก IDE ใน workspace ปัจจุบัน
- มี warning ที่ไม่บล็อก build:
  - `/index.css` resolve ตอน runtime
  - chunk size เกิน threshold ของ Vite

### UI Governance Update (Typography Standardization)

- เพิ่ม typography utility กลางใน `index.html` สำหรับ:
  - page title/subtitle
  - section/subheader
  - table head/body
  - form label/helper/error
  - micro text / kicker
- ปรับใช้ในหน้าหลักของระบบเพื่อให้เกิดความสอดคล้องข้ามหน้า (`Orders`,
  `CreateOrder`, `OrderDetail`, `Dashboard`, `SaleReview`, `CSDashboard`,
  `Admin`, `MasterData`, `Logs`, `Login`, `ClearData`)
- บันทึก guideline + checklist ใน `README.md` เพื่อใช้เป็นมาตรฐานทีม

---

## ⚠️ Known Divergences from Older Specs

- ไม่มี `SALE_MANAGER` ใน code baseline ปัจจุบัน
- ไม่ได้ใช้ `OrderStatus` แบบ legacy enum เดิม
- เอกสาร/flow เก่าที่อ้าง `customerCompanyId` เป็นหลัก ถูกแทนที่ด้วย `companyId`

> หากต้องการกลับไปใช้ spec เก่าแบบเต็ม (legacy status + SALE_MANAGER) ต้องมี
> compatibility migration อีกหนึ่งรอบ

---

## 📋 Requirement Mapping (Old Spec vs Current Code)

| Requirement (Old Spec)                                | Current Code Status | Notes                                                             |
| ----------------------------------------------------- | ------------------- | ----------------------------------------------------------------- |
| มี role `SALE_MANAGER`                                | ❌ Not implemented  | Roles ปัจจุบัน: `ADMIN`, `MAIN_TRADER`, `UBE_JAPAN`, `SALE`, `CS` |
| ใช้ `OrderStatus` (legacy status enum)                | ❌ Not implemented  | ใช้ `OrderProgressStatus` + `OrderLineStatus`                     |
| ใช้ `customerCompanyId` เป็น field หลักใน order/user  | ❌ Not implemented  | ใช้ `companyId` เป็นแกนหลัก                                       |
| Workflow แบบ line-level permission matrix             | ✅ Implemented      | มี `linePermissionMatrix` + presets + lock/unlock                 |
| Admin จัดการ matrix + custom presets                  | ✅ Implemented      | หน้า `User Management` รองรับครบตาม code baseline                 |
| Master Data รองรับ `groupSaleTypes` + `shipTos` scope | ✅ Implemented      | มี tab และการผูก `groupSaleType` ใน `shipTos`                     |
| รองรับ `shipToAccess` (`ALL`/`SELECTED`) ต่อ user     | ✅ Implemented      | ใช้ใน visibility และสิทธิ์การเข้าถึง order lines                  |
| Build ผ่านแบบไม่มี blocking errors                    | ✅ Implemented      | `npm run build` ผ่าน (มีเฉพาะ warnings ที่ไม่บล็อก)               |

---

## Next Steps (Optional)

- ปรับ UI ให้สอดคล้อง design reference ใหม่ โดยไม่กระทบ logic ปัจจุบัน
- เพิ่ม smoke-test checklist ราย role เพื่อใช้ regression หลังปรับดีไซน์
- ถ้าต้องการ strict spec parity: วางแผน migration กลับสู่ schema/spec เดิมเป็น
  phase แยก

---

## 🗂️ Old Version Change Log (Archived Reference)

ส่วนนี้เก็บไว้เป็นประวัติจากเอกสารรุ่นก่อนหน้า (legacy spec log)
เพื่อใช้อ้างอิงย้อนหลังเท่านั้น และ **ไม่ใช่ source of truth ของโค้ดปัจจุบัน**

### Legacy items previously recorded

- เคยระบุ role `SALE_MANAGER` และ user `salemgr1`
- เคยระบุการใช้ `OrderStatus` แบบ legacy (`CREATED`, `CONFIRMED`,
  `VESSEL_BOOKED`, `RECEIVED_PO`, `VESSEL_DEPARTED`)
- เคยระบุโมเดลที่ใช้ `customerCompanyId` เป็นหลัก
- เคยระบุ workflow 5-step แบบ status-driven (ไม่ใช่ line-permission-driven)

### Why this is archived

- โค้ด baseline ปัจจุบันเปลี่ยนสถาปัตยกรรมไปใช้ line-based workflow + permission
  matrix
- data model ปัจจุบันยึด `companyId` และ `OrderProgressStatus`/`OrderLineStatus`
- จึงเก็บ log เดิมไว้เพื่อ historical context เท่านั้น

---

**Last Updated:** February 16, 2026  
**Version:** 2.1.0 (code-aligned)  
**Status:** ✅ Build green / Document aligned to current implementation
