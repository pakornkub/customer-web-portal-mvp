import React, { useState } from 'react';
import { useStore } from '../store';
import { OrderStatus, Role, DocumentType } from '../types';
import {
  Truck,
  AlertTriangle,
  Calendar,
  CheckCircle,
  Upload,
  Package,
  Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';

export const CSDashboard: React.FC = () => {
  const { orders, updateOrder, addNotification, addActivity, currentUser } =
    useStore();
  const [etdDates, setEtdDates] = useState<
    Record<string, Record<string, string>>
  >({});
  const [uploadingOrder, setUploadingOrder] = useState<string | null>(null);
  const [selectedDocType, setSelectedDocType] =
    useState<string>('Shipping Document');
  const [selectedFiles, setSelectedFiles] = useState<
    Record<string, File | null>
  >({});
  const [uploadingDocs, setUploadingDocs] = useState(false);

  const urgentOrders = orders.filter(
    (o) =>
      o.status === OrderStatus.CONFIRMED &&
      (o.items.some((i) => i.asap) || true) // Simplified: all confirmed need CS action
  );

  const departPending = orders.filter(
    (o) => o.status === OrderStatus.RECEIVED_PO
  );

  const handleSubmitETD = (orderNo: string) => {
    const order = orders.find((o) => o.orderNo === orderNo);
    if (!order) return;

    const orderEtds = etdDates[orderNo] || {};
    const missingEtds = order.items.filter((item) => !orderEtds[item.id]);

    if (missingEtds.length > 0) {
      Swal.fire({
        icon: 'warning',
        title: 'ETD Required',
        text: `Please set ETD for all ${order.items.length} line items`,
        confirmButtonColor: '#4F46E5'
      });
      return;
    }

    // Update items with their actualETD
    const updatedItems = order.items.map((item) => ({
      ...item,
      actualETD: orderEtds[item.id]
    }));

    updateOrder(orderNo, {
      status: OrderStatus.VESSEL_BOOKED,
      items: updatedItems
    });

    addActivity(
      'Set ETD',
      'CS',
      `Vessel booked for order ${orderNo} with ${order.items.length} lines`
    );
    addNotification(`Vessel Booked: ${orderNo}`, Role.UBE_JAPAN, 'email');
    Swal.fire({
      icon: 'success',
      title: 'Logistics Confirmed',
      text: `Vessel booking confirmed for ${orderNo}`,
      timer: 2000,
      showConfirmButton: false
    });
  };

  const handleUploadDocs = (orderNo: string) => {
    setUploadingOrder(orderNo);
  };

  const handleSubmitDocument = (orderNo: string) => {
    const filesToUpload = Object.entries(selectedFiles).filter(
      ([_, file]) => file !== null
    );

    if (filesToUpload.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Files Selected',
        text: 'Please select at least one file to upload',
        confirmButtonColor: '#4F46E5'
      });
      return;
    }

    setUploadingDocs(true);
    const order = orders.find((o) => o.orderNo === orderNo);
    if (!order) return;

    // Upload all selected files
    let uploadDelay = 0;
    filesToUpload.forEach(([docType, file], index) => {
      setTimeout(() => {
        const uploadFile = file as File;

        // Map string type to DocumentType enum
        let mappedDocType: DocumentType;
        if (docType === 'Shipping Document') {
          mappedDocType = DocumentType.SHIPPING_DOC;
        } else if (docType === 'BL') {
          mappedDocType = DocumentType.BL;
        } else if (docType === 'Invoice') {
          mappedDocType = DocumentType.INVOICE;
        } else if (docType === 'COA') {
          mappedDocType = DocumentType.COA;
        } else {
          mappedDocType = DocumentType.SHIPPING_DOC; // fallback
        }

        const newDoc: {
          id: string;
          type: DocumentType;
          filename: string;
          uploadedAt: string;
          uploadedBy: string;
        } = {
          id: 'doc-' + Math.random().toString(36).substr(2, 5),
          type: mappedDocType,
          filename: uploadFile.name,
          uploadedAt: new Date().toISOString(),
          uploadedBy: currentUser!.username
        };

        const currentDocs =
          orders.find((o) => o.orderNo === orderNo)?.documents || [];
        updateOrder(orderNo, {
          documents: [...currentDocs, newDoc]
        });

        addActivity(
          'Upload Document',
          currentUser!.username,
          `Uploaded ${docType} for ${orderNo}`
        );

        // On last upload, check if all required docs are uploaded
        if (index === filesToUpload.length - 1) {
          setTimeout(() => {
            const updatedOrder = orders.find((o) => o.orderNo === orderNo);
            const hasShippingDoc = updatedOrder?.documents.some(
              (d) => d.type === 'Shipping Document'
            );
            const hasBL = updatedOrder?.documents.some((d) => d.type === 'BL');

            if (
              hasShippingDoc &&
              hasBL &&
              order.status === OrderStatus.RECEIVED_PO
            ) {
              updateOrder(orderNo, { status: OrderStatus.VESSEL_DEPARTED });
              addNotification(
                `Vessel Departed: ${orderNo}`,
                Role.UBE_JAPAN,
                'email'
              );
              addActivity(
                'Order Departed',
                currentUser!.username,
                `Order ${orderNo} marked as departed - all documents uploaded`
              );

              Swal.fire({
                icon: 'success',
                title: 'Order Departed!',
                text: `All required documents uploaded. Order ${orderNo} marked as DEPARTED`,
                timer: 2000,
                showConfirmButton: false
              });

              setUploadingOrder(null);
              setSelectedFiles({});
            } else {
              Swal.fire({
                icon: 'success',
                title: 'Documents Uploaded',
                text: `${filesToUpload.length} document(s) uploaded successfully`,
                confirmButtonColor: '#4F46E5'
              });
            }

            setUploadingDocs(false);
          }, 500);
        }
      }, uploadDelay);
      uploadDelay += 800;
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            CS Logistics Hub
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Manage vessel bookings, ETD dates, and shipping documentation.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Urgent/Booking Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Truck className="text-blue-600" />
            <h2 className="text-lg font-bold">Vessel Booking Required</h2>
            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-bold">
              {urgentOrders.length}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {urgentOrders.map((order) => (
              <div
                key={order.orderNo}
                className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group"
              >
                {order.items.some((i) => i.asap) && (
                  <div className="absolute top-0 right-0 w-24 h-24 overflow-hidden">
                    <div className="absolute top-2 right-[-32px] bg-red-500 text-white text-[10px] font-black px-8 py-1 rotate-45 shadow-lg">
                      URGENT
                    </div>
                  </div>
                )}

                <div className="flex justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">
                      {order.orderNo}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Created by {order.createdBy}
                    </p>
                  </div>
                  <Link
                    to={`/orders/${order.orderNo}`}
                    className="mr-4 text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                  >
                    View Order &rarr;
                  </Link>
                </div>

                <div className="space-y-2 mb-4">
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                    Set Actual ETD per Line
                  </label>
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700"
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
                          className="shadcn-input h-8 text-xs flex-1"
                          value={etdDates[order.orderNo]?.[item.id] || ''}
                          onChange={(e) =>
                            setEtdDates({
                              ...etdDates,
                              [order.orderNo]: {
                                ...(etdDates[order.orderNo] || {}),
                                [item.id]: e.target.value
                              }
                            })
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleSubmitETD(order.orderNo)}
                  className="w-full h-10 px-4 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                >
                  <CheckCircle size={16} /> Confirm Vessel Booking
                </button>
              </div>
            ))}
            {urgentOrders.length === 0 && (
              <p className="text-sm text-slate-400 dark:text-slate-500 py-4 italic">
                No orders pending vessel booking.
              </p>
            )}
          </div>
        </section>

        {/* Documentation Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Upload className="text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-bold dark:text-white">
              Shipping Documents Finalization
            </h2>
            <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900 text-xs px-2 py-0.5 rounded-full font-bold">
              {departPending.length}
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 uppercase text-[11px] font-black border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4 text-left">Order No</th>
                  <th className="px-6 py-4 text-left">Created By</th>
                  <th className="px-6 py-4 text-left">Documents</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {departPending.map((order) => {
                  const hasShippingDoc = order.documents.some(
                    (d) => d.type === 'Shipping Document'
                  );
                  const hasBL = order.documents.some((d) => d.type === 'BL');
                  const isUploadingThis = uploadingOrder === order.orderNo;

                  return (
                    <React.Fragment key={order.orderNo}>
                      <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-6 py-4 font-bold dark:text-white">
                          {order.orderNo}
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                          {order.createdBy}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                hasShippingDoc
                                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                              }`}
                            >
                              {hasShippingDoc ? '✓' : '○'} Shipping Doc
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                hasBL
                                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                              }`}
                            >
                              {hasBL ? '✓' : '○'} BL
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-900 text-xs font-bold rounded-full uppercase">
                            <Package size={12} />
                            RECEIVED PO
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleUploadDocs(order.orderNo)}
                            className="bg-indigo-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-indigo-700 flex items-center gap-1.5 ml-auto shadow-lg shadow-indigo-500/20"
                          >
                            <Upload size={14} /> Upload Docs
                          </button>
                        </td>
                      </tr>

                      {/* Upload Panel */}
                      {isUploadingThis && (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-6 py-4 bg-indigo-50/50 dark:bg-indigo-950/20"
                          >
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                                  Upload Documents
                                </label>
                                <button
                                  onClick={() => setUploadingOrder(null)}
                                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 font-bold"
                                >
                                  Close
                                </button>
                              </div>

                              <div className="grid gap-2">
                                {[
                                  {
                                    type: 'Shipping Document',
                                    label: 'Shipping Document',
                                    required: true
                                  },
                                  {
                                    type: 'BL',
                                    label: 'Bill of Lading (BL)',
                                    required: true
                                  },
                                  {
                                    type: 'Invoice',
                                    label: 'Invoice',
                                    required: false
                                  },
                                  {
                                    type: 'COA',
                                    label: 'Certificate of Analysis (COA)',
                                    required: false
                                  }
                                ]
                                  .filter(
                                    (doc) =>
                                      currentUser?.role === Role.ADMIN ||
                                      currentUser?.allowedDocumentTypes.includes(
                                        doc.type as any
                                      )
                                  )
                                  .map((doc) => {
                                    const hasDoc = order.documents.some(
                                      (d) => d.type === doc.type
                                    );
                                    return (
                                      <div
                                        key={doc.type}
                                        className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700"
                                      >
                                        <div className="flex items-center gap-3">
                                          <Upload
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
                                                Selected:{' '}
                                                {selectedFiles[doc.type]!.name}
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
                                                const file =
                                                  e.target.files?.[0];
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
                                  onClick={() =>
                                    handleSubmitDocument(order.orderNo)
                                  }
                                  disabled={uploadingDocs}
                                  className="w-full bg-emerald-600 text-white px-4 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                                >
                                  {uploadingDocs ? (
                                    <>
                                      <Loader2
                                        size={14}
                                        className="animate-spin"
                                      />
                                      Uploading...
                                    </>
                                  ) : (
                                    <>
                                      <Upload size={14} />
                                      Submit All Documents (
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

                              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg">
                                <p className="text-xs text-blue-700 dark:text-blue-400 font-medium">
                                  <strong>Required:</strong> Shipping Document +
                                  BL |
                                  <strong className="ml-2">Optional:</strong>{' '}
                                  Invoice, COA
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
                {departPending.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-slate-400 dark:text-slate-500 italic"
                    >
                      No orders ready for document upload.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};
