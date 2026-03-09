---
applyTo: "**/orders/**,**/review/**,**/cs/**,**/store/**"
---

# SKILL: Order Workflow & Permission System

> ใช้ skill นี้เมื่อสร้างหรือแก้ไขส่วนที่เกี่ยวกับ order workflow, line actions,
> permission matrix, หรือ CS/Sale pages

---

## Core Concept: Line-Level Workflow

**ทุก action ทำที่ระดับ line ไม่ใช่ทั้ง order**

- 1 Order มีหลาย `OrderItem` (lines)
- แต่ละ line มี `status: OrderLineStatus` แยกกัน
- `OrderProgressStatus` ของ order **คำนวณมาจาก lines เสมอ** (derived, ไม่ได้เก็บ)

```ts
// ตัวอย่าง: คำนวณ order status จาก lines
const deriveOrderProgressStatus = (items: OrderItem[]): OrderProgressStatus => {
  if (items.length === 0) return OrderProgressStatus.CREATE;
  if (items.every(i => i.status === OrderLineStatus.VESSEL_DEPARTED)) return OrderProgressStatus.COMPLETE;
  if (items.every(i => i.status === OrderLineStatus.DRAFT)) return OrderProgressStatus.CREATE;
  return OrderProgressStatus.IN_PROGRESS;
};
```

---

## Line Status Transition Map

```
DRAFT
  └─[SUBMIT_LINE]──────────▶ CREATED
       └─[UBE_APPROVE_LINE]─▶ UBE_APPROVED
            └─[APPROVE_LINE]─▶ APPROVED
                 └─[SET_ETD]──▶ VESSEL_SCHEDULED
                      └─[MARK_RECEIVED_PO]──▶ RECEIVED_ACTUAL_PO
                           └─[UPLOAD_FINAL_DOCS]──▶ VESSEL_DEPARTED
```

---

## Permission Check Pattern

**ใช้ `canUserRunLineAction()` เสมอก่อนทุก action**

```ts
// store/selectors.ts
export const canUserRunLineAction = (
  user: User | null,
  lineStatus: OrderLineStatus,
  action: LineAction,
  matrix: LineActionPermission[]
): boolean => {
  if (!user) return false;
  if (user.role === Role.ADMIN) return true; // ADMIN bypasses all

  const permission = matrix.find(
    p => p.action === action && p.fromStatus === lineStatus
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
export const getVisibleOrdersForUser = (orders: Order[], user: User | null): Order[] => {
  if (!user) return [];
  if (user.role === Role.ADMIN) return orders;

  return orders
    .map(order => {
      if (order.companyId !== user.companyId) return null;

      const visibleItems = order.items.filter(item =>
        canUserAccessShipTo(user, item.shipToId)
      );

      if (visibleItems.length === 0) return null;

      return {
        ...order,
        items: visibleItems,
        status: deriveOrderProgressStatus(visibleItems)
      };
    })
    .filter((order): order is Order => Boolean(order));
};

export const canUserAccessShipTo = (user: User, shipToId: string): boolean => {
  if (user.role === Role.ADMIN) return true;
  if (user.shipToAccess === 'ALL') return true;
  return user.allowedShipToIds.includes(shipToId);
};
```

---

## Implementing a Line Action (Template)

เมื่อ implement action handler ใดๆ ให้ทำตาม pattern นี้:

```tsx
const handleActionName = async (line: OrderItem) => {
  // 1. Permission check
  if (!canUserRunLineAction(currentUser, line.status, LineAction.ACTION_NAME, matrix)) {
    swal.fire('Error', 'Permission denied', 'error');
    return;
  }

  // 2. Pre-condition validation (ถ้ามี)
  if (!line.price || line.price <= 0) {
    swal.fire('Error', 'Price is required', 'warning');
    return;
  }

  // 3. Confirm dialog
  const result = await swal.fire({
    title: 'Confirm Action?',
    text: 'Are you sure?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Yes, proceed',
  });
  if (!result.isConfirmed) return;

  // 4. Execute update
  updateOrderLine(orderNo, line.id, {
    status: OrderLineStatus.NEXT_STATUS,
  });

  // 5. Activity log
  addActivity('ACTION_NAME', currentUser!.username, `Line ${line.poNo} actioned`);

  // 6. Notification (if applicable)
  addNotification(`...message...`, Role.TARGET_ROLE, 'email');

  // 7. Success feedback
  swal.fire('Done', 'Action completed', 'success');
};
```

---

## Sale Approval with CRM Simulation

Sale Approve มี async steps เพิ่มเติม:

```tsx
const handleApprove = async (line: OrderItem) => {
  // ... checks + confirm ...

  // Show loading
  swal.fire({ title: 'Contacting CRM...', allowOutsideClick: false, didOpen: () => swal.showLoading() });

  // Step 1: CRM API call simulation (2s)
  addIntegrationLog({ orderNo, status: 'PENDING', message: 'Sending to CRM...' });
  await new Promise(resolve => setTimeout(resolve, 2000));

  addIntegrationLog({ orderNo, status: 'SUCCESS', message: 'CRM acknowledged' });
  updateOrderLine(orderNo, line.id, { status: OrderLineStatus.APPROVED });

  swal.close();

  // Step 2: CRM callback simulation (5s async — does NOT block UI)
  setTimeout(() => {
    const quotationNo = `QT-${Date.now()}`;
    updateOrder(orderNo, { quotationNo });
    addActivity('CRM_CALLBACK', 'CRM System', `Quotation ${quotationNo} assigned`);
    addNotification(`Quotation ${quotationNo} is ready`, Role.MAIN_TRADER, 'email');
  }, 5000);
};
```

---

## CS Dashboard Stages

CS page splits into 2 stages based on line status:

**Stage 1 — Set ETD** (lines with status `APPROVED`):
- Input: `actualETD` date
- Action: `SET_ETD` → `VESSEL_SCHEDULED`

**Stage 2 — Upload & Complete** (lines with status `RECEIVED_ACTUAL_PO`):
- Input: file + documentType selector
- Save draft: add to temp upload state (not yet committed)
- Complete: commit uploads + check requirements + `UPLOAD_FINAL_DOCS` → `VESSEL_DEPARTED`
- **Pre-condition**: must have both `SHIPPING_DOC` and `BL` in documents

---

## Permission Matrix (Admin Page)

Admin can modify `linePermissionMatrix` which is `LineActionPermission[]`:

```ts
interface LineActionPermission {
  action: LineAction;
  fromStatus: OrderLineStatus;
  toStatus: OrderLineStatus;
  allowedUserGroups: UserGroup[]; // checkboxes in Admin UI
}
```

Features to implement:
- Display as table (action + from/to status + group checkboxes)
- Lock/Unlock: when locked, hide edit controls
- Apply STANDARD / STRICT preset (replace entire matrix)
- Save current as named preset (add to `linePermissionCustomPresets`)
- Load custom preset (replace entire matrix)
- Reset to STANDARD

---

## Generate PO Action (MARK_RECEIVED_PO)

```tsx
const handleGeneratePO = async (line: OrderItem) => {
  // ... permission check + confirm ...

  // Generate PDFs (client-side)
  const poPdfDataUrl = generatePoPdf(order, line, company);
  const siPdfDataUrl = generateShippingInstructionPdf(order, line, company);

  // Attach to line documents
  const poPdfDoc: OrderDocument = {
    id: nanoid(),
    type: DocumentType.PO_PDF,
    filename: `PO-${line.poNo}.pdf`,
    dataUrl: poPdfDataUrl,
    uploadedBy: 'SYSTEM',
    uploadedAt: new Date().toISOString(),
  };
  const siDoc: OrderDocument = { /* same pattern for SI */ };

  updateOrderLine(orderNo, line.id, {
    status: OrderLineStatus.RECEIVED_ACTUAL_PO,
    documents: [...line.documents, poPdfDoc, siDoc],
  });

  // Trigger browser downloads
  triggerDownload(poPdfDataUrl, `PO-${line.poNo}.pdf`);
  triggerDownload(siPdfDataUrl, `SI-${line.poNo}.pdf`);

  addActivity('MARK_RECEIVED_PO', currentUser!.username, `PO generated for ${line.poNo}`);
};
```

---

## Document Download Guard

Always check permission before rendering download button:

```tsx
{doc.type !== DocumentType.PO_PDF || currentUser?.allowedDocumentTypes.includes(doc.type)
  ? (
    <button onClick={() => triggerDownload(doc.dataUrl, doc.filename)}>
      Download
    </button>
  ) : null
}

// Simpler helper:
const canDownload = (user: User | null, docType: DocumentType): boolean => {
  if (!user) return false;
  if (user.role === Role.ADMIN) return true;
  return user.allowedDocumentTypes.includes(docType);
};
```
