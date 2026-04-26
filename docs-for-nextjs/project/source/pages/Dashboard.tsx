import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Select, { SingleValue } from 'react-select';
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
  CheckCircle2,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useStore, getVisibleOrdersForUser } from '../store';
import { OrderLineStatus } from '../types';
import { LineStatusBadge } from '../components/StatusBadge';

type SelectOption = { value: string; label: string };

const PAGE_SIZE = 10;

export const Dashboard: React.FC = () => {
  const { orders, companies, currentUser, masterData, theme } = useStore();

  const [filterPo, setFilterPo] = useState<SelectOption | null>(null);
  const [filterShipTo, setFilterShipTo] = useState<SelectOption | null>(null);
  const [page, setPage] = useState(0);

  // Reset page whenever filters change
  useEffect(() => {
    setPage(0);
  }, [filterPo, filterShipTo]);

  const isFiltered = filterPo !== null || filterShipTo !== null;

  const getCompanyName = (companyId: string) =>
    companies.find((company) => company.id === companyId)?.name || companyId;

  const getShipToName = (shipToId: string) =>
    masterData.shipTos.find((s) => s.id === shipToId)?.name || shipToId;

  const visibleOrders = useMemo(
    () => getVisibleOrdersForUser(orders, currentUser),
    [orders, currentUser]
  );

  const visibleLines = useMemo(
    () => visibleOrders.flatMap((order) => order.items),
    [visibleOrders]
  );

  // Dropdown options derived from all visible lines (unfiltered)
  const poOptions = useMemo<SelectOption[]>(() => {
    const unique = [
      ...new Set(visibleLines.map((l) => l.poNo).filter(Boolean))
    ];
    return unique.sort().map((po) => ({ value: po, label: po }));
  }, [visibleLines]);

  const shipToOptions = useMemo<SelectOption[]>(() => {
    const unique = [
      ...new Set(visibleLines.map((l) => l.shipToId).filter(Boolean))
    ];
    return unique
      .map((id) => ({ value: id, label: getShipToName(id) }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [visibleLines, masterData.shipTos]);

  // Filtered orders: keep order if ANY line matches both active filters
  const filteredOrders = useMemo(() => {
    if (!isFiltered) return visibleOrders;
    return visibleOrders.filter((order) =>
      order.items.some(
        (line) =>
          (!filterPo || line.poNo === filterPo.value) &&
          (!filterShipTo || line.shipToId === filterShipTo.value)
      )
    );
  }, [visibleOrders, filterPo, filterShipTo, isFiltered]);

  const filteredLines = useMemo(
    () => filteredOrders.flatMap((order) => order.items),
    [filteredOrders]
  );

  // All line rows (sorted) for Recent Orders — paginated
  const allLineRows = useMemo(
    () =>
      filteredOrders
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
        ),
    [filteredOrders]
  );

  const totalPages = Math.max(1, Math.ceil(allLineRows.length / PAGE_SIZE));
  const pagedLineRows = allLineRows.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE
  );

  const now = new Date();
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const urgentLines = useMemo(
    () =>
      filteredOrders
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
        }),
    [filteredOrders]
  );

  const lineStatusCards = [
    {
      status: OrderLineStatus.DRAFT,
      label: '1.DRAFT',
      responsible: 'TRADER',
      tone: 'slate',
      Icon: FileEdit
    },
    {
      status: OrderLineStatus.CREATED,
      label: '2.CREATED',
      responsible: 'TSL_SALE',
      tone: 'indigo',
      Icon: Send
    },
    {
      status: OrderLineStatus.APPROVED,
      label: '3.CONFIRMED',
      responsible: 'TSL_CS',
      tone: 'violet',
      Icon: BadgeCheck
    },
    {
      status: OrderLineStatus.WAIT_SALE_UEC_APPROVE_PO,
      label: '4.WAIT SALE APPROVE PO',
      responsible: 'UEC_SALE',
      tone: 'orange',
      Icon: FileText
    },
    {
      status: OrderLineStatus.WAIT_MGR_UEC_APPROVE_PO,
      label: '5.WAIT MGR APPROVE PO',
      responsible: 'UEC_MANAGER',
      tone: 'purple',
      Icon: BadgeCheck
    },
    {
      status: OrderLineStatus.VESSEL_SCHEDULED,
      label: '6.WAIT VESSEL DEPARTURE',
      responsible: 'TSL_CS',
      tone: 'sky',
      Icon: CalendarCheck
    },
    {
      status: OrderLineStatus.VESSEL_DEPARTED,
      label: '7.DEPARTED',
      responsible: 'TSL_CS',
      tone: 'emerald',
      Icon: Ship
    }
  ].map((item) => ({
    ...item,
    value: filteredLines.filter((line) => line.status === item.status).length
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

  // react-select styles consistent with Admin.tsx
  const isDark = theme === 'dark';
  const selectStyles = useMemo(
    () => ({
      menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
      control: (base: any, state: any) => ({
        ...base,
        minHeight: 38,
        borderRadius: 'var(--radius-control)',
        backgroundColor: isDark ? '#0f172a' : '#ffffff',
        borderColor: state.isFocused
          ? isDark
            ? '#818cf8'
            : '#6366f1'
          : isDark
            ? '#334155'
            : '#cbd5e1',
        boxShadow: 'none',
        ':hover': {
          borderColor: state.isFocused
            ? isDark
              ? '#818cf8'
              : '#6366f1'
            : isDark
              ? '#475569'
              : '#94a3b8'
        }
      }),
      menu: (base: any) => ({
        ...base,
        borderRadius: 'var(--radius-control)',
        backgroundColor: isDark ? '#0f172a' : '#ffffff',
        border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`
      }),
      valueContainer: (base: any) => ({ ...base, padding: '0 10px' }),
      indicatorSeparator: (base: any) => ({
        ...base,
        backgroundColor: isDark ? '#334155' : '#cbd5e1'
      }),
      dropdownIndicator: (base: any) => ({
        ...base,
        padding: 6,
        color: isDark ? '#cbd5e1' : '#475569'
      }),
      clearIndicator: (base: any) => ({
        ...base,
        padding: 6,
        color: isDark ? '#cbd5e1' : '#475569'
      }),
      singleValue: (base: any) => ({
        ...base,
        color: isDark ? '#e2e8f0' : '#0f172a'
      }),
      input: (base: any) => ({
        ...base,
        color: isDark ? '#e2e8f0' : '#0f172a'
      }),
      placeholder: (base: any) => ({
        ...base,
        color: isDark ? '#94a3b8' : '#64748b'
      }),
      option: (base: any, state: any) => ({
        ...base,
        backgroundColor: state.isSelected
          ? isDark
            ? '#4338ca'
            : '#4f46e5'
          : state.isFocused
            ? isDark
              ? '#1e293b'
              : '#eef2ff'
            : 'transparent',
        color: state.isSelected ? '#ffffff' : isDark ? '#e2e8f0' : '#0f172a'
      })
    }),
    [isDark]
  );

  const selectMenuProps = {
    menuPortalTarget: document.body,
    menuPosition: 'fixed' as const,
    styles: selectStyles
  };

  return (
    <div className="space-y-8">
      {/* Header */}
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

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 ui-radius-card border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filter
          </span>
          <div className="flex-1 min-w-[180px] max-w-xs">
            <Select<SelectOption>
              options={poOptions}
              value={filterPo}
              onChange={(opt: SingleValue<SelectOption>) => setFilterPo(opt)}
              isClearable
              isSearchable
              placeholder="Search PO No…"
              classNamePrefix="dash-po"
              {...selectMenuProps}
            />
          </div>
          <div className="flex-1 min-w-[200px] max-w-sm">
            <Select<SelectOption>
              options={shipToOptions}
              value={filterShipTo}
              onChange={(opt: SingleValue<SelectOption>) =>
                setFilterShipTo(opt)
              }
              isClearable
              isSearchable
              placeholder="Search Ship-To…"
              classNamePrefix="dash-shipto"
              {...selectMenuProps}
            />
          </div>
          {isFiltered && (
            <>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 ui-radius-control border border-indigo-200 dark:border-indigo-800">
                {filteredLines.length} line
                {filteredLines.length !== 1 ? 's' : ''} matched
              </span>
              <button
                onClick={() => {
                  setFilterPo(null);
                  setFilterShipTo(null);
                }}
                className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 font-medium"
              >
                <X className="w-3.5 h-3.5" />
                Clear All
              </button>
            </>
          )}
        </div>
      </div>

      {/* Status Cards */}
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
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-medium tracking-wide">
                  {stat.responsible}
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

      {/* Recent Orders + Urgent Lines */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Orders */}
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
                  {isFiltered
                    ? `${allLineRows.length} line${allLineRows.length !== 1 ? 's' : ''} matching current filter`
                    : 'Latest visible orders with summary status and line count.'}
                </p>
              </div>
            </div>
          </div>
          {allLineRows.length === 0 ? (
            <div className="h-[260px] flex flex-col items-center justify-center text-center px-6">
              <div className="w-16 h-16 rounded-full border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 inline-flex items-center justify-center">
                <Package className="w-8 h-8" />
              </div>
              <p className="mt-5 text-lg font-semibold text-slate-700 dark:text-slate-200">
                {isFiltered
                  ? 'No orders match the current filter.'
                  : 'Your logistics pipeline is empty.'}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {isFiltered
                  ? 'Try adjusting or clearing the filter.'
                  : 'No visible lines in your current scope.'}
              </p>
            </div>
          ) : (
            <>
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
                  {pagedLineRows.map((row) => (
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
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>
                    Page {page + 1} of {totalPages} &middot;{' '}
                    {allLineRows.length} result
                    {allLineRows.length !== 1 ? 's' : ''}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                      className="p-1 ui-radius-control border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() =>
                        setPage((p) => Math.min(totalPages - 1, p + 1))
                      }
                      disabled={page >= totalPages - 1}
                      className="p-1 ui-radius-control border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Urgent Lines */}
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
                {isFiltered
                  ? 'No urgent lines in filtered scope.'
                  : 'Perfect! No urgent orders.'}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {isFiltered
                  ? 'Try adjusting or clearing the filter.'
                  : 'No ASAP lines with ETA in the next 30 days.'}
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-3 max-h-[420px] overflow-y-auto">
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
