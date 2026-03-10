import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Send,
  Download,
  AlertCircle,
  FileEdit,
  BadgeCheck,
  CalendarCheck,
  FileText,
  Ship,
  FileWarning,
  CheckCircle2,
  Circle,
  ShieldCheck
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  useStore,
  canUserAccessShipTo,
  canUserRunLineAction,
  deriveOrderProgressStatus,
  getVisibleOrdersForUser
} from '../store';
import Swal from '../utils/swal';
import {
  createOfficialPoPdfDataUrl,
  createShippingInstructionPdfDataUrl
} from '../utils/poPdf';
import {
  LineAction,
  DocumentType,
  OrderLineStatus,
  OrderProgressStatus,
  Role,
  UserGroup
} from '../types';

export const OrderDetail: React.FC = () => {
  const { orderNo } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    orders,
    companies,
    currentUser,
    linePermissionMatrix,
    updateOrder,
    addActivity,
    addNotification
  } = useStore();

  const order = orders.find((item) => item.orderNo === orderNo);

  const canAccessOrder = useMemo(
    () =>
      Boolean(
        getVisibleOrdersForUser(orders, currentUser).find(
          (item) => item.orderNo === orderNo
        )
      ),
    [orders, currentUser, orderNo]
  );

  const visibleLines = useMemo(() => {
    if (!order || !currentUser || !canAccessOrder) return [];
    if (currentUser.role === 'ADMIN') return order.items;

    return order.items.filter((line) =>
      canUserAccessShipTo(currentUser, line.shipToId)
    );
  }, [order, currentUser, canAccessOrder]);

  const selectedLineId = searchParams.get('lineId') || '';
  const selectedLine =
    visibleLines.find((line) => line.id === selectedLineId) || visibleLines[0];

  const [priceInput, setPriceInput] = useState('');
  const [currencyInput, setCurrencyInput] = useState('USD');
  const [saleNoteInput, setSaleNoteInput] = useState('');
  const [actualEtdInput, setActualEtdInput] = useState('');
  const [draftDocFiles, setDraftDocFiles] = useState<
    Partial<Record<DocumentType, File | null>>
  >({});

  useEffect(() => {
    if (!selectedLine) {
      setPriceInput('');
      setCurrencyInput('USD');
      setSaleNoteInput('');
      setActualEtdInput('');
      setDraftDocFiles({});
      return;
    }

    setPriceInput(selectedLine.price ? String(selectedLine.price) : '');
    setCurrencyInput(selectedLine.currency || 'USD');
    setSaleNoteInput(selectedLine.saleNote || '');
    setActualEtdInput(selectedLine.actualETD || '');
    setDraftDocFiles({});
  }, [selectedLine?.id]);

  const lineStatusMeta: Record<
    OrderLineStatus,
    {
      label: string;
      Icon: LucideIcon;
      badgeClassName: string;
      timelineClassName: string;
    }
  > = {
    [OrderLineStatus.DRAFT]: {
      label: 'DRAFT',
      Icon: FileEdit,
      badgeClassName:
        'bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300',
      timelineClassName:
        'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-300'
    },
    [OrderLineStatus.CREATED]: {
      label: 'CREATED',
      Icon: Send,
      badgeClassName:
        'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950 dark:border-indigo-800 dark:text-indigo-300',
      timelineClassName:
        'border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300'
    },
    [OrderLineStatus.WAIT_SALE_UEC_APPROVE_PO]: {
      label: 'WAIT SALE APPROVE PO',
      Icon: FileText,
      badgeClassName:
        'bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-950 dark:border-orange-800 dark:text-orange-300',
      timelineClassName:
        'border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-950 text-orange-600 dark:text-orange-300'
    },
    [OrderLineStatus.WAIT_MGR_UEC_APPROVE_PO]: {
      label: 'WAIT MGR APPROVE PO',
      Icon: BadgeCheck,
      badgeClassName:
        'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-950 dark:border-purple-800 dark:text-purple-300',
      timelineClassName:
        'border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-300'
    },
    [OrderLineStatus.APPROVED]: {
      label: 'CONFIRMED',
      Icon: BadgeCheck,
      badgeClassName:
        'bg-violet-50 border-violet-200 text-violet-700 dark:bg-violet-950 dark:border-violet-800 dark:text-violet-300',
      timelineClassName:
        'border-violet-300 dark:border-violet-700 bg-violet-50 dark:bg-violet-950 text-violet-600 dark:text-violet-300'
    },
    [OrderLineStatus.VESSEL_SCHEDULED]: {
      label: 'VESSEL SCHEDULED',
      Icon: CalendarCheck,
      badgeClassName:
        'bg-sky-50 border-sky-200 text-sky-700 dark:bg-sky-950 dark:border-sky-800 dark:text-sky-300',
      timelineClassName:
        'border-sky-300 dark:border-sky-700 bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-300'
    },
    [OrderLineStatus.VESSEL_DEPARTED]: {
      label: 'DEPARTED',
      Icon: Ship,
      badgeClassName:
        'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-300',
      timelineClassName:
        'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300'
    }
  };

  const orderStatusMeta: Record<
    OrderProgressStatus,
    { Icon: LucideIcon; className: string; label: string }
  > = {
    [OrderProgressStatus.CREATE]: {
      Icon: FileEdit,
      className:
        'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800',
      label: 'DRAFT'
    },
    [OrderProgressStatus.IN_PROGRESS]: {
      Icon: AlertCircle,
      className:
        'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
      label: 'IN PROGRESS'
    },
    [OrderProgressStatus.COMPLETE]: {
      Icon: CheckCircle2,
      className:
        'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
      label: 'COMPLETE'
    }
  };

  const linePermission = selectedLine
    ? linePermissionMatrix.find(
        (item) => item.fromStatus === selectedLine.status
      )
    : undefined;

  const requiredGroup = linePermission?.allowedUserGroups[0] || UserGroup.ADMIN;

  const ownerByFromStatus = new Map<OrderLineStatus, UserGroup>(
    linePermissionMatrix.map((item) => [
      item.fromStatus,
      item.allowedUserGroups[0]
    ])
  );

  const getTimelineOwner = (status: OrderLineStatus, fallback: UserGroup) =>
    ownerByFromStatus.get(status) || fallback;

  const timelineSteps = [
    {
      status: OrderLineStatus.DRAFT,
      label: 'DRAFT',
      owner: getTimelineOwner(OrderLineStatus.DRAFT, UserGroup.TRADER),
      icon: FileEdit as LucideIcon
    },
    {
      status: OrderLineStatus.CREATED,
      label: 'CREATED',
      owner: getTimelineOwner(OrderLineStatus.CREATED, UserGroup.TRADER),
      icon: Send as LucideIcon
    },
    {
      status: OrderLineStatus.APPROVED,
      label: 'CONFIRMED',
      owner: getTimelineOwner(OrderLineStatus.APPROVED, UserGroup.TSL_SALE),
      icon: BadgeCheck as LucideIcon
    },
    {
      status: OrderLineStatus.WAIT_SALE_UEC_APPROVE_PO,
      label: 'WAIT SALE APPROVE PO',
      owner: getTimelineOwner(
        OrderLineStatus.WAIT_SALE_UEC_APPROVE_PO,
        UserGroup.UEC_SALE
      ),
      icon: FileText as LucideIcon
    },
    {
      status: OrderLineStatus.WAIT_MGR_UEC_APPROVE_PO,
      label: 'WAIT MGR APPROVE PO',
      owner: getTimelineOwner(
        OrderLineStatus.WAIT_MGR_UEC_APPROVE_PO,
        UserGroup.UEC_MANAGER
      ),
      icon: BadgeCheck as LucideIcon
    },
    {
      status: OrderLineStatus.VESSEL_SCHEDULED,
      label: 'WAIT VESSEL DEPARTURE',
      owner: getTimelineOwner(
        OrderLineStatus.VESSEL_SCHEDULED,
        UserGroup.TSL_CS
      ),
      icon: CalendarCheck as LucideIcon
    },
    {
      status: OrderLineStatus.VESSEL_DEPARTED,
      label: 'DEPARTED',
      owner: getTimelineOwner(
        OrderLineStatus.VESSEL_DEPARTED,
        UserGroup.TSL_CS
      ),
      icon: Ship as LucideIcon
    }
  ];

  const selectedStepIndex = selectedLine
    ? timelineSteps.findIndex((step) => step.status === selectedLine.status)
    : -1;

  const timelineProgressPercent =
    selectedStepIndex <= 0
      ? 0
      : (selectedStepIndex / (timelineSteps.length - 1)) * 100;

  const selectedToneClass = selectedLine
    ? lineStatusMeta[selectedLine.status].timelineClassName
    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-300';

  const actionHintByStatus: Record<
    OrderLineStatus,
    { title: string; description: string }
  > = {
    [OrderLineStatus.DRAFT]: {
      title: 'Draft Order - Ready to Submit',
      description:
        'This line is in draft status. You can edit in order form or submit for sale review.'
    },
    [OrderLineStatus.CREATED]: {
      title: 'Awaiting Sale Confirmation',
      description:
        'This line was submitted and requires Sale team to confirm price and send.'
    },
    [OrderLineStatus.APPROVED]: {
      title: 'Waiting Vessel Schedule',
      description:
        'CS should set ETD to generate PO and move this line forward.'
    },
    [OrderLineStatus.WAIT_SALE_UEC_APPROVE_PO]: {
      title: 'Waiting Sale Approval on PO',
      description:
        'PO/SI generated. Sale team must review and approve the PO document.'
    },
    [OrderLineStatus.WAIT_MGR_UEC_APPROVE_PO]: {
      title: 'Waiting Manager Final Approval',
      description:
        'Sale approved. Sale Manager must give final approval to schedule vessel.'
    },
    [OrderLineStatus.VESSEL_SCHEDULED]: {
      title: 'Vessel Scheduled - Upload Final Documents',
      description:
        'Vessel is confirmed. CS should upload final shipping documents to complete.'
    },
    [OrderLineStatus.VESSEL_DEPARTED]: {
      title: 'Line Completed',
      description: 'This line has completed the end-to-end workflow.'
    }
  };

  if (!order || !canAccessOrder) {
    return (
      <div className="p-8 text-sm text-slate-500">
        Order not found or access denied.
      </div>
    );
  }

  const canRunSelectedLineAction =
    Boolean(selectedLine && linePermission) &&
    canUserRunLineAction(
      currentUser,
      selectedLine!.status,
      linePermission!.action,
      linePermissionMatrix
    );

  const actionLabelByLineAction: Record<LineAction, string> = {
    [LineAction.SUBMIT_LINE]: 'Submit to Sale',
    [LineAction.APPROVE_LINE]: 'Confirm & Send',
    [LineAction.SET_ETD]: 'Set ETD & Generate PO',
    [LineAction.APPROVE_SALE_PO]: 'Approve PO (Sale)',
    [LineAction.APPROVE_MGR_PO]: 'Approve PO (Manager)',
    [LineAction.UPLOAD_FINAL_DOCS]: 'Complete Line'
  };

  const hasShippingDoc = Boolean(
    selectedLine?.documents.some(
      (doc) => doc.type === DocumentType.SHIPPING_DOC
    )
  );
  const hasBl = Boolean(
    selectedLine?.documents.some((doc) => doc.type === DocumentType.BL)
  );
  const hasPendingShippingDoc = Boolean(
    draftDocFiles[DocumentType.SHIPPING_DOC]
  );
  const hasPendingBl = Boolean(draftDocFiles[DocumentType.BL]);
  const hasRequiredDocForComplete = hasShippingDoc || hasPendingShippingDoc;
  const hasRequiredBlForComplete = hasBl || hasPendingBl;

  const canAccessDocumentType = (docType: DocumentType) => {
    if (!currentUser) return false;
    return currentUser.allowedDocumentTypes.includes(docType);
  };

  const allowedUploadDocumentTypes = useMemo(
    () =>
      Object.values(DocumentType).filter(
        (type) =>
          type !== DocumentType.PO_PDF &&
          type !== DocumentType.SHIPPING_INSTRUCTION_PDF
      ),
    [currentUser]
  );

  const visibleDocuments = useMemo(() => {
    if (!selectedLine) return [];
    return selectedLine.documents;
  }, [selectedLine, currentUser]);

  const documentTypeLabelMap: Record<DocumentType, string> = {
    [DocumentType.SHIPPING_DOC]: 'Shipping Document',
    [DocumentType.BL]: 'Bill of Lading',
    [DocumentType.INVOICE]: 'Invoice',
    [DocumentType.COA]: 'Certificate of Analysis',
    [DocumentType.PO_PDF]: 'PO PDF',
    [DocumentType.SHIPPING_INSTRUCTION_PDF]: 'Shipping Instruction PDF'
  };

  const handlePickDraftDocument = (
    docType: DocumentType,
    file: File | null
  ) => {
    setDraftDocFiles((prev) => ({
      ...prev,
      [docType]: file
    }));
  };

  const triggerDownload = (dataUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadDocument = (docId: string) => {
    if (!selectedLine) return;
    const doc = selectedLine.documents.find((item) => item.id === docId);
    if (!doc) return;

    if (!canAccessDocumentType(doc.type)) {
      Swal.fire({
        icon: 'error',
        title: 'Permission denied',
        text: `You do not have permission to access ${doc.type}.`
      });
      return;
    }

    if (doc.dataUrl) {
      triggerDownload(doc.dataUrl, doc.filename);
      return;
    }

    if (doc.type === DocumentType.PO_PDF) {
      triggerDownload(
        createOfficialPoPdfDataUrl({
          orderNo: order.orderNo,
          orderDate: order.orderDate,
          poNo: selectedLine.poNo,
          shipToId: selectedLine.shipToId,
          destinationId: selectedLine.destinationId,
          termId: selectedLine.termId,
          gradeId: selectedLine.gradeId,
          qty: selectedLine.qty,
          price: selectedLine.price,
          currency: selectedLine.currency,
          requestETD: selectedLine.requestETD,
          actualETD: selectedLine.actualETD
        }),
        doc.filename
      );
      return;
    }

    if (doc.type === DocumentType.SHIPPING_INSTRUCTION_PDF) {
      triggerDownload(
        createShippingInstructionPdfDataUrl({
          orderNo: order.orderNo,
          orderDate: order.orderDate,
          poNo: selectedLine.poNo,
          shipToId: selectedLine.shipToId,
          destinationId: selectedLine.destinationId,
          termId: selectedLine.termId,
          gradeId: selectedLine.gradeId,
          qty: selectedLine.qty,
          price: selectedLine.price,
          currency: selectedLine.currency,
          requestETD: selectedLine.requestETD,
          actualETD: selectedLine.actualETD
        }),
        doc.filename
      );
    }
  };

  const isActionPayloadValid = (() => {
    if (!linePermission || !selectedLine) return false;

    if (linePermission.action === LineAction.APPROVE_LINE) {
      return Number(priceInput) > 0;
    }

    if (linePermission.action === LineAction.SET_ETD) {
      return Boolean(actualEtdInput);
    }

    if (linePermission.action === LineAction.UPLOAD_FINAL_DOCS) {
      return hasRequiredDocForComplete && hasRequiredBlForComplete;
    }

    return true;
  })();

  const runSelectedLineAction = async () => {
    if (!selectedLine || !linePermission) return;

    if (
      linePermission.action === LineAction.APPROVE_LINE &&
      Number(priceInput) <= 0
    ) {
      Swal.fire({
        icon: 'error',
        title: 'Price required',
        text: 'Please input price before confirming line.'
      });
      return;
    }

    if (linePermission.action === LineAction.SET_ETD && !actualEtdInput) {
      Swal.fire({
        icon: 'error',
        title: 'Actual ETD required',
        text: 'Please set actual ETD before moving this line.'
      });
      return;
    }

    if (
      linePermission.action === LineAction.UPLOAD_FINAL_DOCS &&
      (!hasRequiredDocForComplete || !hasRequiredBlForComplete)
    ) {
      Swal.fire({
        icon: 'error',
        title: 'Required documents missing',
        text: 'Shipping Document and BL are required before complete line.'
      });
      return;
    }

    const confirmed = await Swal.fire({
      icon: 'question',
      title: 'Confirm action',
      text: `${actionLabelByLineAction[linePermission.action]} for line ${selectedLine.poNo}?`,
      showCancelButton: true,
      confirmButtonText: 'Confirm',
      cancelButtonText: 'Cancel'
    });

    if (!confirmed.isConfirmed) return;

    const quotationNo =
      linePermission.action === LineAction.APPROVE_LINE
        ? selectedLine.quotationNo ||
          `QT-${Math.floor(100000 + Math.random() * 900000)}`
        : selectedLine.quotationNo;

    const generatedPoFilename = `PO_${order.orderNo}_${selectedLine.poNo}.pdf`;
    const generatedPoDataUrl =
      linePermission.action === LineAction.SET_ETD
        ? createOfficialPoPdfDataUrl({
            orderNo: order.orderNo,
            orderDate: order.orderDate,
            poNo: selectedLine.poNo,
            shipToId: selectedLine.shipToId,
            destinationId: selectedLine.destinationId,
            termId: selectedLine.termId,
            gradeId: selectedLine.gradeId,
            qty: selectedLine.qty,
            price: selectedLine.price,
            currency: selectedLine.currency,
            requestETD: selectedLine.requestETD,
            actualETD: actualEtdInput
          })
        : '';
    const generatedSiFilename = `SI_${order.orderNo}_${selectedLine.poNo}.pdf`;
    const generatedSiDataUrl =
      linePermission.action === LineAction.SET_ETD
        ? createShippingInstructionPdfDataUrl({
            orderNo: order.orderNo,
            orderDate: order.orderDate,
            poNo: selectedLine.poNo,
            shipToId: selectedLine.shipToId,
            destinationId: selectedLine.destinationId,
            termId: selectedLine.termId,
            gradeId: selectedLine.gradeId,
            qty: selectedLine.qty,
            price: selectedLine.price,
            currency: selectedLine.currency,
            requestETD: selectedLine.requestETD,
            actualETD: actualEtdInput
          })
        : '';

    const pendingUploads =
      linePermission.action === LineAction.UPLOAD_FINAL_DOCS
        ? Object.entries(draftDocFiles).filter(
            (entry): entry is [DocumentType, File] =>
              Boolean(entry[1]) &&
              canAccessDocumentType(entry[0] as DocumentType)
          )
        : [];

    const uploadPayloadByType = new Map<
      DocumentType,
      { file: File; dataUrl: string }
    >();

    if (
      linePermission.action === LineAction.UPLOAD_FINAL_DOCS &&
      pendingUploads.length > 0
    ) {
      await Promise.all(
        pendingUploads.map(async ([docType, file]) => {
          const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ''));
            reader.onerror = () => resolve('');
            reader.readAsDataURL(file);
          });
          uploadPayloadByType.set(docType, { file, dataUrl });
        })
      );
    }

    const nextItems = order.items.map((line) => {
      if (line.id !== selectedLine.id) return line;

      if (linePermission.action === LineAction.APPROVE_LINE) {
        return {
          ...line,
          price: Number(priceInput),
          currency: currencyInput.trim() || 'USD',
          saleNote: saleNoteInput.trim(),
          quotationNo,
          status: linePermission.toStatus
        };
      }

      if (linePermission.action === LineAction.SET_ETD) {
        return {
          ...line,
          actualETD: actualEtdInput,
          status: linePermission.toStatus,
          documents: [
            ...line.documents.filter(
              (doc) =>
                doc.type !== DocumentType.PO_PDF &&
                doc.type !== DocumentType.SHIPPING_INSTRUCTION_PDF
            ),
            {
              id: `doc-${Math.random().toString(36).slice(2, 8)}`,
              type: DocumentType.PO_PDF,
              filename: generatedPoFilename,
              dataUrl: generatedPoDataUrl,
              uploadedBy: currentUser?.username || 'system',
              uploadedAt: new Date().toISOString()
            },
            {
              id: `doc-${Math.random().toString(36).slice(2, 8)}`,
              type: DocumentType.SHIPPING_INSTRUCTION_PDF,
              filename: generatedSiFilename,
              dataUrl: generatedSiDataUrl,
              uploadedBy: currentUser?.username || 'system',
              uploadedAt: new Date().toISOString()
            }
          ]
        };
      }

      if (linePermission.action === LineAction.UPLOAD_FINAL_DOCS) {
        const replacingTypes = new Set(uploadPayloadByType.keys());
        const retainedDocuments = line.documents.filter(
          (doc) => !replacingTypes.has(doc.type)
        );
        const uploadedDocuments = Array.from(uploadPayloadByType.entries()).map(
          ([docType, payload]) => ({
            id: `doc-${Math.random().toString(36).slice(2, 8)}`,
            type: docType,
            filename: payload.file.name,
            dataUrl: payload.dataUrl,
            uploadedBy: currentUser?.username || 'system',
            uploadedAt: new Date().toISOString()
          })
        );

        return {
          ...line,
          status: linePermission.toStatus,
          documents: [...retainedDocuments, ...uploadedDocuments]
        };
      }

      return { ...line, status: linePermission.toStatus };
    });

    updateOrder(order.orderNo, {
      items: nextItems,
      status: deriveOrderProgressStatus(nextItems),
      quotationNo: quotationNo || order.quotationNo
    });

    if (
      linePermission.action === LineAction.SET_ETD &&
      canAccessDocumentType(DocumentType.PO_PDF)
    ) {
      triggerDownload(generatedPoDataUrl, generatedPoFilename);
    }
    if (
      linePermission.action === LineAction.SET_ETD &&
      canAccessDocumentType(DocumentType.SHIPPING_INSTRUCTION_PDF)
    ) {
      triggerDownload(generatedSiDataUrl, generatedSiFilename);
    }

    if (linePermission.action === LineAction.UPLOAD_FINAL_DOCS) {
      setDraftDocFiles({});
    }

    if (linePermission.action === LineAction.APPROVE_SALE_PO) {
      addActivity(
        'Approve PO (Sale)',
        currentUser?.username || 'system',
        `${order.orderNo} / ${selectedLine.poNo}`
      );
      addNotification(
        `PO reviewed by Sale for ${order.orderNo} / ${selectedLine.poNo}. Awaiting manager approval.`,
        Role.SALE_MANAGER,
        'email'
      );
    }
  };

  const saveSelectedLineDraft = async () => {
    if (!selectedLine || !linePermission) return;

    const pendingUploads = Object.entries(draftDocFiles).filter(
      (entry): entry is [DocumentType, File] =>
        Boolean(entry[1]) && canAccessDocumentType(entry[0] as DocumentType)
    );

    if (
      linePermission.action === LineAction.UPLOAD_FINAL_DOCS &&
      pendingUploads.length === 0
    ) {
      Swal.fire({
        icon: 'warning',
        title: 'No file selected',
        text: 'Please select at least one document before saving draft.'
      });
      return;
    }

    const confirmed = await Swal.fire({
      icon: 'question',
      title: 'Confirm save draft',
      text: `Save draft for line ${selectedLine.poNo}?`,
      showCancelButton: true,
      confirmButtonText: 'Save Draft',
      cancelButtonText: 'Cancel'
    });

    if (!confirmed.isConfirmed) return;

    const uploadPayloadByType = new Map<
      DocumentType,
      { file: File; dataUrl: string }
    >();

    if (linePermission.action === LineAction.UPLOAD_FINAL_DOCS) {
      await Promise.all(
        pendingUploads.map(async ([docType, file]) => {
          const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ''));
            reader.onerror = () => resolve('');
            reader.readAsDataURL(file);
          });
          uploadPayloadByType.set(docType, { file, dataUrl });
        })
      );
    }

    const nextItems = order.items.map((line) => {
      if (line.id !== selectedLine.id) return line;

      if (linePermission.action === LineAction.APPROVE_LINE) {
        return {
          ...line,
          price: Number(priceInput) > 0 ? Number(priceInput) : undefined,
          currency: currencyInput.trim() || line.currency || 'USD',
          saleNote: saleNoteInput.trim()
        };
      }

      if (linePermission.action === LineAction.SET_ETD) {
        return {
          ...line,
          actualETD: actualEtdInput || ''
        };
      }

      if (linePermission.action === LineAction.UPLOAD_FINAL_DOCS) {
        if (uploadPayloadByType.size === 0) return line;

        const replacingTypes = new Set(uploadPayloadByType.keys());
        const retainedDocuments = line.documents.filter(
          (doc) => !replacingTypes.has(doc.type)
        );

        const uploadedDocuments = Array.from(uploadPayloadByType.entries()).map(
          ([docType, payload]) => ({
            id: `doc-${Math.random().toString(36).slice(2, 8)}`,
            type: docType,
            filename: payload.file.name,
            dataUrl: payload.dataUrl,
            uploadedBy: currentUser?.username || 'system',
            uploadedAt: new Date().toISOString()
          })
        );

        return {
          ...line,
          documents: [...retainedDocuments, ...uploadedDocuments]
        };
      }

      return line;
    });

    updateOrder(order.orderNo, {
      items: nextItems,
      status: deriveOrderProgressStatus(nextItems)
    });

    if (linePermission.action === LineAction.UPLOAD_FINAL_DOCS) {
      setDraftDocFiles({});
    }

    Swal.fire({
      icon: 'success',
      title:
        linePermission.action === LineAction.UPLOAD_FINAL_DOCS
          ? `Draft saved (${pendingUploads.length} file${pendingUploads.length > 1 ? 's' : ''})`
          : 'Draft saved',
      timer: 900,
      showConfirmButton: false
    });
  };

  const orderStatusBadge = orderStatusMeta[order.status];
  const OrderStatusIcon = orderStatusBadge.Icon;

  const renderWaitBadge = () => (
    <span className="inline-flex items-center px-2 py-0.5 ui-radius-control border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950 text-[10px] font-bold uppercase text-amber-700 dark:text-amber-300">
      WAIT
    </span>
  );

  const renderAsapBadge = (isAsap: boolean) =>
    isAsap ? (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-500 text-white animate-pulse">
        ASAP
      </span>
    ) : (
      <span className="text-slate-400 dark:text-slate-500">-</span>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/orders"
          className="ui-kicker text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </Link>
        <div className="flex items-center gap-3">
          <div className="inline-flex flex-col items-end leading-tight">
            <span className="text-[9px] font-extrabold tracking-wide text-slate-500 dark:text-slate-400 uppercase">
              ORDER REF
            </span>
            <span className="mt-0.5 text-[16px] font-black text-slate-900 dark:text-slate-100">
              {order.orderNo}
            </span>
          </div>
          <span
            className={`px-3 py-1.5 ui-radius-control text-xs font-bold border inline-flex items-center gap-1.5 ${orderStatusBadge.className}`}
          >
            <OrderStatusIcon className="w-3.5 h-3.5" />
            {orderStatusBadge.label}
          </span>
        </div>
      </div>

      <div className="border-b border-slate-200 dark:border-slate-800" />

      <div className="bg-white dark:bg-slate-900 ui-radius-card border border-slate-200 dark:border-slate-800 p-4 overflow-hidden shadow-sm">
        <div className="flex items-center">
          <h2 className="ui-section-title">Workflow Timeline</h2>
        </div>

        <div className="relative mt-3 px-2">
          <div
            className="absolute top-5 h-1 rounded-full bg-emerald-500/20 dark:bg-emerald-800/30"
            style={{
              left: `${100 / (timelineSteps.length * 2)}%`,
              right: `${100 / (timelineSteps.length * 2)}%`
            }}
          />
          <div
            className="absolute top-5 h-1 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all"
            style={{
              left: `${100 / (timelineSteps.length * 2)}%`,
              width: `${Math.max(
                0,
                timelineProgressPercent *
                  ((timelineSteps.length - 1) / timelineSteps.length)
              )}%`
            }}
          />

          <div
            className="grid gap-2 relative"
            style={{
              gridTemplateColumns: `repeat(${timelineSteps.length}, minmax(0, 1fr))`
            }}
          >
            {timelineSteps.map((step, index) => {
              const isCurrent = index === selectedStepIndex;
              const isDone = selectedStepIndex > index;
              const isPending = !isCurrent && !isDone;
              const StepIcon = step.icon;

              return (
                <div key={step.status} className="text-center">
                  <div
                    className={`mx-auto relative z-10 w-9 h-9 ui-radius-control border inline-flex items-center justify-center transition-colors ${
                      isCurrent
                        ? `${selectedToneClass} shadow-sm`
                        : isDone
                          ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <StepIcon className="w-3.5 h-3.5" />
                    )}
                  </div>

                  <div className="mt-2">
                    <p
                      className={`text-[10px] font-black uppercase leading-tight ${
                        isCurrent
                          ? 'text-slate-800 dark:text-slate-100'
                          : isDone
                            ? 'text-emerald-700 dark:text-emerald-300'
                            : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {step.label}
                    </p>
                    <p
                      className={`mt-0.5 text-[10px] uppercase ${
                        isPending
                          ? 'text-slate-400 dark:text-slate-500'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {step.owner}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-900 ui-radius-card border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="ui-kicker text-indigo-600 dark:text-indigo-400 inline-flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Current Required Action: {requiredGroup}
                </p>
                {selectedLine ? (
                  <>
                    <h3 className="mt-2 text-base font-bold text-slate-900 dark:text-white">
                      {actionHintByStatus[selectedLine.status].title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {actionHintByStatus[selectedLine.status].description}
                    </p>
                  </>
                ) : (
                  <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                    No visible line selected.
                  </p>
                )}
              </div>
              <ShieldCheck className="w-8 h-8 text-slate-300 dark:text-slate-700" />
            </div>

            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-2">
              {linePermission?.action === LineAction.APPROVE_LINE && (
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <p className="ui-kicker text-slate-500 dark:text-slate-400">
                      Price
                    </p>
                    <input
                      type="number"
                      min={0}
                      value={priceInput}
                      onChange={(event) => setPriceInput(event.target.value)}
                      placeholder="Price"
                      className="shadcn-input h-8 text-xs"
                      disabled={!canRunSelectedLineAction}
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="ui-kicker text-slate-500 dark:text-slate-400">
                      Currency
                    </p>
                    <select
                      value={currencyInput}
                      onChange={(event) => setCurrencyInput(event.target.value)}
                      className="shadcn-input h-8 text-xs"
                      disabled={!canRunSelectedLineAction}
                    >
                      <option value="USD">USD</option>
                      <option value="THB">THB</option>
                      <option value="EUR">EUR</option>
                      <option value="JPY">JPY</option>
                      <option value="CNY">CNY</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <p className="ui-kicker text-slate-500 dark:text-slate-400">
                      Note
                    </p>
                    <input
                      value={saleNoteInput}
                      onChange={(event) => setSaleNoteInput(event.target.value)}
                      placeholder="Internal note"
                      className="shadcn-input h-8 text-xs"
                      disabled={!canRunSelectedLineAction}
                    />
                  </div>
                </div>
              )}

              {linePermission?.action === LineAction.SET_ETD && (
                <div className="md:col-span-2">
                  <div className="space-y-1">
                    <p className="ui-kicker text-slate-500 dark:text-slate-400">
                      Actual ETD
                    </p>
                    <input
                      type="date"
                      value={actualEtdInput}
                      onChange={(event) =>
                        setActualEtdInput(event.target.value)
                      }
                      className="shadcn-input h-8 text-xs"
                      disabled={!canRunSelectedLineAction}
                    />
                  </div>
                </div>
              )}

              {linePermission?.action === LineAction.UPLOAD_FINAL_DOCS && (
                <div className="md:col-span-2 space-y-2">
                  <div className="space-y-2">
                    {allowedUploadDocumentTypes.map((docType) => {
                      const canAccessDocType = canAccessDocumentType(docType);
                      const existingDocument = selectedLine?.documents.find(
                        (doc) => doc.type === docType
                      );
                      const pickedFile = draftDocFiles[docType] || null;
                      return (
                        <div
                          key={docType}
                          className="p-2 border border-slate-200 dark:border-slate-700 ui-radius-control flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                              {documentTypeLabelMap[docType] || docType}
                              {(docType === DocumentType.SHIPPING_DOC ||
                                docType === DocumentType.BL) && (
                                <span className="text-rose-500"> *</span>
                              )}
                              {!canAccessDocType && (
                                <span className="ml-2 text-[10px] font-bold uppercase text-rose-600 dark:text-rose-400">
                                  No Access
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {pickedFile?.name ||
                                existingDocument?.filename ||
                                'No file selected'}
                            </p>
                          </div>
                          <label
                            className={`px-3 h-8 inline-flex items-center ui-radius-control text-xs font-bold ${
                              canRunSelectedLineAction
                                ? canAccessDocType
                                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            Select
                            <input
                              type="file"
                              className="hidden"
                              disabled={
                                !canRunSelectedLineAction || !canAccessDocType
                              }
                              onChange={(event) =>
                                handlePickDraftDocument(
                                  docType,
                                  event.target.files?.[0] || null
                                )
                              }
                            />
                          </label>
                        </div>
                      );
                    })}
                  </div>
                  <p className="ui-micro-text text-slate-500 dark:text-slate-400">
                    Required before complete: Shipping Document (
                    {hasRequiredDocForComplete ? '✓' : '✕'}) and BL (
                    {hasRequiredBlForComplete ? '✓' : '✕'})
                  </p>
                </div>
              )}

              {linePermission &&
                [
                  LineAction.APPROVE_LINE,
                  LineAction.SET_ETD,
                  LineAction.UPLOAD_FINAL_DOCS
                ].includes(linePermission.action) && (
                  <button
                    onClick={saveSelectedLineDraft}
                    disabled={!canRunSelectedLineAction}
                    className={`px-4 py-2.5 ui-radius-control text-sm font-bold inline-flex items-center justify-center gap-2 ${
                      canRunSelectedLineAction
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    Save Draft
                  </button>
                )}

              {linePermission && (
                <button
                  onClick={runSelectedLineAction}
                  disabled={!canRunSelectedLineAction || !isActionPayloadValid}
                  className={`px-4 py-2.5 ui-radius-control text-sm font-bold inline-flex items-center justify-center gap-2 ${
                    ![
                      LineAction.APPROVE_LINE,
                      LineAction.SET_ETD,
                      LineAction.UPLOAD_FINAL_DOCS
                    ].includes(linePermission.action)
                      ? 'col-span-2'
                      : ''
                  } ${
                    canRunSelectedLineAction && isActionPayloadValid
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  {actionLabelByLineAction[linePermission.action]}
                </button>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 ui-radius-card border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/20">
              <h2 className="ui-section-title">Line Detail</h2>
            </div>
            {selectedLine ? (
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                  <p className="ui-kicker text-slate-500 dark:text-slate-400">
                    PO Ref.
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">
                    {selectedLine.poNo}
                  </p>
                </div>
                <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                  <p className="ui-kicker text-slate-500 dark:text-slate-400">
                    Ship To
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">
                    {selectedLine.shipToId}
                  </p>
                </div>
                <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                  <p className="ui-kicker text-slate-500 dark:text-slate-400">
                    Destination
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">
                    {selectedLine.destinationId}
                  </p>
                </div>
                <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                  <p className="ui-kicker text-slate-500 dark:text-slate-400">
                    Term
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">
                    {selectedLine.termId}
                  </p>
                </div>
                <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                  <p className="ui-kicker text-slate-500 dark:text-slate-400">
                    Grade
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">
                    {selectedLine.gradeId}
                  </p>
                </div>
                <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                  <p className="ui-kicker text-slate-500 dark:text-slate-400">
                    Qty
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">
                    {selectedLine.qty}
                  </p>
                </div>
                <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                  <p className="ui-kicker text-slate-500 dark:text-slate-400">
                    Req ETD
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">
                    {selectedLine.requestETD || '-'}
                  </p>
                </div>
                <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                  <p className="ui-kicker text-slate-500 dark:text-slate-400">
                    Req ETA
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">
                    {selectedLine.requestETA || '-'}
                  </p>
                </div>
                <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                  <p className="ui-kicker text-slate-500 dark:text-slate-400">
                    Actual ETD
                  </p>
                  <div className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">
                    {selectedLine.actualETD || renderWaitBadge()}
                  </div>
                </div>
                <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                  <p className="ui-kicker text-slate-500 dark:text-slate-400">
                    Price
                  </p>
                  <div className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">
                    {selectedLine.price
                      ? `${selectedLine.currency || 'USD'} ${selectedLine.price}`
                      : renderWaitBadge()}
                  </div>
                </div>
                <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                  <p className="ui-kicker text-slate-500 dark:text-slate-400">
                    ASAP
                  </p>
                  <div className="mt-1">
                    {renderAsapBadge(selectedLine.asap)}
                  </div>
                </div>
                <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
                  <p className="ui-kicker text-slate-500 dark:text-slate-400">
                    Status
                  </p>
                  <div className="mt-1">
                    {(() => {
                      const lineMeta = lineStatusMeta[selectedLine.status];
                      const LineStatusIcon = lineMeta.Icon;
                      return (
                        <span
                          className={`px-2 py-1 ui-radius-control border ui-micro-text font-bold uppercase inline-flex items-center gap-1 ${lineMeta.badgeClassName}`}
                        >
                          <LineStatusIcon className="w-3 h-3" />
                          {lineMeta.label}
                        </span>
                      );
                    })()}
                  </div>
                </div>
                <div className="md:col-span-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <p className="ui-kicker text-slate-500 dark:text-slate-400">
                    Note
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100 whitespace-pre-wrap">
                    {selectedLine.saleNote || '-'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="px-4 py-10 text-center text-slate-400">
                No visible line in this order.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 ui-radius-card border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
            <h2 className="ui-subheader">Metadata</h2>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-slate-500 dark:text-slate-400">
                  Created By
                </span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {order.createdBy}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-500 dark:text-slate-400">
                  Submitted
                </span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {new Date(order.orderDate).toLocaleDateString('en-GB')}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-500 dark:text-slate-400">
                  CRM QT
                </span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {order.quotationNo || '-'}
                </span>
              </div>
            </div>
            <div className="mt-3 p-3 ui-radius-control border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-sm italic text-slate-600 dark:text-slate-300">
              {order.note || '-'}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 ui-radius-card border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
            <h2 className="ui-subheader inline-flex items-center gap-1.5">
              <FileText className="w-4 h-4" />
              Documentation
            </h2>

            {selectedLine && visibleDocuments.length > 0 ? (
              <div className="mt-3 space-y-2">
                {visibleDocuments.map((doc) =>
                  (() => {
                    const canAccessDoc = canAccessDocumentType(doc.type);
                    return (
                      <div
                        key={doc.id}
                        className="p-2 border border-slate-200 dark:border-slate-700 ui-radius-control text-xs flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 dark:text-slate-200">
                            {doc.type}
                            {!canAccessDoc && (
                              <span className="ml-2 text-[10px] font-bold uppercase text-rose-600 dark:text-rose-400">
                                No Access
                              </span>
                            )}
                          </p>
                          <p className="text-slate-500 dark:text-slate-400 truncate">
                            {doc.filename}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDownloadDocument(doc.id)}
                          disabled={!canAccessDoc}
                          className={`p-1.5 ui-radius-control ${
                            canAccessDoc
                              ? 'text-slate-400 hover:text-indigo-600 dark:text-slate-500 dark:hover:text-indigo-400'
                              : 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                          }`}
                          title="Download document"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })()
                )}
              </div>
            ) : (
              <div className="mt-3 h-28 flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500">
                <FileWarning className="w-6 h-6 mb-2" />
                <p className="text-sm">No documents</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
