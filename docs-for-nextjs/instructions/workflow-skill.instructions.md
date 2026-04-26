---
applyTo: '**/orders/**,**/store/**'
---

# SKILL: Order Workflow & Permission System

> ใช้ skill นี้เมื่อสร้างหรือแก้ไขส่วนที่เกี่ยวกับ order workflow, header
> actions, permission matrix, หรือ unified Orders workspace

> Scope note: ไฟล์นี้ตั้งใจครอบคลุมเฉพาะงาน workflow/order/store เท่านั้น ไม่ใช่
> source of truth สำหรับทุกเมนูในระบบ หากต้องการดู logic แบบ menu-by-menu
> ให้เริ่มจาก `README.md`, `requirements/pages/MENU-FLOWS.md`, และ
> `requirements/pages/ORDERS-WORKSPACE.md`

---

## Core Concept: Header-Level Workflow

**ทุก action ทำที่ระดับ header โดย 1 header = 1 PO**

- 1 Header มีหลาย `OrderProductLine`
- status อยู่ที่ `OrderHeaderStatus` ของ header
- product lines ไม่มี workflow status แยก

```ts
type OrderHeader = {
  id: string;
  poNo: string;
  shipToId: string;
  status: OrderHeaderStatus;
  items: OrderProductLine[];
};
```

---

## Header Status Transition Map

```
DRAFT
  └─[SUBMIT_LINE]──────────▶ CREATED
    └─[APPROVE_LINE]────▶ APPROVED
      └─[SET_ETD]────▶ WAIT_SALE_UEC_APPROVE_PO
        └─[APPROVE_SALE_PO]──▶ WAIT_MGR_UEC_APPROVE_PO
          └─[APPROVE_MGR_PO]──▶ VESSEL_SCHEDULED
            └─[UPLOAD_FINAL_DOCS]──▶ VESSEL_DEPARTED
```

---

## Permission Check Pattern

**ใช้ `canUserRunHeaderAction()` เสมอก่อนทุก action**

```ts
// store/selectors.ts
export const canUserRunHeaderAction = (
  user: User | null,
  headerStatus: OrderHeaderStatus,
  action: HeaderAction,
  matrix: HeaderActionPermission[]
): boolean => {
  if (!user) return false;
  if (user.role === Role.ADMIN) return true; // ADMIN bypasses all

  const permission = matrix.find(
    (p) => p.action === action && p.fromStatus === headerStatus
  );
  if (!permission) return false;

  return permission.allowedUserGroups.includes(user.userGroup);
};
```

**ห้ามข้ามการเช็คนี้ ไม่ว่ากรณีใด**

---

## Data Visibility Pattern

**ใช้ `getVisibleOrdersForUser()` ก่อนแสดงผล orders ทุกครั้ง**

```ts
export const getVisibleOrdersForUser = (
  orders: OrderHeader[],
  user: User | null
): OrderHeader[] => {
  if (!user) return [];
  if (user.role === Role.ADMIN) return orders;

  return orders.filter((order) => canUserAccessShipTo(user, order.shipToId));
};

export const canUserAccessShipTo = (user: User, shipToId: string): boolean => {
  if (user.role === Role.ADMIN) return true;
  if (user.shipToAccess === 'ALL') return true;
  return user.allowedShipToIds.includes(shipToId);
};
```

---

## Implementing a Header Action (Template)

เมื่อ implement action handler ใดๆ ให้ทำตาม pattern นี้:

```tsx
const handleActionName = async (header: OrderHeader) => {
  // 1. Permission check
  if (
    !canUserRunHeaderAction(
      currentUser,
      header.status,
      HeaderAction.ACTION_NAME,
      matrix
    )
  ) {
    swal.fire('Error', 'Permission denied', 'error');
    return;
  }

  // 2. Pre-condition validation (ถ้ามี)
  if (!header.price || header.price <= 0) {
    swal.fire('Error', 'Price is required', 'warning');
    return;
  }

  // 3. Confirm dialog
  const result = await swal.fire({
    title: 'Confirm Action?',
    text: 'Are you sure?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Yes, proceed'
  });
  if (!result.isConfirmed) return;

  // 4. Execute update
  updateOrderHeader(header.id, {
    status: OrderHeaderStatus.NEXT_STATUS
  });

  // 5. Activity log
  addActivity(
    'ACTION_NAME',
    currentUser!.username,
    `PO ${header.poNo} actioned`
  );

  // 6. Notification (if applicable)
  addNotification(`...message...`, Role.TARGET_ROLE, 'email');

  // 7. Success feedback
  swal.fire('Done', 'Action completed', 'success');
};
```

---

## Sale Approval with CRM Simulation

Sale Approve ใน implementation ปัจจุบันเป็น async round-trip เดียว:

```tsx
const handleApprove = async (header: OrderHeader) => {
  // ... checks + confirm ...

  addIntegrationLog({
    orderId: header.id,
    integrationType: 'CRM',
    status: 'PENDING',
    message: `[PO ${header.poNo}] Sending approved header to CRM...`
  });

  await new Promise((resolve) => setTimeout(resolve, 1800));

  const quotationNo = `QT-${Math.floor(100000 + Math.random() * 900000)}`;

  updateOrderHeader(header.id, {
    status: OrderHeaderStatus.APPROVED,
    quotationNo
  });

  addIntegrationLog({
    orderId: header.id,
    integrationType: 'CRM',
    status: 'SUCCESS',
    message: `[PO ${header.poNo}] CRM callback success. Quotation: ${quotationNo}`
  });
  addActivity(
    'CRM Callback (header)',
    'CRM System',
    `${header.poNo} / ${quotationNo}`
  );
  addNotification(
    `CRM created quotation ${quotationNo} for ${header.poNo}.`,
    Role.CS,
    'email'
  );
};
```

---

## CS Dashboard Stages

CS page splits into 2 stages based on header status:

**Stage 1 — Set ETD** (headers with status `APPROVED`):

- Input: `actualETD` date
- Action: open `PdfGenerationModal`, generate PO/SI PDFs, auto-download if
  permitted, then `SET_ETD` → `WAIT_SALE_UEC_APPROVE_PO`

**Stage 2 — Upload & Complete** (headers with status `VESSEL_SCHEDULED`):

- Input: file + documentType selector
- Save draft: add to temp upload state (not yet committed)
- Complete: commit uploads + check requirements + `UPLOAD_FINAL_DOCS` →
  `VESSEL_DEPARTED`
- **Pre-condition**: must have both `SHIPPING_DOC` and `BL` in documents

---

## Permission Matrix (Admin Page)

Admin can modify `headerPermissionMatrix` which is `HeaderActionPermission[]`:

```ts
interface HeaderActionPermission {
  action: HeaderAction;
  fromStatus: OrderHeaderStatus;
  toStatus: OrderHeaderStatus;
  allowedUserGroups: UserGroup[]; // checkboxes in Admin UI
}
```

Features to implement:

- Display as table (action + from/to status + group checkboxes)
- Lock/Unlock: when locked, hide edit controls
- Apply STANDARD / STRICT preset (replace entire matrix)
- Save current as named preset (add to `headerPermissionCustomPresets`)
- Load custom preset (replace entire matrix)
- Reset to STANDARD

---

## Set ETD + Generate PO/SI Action

```tsx
const handleSetEtd = async (header: OrderHeader, actualETD: string) => {
  // ... permission check + confirm ...

  // Generate PDFs (client-side)
  const poPdfDataUrl = createOfficialPoPdfDataUrl(poInput);
  const siPdfDataUrl = createShippingInstructionPdfDataUrl(siInput);

  // Attach to header documents
  const poPdfDoc: OrderDocument = {
    id: `doc-${Math.random().toString(36).slice(2, 8)}`,
    type: DocumentType.PO_PDF,
    filename: `PO-${header.poNo}.pdf`,
    dataUrl: poPdfDataUrl,
    uploadedBy: 'SYSTEM',
    uploadedAt: new Date().toISOString()
  };
  const siDoc: OrderDocument = {
    /* same pattern for SI */
  };

  updateOrderHeader(header.id, {
    actualETD,
    status: OrderHeaderStatus.WAIT_SALE_UEC_APPROVE_PO,
    documents: [...header.documents, poPdfDoc, siDoc]
  });

  // Trigger browser downloads
  triggerDownload(poPdfDataUrl, `PO-${header.poNo}.pdf`);
  triggerDownload(siPdfDataUrl, `SI-${header.poNo}.pdf`);

  addActivity('Set ETD (header)', currentUser!.username, `${header.poNo}`);
};
```

---

## Document Download Guard

Always check permission before rendering download button:

```tsx
{
  doc.type !== DocumentType.PO_PDF ||
  currentUser?.allowedDocumentTypes.includes(doc.type) ? (
    <button onClick={() => triggerDownload(doc.dataUrl, doc.filename)}>
      Download
    </button>
  ) : null;
}

// Simpler helper:
const canDownload = (user: User | null, docType: DocumentType): boolean => {
  if (!user) return false;
  if (user.role === Role.ADMIN) return true;
  return user.allowedDocumentTypes.includes(docType);
};
```
