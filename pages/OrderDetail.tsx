import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { OrderStatus, DocumentType, Role, OrderDocument } from '../types';
import {
  ArrowLeft,
  Download,
  FileText,
  CheckCircle2,
  Ship,
  ShieldCheck,
  Package,
  Calendar,
  Globe,
  Loader2,
  DollarSign,
  Upload,
  AlertCircle,
  User,
  Trash2,
  Save,
  Send
} from 'lucide-react';
import Swal from '../utils/swal';
import {
  getActualEtdRequiredAlert,
  getMissingFieldsAlert,
  getNoFilesSelectedAlert,
  getPriceRequiredAlert
} from '../utils/alertMessages';
import { useEffect } from 'react';

const escapePdfText = (value: string) =>
  value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

const buildSimplePdf = (
  blocks: Array<{ fontSize: number; lines: string[] }>
) => {
  const contentLines = ['BT', '/F1 11 Tf', '50 760 Td', '14 TL'];
  blocks.forEach((block, blockIndex) => {
    if (blockIndex > 0) {
      contentLines.push('T*');
    }
    contentLines.push(`/F1 ${block.fontSize} Tf`);
    block.lines.forEach((line, lineIndex) => {
      const prefix = blockIndex === 0 && lineIndex === 0 ? '' : 'T* ';
      contentLines.push(`${prefix}(${escapePdfText(line)}) Tj`);
    });
  });
  contentLines.push('ET');
  const content = contentLines.join('\n');
  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n',
    `4 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\n`,
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj\n'
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((obj) => {
    offsets.push(pdf.length);
    pdf += obj;
  });

  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  offsets.slice(1).forEach((offset) => {
    pdf += `${offset.toString().padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return pdf.replace(/[^\x00-\x7F]/g, '?');
};

const createPoPdfDataUrl = (
  blocks: Array<{ fontSize: number; lines: string[] }>
) => {
  const pdf = buildSimplePdf(blocks);
  return `data:application/pdf;base64,${btoa(pdf)}`;
};

const triggerDownload = (dataUrl: string, filename: string) => {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const OrderDetail: React.FC = () => {
  const { orderNo } = useParams();
  const navigate = useNavigate();
  const {
    orders,
    currentUser,
    updateOrder,
    deleteOrder,
    addActivity,
    addNotification,
    addIntegrationLog,
    companies
  } = useStore();

  const [processing, setProcessing] = useState(false);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [currencies, setCurrencies] = useState<Record<string, string>>({});
  const [etdDates, setEtdDates] = useState<Record<string, string>>({});
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<DocumentType>(
    DocumentType.SHIPPING_DOC
  );
  const [selectedFiles, setSelectedFiles] = useState<
    Record<DocumentType, File | null>
  >({} as Record<DocumentType, File | null>);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const order = orders.find((o) => o.orderNo === orderNo);
  const companyName =
    companies.find((c) => c.id === order?.customerCompanyId)?.name ||
    order?.customerCompanyId ||
    'Unknown Customer';

  const wrapText = (value: string, width: number) => {
    const words = value.split(' ');
    const lines: string[] = [];
    let current = '';

    words.forEach((word) => {
      const next = current ? `${current} ${word}` : word;
      if (next.length > width) {
        if (current) lines.push(current);
        current = word;
      } else {
        current = next;
      }
    });

    if (current) lines.push(current);
    return lines.length ? lines : [''];
  };

  // Populate default values from saved data when order is loaded
  useEffect(() => {
    if (order) {
      const initialPrices: Record<string, number> = {};
      const initialCurrencies: Record<string, string> = {};
      const initialETDs: Record<string, string> = {};

      order.items.forEach((item) => {
        if (item.price) {
          initialPrices[item.id] = item.price;
        }
        if (item.currency) {
          initialCurrencies[item.id] = item.currency;
        }
        if (item.actualETD) {
          initialETDs[item.id] = item.actualETD;
        }
      });

      setPrices(initialPrices);
      setCurrencies(initialCurrencies);
      setEtdDates(initialETDs);
    }
  }, [order?.orderNo]);

  if (!order)
    return (
      <div className="p-20 text-center font-bold text-slate-400">
        Resource not found.
      </div>
    );

  const handleApprove = async () => {
    // Validate that all items have prices
    const missingPrices = order.items.filter(
      (item) => !prices[item.id] && !item.price
    );

    if (missingPrices.length > 0) {
      Swal.fire(getPriceRequiredAlert(missingPrices.length));
      return;
    }

    setProcessing(true);

    // Step 2.1: Sale approval + CRM integration
    addActivity(
      'Sale Approve',
      currentUser!.username,
      `Approved order ${order.orderNo} for CRM sync`
    );

    await new Promise((r) => setTimeout(r, 2000));
    const updatedItems = order.items.map((item) => ({
      ...item,
      price: prices[item.id] || item.price || 0,
      currency: currencies[item.id] || item.currency || 'USD'
    }));

    updateOrder(order.orderNo, {
      status: OrderStatus.CONFIRMED,
      items: updatedItems
    });
    addIntegrationLog({
      orderNo: order.orderNo,
      status: 'SUCCESS',
      message: 'Order synced to CRM successfully. SAP record created.'
    });
    addNotification(
      `Order ${order.orderNo} confirmed and synced to CRM`,
      Role.SALE,
      'system'
    );

    Swal.fire({
      icon: 'success',
      title: 'Order Approved',
      text: `Order ${order.orderNo} has been approved and synced to CRM`,
      timer: 2000,
      showConfirmButton: false
    });

    // Step 2.2: Simulate CRM callback (Quotation creation)
    setTimeout(() => {
      const quotationNo = 'QT-' + Math.floor(100000 + Math.random() * 900000);
      updateOrder(order.orderNo, { quotationNo });
      addNotification(
        `Quotation ${quotationNo} created for Order ${order.orderNo}. Ready for customer review.`,
        Role.UBE_JAPAN,
        'email'
      );
      addActivity(
        'CRM Callback',
        'CRM System',
        `Quotation ${quotationNo} auto-generated for ${order.orderNo}`
      );
      console.log(
        `[CRM Callback] Quotation ${quotationNo} created for ${order.orderNo}`
      );
    }, 5000);

    setProcessing(false);
  };

  const handleSetETD = () => {
    // Check if all items have ETD dates
    const hasAllDates = order.items.every((item) => etdDates[item.id]);

    if (!hasAllDates) {
      Swal.fire(getActualEtdRequiredAlert(order.items.length));
      return;
    }

    // Update each item with its own actualETD
    const updatedItems = order.items.map((item) => ({
      ...item,
      actualETD: etdDates[item.id]
    }));

    updateOrder(order.orderNo, {
      status: OrderStatus.VESSEL_SCHEDULED,
      items: updatedItems
    });
    addActivity(
      'Set ETD',
      currentUser!.username,
      `Vessel scheduled for ${order.orderNo} with ${order.items.length} lines`
    );
    addNotification(
      `Vessel Scheduled: ${order.orderNo}`,
      Role.UBE_JAPAN,
      'email'
    );
    Swal.fire({
      icon: 'success',
      title: 'Vessel Scheduled',
      text: `ETD set successfully for ${order.orderNo}`,
      timer: 2000,
      showConfirmButton: false
    });
  };

  const buildPoBlocks = () => {
    const noteText = order.note?.trim() || '-';
    const noteLines = wrapText(noteText, 64).map(
      (line, index) => `${index === 0 ? 'Note' : '    '} : ${line}`
    );
    const headerLines = [
      'PURCHASE ORDER',
      '------------------------------',
      `Order No : ${order.orderNo}`,
      `Order Date : ${formatDate(order.orderDate)}`,
      `Customer : ${companyName}`,
      ...noteLines,
      ''
    ];
    const tableHeader = [
      'LN  PO NO       GRADE      QTY  DEST    TERM  ETD        ETA        ACT ETD    PRICE'
    ];
    const tableDivider = [
      '--  ----------  ---------  ---- ------- ---- ---------- ---------- ---------- ------------'
    ];
    const tableRows = order.items.map((item, index) => {
      const line = String(index + 1).padEnd(2, ' ');
      const poNo = item.poNo.padEnd(10, ' ').slice(0, 10);
      const grade = item.gradeId.padEnd(9, ' ').slice(0, 9);
      const qty = String(item.qty).padStart(4, ' ').slice(-4);
      const dest = item.destinationId.padEnd(7, ' ').slice(0, 7);
      const term = item.termId.padEnd(4, ' ').slice(0, 4);
      const etdValue = item.asap ? 'ASAP' : item.requestETD || '';
      const etaValue = item.asap ? 'ASAP' : item.requestETA || '';
      const etd = etdValue.padEnd(10, ' ').slice(0, 10);
      const eta = etaValue.padEnd(10, ' ').slice(0, 10);
      const actual = (item.actualETD || '').padEnd(10, ' ').slice(0, 10);
      const priceNumber = item.price ?? prices[item.id];
      const priceCurrency = item.currency ?? currencies[item.id];
      const formattedPrice =
        priceNumber != null
          ? new Intl.NumberFormat('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            }).format(priceNumber)
          : '';
      const priceValue = formattedPrice
        ? priceCurrency
          ? `${formattedPrice} ${priceCurrency}`
          : formattedPrice
        : '';
      const price = priceValue.trim().padEnd(12, ' ').slice(0, 12);
      return `${line}  ${poNo}  ${grade}  ${qty} ${dest} ${term} ${etd} ${eta} ${actual} ${price}`;
    });

    return [
      { fontSize: 14, lines: headerLines },
      { fontSize: 9, lines: tableHeader },
      { fontSize: 9, lines: tableDivider },
      { fontSize: 9, lines: tableRows }
    ];
  };

  const handleGeneratePO = () => {
    const filename = `PO_${order.orderNo}.pdf`;
    const dataUrl = createPoPdfDataUrl(buildPoBlocks());
    triggerDownload(dataUrl, filename);

    updateOrder(order.orderNo, {
      status: OrderStatus.RECEIVED_ACTUAL_PO,
      documents: [
        ...order.documents.filter((doc) => doc.type !== DocumentType.PO_PDF),
        {
          id: 'doc-' + Math.random().toString(36).substr(2, 5),
          type: DocumentType.PO_PDF,
          filename,
          dataUrl,
          uploadedAt: new Date().toISOString(),
          uploadedBy: currentUser!.username
        }
      ]
    });
    addActivity(
      'Generate PO',
      currentUser!.username,
      `Generated PO PDF for ${order.orderNo}`
    );
    addNotification(`PO Generated for ${order.orderNo}`, Role.CS, 'system');
    Swal.fire({
      icon: 'success',
      title: 'PO Generated',
      text: `Purchase Order PDF created for ${order.orderNo}`,
      timer: 2000,
      showConfirmButton: false
    });
  };

  const handleDownloadDoc = (doc: OrderDocument) => {
    if (
      !currentUser?.allowedDocumentTypes.includes(doc.type) &&
      currentUser?.role !== Role.ADMIN
    ) {
      Swal.fire({
        icon: 'error',
        title: 'Access Denied',
        text: `You don't have permission to download ${doc.type} documents.`,
        confirmButtonColor: '#4F46E5'
      });
      addActivity(
        'Download Denied',
        currentUser!.username,
        `Attempted to download ${doc.filename} without permission`
      );
      return;
    }

    if (doc.dataUrl) {
      triggerDownload(doc.dataUrl, doc.filename);
      addActivity(
        'Download Document',
        currentUser!.username,
        `Downloaded ${doc.filename}`
      );
      return;
    }

    if (doc.type === DocumentType.PO_PDF) {
      const filename = `PO_${order.orderNo}.pdf`;
      triggerDownload(createPoPdfDataUrl(buildPoBlocks()), filename);
      addActivity(
        'Download Document',
        currentUser!.username,
        `Downloaded ${filename}`
      );
      return;
    }

    // Simulate download
    addActivity(
      'Download Document',
      currentUser!.username,
      `Downloaded ${doc.filename}`
    );
    Swal.fire({
      icon: 'success',
      title: 'Download Started',
      text: `Downloading: ${doc.filename}`,
      timer: 2000,
      showConfirmButton: false
    });
  };

  const handleUploadDocs = () => {
    const filesToUpload = Object.entries(selectedFiles).filter(
      ([_, file]) => file !== null
    );

    if (filesToUpload.length === 0) {
      Swal.fire(getNoFilesSelectedAlert());
      return;
    }

    setUploadingDocs(true);

    // Upload all files and collect new documents
    const newDocs: OrderDocument[] = [];
    filesToUpload.forEach(([docType, file]) => {
      const uploadFile = file as File;
      const newDoc = {
        id: 'doc-' + Math.random().toString(36).substr(2, 5),
        type: docType as DocumentType,
        filename: uploadFile.name,
        uploadedAt: new Date().toISOString(),
        uploadedBy: currentUser!.username
      };
      newDocs.push(newDoc);

      addActivity(
        'Upload Document',
        currentUser!.username,
        `Uploaded ${docType} for ${order.orderNo}`
      );
    });

    // Simulate upload delay then update all at once
    setTimeout(() => {
      const currentDocs = order.documents || [];
      const allDocs = [...currentDocs, ...newDocs];

      // Check if all required docs are present
      const hasShippingDoc = allDocs.some(
        (d) => d.type === DocumentType.SHIPPING_DOC
      );
      const hasBL = allDocs.some((d) => d.type === DocumentType.BL);

      // Update order with documents
      updateOrder(order.orderNo, {
        documents: allDocs
      });

      // If all required docs are uploaded, also update status
      if (
        hasShippingDoc &&
        hasBL &&
        order.status === OrderStatus.RECEIVED_ACTUAL_PO
      ) {
        updateOrder(order.orderNo, {
          status: OrderStatus.VESSEL_DEPARTED,
          documents: allDocs
        });
        addNotification(
          `Vessel Departed: ${order.orderNo}`,
          Role.UBE_JAPAN,
          'email'
        );
        Swal.fire({
          icon: 'success',
          title: 'Status Updated',
          text: `Order ${order.orderNo} marked as Vessel Departed`,
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        Swal.fire({
          icon: 'success',
          title: 'Documents Uploaded',
          text: `${filesToUpload.length} document(s) uploaded successfully`,
          timer: 2000,
          showConfirmButton: false
        });
      }

      setSelectedFiles({} as Record<DocumentType, File | null>);
      setUploadingDocs(false);
    }, 1500);
  };

  const steps = [
    { label: 'Draft', status: OrderStatus.DRAFT, role: 'Trader' },
    { label: 'Created', status: OrderStatus.CREATED, role: 'Trader' },
    { label: 'Confirmed', status: OrderStatus.CONFIRMED, role: 'Sale' },
    {
      label: 'Vessel Scheduled',
      status: OrderStatus.VESSEL_SCHEDULED,
      role: 'CS'
    },
    {
      label: 'Received Actual PO',
      status: OrderStatus.RECEIVED_ACTUAL_PO,
      role: 'Trader'
    },
    { label: 'Departed', status: OrderStatus.VESSEL_DEPARTED, role: 'CS' }
  ];
  const activeIdx = steps.findIndex((s) => s.status === order.status);

  const handleDeleteOrder = async () => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Delete Order?',
      text: `Are you sure you want to delete order ${order.orderNo}? This action cannot be undone.`,
      showCancelButton: true,
      confirmButtonColor: '#DC2626',
      cancelButtonColor: '#64748B',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      deleteOrder(order.orderNo);
      Swal.fire({
        icon: 'success',
        title: 'Order Deleted',
        text: `Order ${order.orderNo} has been deleted`,
        timer: 1500,
        showConfirmButton: false
      });
      setTimeout(() => {
        navigate('/orders');
      }, 1500);
    }
  };

  const handleSubmitDraft = async () => {
    // Validate required fields
    const missingFields: string[] = [];

    order.items.forEach((item, index) => {
      if (!item.poNo) missingFields.push(`Line ${index + 1}: PO Number`);
      if (!item.destinationId)
        missingFields.push(`Line ${index + 1}: Destination`);
      if (!item.termId) missingFields.push(`Line ${index + 1}: Term`);
      if (!item.gradeId) missingFields.push(`Line ${index + 1}: Grade`);
      if (!item.asap && !item.requestETD && !item.requestETA) {
        missingFields.push(`Line ${index + 1}: ETD or ETA`);
      }
      if (!item.qty || item.qty < 1)
        missingFields.push(`Line ${index + 1}: Quantity`);
    });

    if (missingFields.length > 0) {
      Swal.fire(getMissingFieldsAlert(missingFields));
      return;
    }

    const result = await Swal.fire({
      icon: 'question',
      title: 'Submit Order?',
      text: `Submit order ${order.orderNo} to Sale for review?`,
      showCancelButton: true,
      confirmButtonColor: '#4F46E5',
      cancelButtonColor: '#64748B',
      confirmButtonText: 'Yes, Submit',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      updateOrder(order.orderNo, { status: OrderStatus.CREATED });
      addActivity(
        'Submit Order',
        currentUser!.username,
        `Submitted draft order ${order.orderNo} for review`
      );
      addNotification(
        `Order ${order.orderNo} submitted for review`,
        Role.SALE,
        'email'
      );
      Swal.fire({
        icon: 'success',
        title: 'Order Submitted',
        text: `Order ${order.orderNo} has been submitted for review`,
        timer: 1500,
        showConfirmButton: false
      });
    }
  };

  const canDelete =
    order.status === OrderStatus.DRAFT &&
    (order.createdBy === currentUser?.username ||
      currentUser?.role === Role.ADMIN);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10 px-4">
      <div className="flex items-center justify-between border-b dark:border-slate-800 pb-4">
        <button
          onClick={() => navigate('/orders')}
          className="flex items-center gap-1 text-slate-400 hover:text-slate-900 dark:hover:text-white text-[10px] font-bold uppercase tracking-wider transition-colors"
        >
          <ArrowLeft size={12} /> Back
        </button>
        <div className="flex items-center gap-3">
          {canDelete && (
            <button
              onClick={handleDeleteOrder}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-950/50 transition-all"
            >
              <Trash2 size={12} /> Delete Order
            </button>
          )}
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">
              Order Ref
            </span>
            <span className="text-xs font-bold dark:text-white leading-none">
              {order.orderNo}
            </span>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase border ${
              order.status === OrderStatus.DRAFT
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                : order.status === OrderStatus.CREATED
                  ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900'
                  : order.status === OrderStatus.CONFIRMED
                    ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900'
                    : order.status === OrderStatus.VESSEL_SCHEDULED
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900'
                      : order.status === OrderStatus.RECEIVED_ACTUAL_PO
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-900'
                        : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900'
            }`}
          >
            {order.status === OrderStatus.DRAFT && <FileText size={12} />}
            {order.status === OrderStatus.CREATED && <FileText size={12} />}
            {order.status === OrderStatus.CONFIRMED && (
              <CheckCircle2 size={12} />
            )}
            {order.status === OrderStatus.VESSEL_SCHEDULED && (
              <Ship size={12} />
            )}
            {order.status === OrderStatus.RECEIVED_ACTUAL_PO && (
              <Package size={12} />
            )}
            {order.status === OrderStatus.VESSEL_DEPARTED && (
              <CheckCircle2 size={12} />
            )}
            {order.status.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      {/* Order Note */}
      {order.note && (
        <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
            <span className="font-bold text-slate-900 dark:text-white">
              Note:
            </span>{' '}
            {order.note}
          </p>
        </div>
      )}

      {/* Process Stepper */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex items-center justify-between shadow-sm">
        {steps.map((s, i) => (
          <div
            key={s.label}
            className="flex flex-col items-center flex-1 relative group"
          >
            <div
              className={`w-3 h-3 rounded-full z-10 border-2 ${i <= activeIdx ? 'bg-indigo-600 border-indigo-600' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}
            ></div>
            <div className="flex flex-col items-center mt-2">
              <span
                className={`text-[9px] font-black uppercase tracking-tight ${i <= activeIdx ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}
              >
                {s.label}
              </span>
              <span className="text-[8px] text-slate-300 dark:text-slate-600 font-bold uppercase group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors mt-0.5">
                {s.role}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`absolute top-[4.5px] left-1/2 w-full h-[1.5px] ${i < activeIdx ? 'bg-indigo-600' : 'bg-slate-100 dark:bg-slate-800'}`}
              ></div>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 space-y-4">
          {/* Action Hub */}
          <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <ShieldCheck size={48} className="text-indigo-600" />
            </div>

            <div className="flex items-center gap-2 mb-3">
              <div
                className={`p-1 rounded bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600`}
              >
                <User size={12} />
              </div>
              <h3 className="text-[10px] font-black uppercase text-indigo-600 tracking-[0.1em]">
                Current Required Action: {currentUser?.role}
              </h3>
            </div>

            <div className="min-h-[60px] flex items-center">
              {/* Trader: Draft Status - Edit and Submit */}
              {(currentUser?.role === Role.MAIN_TRADER ||
                currentUser?.role === Role.UBE_JAPAN ||
                currentUser?.role === Role.ADMIN) &&
                order.status === OrderStatus.DRAFT && (
                  <div className="flex flex-col w-full gap-3">
                    <div className="space-y-0.5">
                      <p className="text-[11px] font-bold dark:text-white">
                        Draft Order - Ready to Submit
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        This order is in draft status. You can edit it in the
                        Orders list or submit it for Sale review.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          navigate(`/orders/edit/${order.orderNo}`)
                        }
                        className="flex-1 h-10 px-4 bg-slate-600 text-white text-sm font-bold rounded-xl hover:bg-slate-700 transition-all flex items-center justify-center gap-2 shadow-lg"
                      >
                        <FileText size={16} />
                        Edit Order
                      </button>
                      <button
                        onClick={handleSubmitDraft}
                        className="flex-1 h-10 px-4 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                      >
                        <Send size={16} />
                        Submit to Sale
                      </button>
                    </div>
                  </div>
                )}

              {/* Sale: Step 2 */}
              {(currentUser?.role === Role.SALE ||
                currentUser?.role === Role.SALE_MANAGER ||
                currentUser?.role === Role.ADMIN) &&
                order.status === OrderStatus.CREATED && (
                  <div className="flex flex-col w-full gap-3">
                    <div className="space-y-0.5">
                      <p className="text-[11px] font-bold dark:text-white">
                        Commercial Verification Required
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Set price and currency for each line item before CRM
                        synchronization.
                      </p>
                    </div>
                    <div className="space-y-2 max-h-[240px] overflow-y-auto">
                      {order.items.map((item, idx) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 p-3 bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-700"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-slate-900 dark:text-white truncate">
                              Line {idx + 1}: {item.poNo} - {item.gradeId}
                            </p>
                            <p className="text-[9px] text-slate-500 dark:text-slate-400">
                              Qty: {item.qty.toLocaleString()} units
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-28">
                              <input
                                type="number"
                                step="0.01"
                                className="shadcn-input h-8 text-xs bg-white dark:bg-slate-950"
                                value={prices[item.id] || ''}
                                onChange={(e) =>
                                  setPrices({
                                    ...prices,
                                    [item.id]: parseFloat(e.target.value)
                                  })
                                }
                                placeholder="Price"
                              />
                            </div>
                            <div className="w-20">
                              <select
                                className="shadcn-input h-8 text-xs bg-white dark:bg-slate-950"
                                value={currencies[item.id] || 'USD'}
                                onChange={(e) =>
                                  setCurrencies({
                                    ...currencies,
                                    [item.id]: e.target.value
                                  })
                                }
                              >
                                <option value="USD">USD</option>
                                <option value="THB">THB</option>
                                <option value="JPY">JPY</option>
                                <option value="EUR">EUR</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          // Save Draft: บันทึกข้อมูลโดยไม่เปลี่ยน status
                          const updatedItems = order.items.map((item) => ({
                            ...item,
                            price: prices[item.id] || item.price || 0,
                            currency:
                              currencies[item.id] || item.currency || 'USD'
                          }));
                          updateOrder(order.orderNo, { items: updatedItems });
                          addActivity(
                            'Save Draft',
                            currentUser!.username,
                            `Saved price data for order ${order.orderNo}`
                          );
                          Swal.fire({
                            icon: 'success',
                            title: 'Draft Saved',
                            text: 'Price data has been saved',
                            timer: 1500,
                            showConfirmButton: false
                          });
                        }}
                        disabled={processing}
                        className="flex-1 h-10 px-4 bg-slate-600 text-white text-sm font-bold rounded-xl hover:bg-slate-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg"
                      >
                        <Save size={16} />
                        Save Draft
                      </button>
                      <button
                        onClick={handleApprove}
                        disabled={processing}
                        className="flex-1 h-10 px-4 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                      >
                        {processing ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <CheckCircle2 size={16} />
                        )}
                        {processing ? 'Syncing to CRM...' : 'Approve & Send'}
                      </button>
                    </div>
                  </div>
                )}

              {/* CS: Step 3 */}
              {(currentUser?.role === Role.CS ||
                currentUser?.role === Role.ADMIN) &&
                order.status === OrderStatus.CONFIRMED && (
                  <div className="flex flex-col w-full gap-3">
                    <div className="space-y-0.5">
                      <p className="text-[11px] font-bold dark:text-white">
                        Vessel Scheduling & Logistics
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        CRM confirm received. Set actual ETD per line and
                        confirm scheduling.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                        Set Actual ETD per Line
                      </label>
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="p-3 bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-700"
                        >
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <div className="flex-1">
                              <span className="text-xs font-bold text-slate-900 dark:text-white">
                                {item.poNo}
                              </span>
                              <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">
                                {item.gradeId} (x{item.qty})
                              </span>
                            </div>
                            <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                              Req. ETA: {item.requestETA}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-slate-400" />
                            <input
                              type="date"
                              className="shadcn-input h-8 text-xs flex-1 bg-white dark:bg-slate-950"
                              value={etdDates[item.id] || ''}
                              onChange={(e) =>
                                setEtdDates({
                                  ...etdDates,
                                  [item.id]: e.target.value
                                })
                              }
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          // Save Draft: บันทึก ETD โดยไม่เปลี่ยน status
                          const updatedItems = order.items.map((item) => ({
                            ...item,
                            actualETD: etdDates[item.id] || item.actualETD || ''
                          }));
                          updateOrder(order.orderNo, { items: updatedItems });
                          addActivity(
                            'Save Draft',
                            currentUser!.username,
                            `Saved ETD data for order ${order.orderNo}`
                          );
                          Swal.fire({
                            icon: 'success',
                            title: 'Draft Saved',
                            text: 'ETD data has been saved',
                            timer: 1500,
                            showConfirmButton: false
                          });
                        }}
                        className="flex-1 h-10 px-4 bg-slate-600 text-white text-sm font-bold rounded-xl hover:bg-slate-700 transition-all flex items-center justify-center gap-2 shadow-lg"
                      >
                        <Save size={16} /> Save Draft
                      </button>
                      <button
                        onClick={handleSetETD}
                        className="flex-1 h-10 px-4 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                      >
                        <CheckCircle2 size={16} /> Confirm & Send
                      </button>
                    </div>
                  </div>
                )}

              {/* Trader: Step 4 */}
              {(currentUser?.role === Role.MAIN_TRADER ||
                currentUser?.role === Role.UBE_JAPAN ||
                currentUser?.role === Role.ADMIN) &&
                order.status === OrderStatus.VESSEL_SCHEDULED && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-3">
                    <div className="space-y-0.5">
                      <p className="text-[11px] font-bold dark:text-white">
                        Generate Official PO Document
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Logistics confirmed. Finalize the order by generating
                        the formal PO PDF.
                      </p>
                    </div>
                    <button
                      onClick={handleGeneratePO}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20"
                    >
                      <FileText size={14} /> Generate PO
                    </button>
                  </div>
                )}

              {/* CS: Step 5 */}
              {(currentUser?.role === Role.CS ||
                currentUser?.role === Role.ADMIN) &&
                order.status === OrderStatus.RECEIVED_ACTUAL_PO && (
                  <div className="flex flex-col w-full gap-3">
                    <div className="space-y-0.5">
                      <p className="text-[11px] font-bold dark:text-white">
                        Documentation Finalization
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Upload shipping documents.{' '}
                        <span className="text-rose-600 dark:text-rose-400 font-bold">
                          Required: Shipping Doc + BL
                        </span>{' '}
                        to mark as departed.
                      </p>
                    </div>
                    <div className="space-y-2">
                      {[
                        {
                          type: DocumentType.SHIPPING_DOC,
                          label: 'Shipping Document',
                          required: true
                        },
                        {
                          type: DocumentType.BL,
                          label: 'Bill of Lading',
                          required: true
                        },
                        {
                          type: DocumentType.INVOICE,
                          label: 'Invoice',
                          required: false
                        },
                        {
                          type: DocumentType.COA,
                          label: 'Certificate of Analysis',
                          required: false
                        }
                      ]
                        .filter(
                          (doc) =>
                            currentUser?.role === Role.ADMIN ||
                            currentUser?.allowedDocumentTypes.includes(doc.type)
                        )
                        .map((doc) => {
                          const hasDoc = order.documents.some(
                            (d) => d.type === doc.type
                          );
                          return (
                            <div
                              key={doc.type}
                              className="flex items-center justify-between p-3 bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-700"
                            >
                              <div className="flex items-center gap-3">
                                <FileText
                                  size={14}
                                  className={
                                    hasDoc
                                      ? 'text-emerald-600 dark:text-emerald-400'
                                      : 'text-slate-400'
                                  }
                                />
                                <div className="flex-1">
                                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                                    {doc.label}
                                    {doc.required && (
                                      <span className="text-rose-500 ml-1">
                                        *
                                      </span>
                                    )}
                                  </p>
                                  {hasDoc && (
                                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                                      ✓ Uploaded
                                    </p>
                                  )}
                                  {selectedFiles[doc.type] && (
                                    <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                                      Selected: {selectedFiles[doc.type]!.name}
                                    </p>
                                  )}
                                </div>
                              </div>
                              {!hasDoc && (
                                <label className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1.5 hover:bg-indigo-700 cursor-pointer transition-all">
                                  <Upload size={12} />
                                  {selectedFiles[doc.type]
                                    ? 'Change'
                                    : 'Select'}
                                  <input
                                    type="file"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        setSelectedFiles((prev) => ({
                                          ...prev,
                                          [doc.type]: file
                                        }));
                                      }
                                    }}
                                    disabled={uploadingDocs}
                                  />
                                </label>
                              )}
                            </div>
                          );
                        })}
                    </div>
                    {Object.keys(selectedFiles).length > 0 && (
                      <button
                        onClick={handleUploadDocs}
                        disabled={uploadingDocs}
                        className="w-full bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/20"
                      >
                        {uploadingDocs ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload size={14} />
                            Upload & Send (
                            {
                              Object.values(selectedFiles).filter(
                                (f) => f !== null
                              ).length
                            }
                            )
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}

              {order.status === OrderStatus.VESSEL_DEPARTED && (
                <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 p-2.5 rounded-md w-full">
                  <CheckCircle2
                    size={14}
                    className="text-emerald-600 shrink-0"
                  />
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-tight">
                    Supply chain workflow successfully closed. Vessel has
                    departed.
                  </span>
                </div>
              )}

              {/* Role/Status Mismatch Fallback */}
              {![OrderStatus.VESSEL_DEPARTED].includes(order.status) &&
                currentUser?.role !== Role.ADMIN &&
                !(
                  ((currentUser?.role === Role.SALE ||
                    currentUser?.role === Role.SALE_MANAGER) &&
                    order.status === OrderStatus.CREATED) ||
                  (currentUser?.role === Role.CS &&
                    (order.status === OrderStatus.CONFIRMED ||
                      order.status === OrderStatus.RECEIVED_ACTUAL_PO)) ||
                  ((currentUser?.role === Role.MAIN_TRADER ||
                    currentUser?.role === Role.UBE_JAPAN) &&
                    order.status === OrderStatus.VESSEL_SCHEDULED)
                ) && (
                  <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 italic text-[10px] font-medium">
                    <AlertCircle size={12} /> Waiting for another role to
                    complete the next step...
                  </div>
                )}
            </div>
          </div>

          {/* Consignment Items */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
              <h3 className="text-xs font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                Detailed Consignment Lines
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider min-w-[140px]">
                      PO Ref.
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider min-w-[120px]">
                      Grade
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider min-w-[140px]">
                      Destination
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider min-w-[100px]">
                      Term
                    </th>
                    <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider min-w-[80px]">
                      Qty
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider min-w-[110px]">
                      Req. ETD
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider min-w-[110px]">
                      Req. ETA
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider min-w-[110px]">
                      Actual ETD
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider min-w-[110px]">
                      Price
                    </th>
                    <th className="px-4 py-3 text-center text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider min-w-[70px]">
                      ASAP
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {order.items.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-3 py-2 font-bold text-slate-900 dark:text-white text-xs">
                        {item.poNo}
                      </td>
                      <td className="px-3 py-2 text-slate-600 dark:text-slate-400 text-xs">
                        {item.gradeId}
                      </td>
                      <td className="px-3 py-2 text-slate-600 dark:text-slate-400 text-xs">
                        {item.destinationId}
                      </td>
                      <td className="px-3 py-2 text-slate-600 dark:text-slate-400 text-xs">
                        {item.termId}
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-slate-900 dark:text-white tabular-nums text-xs">
                        {item.qty.toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-slate-500 dark:text-slate-400 font-medium tabular-nums text-xs">
                        {item.requestETD}
                      </td>
                      <td className="px-3 py-2 text-slate-500 dark:text-slate-400 font-medium tabular-nums text-xs">
                        {item.requestETA}
                      </td>
                      <td className="px-3 py-2">
                        {item.actualETD ? (
                          <span className="text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1 text-xs">
                            {item.actualETD}
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-700 text-xs">
                            -
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {item.price ? (
                          <span className="text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                            ${item.price.toFixed(2)} {item.currency || 'USD'}
                          </span>
                        ) : (
                          <span className="text-[9px] font-black text-amber-500 uppercase bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded tracking-tighter">
                            Awaiting
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {item.asap ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                            ASAP
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-700">
                            -
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-4 shadow-sm">
            <h3 className="text-xs font-black uppercase text-slate-400 dark:text-slate-500 border-b dark:border-slate-800 pb-2 tracking-wider">
              Metadata
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">
                  Created By
                </span>
                <span className="text-sm font-bold dark:text-white">
                  {order.createdBy}
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">
                  Submitted
                </span>
                <span className="text-sm font-bold dark:text-white">
                  {formatDate(order.orderDate)}
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-bold uppercase flex items-center gap-1">
                  <FileText size={10} /> CRM QT
                </span>
                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                  {order.quotationNo || '-'}
                </span>
              </div>
            </div>
            {order.note && (
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg text-xs text-slate-600 dark:text-slate-400 italic border border-slate-100 dark:border-slate-800 leading-relaxed">
                "{order.note}"
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3 shadow-sm">
            <h3 className="text-xs font-black uppercase text-slate-400 dark:text-slate-500 border-b dark:border-slate-800 pb-2 tracking-wider flex items-center gap-2">
              <FileText size={14} /> Documentation
            </h3>
            <div className="space-y-1.5">
              {order.documents.length > 0 ? (
                order.documents.map((doc) => {
                  const hasPermission =
                    currentUser?.allowedDocumentTypes.includes(doc.type);
                  return (
                    <div
                      key={doc.id}
                      className={`flex items-center justify-between p-2.5 rounded-lg border group/doc transition-all ${
                        hasPermission
                          ? 'bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900'
                          : 'bg-rose-50/30 dark:bg-rose-950/10 border-rose-100 dark:border-rose-900/30'
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <FileText
                          size={14}
                          className={
                            hasPermission
                              ? 'text-indigo-600 dark:text-indigo-400'
                              : 'text-rose-400 dark:text-rose-500'
                          }
                        />
                        <div className="min-w-0">
                          <p
                            className={`text-[10px] font-bold truncate leading-none ${hasPermission ? 'text-slate-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'}`}
                          >
                            {doc.filename}
                          </p>
                          <p className="text-[8px] text-slate-400 dark:text-slate-500 uppercase font-bold mt-0.5">
                            {doc.type}
                          </p>
                        </div>
                      </div>
                      {hasPermission ? (
                        <button
                          onClick={() => handleDownloadDoc(doc)}
                          className="text-slate-300 dark:text-slate-600 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors p-1.5 group-hover/doc:bg-indigo-50 dark:group-hover/doc:bg-indigo-900/30 rounded"
                        >
                          <Download size={12} />
                        </button>
                      ) : (
                        <span className="text-[8px] font-black text-rose-500 dark:text-rose-400 uppercase px-2 py-1 bg-rose-100 dark:bg-rose-900/30 rounded">
                          No Access
                        </span>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6">
                  <FileText
                    size={24}
                    className="mx-auto text-slate-300 dark:text-slate-700 mb-2"
                  />
                  <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                    No documents uploaded yet
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
