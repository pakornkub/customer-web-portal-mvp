import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FileEdit,
  Send,
  BadgeCheck,
  CalendarCheck,
  FileText,
  Ship,
  Plus,
  Package,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { useStore, getVisibleOrdersForUser } from '../store';
import { OrderLineStatus } from '../types';
import { LineStatusBadge } from '../components/StatusBadge';

export const Dashboard: React.FC = () => {
  const { orders, companies, currentUser } = useStore();

  const getCompanyName = (companyId: string) =>
    companies.find((company) => company.id === companyId)?.name || companyId;

  const visibleOrders = useMemo(
    () => getVisibleOrdersForUser(orders, currentUser),
    [orders, currentUser]
  );

  const visibleLines = visibleOrders.flatMap((order) => order.items);
  const recentLineRows = useMemo(
    () =>
      visibleOrders
        .flatMap((order) =>
          order.items.map((line) => ({
            orderNo: order.orderNo,
            orderDate: order.orderDate,
            companyId: order.companyId,
            lineId: line.id,
            poNo: line.poNo,
            status: line.status
          }))
        )
        .sort(
          (a, b) =>
            new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
        )
        .slice(0, 8),
    [visibleOrders]
  );
  const now = new Date();
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const urgentLines = visibleOrders
    .flatMap((order) =>
      order.items.map((line) => ({
        orderNo: order.orderNo,
        lineId: line.id,
        poNo: line.poNo,
        requestETA: line.requestETA,
        asap: line.asap,
        status: line.status
      }))
    )
    .filter((line) => {
      if (line.status === OrderLineStatus.VESSEL_DEPARTED) return false;
      if (!line.asap) return false;
      if (!line.requestETA) return true;
      const eta = new Date(line.requestETA);
      return eta >= now && eta <= thirtyDaysLater;
    })
    .slice(0, 6);

  const lineStatusCards = [
    {
      status: OrderLineStatus.DRAFT,
      label: 'DRAFT',
      tone: 'slate',
      Icon: FileEdit
    },
    {
      status: OrderLineStatus.CREATED,
      label: 'CREATED',
      tone: 'indigo',
      Icon: Send
    },
    {
      status: OrderLineStatus.APPROVED,
      label: 'CONFIRMED',
      tone: 'violet',
      Icon: BadgeCheck
    },
    {
      status: OrderLineStatus.WAIT_SALE_UEC_APPROVE_PO,
      label: 'WAIT SALE APPROVE PO',
      tone: 'orange',
      Icon: FileText
    },
    {
      status: OrderLineStatus.WAIT_MGR_UEC_APPROVE_PO,
      label: 'WAIT MGR APPROVE PO',
      tone: 'purple',
      Icon: BadgeCheck
    },
    {
      status: OrderLineStatus.VESSEL_SCHEDULED,
      label: 'VESSEL SCHEDULED',
      tone: 'sky',
      Icon: CalendarCheck
    },
    {
      status: OrderLineStatus.VESSEL_DEPARTED,
      label: 'DEPARTED',
      tone: 'emerald',
      Icon: Ship
    }
  ].map((item) => ({
    ...item,
    value: visibleLines.filter((line) => line.status === item.status).length
  }));

  const toneClassMap: Record<string, string> = {
    slate:
      'bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300',
    indigo:
      'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-300',
    orange:
      'bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-900/30 dark:border-orange-800 dark:text-orange-300',
    purple:
      'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-900/30 dark:border-purple-800 dark:text-purple-300',
    violet:
      'bg-violet-50 border-violet-200 text-violet-700 dark:bg-violet-900/30 dark:border-violet-800 dark:text-violet-300',
    sky: 'bg-sky-50 border-sky-200 text-sky-700 dark:bg-sky-900/30 dark:border-sky-800 dark:text-sky-300',
    amber:
      'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-300',
    emerald:
      'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-300'
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="ui-page-title">Executive Dashboard</h1>
          <p className="ui-page-subtitle">
            Line-based workflow summary with urgent monitoring and shipment
            progress.
          </p>
        </div>
        {currentUser?.canCreateOrder && (
          <Link
            to="/orders/create"
            className="bg-indigo-600 text-white px-4 py-2 ui-radius-control text-sm font-bold hover:bg-indigo-700 inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Place New Order
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {lineStatusCards.map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-slate-900 ui-radius-card border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-lg transition-all"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="ui-kicker text-slate-500">{stat.label}</p>
                <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
                  {stat.value}
                </p>
              </div>
              <span
                className={`p-2 rounded ${toneClassMap[stat.tone]}`}
                title={stat.label}
              >
                <stat.Icon className="w-5 h-5" />
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white dark:bg-slate-900 ui-radius-card border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-start gap-3">
              <span className="w-9 h-9 ui-radius-control bg-indigo-50 dark:bg-indigo-900/30 border-indigo-100 dark:border-indigo-800 text-indigo-600 dark:text-indigo-300 inline-flex items-center justify-center shrink-0">
                <Package className="w-4 h-4" />
              </span>
              <div>
                <h2 className="font-bold text-slate-900 dark:text-white">
                  Recent Orders
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Latest visible orders with summary status and line count.
                </p>
              </div>
            </div>
          </div>
          {visibleOrders.length === 0 ? (
            <div className="h-[260px] flex flex-col items-center justify-center text-center px-6">
              <div className="w-16 h-16 rounded-full border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 inline-flex items-center justify-center">
                <Package className="w-8 h-8" />
              </div>
              <p className="mt-5 text-lg font-semibold text-slate-700 dark:text-slate-200">
                Your logistics pipeline is empty.
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                No visible lines in your current scope.
              </p>
            </div>
          ) : (
            <table className="w-full text-sm ui-table-standard">
              <thead className="bg-slate-50/70 dark:bg-slate-950/40 ui-table-head">
                <tr>
                  <th className="px-4 py-3 text-left">Order</th>
                  <th className="px-4 py-3 text-left">PO</th>
                  <th className="px-4 py-3 text-left">Company</th>
                  <th className="px-4 py-3 text-left">Line Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentLineRows.map((row) => (
                  <tr key={`${row.orderNo}-${row.lineId}`}>
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                      <Link
                        to={`/orders/${row.orderNo}?lineId=${row.lineId}`}
                        className="hover:text-indigo-600 dark:hover:text-indigo-400"
                      >
                        {row.orderNo}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                      {row.poNo}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {getCompanyName(row.companyId)}
                    </td>
                    <td className="px-4 py-3">
                      <LineStatusBadge status={row.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 ui-radius-card border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-start gap-3">
              <span className="w-9 h-9 ui-radius-control bg-rose-50 dark:bg-rose-900/30 border-rose-100 dark:border-rose-800 text-rose-600 dark:text-rose-300 inline-flex items-center justify-center shrink-0">
                <AlertCircle className="w-4 h-4" />
              </span>
              <div>
                <h2 className="font-bold text-slate-900 dark:text-white">
                  Urgent Lines
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  ASAP lines and lines with ETA &lt; 30 days.
                </p>
              </div>
            </div>
          </div>
          {urgentLines.length === 0 ? (
            <div className="h-[260px] flex flex-col items-center justify-center text-center px-6">
              <div className="w-16 h-16 rounded-full border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-300 inline-flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <p className="mt-5 text-lg font-semibold text-slate-700 dark:text-slate-200">
                Perfect! No urgent orders.
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                No ASAP lines with ETA in the next 30 days.
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {urgentLines.map((line) => (
                <div
                  key={`${line.orderNo}-${line.lineId}`}
                  className="p-4 ui-radius-panel border border-rose-200 bg-rose-50/60 dark:bg-rose-900/20 dark:border-rose-800"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      to={`/orders/${line.orderNo}?lineId=${line.lineId}`}
                      className="text-xs font-bold text-rose-700 dark:text-rose-300 hover:underline"
                    >
                      {line.orderNo}
                    </Link>
                    <LineStatusBadge status={line.status as OrderLineStatus} />
                  </div>
                  <p className="mt-1 text-xs text-rose-700 dark:text-rose-300">
                    PO: {line.poNo}
                  </p>
                  <p className="ui-micro-text text-rose-600 dark:text-rose-400 mt-0.5">
                    ETA: {line.requestETA || '-'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
