# Customer Web Portal MVP — Working Guide

> เอกสารสรุปภาพรวมระบบสำหรับใช้ทำงานต่อในทีม (Design + Flow + Business Rules)
> อ้างอิงจากโค้ดปัจจุบันในโปรเจกต์

---

## 1) Project Purpose

ระบบนี้เป็น Customer Web Portal สำหรับจัดการ **Order แบบ Header + Workflow
แบบราย Line** โดยกระบวนการหลักจะไหลตั้งแต่การสร้าง/ส่ง line
ไปจนถึงการปิดงานขนส่ง (Departed) พร้อมระบบสิทธิ์ผู้ใช้, เอกสาร, และ
activity/notification logs

---

## 2) Core Architecture (Current)

- Frontend: React + TypeScript + Vite
- State: Zustand (persist localStorage)
- Validation: react-hook-form + zod
- UI: Tailwind utility + shared typography classes + lucide icons
- Data mode: In-memory + persisted storage (ไม่มี backend จริงใน MVP)
- PDF: สร้างเอกสารจาก utility (data URL) แล้วดาวน์โหลด

**Source of truth หลัก**

- `types.ts`: enums/interfaces ของระบบ
- `store.ts`: business logic กลาง, permissions, state actions
- `pages/*`: flow/action จริงของแต่ละ role
- `utils/poPdf.ts`: generator เอกสาร PO + Shipping Instruction

---

## 3) Design Guidelines (Current Team Standard)

### 3.1 Typography & Layout Baseline

ใช้ utility classes กลางให้สม่ำเสมอ เช่น:

- `ui-page-title`, `ui-page-subtitle`
- `ui-section-title`, `ui-subheader`
- `ui-table-head`, `ui-table-standard`
- `ui-form-label`, `ui-form-helper`, `ui-form-error`
- `ui-kicker`, `ui-micro-text`

แนวทางนี้ช่วยให้ทุกหน้าสไตล์ตรงกันและปรับดีไซน์ทีเดียวได้ทั้งระบบ

### 3.2 UI Pattern ที่ใช้จริง

- หน้า workflow ใช้ card/table แบบอ่านเร็ว + action ชัดเจน
- Action สำคัญใช้ confirm dialog ทุกครั้ง
- Input validation แสดง error ใต้ฟิลด์
- สีสถานะคงที่ตาม line status
- รองรับ dark mode

### 3.3 Design Backlog (ภายหลัง)

จุดที่สามารถปรับต่อได้โดยไม่กระทบ business logic:

- spacing/typography ราย section
- visual hierarchy ของ dashboard cards
- consistency ของ card/table density
- PDF visual polish (ระยะ, alignment, typo)

---

## 4) Domain Model Snapshot

### 4.1 Roles & User Groups

Roles:

- `ADMIN`, `MAIN_TRADER`, `UBE_JAPAN`, `SALE`, `CS`

UserGroup:

- `TRADER`, `UBE`, `SALE`, `CS`, `ADMIN`

### 4.2 Line Status

- `DRAFT`
- `CREATED`
- `APPROVED`
- `VESSEL_SCHEDULED`
- `RECEIVED_ACTUAL_PO`
- `VESSEL_DEPARTED`

### 4.3 Order Progress

- `CREATE`: ทุก line ยังเป็น DRAFT
- `IN_PROGRESS`: มี line เดิน flow แล้วแต่ยังไม่ครบ
- `COMPLETE`: ทุก line เป็น VESSEL_DEPARTED

### 4.4 Document Types

- `Shipping Document`
- `BL`
- `Invoice`
- `COA`
- `PO_PDF`
- `SHIPPING_INSTRUCTION_PDF`

---

## 5) Workflow (Line-Based)

> ทุก action ทำที่ระดับ line ไม่ใช่ทั้ง order

### Step A — Submit Line

- From: `DRAFT`
- To: `CREATED`
- Action: `SUBMIT_LINE`
- เงื่อนไขหลัก: เลือก line ที่ submit และมีสิทธิ์ตาม permission matrix

### Step B — Sale Approve

- From: `CREATED`
- To: `APPROVED`
- Action: `APPROVE_LINE`
- เงื่อนไขหลัก:
  - ต้องมีราคา (`price > 0`)
  - currency/sale note บันทึกที่ระดับ line
- ผลลัพธ์:
  - line ถูกย้ายเป็น APPROVED
  - สร้าง integration log + quotation callback simulation

### Step C — Set ETD

- From: `APPROVED`
- To: `VESSEL_SCHEDULED`
- Action: `SET_ETD`
- เงื่อนไขหลัก: ต้องกรอก `actualETD`

### Step D — Generate Official Docs

- From: `VESSEL_SCHEDULED`
- To: `RECEIVED_ACTUAL_PO`
- Action: `MARK_RECEIVED_PO`
- เงื่อนไขหลัก: ผู้ใช้ต้องมีสิทธิ์ action ตาม matrix
- ผลลัพธ์:
  - สร้างเอกสาร 2 ไฟล์อัตโนมัติ
    - PO PDF
    - Shipping Instruction PDF
  - แนบลง documents ของ line
  - trigger download ให้ผู้ใช้ (ตามสิทธิ์ document type)

### Step E — Upload Final Docs / Complete

- From: `RECEIVED_ACTUAL_PO`
- To: `VESSEL_DEPARTED`
- Action: `UPLOAD_FINAL_DOCS`
- เงื่อนไขหลัก:
  - ก่อน complete ต้องมีอย่างน้อย
    - `Shipping Document`
    - `BL`
- รองรับ Save Draft แบบหลายไฟล์ แยกตาม document type

---

## 6) Permission & Access Rules

### 6.1 Line Action Permission

ระบบยึด `linePermissionMatrix` เป็นศูนย์กลาง

- มี preset: `STANDARD`, `STRICT`
- Admin ปรับ matrix ได้
- รองรับ custom presets + lock matrix

### 6.2 Data Visibility

ผู้ใช้เห็น order/line เฉพาะที่ผ่านทั้ง 2 เงื่อนไข:

1. `companyId` ตรงกับผู้ใช้ (ยกเว้น ADMIN)
2. ship-to อยู่ใน scope (`ALL` หรืออยู่ใน `allowedShipToIds`)

### 6.3 Document Access

- ผู้ใช้ดาวน์โหลดได้เฉพาะ document types ที่อยู่ใน `allowedDocumentTypes`
- ADMIN เข้าถึงได้ทุกชนิด
- ประเภทที่ระบบ generate อัตโนมัติ (`PO_PDF`, `SHIPPING_INSTRUCTION_PDF`)
  ไม่อยู่ใน list อัปโหลดมือ

---

## 7) Page-by-Page Responsibility

### Dashboard

- แสดง summary line status
- แสดง recent orders ตาม scope ผู้ใช้
- Urgent lines: only ASAP + ETA ใกล้ถึงกำหนด
- **ไม่แสดง line ที่ `VESSEL_DEPARTED` ใน urgent**

### Orders / Create Order

- สร้างและแก้ไข order + line items
- validate ด้วย zod
- line ที่เลย DRAFT ถูกล็อกไม่ให้แก้
- submit ได้เฉพาะ line ที่เลือก

### Sale Review

- ดึงเฉพาะ lines สถานะ `CREATED` ที่ผู้ใช้มีสิทธิ์ approve
- บังคับ price ก่อน approve
- บันทึก currency/sale note
- มี integration logs และ callback simulation

### CS Dashboard

- Stage 1: ตั้ง ETD ให้ lines ที่ APPROVED
- Stage 2: จัดการ final docs สำหรับ lines ที่ RECEIVED_ACTUAL_PO
- UI เป็น card-based สำหรับ shipping finalization
- รองรับ multi-file draft upload ต่อ line
- complete line ได้เมื่อมี Shipping Doc + BL ครบ

### Order Detail

- มุมมอง workflow ครบจบในหน้าเดียว
- timeline + action zone ตาม status ปัจจุบัน
- ไม่มีปุ่ม action เมื่อ line ไม่มี action ที่ทำได้
- action `Generate PO & Mark Received` จะสร้าง PO + SI ทั้งคู่

### Admin / Master Data / Logs

- Admin: users, permissions, line matrix presets
- Master Data: destinations/terms/grades/shipTos/groupSaleTypes
- Logs: ติดตาม integration / activity / notifications

---

## 8) PDF Generation Notes (Current)

### PO PDF

- จัด layout แบบ official PO
- มีการ clamp/fitting บาง field เพื่อกัน text overflow

### Shipping Instruction PDF

- สร้างคู่กับ PO ตอน Step D
- โครงฟอร์มมาจาก reference ล่าสุด
- กล่อง/กรอบที่ผู้ใช้รีวิวล่าสุดถูกลบตาม requirement

---

## 9) Key Business Rules (Quick Checklist)

- [ ] Price ต้องมากกว่า 0 ก่อน approve line
- [ ] Actual ETD ต้องมี ก่อน mark vessel scheduled
- [ ] ต้องมี Shipping Document + BL ก่อน complete line
- [ ] Urgent dashboard ไม่รวม departed lines
- [ ] Action ทั้งหมดต้องผ่าน canUserRunLineAction
- [ ] Document download ต้องผ่าน allowedDocumentTypes
- [ ] status label แสดงผลแบบอ่านง่าย (ไม่มี underscore)

---

## 10) Change Safety Checklist (ก่อน merge ทุกครั้ง)

1. Flow check
   - ทดสอบ transition ทุก status อย่างน้อย 1 เส้นทาง
2. Permission check
   - เทียบผลลัพธ์ระหว่าง ADMIN กับ non-admin อย่างน้อย 1 role
3. Document check
   - upload/download ได้ตาม document permission
4. UI consistency
   - ใช้ typography classes กลาง
5. Build check
   - `npm run build` ผ่าน

---

## 11) Suggested Next Documentation (Optional)

ถ้าจะต่อยอดเอกสารให้ทีมใช้งานระยะยาว แนะนำเพิ่ม:

- Sequence diagram ของ line workflow
- RBAC matrix แบบตาราง (Role x Action x Status)
- Regression test checklist ต่อหน้า
- PDF template spec (ตำแหน่ง field แบบพิกัด)

---

Last updated: 18-Feb-2026 Owner: Project team (living document)
