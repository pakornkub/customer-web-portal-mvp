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
  createOfficialPoPdfDataUrl,
  createShippingInstructionPdfDataUrl
} from '../utils/poPdf';
import {
  PdfGenerationModal,
  type PoPdfInput
} from '../components/PdfGenerationModal';
import {
  useStore,
  canUserAccessShipTo,
  canUserRunLineAction,
  deriveOrderProgressStatus
} from '../store';
import { DocumentType, LineAction, OrderLineStatus, Role } from '../types';

type VesselViewRecord = {
  c_feeder: string;
  c_mother: string;
  c_shpline: string;
  c_fwd: string;
  c_etd: string;
  c_eta: string;
};
const VESSEL_VIEW_MOCK: Record<string, VesselViewRecord> = {
  'SHIP-BRIDGESTONE-POZNAN': {
    c_feeder: 'ITHACA V.111S',
    c_mother: 'ONE SATISFACTION V.001W',
    c_shpline: 'OCEAN NETWORK EXPRESS PTE. LTD.',
    c_fwd: 'DIRECT',
    c_etd: '2026-02-11',
    c_eta: '2026-04-03'
  },
  'SHIP-BRIDGESTONE-BRASIL': {
    c_feeder: 'ONE GRUS V.023E',
    c_mother: 'EVER LOTUS V.1571-060W',
    c_shpline: 'YANGMING',
    c_fwd: 'MERCURIAL',
    c_etd: '2023-12-28',
    c_eta: '2024-02-01'
  },
  'SHIP-BRIDGESTONE-TATABANYA': {
    c_feeder: 'PELICAN V.073S',
    c_mother: 'ONE HELSINKI V.063W',
    c_shpline: 'OCEAN NETWORK EXPRESS PTE. LTD.',
    c_fwd: 'DIRECT',
    c_etd: '2025-10-04',
    c_eta: '2026-01-02'
  },
  'SHIP-SUMITOMO-BRASIL': {
    c_feeder: 'SINAR BAJO V.110S',
    c_mother: 'CMA CGM BUZIOS V.0010W',
    c_shpline:
      'PACIFIC INTERNATIONAL LINES (PRIVATE) LIMITED C/O PIL SHIPPING (THAILAND)LTD.',
    c_fwd: 'DLT',
    c_etd: '2026-02-25',
    c_eta: '2026-04-13'
  },
  'SHIP-SUMITOMO-SOUTH-AFRICA': {
    c_feeder: 'ONE WREN V.029E',
    c_mother: 'NYK FUJI V.135W',
    c_shpline: 'OCEAN NETWORK EXPRESS PTE. LTD. C/O',
    c_fwd: 'FOB / DSV',
    c_etd: '2026-02-22',
    c_eta: '2026-03-27'
  },
  'SHIP-SUMITOMO-HUNAN': {
    c_feeder: 'HEUNG-A BANGKOK V.2602N',
    c_mother: '-',
    c_shpline: 'HEUNG A',
    c_fwd: 'DIRECT',
    c_etd: '2026-03-20',
    c_eta: '2026-03-27'
  },
  'SHIP-TOYO-MALAYSIA': {
    c_feeder: 'INTERASIA TRIUMPH V.W007',
    c_mother: '-',
    c_shpline: 'WANHAI',
    c_fwd: 'LEO',
    c_etd: '',
    c_eta: ''
  },
  'SHIP-HENGDASHENG-TOYO': {
    c_feeder: 'JOSCO LUCKY V.2511N',
    c_mother: '-',
    c_shpline: 'TAICANG CONTAINER LINES CO.,LTD',
    c_fwd: 'LEO',
    c_etd: '',
    c_eta: ''
  },
  'SHIP-TOYO-TIRE-NA': {
    c_feeder: 'MSC BRIDGEPORT V.GU606W',
    c_mother: 'ZIM THAILAND V.14E',
    c_shpline: 'MSC',
    c_fwd: 'DIRECT / FOB',
    c_etd: '',
    c_eta: ''
  }
};

export const CSDashboard: React.FC = () => {
  const {
    orders,
    currentUser,
    linePermissionMatrix,
    masterData,
    updateOrder,
    addActivity,
    addNotification
  } = useStore();

  const getShipToName = (shipToId: string) =>
    masterData.shipTos.find((s) => s.id === shipToId)?.name || shipToId;

  type VesselInputs = {
    feeder: string;
    mother: string;
    company: string;
    forwarder: string;
    eta: string;
  };
  const defaultVI = (): VesselInputs => ({
    feeder: '',
    mother: '',
    company: '',
    forwarder: '',
    eta: ''
  });
  const [etdDates, setEtdDates] = useState<Record<string, string>>({});
  const [vesselInputs, setVesselInputs] = useState<
    Record<string, VesselInputs>
  >({});
  const setVI = (lineId: string, field: keyof VesselInputs, value: string) =>
    setVesselInputs((prev) => ({
      ...prev,
      [lineId]: { ...(prev[lineId] || defaultVI()), [field]: value }
    }));
  const [pdfModalState, setPdfModalState] = useState<{
    orderNo: string;
    lineId: string;
    actualETD: string;
    feederVessel: string;
    motherVessel: string;
    vesselCompany: string;
    forwarder: string;
    vesselEta: string;
  } | null>(null);
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
        .filter((line) => canUserAccessShipTo(currentUser, line.shipToId))
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

  const handleFetchVesselView = (lineId: string, shipToId: string) => {
    const record = VESSEL_VIEW_MOCK[shipToId];
    if (!record) {
      Swal.fire({
        icon: 'info',
        title: 'No data found',
        text: `No scheduled vessel found for ship-to "${getShipToName(shipToId)}".`
      });
      return;
    }
    setVesselInputs((prev) => ({
      ...prev,
      [lineId]: {
        feeder: record.c_feeder,
        mother: record.c_mother,
        company: record.c_shpline,
        forwarder: record.c_fwd,
        eta: record.c_eta
      }
    }));
    setEtdDates((prev) => ({ ...prev, [lineId]: record.c_etd }));
  };

  const submitETD = async (orderNo: string, lineId: string) => {
    const date = etdDates[lineId];
    if (!date) return;
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

    // Open the PO/SI template modal — CS reviews/edits fields before generating
    const vi = vesselInputs[lineId] || defaultVI();
    setPdfModalState({
      orderNo,
      lineId,
      actualETD: date,
      feederVessel: vi.feeder,
      motherVessel: vi.mother,
      vesselCompany: vi.company,
      forwarder: vi.forwarder,
      vesselEta: vi.eta
    });
  };

  const handlePdfModalConfirm = (poInput: PoPdfInput, siInput: PoPdfInput) => {
    if (!pdfModalState || !currentUser) return;
    const {
      orderNo,
      lineId,
      actualETD,
      feederVessel,
      motherVessel,
      vesselCompany,
      forwarder,
      vesselEta
    } = pdfModalState;

    const { order, line } = getLine(orderNo, lineId);
    if (!order || !line) return;

    const generatedPoFilename = `PO_${orderNo}_${line.poNo}.pdf`;
    const generatedPoDataUrl = createOfficialPoPdfDataUrl(poInput);
    const generatedSiFilename = `SI_${orderNo}_${line.poNo}.pdf`;
    const generatedSiDataUrl = createShippingInstructionPdfDataUrl(siInput);

    updateLine(orderNo, lineId, (item) => ({
      ...item,
      actualETD,
      feederVessel: feederVessel || undefined,
      motherVessel: motherVessel || undefined,
      vesselCompany: vesselCompany || undefined,
      forwarder: forwarder || undefined,
      vesselEta: vesselEta || undefined,
      status: OrderLineStatus.WAIT_SALE_UEC_APPROVE_PO,
      documents: [
        ...item.documents.filter(
          (doc) =>
            doc.type !== DocumentType.PO_PDF &&
            doc.type !== DocumentType.SHIPPING_INSTRUCTION_PDF
        ),
        {
          id: `doc-${Math.random().toString(36).slice(2, 8)}`,
          type: DocumentType.PO_PDF,
          filename: generatedPoFilename,
          dataUrl: generatedPoDataUrl,
          uploadedBy: currentUser?.username || 'cs',
          uploadedAt: new Date().toISOString()
        },
        {
          id: `doc-${Math.random().toString(36).slice(2, 8)}`,
          type: DocumentType.SHIPPING_INSTRUCTION_PDF,
          filename: generatedSiFilename,
          dataUrl: generatedSiDataUrl,
          uploadedBy: currentUser?.username || 'cs',
          uploadedAt: new Date().toISOString()
        }
      ]
    }));

    if (canAccessDocumentType(DocumentType.PO_PDF)) {
      const link = document.createElement('a');
      link.href = generatedPoDataUrl;
      link.download = generatedPoFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    if (canAccessDocumentType(DocumentType.SHIPPING_INSTRUCTION_PDF)) {
      const link = document.createElement('a');
      link.href = generatedSiDataUrl;
      link.download = generatedSiFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    addActivity(
      'Set ETD (line)',
      currentUser?.username || 'cs',
      `${orderNo} / ${lineId}`
    );
    addNotification(
      `ETD set for ${orderNo} / ${line.poNo}: ${actualETD}. PO/SI generated, waiting Sale approval.`,
      Role.SALE,
      'email'
    );

    setPdfModalState(null);
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

    const vi = vesselInputs[lineId] || defaultVI();
    updateLine(orderNo, lineId, (item) => ({
      ...item,
      actualETD: date,
      feederVessel: vi.feeder || undefined,
      motherVessel: vi.mother || undefined,
      vesselCompany: vi.company || undefined,
      forwarder: vi.forwarder || undefined,
      vesselEta: vi.eta || undefined
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
      Role.CS,
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
      Role.SALE,
      'email'
    );
  };

  const approvedLines = visibleLines.filter((row) => {
    const { line } = getLine(row.orderNo, row.lineId);
    return line?.status === OrderLineStatus.APPROVED;
  });

  const receivedPoLines = visibleLines.filter((row) => {
    const { line } = getLine(row.orderNo, row.lineId);
    return line?.status === OrderLineStatus.VESSEL_SCHEDULED;
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
                      {line.poNo} • {getShipToName(line.shipToId)}
                    </p>
                  </div>

                  {/* Vessel info inputs */}
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        Vessel Information
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          handleFetchVesselView(line.id, line.shipToId)
                        }
                        disabled={!canRunLineAction}
                        className="text-xs px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:opacity-50 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-900/50 transition-colors"
                      >
                        Fetch from View
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="space-y-0.5">
                        <p className="ui-kicker text-slate-400 dark:text-slate-500">
                          Feeder Vessel
                        </p>
                        <input
                          type="text"
                          value={vesselInputs[line.id]?.feeder || ''}
                          onChange={(e) =>
                            setVI(line.id, 'feeder', e.target.value)
                          }
                          className="shadcn-input h-7 text-xs w-full"
                          disabled={!canRunLineAction}
                          placeholder="c_feeder"
                        />
                      </div>
                      <div className="space-y-0.5">
                        <p className="ui-kicker text-slate-400 dark:text-slate-500">
                          Mother Vessel
                        </p>
                        <input
                          type="text"
                          value={vesselInputs[line.id]?.mother || ''}
                          onChange={(e) =>
                            setVI(line.id, 'mother', e.target.value)
                          }
                          className="shadcn-input h-7 text-xs w-full"
                          disabled={!canRunLineAction}
                          placeholder="c_mother"
                        />
                      </div>
                      <div className="space-y-0.5">
                        <p className="ui-kicker text-slate-400 dark:text-slate-500">
                          Vessel Company
                        </p>
                        <input
                          type="text"
                          value={vesselInputs[line.id]?.company || ''}
                          onChange={(e) =>
                            setVI(line.id, 'company', e.target.value)
                          }
                          className="shadcn-input h-7 text-xs w-full"
                          disabled={!canRunLineAction}
                          placeholder="c_shpline"
                        />
                      </div>
                      <div className="space-y-0.5">
                        <p className="ui-kicker text-slate-400 dark:text-slate-500">
                          Forwarder
                        </p>
                        <input
                          type="text"
                          value={vesselInputs[line.id]?.forwarder || ''}
                          onChange={(e) =>
                            setVI(line.id, 'forwarder', e.target.value)
                          }
                          className="shadcn-input h-7 text-xs w-full"
                          disabled={!canRunLineAction}
                          placeholder="c_fwd"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="space-y-0.5">
                        <p className="ui-kicker text-slate-400 dark:text-slate-500">
                          Actual ETD
                        </p>
                        <input
                          type="date"
                          value={etdDates[line.id] || ''}
                          onChange={(e) =>
                            setEtdDates((prev) => ({
                              ...prev,
                              [line.id]: e.target.value
                            }))
                          }
                          className="shadcn-input h-7 text-xs w-full"
                          disabled={!canRunLineAction}
                        />
                      </div>
                      <div className="space-y-0.5">
                        <p className="ui-kicker text-slate-400 dark:text-slate-500">
                          Actual ETA
                        </p>
                        <input
                          type="date"
                          value={vesselInputs[line.id]?.eta || ''}
                          onChange={(e) =>
                            setVI(line.id, 'eta', e.target.value)
                          }
                          className="shadcn-input h-7 text-xs w-full"
                          disabled={!canRunLineAction}
                        />
                      </div>
                    </div>
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

      {/* PO/SI Generation Modal */}
      {pdfModalState &&
        (() => {
          const { order, line } = getLine(
            pdfModalState.orderNo,
            pdfModalState.lineId
          );
          if (!order || !line) return null;
          return (
            <PdfGenerationModal
              order={order}
              line={line}
              actualETD={pdfModalState.actualETD}
              onConfirm={handlePdfModalConfirm}
              onClose={() => setPdfModalState(null)}
            />
          );
        })()}
    </div>
  );
};
