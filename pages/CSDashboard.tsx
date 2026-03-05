import React, { useMemo, useState } from 'react';
import {
  CalendarClock,
  Truck,
  Package,
  Loader2,
  Send,
  FileText
} from 'lucide-react';
import Swal from '../utils/swal';
import {
  useStore,
  canUserAccessShipTo,
  canUserRunLineAction,
  deriveOrderProgressStatus
} from '../store';
import { DocumentType, LineAction, OrderLineStatus, Role } from '../types';

export const CSDashboard: React.FC = () => {
  const {
    orders,
    currentUser,
    linePermissionMatrix,
    updateOrder,
    addActivity,
    addNotification
  } = useStore();
  const [etdDates, setEtdDates] = useState<Record<string, string>>({});
  const [draftDocFilesByLine, setDraftDocFilesByLine] = useState<
    Record<string, Partial<Record<DocumentType, File | null>>>
  >({});
  const [uploadingLineId, setUploadingLineId] = useState<string | null>(null);

  const canAccessDocumentType = (docType: DocumentType) => {
    if (!currentUser) return false;
    return currentUser.allowedDocumentTypes.includes(docType);
  };

  const allowedUploadDocumentTypes = useMemo<DocumentType[]>(
    () =>
      Object.values(DocumentType).filter(
        (item) =>
          item !== DocumentType.PO_PDF &&
          item !== DocumentType.SHIPPING_INSTRUCTION_PDF
      ),
    [currentUser]
  );

  const visibleLines = useMemo(() => {
    if (!currentUser) return [] as Array<{ orderNo: string; lineId: string }>;

    return orders.flatMap((order) =>
      order.items
        .filter(
          (line) =>
            order.companyId === currentUser.companyId &&
            canUserAccessShipTo(currentUser, line.shipToId)
        )
        .map((line) => ({ orderNo: order.orderNo, lineId: line.id }))
    );
  }, [orders, currentUser]);

  const getLine = (orderNo: string, lineId: string) => {
    const order = orders.find((item) => item.orderNo === orderNo);
    const line = order?.items.find((item) => item.id === lineId);
    return { order, line };
  };

  const updateLine = (
    orderNo: string,
    lineId: string,
    updater: (
      line: NonNullable<ReturnType<typeof getLine>['line']>
    ) => NonNullable<ReturnType<typeof getLine>['line']>
  ) => {
    const { order } = getLine(orderNo, lineId);
    if (!order) return;

    const nextItems = order.items.map((line) =>
      line.id === lineId ? updater(line) : line
    );

    updateOrder(orderNo, {
      items: nextItems,
      status: deriveOrderProgressStatus(nextItems)
    });
  };

  const submitETD = (orderNo: string, lineId: string) => {
    const date = etdDates[lineId];
    if (!date) return;
    if (!currentUser) return;

    const { order, line } = getLine(orderNo, lineId);
    if (
      !line ||
      !canUserRunLineAction(
        currentUser,
        line.status,
        LineAction.SET_ETD,
        linePermissionMatrix
      )
    ) {
      return;
    }

    updateLine(orderNo, lineId, (line) => ({
      ...line,
      actualETD: date,
      status: OrderLineStatus.VESSEL_SCHEDULED
    }));

    addActivity(
      'Set ETD (line)',
      currentUser?.username || 'cs',
      `${orderNo} / ${lineId}`
    );
    addNotification(
      `ETD set for ${orderNo} / ${line.poNo}: ${date}`,
      Role.UBE_JAPAN,
      'email'
    );
  };

  const saveEtdDraft = (orderNo: string, lineId: string) => {
    const date = etdDates[lineId] || '';
    if (!currentUser) return;

    const { line } = getLine(orderNo, lineId);
    if (
      !line ||
      !canUserRunLineAction(
        currentUser,
        line.status,
        LineAction.SET_ETD,
        linePermissionMatrix
      )
    ) {
      return;
    }

    updateLine(orderNo, lineId, (item) => ({
      ...item,
      actualETD: date
    }));

    Swal.fire({
      icon: 'success',
      title: 'Draft saved',
      timer: 900,
      showConfirmButton: false
    });
  };

  const uploadDocument = async (orderNo: string, lineId: string) => {
    if (!currentUser) return;

    const { line } = getLine(orderNo, lineId);
    if (
      !line ||
      !canUserRunLineAction(
        currentUser,
        line.status,
        LineAction.UPLOAD_FINAL_DOCS,
        linePermissionMatrix
      )
    ) {
      return;
    }

    const pendingUploads = Object.entries(draftDocFilesByLine[lineId] || {})
      .filter(
        (entry): entry is [DocumentType, File] =>
          Boolean(entry[1]) && canAccessDocumentType(entry[0] as DocumentType)
      )
      .map(([docType, file]) => ({ docType, file }));

    if (pendingUploads.length === 0) {
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
      text: `Save draft for line ${line.poNo}?`,
      showCancelButton: true,
      confirmButtonText: 'Save Draft',
      cancelButtonText: 'Cancel'
    });

    if (!confirmed.isConfirmed) return;

    setUploadingLineId(lineId);

    const uploadPayloadByType = new Map<
      DocumentType,
      { file: File; dataUrl: string }
    >();

    await Promise.all(
      pendingUploads.map(async ({ docType, file }) => {
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ''));
          reader.onerror = () => resolve('');
          reader.readAsDataURL(file);
        });
        uploadPayloadByType.set(docType, { file, dataUrl });
      })
    );

    updateLine(orderNo, lineId, (line) => ({
      ...line,
      documents: [
        ...line.documents.filter(
          (doc) => !uploadPayloadByType.has(doc.type as DocumentType)
        ),
        ...Array.from(uploadPayloadByType.entries()).map(
          ([docType, payload]) => ({
            id: `doc-${Math.random().toString(36).slice(2, 8)}`,
            type: docType,
            filename: payload.file.name,
            dataUrl: payload.dataUrl,
            uploadedBy: currentUser?.username || 'cs',
            uploadedAt: new Date().toISOString()
          })
        )
      ]
    }));

    addActivity(
      'Upload document (line)',
      currentUser?.username || 'cs',
      `${orderNo} / ${lineId}`
    );
    addNotification(
      `Documents uploaded (${pendingUploads.length}) for ${orderNo} / line ${lineId}`,
      Role.UBE_JAPAN,
      'system'
    );

    setDraftDocFilesByLine((prev) => ({ ...prev, [lineId]: {} }));
    setUploadingLineId(null);

    Swal.fire({
      icon: 'success',
      title: `Draft saved (${pendingUploads.length} file${pendingUploads.length > 1 ? 's' : ''})`,
      timer: 900,
      showConfirmButton: false
    });
  };

  const departLine = async (orderNo: string, lineId: string) => {
    if (!currentUser) return;
    const { line } = getLine(orderNo, lineId);
    if (
      !line ||
      !canUserRunLineAction(
        currentUser,
        line.status,
        LineAction.UPLOAD_FINAL_DOCS,
        linePermissionMatrix
      )
    ) {
      return;
    }

    const hasShippingDoc = line.documents.some(
      (doc) => doc.type === DocumentType.SHIPPING_DOC
    );
    const hasBl = line.documents.some((doc) => doc.type === DocumentType.BL);
    if (!hasShippingDoc || !hasBl) {
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
      text: `Complete Line for line ${line.poNo}?`,
      showCancelButton: true,
      confirmButtonText: 'Confirm',
      cancelButtonText: 'Cancel'
    });

    if (!confirmed.isConfirmed) return;

    updateLine(orderNo, lineId, (item) => ({
      ...item,
      status: OrderLineStatus.VESSEL_DEPARTED
    }));

    addActivity(
      'Vessel Departed (line)',
      currentUser.username,
      `${orderNo} / ${line.poNo}`
    );
    addNotification(
      `Line departed: ${orderNo} / ${line.poNo}`,
      Role.UBE_JAPAN,
      'email'
    );
  };

  const approvedLines = visibleLines.filter((row) => {
    const { line } = getLine(row.orderNo, row.lineId);
    return line?.status === OrderLineStatus.APPROVED;
  });

  const receivedPoLines = visibleLines.filter((row) => {
    const { line } = getLine(row.orderNo, row.lineId);
    return line?.status === OrderLineStatus.RECEIVED_ACTUAL_PO;
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="ui-page-title">CS Logistics Hub</h1>
          <p className="ui-page-subtitle">
            Execute line-level workflow from APPROVED to DEPARTED.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Truck className="text-blue-600 dark:text-blue-400" />
            <h2 className="ui-subheader">Vessel Scheduling Required</h2>
            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-bold dark:bg-blue-900/30 dark:text-blue-300">
              {approvedLines.length}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {approvedLines.map((row) => {
              const { line } = getLine(row.orderNo, row.lineId);
              if (!line) return null;
              const canRunLineAction = canUserRunLineAction(
                currentUser,
                line.status,
                LineAction.SET_ETD,
                linePermissionMatrix
              );
              return (
                <div
                  key={row.lineId}
                  className="bg-white dark:bg-slate-900 p-6 ui-radius-panel border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden"
                >
                  {line.asap && (
                    <div className="absolute top-0 right-0 w-24 h-24 overflow-hidden">
                      <div className="absolute top-2 right-[-32px] bg-red-500 text-white ui-micro-text font-black px-8 py-1 rotate-45 shadow-lg">
                        URGENT
                      </div>
                    </div>
                  )}
                  <div className="space-y-1 mb-3">
                    <h3 className="font-bold text-slate-900 dark:text-white">
                      {row.orderNo}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {line.poNo} • {line.shipToId}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={etdDates[line.id] || ''}
                      onChange={(e) =>
                        setEtdDates((prev) => ({
                          ...prev,
                          [line.id]: e.target.value
                        }))
                      }
                      className="shadcn-input h-8 text-xs flex-1"
                      disabled={!canRunLineAction}
                    />
                  </div>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      onClick={() => saveEtdDraft(row.orderNo, row.lineId)}
                      disabled={!canRunLineAction}
                      className={`px-4 py-2.5 ui-radius-control text-sm font-bold inline-flex items-center justify-center gap-2 ${
                        canRunLineAction
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                      Save Draft
                    </button>
                    <button
                      onClick={() => submitETD(row.orderNo, row.lineId)}
                      disabled={!canRunLineAction || !etdDates[line.id]}
                      className={`px-4 py-2.5 ui-radius-control text-sm font-bold inline-flex items-center justify-center gap-2 ${
                        canRunLineAction && Boolean(etdDates[line.id])
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <CalendarClock className="w-4 h-4" />
                      Mark Vessel Scheduled
                    </button>
                  </div>
                </div>
              );
            })}
            {approvedLines.length === 0 && (
              <p className="text-sm text-slate-400 py-4 italic">
                No approved lines waiting ETD.
              </p>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Package className="text-indigo-600 dark:text-indigo-400" />
            <h2 className="ui-subheader">Shipping Documents Finalization</h2>
            <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-bold dark:bg-indigo-900/30 dark:text-indigo-300">
              {receivedPoLines.length}
            </span>
          </div>
          <div className="space-y-4">
            {receivedPoLines.map((row) => {
              const { line } = getLine(row.orderNo, row.lineId);
              if (!line) return null;
              const canRunLineAction = canUserRunLineAction(
                currentUser,
                line.status,
                LineAction.UPLOAD_FINAL_DOCS,
                linePermissionMatrix
              );
              const hasShippingDoc = line.documents.some(
                (doc) => doc.type === DocumentType.SHIPPING_DOC
              );
              const hasBl = line.documents.some(
                (doc) => doc.type === DocumentType.BL
              );
              const selectedCount = Object.values(
                draftDocFilesByLine[line.id] || {}
              ).filter(Boolean).length;

              return (
                <div
                  key={row.lineId}
                  className="bg-white dark:bg-slate-900 ui-radius-card border border-slate-200 dark:border-slate-800 shadow-sm p-4 md:p-5"
                >
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                    <div className="xl:col-span-1 space-y-2">
                      <p className="ui-kicker text-slate-500 dark:text-slate-400">
                        Order
                      </p>
                      <p className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                        {row.orderNo}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        PO: <span className="font-bold">{line.poNo}</span>
                      </p>
                    </div>

                    <div className="xl:col-span-2 space-y-2">
                      {allowedUploadDocumentTypes.map((docType) => {
                        const canAccessDocType = canAccessDocumentType(docType);
                        const existingDocument = line.documents.find(
                          (doc) => doc.type === docType
                        );
                        const pickedFile =
                          draftDocFilesByLine[line.id]?.[docType] || null;

                        return (
                          <div
                            key={`${line.id}-${docType}`}
                            className="p-2 border border-slate-200 dark:border-slate-700 ui-radius-control flex items-center justify-between gap-3"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                {docType}
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
                                canRunLineAction
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
                                  !canRunLineAction || !canAccessDocType
                                }
                                onChange={(event) =>
                                  setDraftDocFilesByLine((prev) => ({
                                    ...prev,
                                    [line.id]: {
                                      ...(prev[line.id] || {}),
                                      [docType]: event.target.files?.[0] || null
                                    }
                                  }))
                                }
                              />
                            </label>
                          </div>
                        );
                      })}

                      <p className="ui-micro-text text-slate-500 dark:text-slate-400">
                        Required before complete: Shipping Document (
                        {hasShippingDoc ? '✓' : '✕'}) and BL (
                        {hasBl ? '✓' : '✕'})
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                        <button
                          onClick={() =>
                            uploadDocument(row.orderNo, row.lineId)
                          }
                          disabled={
                            !canRunLineAction ||
                            uploadingLineId === line.id ||
                            selectedCount === 0
                          }
                          className={`px-4 py-2.5 ui-radius-control text-sm font-bold inline-flex items-center justify-center gap-2 ${
                            canRunLineAction &&
                            uploadingLineId !== line.id &&
                            selectedCount > 0
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          {uploadingLineId === line.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <FileText className="w-4 h-4" />
                          )}
                          Save Draft
                        </button>

                        <button
                          onClick={() => departLine(row.orderNo, row.lineId)}
                          disabled={
                            !canRunLineAction || !hasShippingDoc || !hasBl
                          }
                          className={`px-4 py-2.5 ui-radius-control text-sm font-bold inline-flex items-center justify-center gap-2 ${
                            canRunLineAction && hasShippingDoc && hasBl
                              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          <Send className="w-4 h-4" />
                          Complete Line
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {receivedPoLines.length === 0 && (
              <div className="bg-white dark:bg-slate-900 ui-radius-card border border-slate-200 dark:border-slate-800 shadow-sm px-6 py-10 text-center text-slate-400">
                No lines in RECEIVED ACTUAL PO.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
