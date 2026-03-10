import React, { useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Select, { SingleValue } from 'react-select';
import {
  Plus,
  Eye,
  Pencil,
  Trash2,
  Search,
  FileUp,
  FileSpreadsheet,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import Swal from '../utils/swal';
import {
  ActionIconButton,
  ActionIconLink
} from '../components/ActionIconButton';
import { LineStatusBadge, OrderStatusBadge } from '../components/StatusBadge';
import {
  useStore,
  getVisibleOrdersForUser,
  canUserAccessShipTo
} from '../store';
import { OrderLineStatus, OrderProgressStatus } from '../types';
import { formatStatusLabel } from '../utils/statusLabel';

type StatusFilter =
  | 'ALL'
  | `HEADER:${OrderProgressStatus}`
  | `LINE:${OrderLineStatus}`;

type StatusOption = {
  value: StatusFilter;
  label: string;
};

const SAMPLE_CSV =
  'note,poNo,destinationId,termId,gradeId,shipToId,requestETD,requestETA,qty,asap,otherRequested\n"Q1 restock (updated master)",PO-0001,DEST-TKY,CIF,BR150B,SHIP-MICHELIN,2026-03-10,2026-03-20,25,FALSE,\n"Q1 restock (updated master)",PO-0002,DEST-SH,FOB,BR360B,SHIP-TOYO-TIRE,2026-03-18,2026-03-29,15,FALSE,\n"Q1 restock (updated master)",PO-0003,DEST-OSA,EXW,VCR-617,SHIP-BRIDGESTONE,,,10,TRUE,"Need earliest vessel"';

const parseCsvLine = (line: string) => {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index++) {
    const char = line[index];

    if (char === '"') {
      const isEscapedQuote = inQuotes && line[index + 1] === '"';
      if (isEscapedQuote) {
        current += '"';
        index++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
};

const normalizeBoolean = (value: string) => value.toLowerCase() === 'true';

export const Orders: React.FC = () => {
  const navigate = useNavigate();
  const csvInputRef = useRef<HTMLInputElement>(null);
  const { orders, companies, currentUser, deleteOrder, masterData, theme } =
    useStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [expandedOrderNos, setExpandedOrderNos] = useState<string[]>([]);

  const handleDeleteOrder = async (orderNo: string) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: `Delete order ${orderNo}?`,
      text: 'This action cannot be undone.',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;
    deleteOrder(orderNo);
  };

  const getCompanyName = (companyId: string) =>
    companies.find((company) => company.id === companyId)?.name || companyId;

  const visibleOrders = useMemo(
    () => getVisibleOrdersForUser(orders, currentUser),
    [orders, currentUser]
  );

  const rows = useMemo(() => {
    return visibleOrders
      .map((order) => {
        const companyName = getCompanyName(order.companyId);
        const matchSearch =
          order.orderNo.toLowerCase().includes(search.toLowerCase()) ||
          order.companyId.toLowerCase().includes(search.toLowerCase()) ||
          companyName.toLowerCase().includes(search.toLowerCase());

        if (!matchSearch) return null;

        if (statusFilter === 'ALL') {
          return { order, filteredLines: order.items };
        }

        if (statusFilter.startsWith('HEADER:')) {
          const headerStatus = statusFilter.replace(
            'HEADER:',
            ''
          ) as OrderProgressStatus;
          return order.status === headerStatus
            ? { order, filteredLines: order.items }
            : null;
        }

        const lineStatus = statusFilter.replace('LINE:', '') as OrderLineStatus;
        const filteredLines = order.items.filter(
          (line) => line.status === lineStatus
        );

        return filteredLines.length > 0 ? { order, filteredLines } : null;
      })
      .filter(
        (
          item
        ): item is {
          order: (typeof visibleOrders)[number];
          filteredLines: (typeof visibleOrders)[number]['items'];
        } => Boolean(item)
      );
  }, [visibleOrders, search, statusFilter]);

  const canCreate = Boolean(currentUser?.canCreateOrder);

  const statusOptions = useMemo<StatusOption[]>(
    () => [
      { value: 'ALL', label: 'All Status' },
      ...Object.values(OrderProgressStatus).map((item) => ({
        value: `HEADER:${item}` as StatusFilter,
        label: `Header: ${
          item === OrderProgressStatus.CREATE
            ? 'DRAFT'
            : formatStatusLabel(item)
        }`
      })),
      ...Object.values(OrderLineStatus).map((item) => ({
        value: `LINE:${item}` as StatusFilter,
        label: `Line: ${formatStatusLabel(item)}`
      }))
    ],
    []
  );

  const selectStyles = useMemo(() => {
    const isDark = theme === 'dark';
    return {
      menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
      control: (base: any, state: any) => ({
        ...base,
        minHeight: 36,
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
      valueContainer: (base: any) => ({
        ...base,
        minHeight: 34,
        padding: '0 12px'
      }),
      indicatorSeparator: (base: any) => ({
        ...base,
        marginTop: 6,
        marginBottom: 6,
        backgroundColor: isDark ? '#334155' : '#cbd5e1'
      }),
      dropdownIndicator: (base: any) => ({
        ...base,
        padding: 7,
        color: isDark ? '#cbd5e1' : '#475569'
      }),
      singleValue: (base: any) => ({
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
    };
  }, [theme]);

  const isExpanded = (orderNo: string) => expandedOrderNos.includes(orderNo);
  const toggleExpand = (orderNo: string) => {
    setExpandedOrderNos((prev) =>
      prev.includes(orderNo)
        ? prev.filter((value) => value !== orderNo)
        : [...prev, orderNo]
    );
  };

  const companyId = currentUser?.companyId || 'C001';

  const shipTos = useMemo(
    () =>
      masterData.shipTos.filter((shipTo) =>
        currentUser ? canUserAccessShipTo(currentUser, shipTo.id) : false
      ),
    [masterData.shipTos, currentUser]
  );

  const grades = masterData.grades;
  const destinations = masterData.destinations;
  const terms = masterData.terms;

  const handleDownloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'order-import-sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCsvImport = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      const lines = content
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      if (lines.length < 2) {
        Swal.fire({
          icon: 'error',
          title: 'Invalid CSV',
          text: 'CSV needs header + at least 1 row.'
        });
        return;
      }

      const headers = parseCsvLine(lines[0]);
      const requiredHeaders = [
        'poNo',
        'destinationId',
        'termId',
        'gradeId',
        'shipToId',
        'qty',
        'asap'
      ];

      const missingHeader = requiredHeaders.find(
        (header) => !headers.includes(header)
      );

      if (missingHeader) {
        Swal.fire({
          icon: 'error',
          title: 'Missing column',
          text: `${missingHeader}`
        });
        return;
      }

      const rows = lines.slice(1).map((line) => {
        const columns = parseCsvLine(line);
        const record = headers.reduce<Record<string, string>>(
          (acc, key, idx) => {
            acc[key] = columns[idx] || '';
            return acc;
          },
          {}
        );

        return {
          poNo: record.poNo || '',
          shipToId: record.shipToId || '',
          destinationId: record.destinationId || '',
          termId: record.termId || '',
          gradeId: record.gradeId || '',
          requestETD: record.requestETD || '',
          requestETA: record.requestETA || '',
          qty: Number(record.qty) > 0 ? Number(record.qty) : 1,
          asap: normalizeBoolean(record.asap || ''),
          otherRequested: record.otherRequested || ''
        };
      });

      const shipToIds = new Set(shipTos.map((item) => item.id));
      const destinationIds = new Set(destinations.map((item) => item.id));
      const termIds = new Set(terms.map((item) => item.id));
      const gradeIds = new Set(grades.map((item) => item.id));
      const invalidMasterRows: string[] = [];

      rows.forEach((row, index) => {
        const rowNo = index + 2;
        const invalidFields: string[] = [];

        if (row.shipToId && !shipToIds.has(row.shipToId)) {
          invalidFields.push('shipToId');
        }
        if (row.destinationId && !destinationIds.has(row.destinationId)) {
          invalidFields.push('destinationId');
        }
        if (row.termId && !termIds.has(row.termId)) {
          invalidFields.push('termId');
        }
        if (row.gradeId && !gradeIds.has(row.gradeId)) {
          invalidFields.push('gradeId');
        }

        if (invalidFields.length > 0) {
          invalidMasterRows.push(`Row ${rowNo}: ${invalidFields.join(', ')}`);
        }
      });

      if (invalidMasterRows.length > 0) {
        Swal.fire({
          icon: 'error',
          title: 'Invalid master data reference',
          html: `<div class="text-left text-sm"><p class="mb-2">Please fix these CSV rows:</p><ul class="list-disc pl-5">${invalidMasterRows
            .slice(0, 8)
            .map((item) => `<li>${item}</li>`)
            .join('')}</ul>${
            invalidMasterRows.length > 8
              ? `<p class="mt-2 text-xs">...and ${invalidMasterRows.length - 8} more row(s)</p>`
              : ''
          }</div>`
        });
        return;
      }

      const validRows = rows.filter(
        (row) =>
          row.poNo &&
          row.shipToId &&
          row.destinationId &&
          row.termId &&
          row.gradeId
      );

      if (validRows.length === 0) {
        Swal.fire({
          icon: 'error',
          title: 'No valid rows',
          text: 'Check required fields in CSV.'
        });
        return;
      }

      const firstNoteLine = parseCsvLine(lines[1]);
      const noteIndex = headers.findIndex((header) => header === 'note');
      const note = noteIndex >= 0 ? firstNoteLine[noteIndex] || '' : '';

      navigate('/orders/create', {
        state: {
          importedDraft: {
            note,
            items: validRows
          }
        }
      });
    } catch {
      Swal.fire({
        icon: 'error',
        title: 'Import failed',
        text: 'Cannot read CSV file.'
      });
    } finally {
      if (event.target) event.target.value = '';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="ui-page-title">Order Management</h1>
          <p className="ui-page-subtitle">
            Visibility is controlled per line by user ship-to.
          </p>
        </div>
        {canCreate && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadSample}
              className="bg-slate-700 text-white px-4 py-2 ui-radius-control text-sm font-bold hover:bg-slate-800 inline-flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Sample CSV
            </button>
            <button
              onClick={() => csvInputRef.current?.click()}
              className="bg-violet-600 text-white px-4 py-2 ui-radius-control text-sm font-bold hover:bg-violet-700 inline-flex items-center gap-2"
            >
              <FileUp className="w-4 h-4" />
              Import CSV
            </button>

            <Link
              to="/orders/create"
              className="bg-indigo-600 text-white px-4 py-2 ui-radius-control text-sm font-bold hover:bg-indigo-700 inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Order
            </Link>
          </div>
        )}
      </div>

      <input
        ref={csvInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handleCsvImport}
      />

      <div className="bg-white dark:bg-slate-900 ui-radius-card border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-2 bg-slate-50/40 dark:bg-slate-950/20">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="shadcn-input h-9 text-sm pl-9"
              placeholder="Search order no / company"
            />
          </div>
          <div className="md:w-60">
            <Select
              options={statusOptions}
              value={statusOptions.find(
                (option) => option.value === statusFilter
              )}
              onChange={(option: SingleValue<StatusOption>) =>
                setStatusFilter(option?.value || 'ALL')
              }
              classNamePrefix="status-filter"
              menuPortalTarget={document.body}
              menuPosition="fixed"
              styles={selectStyles}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm ui-table-standard">
            <thead className="bg-slate-50/70 dark:bg-slate-950/40 ui-table-head">
              <tr>
                <th className="px-4 py-3 text-left">Order No</th>
                <th className="px-4 py-3 text-left">Company</th>
                <th className="px-4 py-3 text-left">Created By</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Visible Lines</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map((row) => {
                const { order, filteredLines } = row;
                const expanded = isExpanded(order.orderNo);
                return (
                  <React.Fragment key={order.orderNo}>
                    <tr className="bg-white dark:bg-slate-900">
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                        <button
                          type="button"
                          onClick={() => toggleExpand(order.orderNo)}
                          className="inline-flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400"
                          title={expanded ? 'Collapse items' : 'Expand items'}
                          aria-label={
                            expanded ? 'Collapse items' : 'Expand items'
                          }
                        >
                          {expanded ? (
                            <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                          )}
                          <span>{order.orderNo}</span>
                        </button>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {getCompanyName(order.companyId)}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {order.createdBy}
                      </td>
                      <td className="px-4 py-3">
                        <OrderStatusBadge status={order.status} />
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-700 dark:text-slate-300">
                        {filteredLines.length}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <ActionIconLink
                            to={`/orders/edit/${order.orderNo}?readonly=1`}
                            tone="indigo"
                            title="Detail"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </ActionIconLink>
                          {canCreate && (
                            <ActionIconLink
                              to={`/orders/edit/${order.orderNo}`}
                              tone="emerald"
                              title="Edit"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </ActionIconLink>
                          )}
                          {canCreate && (
                            <ActionIconButton
                              onClick={() => handleDeleteOrder(order.orderNo)}
                              tone="rose"
                              title={
                                order.status !== OrderProgressStatus.CREATE
                                  ? 'Cannot delete order in progress'
                                  : 'Delete'
                              }
                              disabled={
                                order.status !== OrderProgressStatus.CREATE
                              }
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </ActionIconButton>
                          )}
                        </div>
                      </td>
                    </tr>

                    {expanded && (
                      <tr className="bg-slate-50/40 dark:bg-slate-950/30">
                        <td colSpan={6} className="px-4 py-3">
                          <div className="border border-slate-200 dark:border-slate-800 ui-radius-panel overflow-hidden">
                            <table className="w-full text-xs ui-table-standard">
                              <thead className="bg-slate-100/80 dark:bg-slate-900/60 ui-table-head">
                                <tr>
                                  <th className="px-3 py-2 text-left">PO</th>
                                  <th className="px-3 py-2 text-left">
                                    Ship-to
                                  </th>
                                  <th className="px-3 py-2 text-left">
                                    Destination
                                  </th>
                                  <th className="px-3 py-2 text-left">
                                    Status
                                  </th>
                                  <th className="px-3 py-2 text-right">Qty</th>
                                  <th className="px-3 py-2 text-left">
                                    Req ETA
                                  </th>
                                  <th className="px-3 py-2 text-right">
                                    Action
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                                {filteredLines.map((line) => (
                                  <tr key={line.id}>
                                    <td className="px-3 py-2 font-semibold text-slate-800 dark:text-slate-200">
                                      {line.poNo}
                                    </td>
                                    <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
                                      {line.shipToId}
                                    </td>
                                    <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
                                      {line.destinationId}
                                    </td>
                                    <td className="px-3 py-2">
                                      <LineStatusBadge
                                        status={line.status}
                                        className="text-[9px]"
                                      />
                                    </td>
                                    <td className="px-3 py-2 text-right text-slate-700 dark:text-slate-300 font-semibold">
                                      {line.qty}
                                    </td>
                                    <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
                                      {line.requestETA || '-'}
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                      <ActionIconLink
                                        to={`/orders/${order.orderNo}?lineId=${line.id}`}
                                        tone="indigo"
                                        title="Line Detail"
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                      </ActionIconLink>
                                    </td>
                                  </tr>
                                ))}
                                {filteredLines.length === 0 && (
                                  <tr>
                                    <td
                                      colSpan={7}
                                      className="px-3 py-6 text-center text-slate-400"
                                    >
                                      No visible items in this order.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-sm text-slate-400"
                  >
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
