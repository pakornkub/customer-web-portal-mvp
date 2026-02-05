import React, { useState } from 'react';
import { useStore } from '../store';
import { OrderStatus, Role } from '../types';
import {
  FileText,
  CheckCircle,
  Loader2,
  DollarSign,
  MessageSquare,
  ChevronRight,
  Globe,
  TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';

export const SaleReview: React.FC = () => {
  const {
    orders,
    updateOrder,
    addNotification,
    addActivity,
    addIntegrationLog
  } = useStore();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [saleNotes, setSaleNotes] = useState<Record<string, string>>({});

  const pendingReview = orders.filter((o) => o.status === OrderStatus.CREATED);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handlePriceChange = (itemId: string, val: string) => {
    setPrices((prev) => ({ ...prev, [itemId]: parseFloat(val) }));
  };

  const handleApprove = async (orderNo: string) => {
    const order = orders.find((o) => o.orderNo === orderNo);
    if (!order) return;

    const missingPrice = order.items.some(
      (item) => !prices[item.id] && !item.price
    );
    if (missingPrice) {
      Swal.fire({
        icon: 'error',
        title: 'Missing Price Information',
        text: 'Please ensure all consignment lines have been valued before syncing to CRM.',
        confirmButtonColor: '#4F46E5'
      });
      return;
    }

    setProcessingId(orderNo);

    // Step 2.1: Sale approval + CRM integration
    await new Promise((resolve) => setTimeout(resolve, 2500));

    const updatedItems = order.items.map((item) => ({
      ...item,
      price: prices[item.id] || item.price || 0,
      currency: 'USD' // Default currency
    }));

    updateOrder(orderNo, {
      status: OrderStatus.CONFIRMED,
      items: updatedItems,
      saleNote: saleNotes[orderNo] || ''
    });

    addIntegrationLog({
      orderNo: orderNo,
      status: 'SUCCESS',
      message:
        'Order transmitted to CRM/SAP. Sales Order record created successfully.'
    });

    addActivity(
      'Approve Order',
      'Sale',
      `Order ${orderNo} approved with commercial pricing and synced to CRM`
    );
    addNotification(
      `Order ${orderNo} approved and synced to CRM`,
      Role.SALE,
      'system'
    );

    // Step 2.2: CRM Callback Simulation (Quotation creation)
    setTimeout(() => {
      const qNo = `QT-${Math.floor(100000 + Math.random() * 900000)}`;
      updateOrder(orderNo, { quotationNo: qNo });
      addNotification(
        `Quotation ${qNo} auto-generated for Order ${orderNo}. Customer notified.`,
        Role.UBE_JAPAN,
        'email'
      );
      addActivity(
        'CRM Callback',
        'CRM System',
        `Quotation ${qNo} created for ${orderNo} via callback`
      );
      console.log(
        `[CRM Callback] Generated quotation ${qNo} for order ${orderNo}`
      );
    }, 5000);

    setProcessingId(null);
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Sales Verification Desk
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Verify pricing, add commercial notes, and sync confirmed orders with
            CRM systems.
          </p>
        </div>{' '}
      </div>

      <div className="space-y-10">
        {pendingReview.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-24 rounded-[1rem] border-2 border-dashed border-slate-200 dark:border-slate-800 text-center space-y-4">
            <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-100 dark:border-emerald-900">
              <CheckCircle size={32} />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Workspace Clear
              </h3>
              <p className="text-slate-400 dark:text-slate-500 font-medium">
                No new orders require commercial verification at this time.
              </p>
            </div>
          </div>
        ) : (
          pendingReview.map((order) => (
            <div
              key={order.orderNo}
              className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-500"
            >
              <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-slate-950/30">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm text-indigo-600 dark:text-indigo-400">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                      {order.orderNo}
                      <span className="text-[10px] font-black uppercase bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-lg tracking-widest">
                        Needs Review
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                      Created by {order.createdBy} &bull; Received{' '}
                      {formatDate(order.orderDate)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Link
                    to={`/orders/${order.orderNo}`}
                    className="text-xs font-black text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 uppercase tracking-widest transition-colors mr-2"
                  >
                    Deep View
                  </Link>
                  <button
                    disabled={processingId === order.orderNo}
                    onClick={() => handleApprove(order.orderNo)}
                    className="bg-indigo-600 text-white px-8 py-3 rounded-xl text-sm font-extrabold hover:bg-indigo-700 transition-all flex items-center gap-3 disabled:opacity-50 shadow-lg shadow-indigo-500/20 dark:shadow-indigo-500/10 active:scale-95"
                  >
                    {processingId === order.orderNo ? (
                      <>
                        <Loader2 size={18} className="animate-spin" /> CRM
                        Handshake...
                      </>
                    ) : (
                      <>
                        <Globe size={18} /> Sync with CRM
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                      <TrendingUp size={14} className="text-indigo-600" />
                      Commercial Line Items
                    </h4>
                  </div>
                  <div className="overflow-hidden border border-slate-100 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50/50 dark:bg-slate-950/50 text-slate-400 dark:text-slate-500 uppercase text-[10px] font-black border-b border-slate-100 dark:border-slate-800">
                        <tr>
                          <th className="px-6 py-4 text-left">PO Reference</th>
                          <th className="px-6 py-4 text-left">Grade</th>
                          <th className="px-6 py-4 text-right">Volume</th>
                          <th className="px-6 py-4 text-right">
                            Unit Price (USD)
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                        {order.items.map((item) => (
                          <tr
                            key={item.id}
                            className="hover:bg-slate-50/30 dark:hover:bg-slate-800/30 transition-colors"
                          >
                            <td className="px-6 py-5 font-extrabold text-slate-900 dark:text-white">
                              {item.poNo}
                            </td>
                            <td className="px-6 py-5">
                              <span className="font-bold text-slate-600 dark:text-slate-400">
                                {item.gradeId}
                              </span>
                            </td>
                            <td className="px-6 py-5 text-right">
                              <span className="font-bold text-slate-900 dark:text-white">
                                {item.qty.toLocaleString()} units
                              </span>
                            </td>
                            <td className="px-6 py-5 text-right">
                              <div className="inline-flex items-center border border-slate-200 dark:border-slate-700 rounded-xl px-3 bg-white dark:bg-slate-950 focus-within:ring-4 focus-within:ring-indigo-600/5 dark:focus-within:ring-indigo-400/10 focus-within:border-indigo-600 dark:focus-within:border-indigo-500 transition-all shadow-sm">
                                <DollarSign
                                  size={14}
                                  className="text-slate-300 dark:text-slate-600 mr-1"
                                />
                                <input
                                  type="number"
                                  className="w-24 py-2 outline-none text-right font-black text-slate-900 dark:text-white bg-transparent"
                                  placeholder="0.00"
                                  value={prices[item.id] ?? ''}
                                  onChange={(e) =>
                                    handlePriceChange(item.id, e.target.value)
                                  }
                                />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-4">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                      <MessageSquare size={14} className="text-indigo-600" />
                      Internal Sale Review
                    </label>
                    <textarea
                      className="w-full h-[220px] text-sm border border-slate-200 rounded-3xl p-5 outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all bg-slate-50/50 resize-none font-medium text-slate-700 leading-relaxed"
                      placeholder="Add specific commercial notes or CRM specific instructions for this order sequence..."
                      value={saleNotes[order.orderNo] || ''}
                      onChange={(e) =>
                        setSaleNotes({
                          ...saleNotes,
                          [order.orderNo]: e.target.value
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
