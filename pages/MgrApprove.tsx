import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BadgeCheck, FileText, Loader2, Package } from 'lucide-react';
import { ActionIconButton } from '../components/ActionIconButton';
import {
  useStore,
  canUserAccessShipTo,
  canUserRunLineAction,
  deriveOrderProgressStatus
} from '../store';
import { DocumentType, LineAction, OrderLineStatus, Role } from '../types';
import Swal from '../utils/swal';

export const MgrApprove: React.FC = () => {
  const {
    orders,
    currentUser,
    linePermissionMatrix,
    masterData,
    updateOrder,
    addActivity,
    addNotification
  } = useStore();
  const [processingLineId, setProcessingLineId] = useState<string | null>(null);

  const targets = useMemo(() => {
    if (!currentUser) return [] as Array<{ orderNo: string; lineId: string }>;

    return orders.flatMap((order) =>
      order.items
        .filter(
          (line) =>
            line.status === OrderLineStatus.WAIT_MGR_UEC_APPROVE_PO &&
            canUserRunLineAction(
              currentUser,
              line.status,
              LineAction.APPROVE_MGR_PO,
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

  const getShipToName = (shipToId: string) =>
    masterData.shipTos.find((s) => s.id === shipToId)?.name || shipToId;

  const getGradeName = (gradeId: string) =>
    masterData.grades.find((g) => g.id === gradeId)?.name || gradeId;

  const updateLine = (
    orderNo: string,
    lineId: string,
    updater: (
      line: NonNullable<ReturnType<typeof getLine>['line']>
    ) => NonNullable<ReturnType<typeof getLine>['line']>
  ) => {
    const { order } = getLine(orderNo, lineId);
    if (!order) return;
    const nextItems = order.items.map((item) =>
      item.id === lineId ? updater(item) : item
    );
    updateOrder(orderNo, {
      items: nextItems,
      status: deriveOrderProgressStatus(nextItems)
    });
  };

  const approveMgrPo = async (orderNo: string, lineId: string) => {
    const { line } = getLine(orderNo, lineId);
    if (!line || !currentUser) return;

    if (
      !canUserRunLineAction(
        currentUser,
        line.status,
        LineAction.APPROVE_MGR_PO,
        linePermissionMatrix
      )
    )
      return;

    const confirmed = await Swal.fire({
      icon: 'question',
      title: 'Approve PO (Manager)',
      text: `Approve PO for ${orderNo} / ${line.poNo}? This will move the line to Vessel Scheduled.`,
      showCancelButton: true,
      confirmButtonText: 'Approve',
      cancelButtonText: 'Cancel'
    });

    if (!confirmed.isConfirmed) return;

    setProcessingLineId(lineId);

    updateLine(orderNo, lineId, (item) => ({
      ...item,
      status: OrderLineStatus.VESSEL_SCHEDULED
    }));

    addActivity(
      'Approve PO (Manager)',
      currentUser.username,
      `${orderNo} / ${line.poNo}`
    );
    addNotification(
      `PO approved by Manager for ${orderNo} / ${line.poNo}. Line is Vessel Scheduled.`,
      Role.CS,
      'email'
    );

    setProcessingLineId(null);

    Swal.fire({
      icon: 'success',
      title: 'PO Approved',
      text: `${orderNo} / ${line.poNo} is now Vessel Scheduled.`,
      timer: 1500,
      showConfirmButton: false
    });
  };

  const getPoPdfDoc = (line: NonNullable<ReturnType<typeof getLine>['line']>) =>
    line.documents.find((doc) => doc.type === DocumentType.PO_PDF);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="ui-page-title">Manager PO Approval</h1>
        <p className="ui-page-subtitle">
          Review and approve Purchase Orders awaiting manager sign-off.
        </p>
      </div>

      {groupedTargets.length === 0 && (
        <div className="bg-white dark:bg-slate-900 ui-radius-card border border-slate-200 dark:border-slate-800 p-12 text-center">
          <BadgeCheck className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            No POs pending manager approval.
          </p>
        </div>
      )}

      {groupedTargets.map(({ orderNo, lines }) => (
        <div
          key={orderNo}
          className="bg-white dark:bg-slate-900 ui-radius-card border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Package className="w-5 h-5 text-indigo-500 shrink-0" />
              <div>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  Order:{' '}
                </span>
                <Link
                  to={`/orders/${orderNo}`}
                  className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  {orderNo}
                </Link>
              </div>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {lines.length} line{lines.length > 1 ? 's' : ''} pending
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {lines.map((line) => {
              const poPdf = getPoPdfDoc(line);
              const isProcessing = processingLineId === line.id;

              return (
                <div
                  key={line.id}
                  className="px-5 py-4 flex flex-col md:flex-row md:items-center gap-4"
                >
                  <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="ui-micro-text text-slate-500 dark:text-slate-400 mb-0.5">
                        PO No
                      </p>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {line.poNo}
                      </p>
                    </div>
                    <div>
                      <p className="ui-micro-text text-slate-500 dark:text-slate-400 mb-0.5">
                        Ship To
                      </p>
                      <p className="font-medium text-slate-700 dark:text-slate-300">
                        {getShipToName(line.shipToId)}
                      </p>
                    </div>
                    <div>
                      <p className="ui-micro-text text-slate-500 dark:text-slate-400 mb-0.5">
                        Grade / Qty
                      </p>
                      <p className="font-medium text-slate-700 dark:text-slate-300">
                        {getGradeName(line.gradeId)} · {line.qty} MT
                      </p>
                    </div>
                    <div>
                      <p className="ui-micro-text text-slate-500 dark:text-slate-400 mb-0.5">
                        ETD
                      </p>
                      <p className="font-medium text-slate-700 dark:text-slate-300">
                        {line.actualETD || line.requestETD || '-'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {poPdf && (
                      <a
                        href={poPdf.dataUrl}
                        download={poPdf.filename}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 ui-radius-control text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        title="Download PO PDF"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        PO PDF
                      </a>
                    )}
                    <ActionIconButton
                      onClick={() => approveMgrPo(orderNo, line.id)}
                      tone="indigo"
                      title="Approve PO (Manager)"
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <BadgeCheck className="w-3.5 h-3.5" />
                      )}
                    </ActionIconButton>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
