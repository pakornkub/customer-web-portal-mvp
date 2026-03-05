import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BadgeCheck,
  CheckCircle,
  FileText,
  Loader2,
  MessageSquare,
  TrendingUp
} from 'lucide-react';
import { ActionIconButton } from '../components/ActionIconButton';
import {
  useStore,
  canUserAccessShipTo,
  canUserRunLineAction,
  deriveOrderProgressStatus
} from '../store';
import { LineAction, OrderLineStatus, Role } from '../types';
import Swal from '../utils/swal';

export const SaleReview: React.FC = () => {
  const {
    orders,
    currentUser,
    linePermissionMatrix,
    updateOrder,
    addActivity,
    addNotification,
    addIntegrationLog
  } = useStore();
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [currencies, setCurrencies] = useState<Record<string, string>>({});
  const [saleNotes, setSaleNotes] = useState<Record<string, string>>({});
  const [processingLineId, setProcessingLineId] = useState<string | null>(null);

  const targets = useMemo(() => {
    if (!currentUser) return [] as Array<{ orderNo: string; lineId: string }>;

    return orders.flatMap((order) =>
      order.items
        .filter(
          (line) =>
            line.status === OrderLineStatus.UBE_APPROVED &&
            order.companyId === currentUser.companyId &&
            canUserRunLineAction(
              currentUser,
              line.status,
              LineAction.APPROVE_LINE,
              linePermissionMatrix
            ) &&
            canUserAccessShipTo(currentUser, line.shipToId)
        )
        .map((line) => ({ orderNo: order.orderNo, lineId: line.id }))
    );
  }, [orders, currentUser, linePermissionMatrix]);

  const getLine = (orderNo: string, lineId: string) => {
    const order = orders.find((item) => item.orderNo === orderNo);
    const line = order?.items.find((item) => item.id === lineId);
    return { order, line };
  };

  const groupedTargets = useMemo(() => {
    const grouped = new Map<
      string,
      Array<NonNullable<ReturnType<typeof getLine>['line']>>
    >();

    targets.forEach((target) => {
      const { line } = getLine(target.orderNo, target.lineId);
      if (!line) return;
      const current = grouped.get(target.orderNo) || [];
      grouped.set(target.orderNo, [...current, line]);
    });

    return Array.from(grouped.entries()).map(([orderNo, lines]) => ({
      orderNo,
      lines
    }));
  }, [targets, orders]);

  const approveLine = async (orderNo: string, lineId: string) => {
    const { order, line } = getLine(orderNo, lineId);
    if (!order || !line) return;

    const price = prices[lineId] ?? line.price;
    if (!price || price <= 0) {
      Swal.fire({
        icon: 'error',
        title: 'Price required',
        text: 'Please input price before approve line.'
      });
      return;
    }

    const currency =
      (currencies[lineId] ?? line.currency ?? 'USD').trim() || 'USD';
    const saleNote = saleNotes[lineId]?.trim() || line.saleNote || '';

    setProcessingLineId(lineId);

    addIntegrationLog({
      orderNo,
      status: 'PENDING',
      message: `[Line ${line.poNo}] Sending approved line to CRM...`
    });

    const approvedItems = order.items.map((item) =>
      item.id === lineId
        ? {
            ...item,
            price,
            currency,
            saleNote,
            status: OrderLineStatus.APPROVED
          }
        : item
    );

    updateOrder(orderNo, {
      items: approvedItems,
      status: deriveOrderProgressStatus(approvedItems)
    });

    addActivity(
      'Line Approved',
      currentUser?.username || 'sale',
      `${orderNo} / ${line.poNo}`
    );

    addNotification(
      `Line ${line.poNo} in ${orderNo} approved. CRM sync started.`,
      Role.CS,
      'system'
    );

    await new Promise((resolve) => setTimeout(resolve, 1800));

    const quotationNo = `QT-${Math.floor(100000 + Math.random() * 900000)}`;
    const syncedItems = approvedItems.map((item) =>
      item.id === lineId ? { ...item, quotationNo } : item
    );

    updateOrder(orderNo, {
      items: syncedItems,
      status: deriveOrderProgressStatus(syncedItems),
      quotationNo
    });

    addIntegrationLog({
      orderNo,
      status: 'SUCCESS',
      message: `[Line ${line.poNo}] CRM callback success. Quotation: ${quotationNo}`
    });

    addActivity(
      'CRM Callback (line)',
      'CRM System',
      `${orderNo} / ${line.poNo} / ${quotationNo}`
    );

    addNotification(
      `CRM created quotation ${quotationNo} for ${orderNo} / ${line.poNo}.`,
      Role.UBE_JAPAN,
      'email'
    );

    setProcessingLineId(null);
  };

  const saveLineDraft = (orderNo: string, lineId: string) => {
    const { order, line } = getLine(orderNo, lineId);
    if (!order || !line) return;

    const priceInput = prices[lineId];
    const nextPrice =
      typeof priceInput === 'number' && Number.isFinite(priceInput)
        ? priceInput > 0
          ? priceInput
          : undefined
        : line.price;
    const nextCurrency =
      (currencies[lineId] ?? line.currency ?? 'USD').trim() || 'USD';
    const nextSaleNote = (saleNotes[lineId] ?? line.saleNote ?? '').trim();

    const nextItems = order.items.map((item) =>
      item.id === lineId
        ? {
            ...item,
            price: nextPrice,
            currency: nextCurrency,
            saleNote: nextSaleNote
          }
        : item
    );

    updateOrder(orderNo, {
      items: nextItems,
      status: deriveOrderProgressStatus(nextItems)
    });

    Swal.fire({
      icon: 'success',
      title: 'Draft saved',
      timer: 900,
      showConfirmButton: false
    });
  };

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="ui-page-title">Sales Verification Desk</h1>
          <p className="ui-page-subtitle">
            Review each line and approve from CREATED to APPROVED.
          </p>
        </div>
      </div>

      {groupedTargets.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-24 ui-radius-card border-2 border-dashed border-slate-200 dark:border-slate-800 text-center space-y-4">
          <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-100 dark:border-emerald-900">
            <CheckCircle size={32} />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Workspace Clear
            </h3>
            <p className="text-slate-400 dark:text-slate-500 font-medium">
              No lines waiting for sale review.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-10">
          {groupedTargets.map((group) => (
            <div
              key={group.orderNo}
              className="bg-white dark:bg-slate-900 ui-radius-card border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
            >
              <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-slate-950/30">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 ui-radius-panel shadow-sm text-indigo-600 dark:text-indigo-400">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                      {group.orderNo}
                      <span className="ui-kicker bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 ui-radius-control">
                        Needs Review
                      </span>
                    </h3>
                  </div>
                </div>
                <Link
                  to={`/orders/${group.orderNo}`}
                  className="ui-kicker text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors mr-2"
                >
                  Deep View
                </Link>
              </div>

              <div className="p-8 space-y-6">
                <h4 className="ui-section-title flex items-center gap-2">
                  <TrendingUp
                    size={14}
                    className="text-indigo-600 dark:text-indigo-400"
                  />
                  Commercial Line Items
                </h4>

                <div className="overflow-hidden border border-slate-100 dark:border-slate-800 ui-radius-panel bg-white dark:bg-slate-900">
                  <table className="w-full text-left text-sm ui-table-standard">
                    <thead className="bg-slate-50/50 dark:bg-slate-950/50 ui-table-head border-b border-slate-100 dark:border-slate-800">
                      <tr>
                        <th className="px-6 py-4 text-left">PO</th>
                        <th className="px-6 py-4 text-left">Ship To</th>
                        <th className="px-6 py-4 text-right">Qty</th>
                        <th className="px-6 py-4 text-right">Price</th>
                        <th className="px-6 py-4 text-right">Currency</th>
                        <th className="px-6 py-4 text-left">Sale Note</th>
                        <th className="px-6 py-4 text-left">CRM QT</th>
                        <th className="px-6 py-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                      {group.lines.map((line) => (
                        <tr
                          key={line.id}
                          className="hover:bg-slate-50/30 dark:hover:bg-slate-800/30 transition-colors"
                        >
                          <td className="px-6 py-5 font-extrabold text-slate-900 dark:text-white">
                            {line.poNo}
                          </td>
                          <td className="px-6 py-5 font-bold text-slate-600 dark:text-slate-400">
                            {line.shipToId || '-'}
                          </td>
                          <td className="px-6 py-5 text-right font-bold text-slate-900 dark:text-white">
                            {line.qty.toLocaleString()} units
                          </td>
                          <td className="px-6 py-5 text-right">
                            <input
                              type="number"
                              value={prices[line.id] ?? line.price ?? ''}
                              onChange={(e) =>
                                setPrices((prev) => ({
                                  ...prev,
                                  [line.id]: Number(e.target.value)
                                }))
                              }
                              className="shadcn-input h-8 text-xs w-28 ml-auto"
                            />
                          </td>
                          <td className="px-6 py-5 text-right">
                            <select
                              value={
                                currencies[line.id] ?? line.currency ?? 'USD'
                              }
                              onChange={(e) =>
                                setCurrencies((prev) => ({
                                  ...prev,
                                  [line.id]: e.target.value
                                }))
                              }
                              className="shadcn-input h-8 text-xs w-24 ml-auto"
                            >
                              <option value="USD">USD</option>
                              <option value="THB">THB</option>
                              <option value="EUR">EUR</option>
                              <option value="JPY">JPY</option>
                              <option value="CNY">CNY</option>
                            </select>
                          </td>
                          <td className="px-6 py-5">
                            <div className="relative">
                              <MessageSquare className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                              <input
                                value={
                                  saleNotes[line.id] ?? line.saleNote ?? ''
                                }
                                onChange={(e) =>
                                  setSaleNotes((prev) => ({
                                    ...prev,
                                    [line.id]: e.target.value
                                  }))
                                }
                                placeholder="Internal note"
                                className="shadcn-input h-8 text-xs w-56 pl-8"
                              />
                            </div>
                          </td>
                          <td className="px-6 py-5 text-xs font-semibold text-indigo-600 dark:text-indigo-300">
                            {line.quotationNo || '-'}
                          </td>
                          <td className="px-6 py-5 text-right">
                            <div className="inline-flex items-center gap-2">
                              <ActionIconButton
                                onClick={() =>
                                  saveLineDraft(group.orderNo, line.id)
                                }
                                tone="slate"
                                title="Save Draft"
                                disabled={processingLineId === line.id}
                              >
                                <FileText className="w-3.5 h-3.5" />
                              </ActionIconButton>
                              <ActionIconButton
                                onClick={() =>
                                  approveLine(group.orderNo, line.id)
                                }
                                tone="indigo"
                                title="Approve Line"
                                disabled={processingLineId === line.id}
                              >
                                {processingLineId === line.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <BadgeCheck className="w-3.5 h-3.5" />
                                )}
                              </ActionIconButton>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
