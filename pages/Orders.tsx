import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Eye,
  Pencil,
  Trash2,
  FileUp,
  FileSpreadsheet,
  Copy,
  X,
  ChevronLeft,
  ChevronRight
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
import {
  Order,
  OrderItem,
  OrderLineStatus,
  OrderProgressStatus
} from '../types';
import { formatStatusLabel } from '../utils/statusLabel';

type FlatRow =
  | { type: 'group'; order: Order; lineCount: number }
  | { type: 'line'; order: Order; line: OrderItem };

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
  const { orders, companies, currentUser, deleteOrder, masterData } =
    useStore();
  const [selectedLineIds, setSelectedLineIds] = useState<Set<string>>(
    new Set()
  );
  const [orderFilters, setOrderFilters] = useState({
    orderNo: '',
    company: '',
    createdBy: '',
    orderStatus: 'ALL' as OrderProgressStatus | 'ALL'
  });
  const [lineFilters, setLineFilters] = useState({
    poNo: '',
    grade: '',
    term: '',
    shipTo: '',
    destination: '',
    lineStatus: 'ALL' as OrderLineStatus | 'ALL'
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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

  const canCreate = Boolean(currentUser?.canCreateOrder);

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

  const getGradeName = (gradeId: string) =>
    grades.find((g) => g.id === gradeId)?.name || gradeId;
  const getTermName = (termId: string) =>
    terms.find((t) => t.id === termId)?.name || termId;
  const getShipToName = (shipToId: string) =>
    shipTos.find((s) => s.id === shipToId)?.name || shipToId;
  const getDestinationName = (destId: string) =>
    destinations.find((d) => d.id === destId)?.name || destId;

  const flatRows = useMemo((): FlatRow[] => {
    const result: FlatRow[] = [];
    for (const order of visibleOrders) {
      const companyName = getCompanyName(order.companyId);

      if (
        orderFilters.orderNo &&
        !order.orderNo
          .toLowerCase()
          .includes(orderFilters.orderNo.toLowerCase())
      )
        continue;
      if (
        orderFilters.company &&
        !companyName
          .toLowerCase()
          .includes(orderFilters.company.toLowerCase()) &&
        !order.companyId
          .toLowerCase()
          .includes(orderFilters.company.toLowerCase())
      )
        continue;
      if (
        orderFilters.createdBy &&
        !order.createdBy
          .toLowerCase()
          .includes(orderFilters.createdBy.toLowerCase())
      )
        continue;
      if (
        orderFilters.orderStatus !== 'ALL' &&
        order.status !== orderFilters.orderStatus
      )
        continue;

      const visibleLines = order.items.filter((line) => {
        if (
          lineFilters.poNo &&
          !line.poNo.toLowerCase().includes(lineFilters.poNo.toLowerCase())
        )
          return false;
        if (
          lineFilters.grade &&
          !getGradeName(line.gradeId)
            .toLowerCase()
            .includes(lineFilters.grade.toLowerCase()) &&
          !line.gradeId.toLowerCase().includes(lineFilters.grade.toLowerCase())
        )
          return false;
        if (
          lineFilters.term &&
          !getTermName(line.termId)
            .toLowerCase()
            .includes(lineFilters.term.toLowerCase()) &&
          !line.termId.toLowerCase().includes(lineFilters.term.toLowerCase())
        )
          return false;
        if (
          lineFilters.shipTo &&
          !getShipToName(line.shipToId)
            .toLowerCase()
            .includes(lineFilters.shipTo.toLowerCase()) &&
          !line.shipToId
            .toLowerCase()
            .includes(lineFilters.shipTo.toLowerCase())
        )
          return false;
        if (
          lineFilters.destination &&
          !getDestinationName(line.destinationId)
            .toLowerCase()
            .includes(lineFilters.destination.toLowerCase()) &&
          !line.destinationId
            .toLowerCase()
            .includes(lineFilters.destination.toLowerCase())
        )
          return false;
        if (
          lineFilters.lineStatus !== 'ALL' &&
          line.status !== lineFilters.lineStatus
        )
          return false;
        return true;
      });

      if (visibleLines.length === 0) continue;
      result.push({ type: 'group', order, lineCount: visibleLines.length });
      for (const line of visibleLines) {
        result.push({ type: 'line', order, line });
      }
    }
    return result;
  }, [
    visibleOrders,
    orderFilters,
    lineFilters,
    grades,
    terms,
    shipTos,
    destinations
  ]);

  const orderStatusOptions = useMemo(
    () => [
      { value: 'ALL' as const, label: 'All' },
      ...Object.values(OrderProgressStatus).map((s) => ({
        value: s,
        label: s === OrderProgressStatus.CREATE ? 'DRAFT' : formatStatusLabel(s)
      }))
    ],
    []
  );

  const lineStatusOptions = useMemo(
    () => [
      { value: 'ALL' as const, label: 'All' },
      ...Object.values(OrderLineStatus).map((s) => ({
        value: s,
        label: formatStatusLabel(s)
      }))
    ],
    []
  );

  const hasAnyFilter =
    Object.values(orderFilters).some((v) => v !== '' && v !== 'ALL') ||
    Object.values(lineFilters).some((v) => v !== '' && v !== 'ALL');

  const clearAllFilters = () => {
    setOrderFilters({
      orderNo: '',
      company: '',
      createdBy: '',
      orderStatus: 'ALL'
    });
    setLineFilters({
      poNo: '',
      grade: '',
      term: '',
      shipTo: '',
      destination: '',
      lineStatus: 'ALL'
    });
    setPage(1);
  };

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setPage(1);
  }, [orderFilters, lineFilters]);

  // Paginate by order groups so no group is split across pages
  const groupOrderNos = useMemo(
    () => [
      ...new Map(
        flatRows
          .filter((r) => r.type === 'group')
          .map((r) => [r.order.orderNo, r.order.orderNo])
      ).keys()
    ],
    [flatRows]
  );

  const pageCount = Math.max(1, Math.ceil(groupOrderNos.length / pageSize));
  const safePage = Math.min(page, pageCount);

  const pagedOrderNos = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return new Set(groupOrderNos.slice(start, start + pageSize));
  }, [groupOrderNos, safePage, pageSize]);

  const pagedRows = useMemo(
    () => flatRows.filter((r) => pagedOrderNos.has(r.order.orderNo)),
    [flatRows, pagedOrderNos]
  );

  const visibleLineRows = useMemo(
    () =>
      pagedRows.filter(
        (r): r is Extract<FlatRow, { type: 'line' }> => r.type === 'line'
      ),
    [pagedRows]
  );

  const allVisibleSelected =
    visibleLineRows.length > 0 &&
    visibleLineRows.every((r) => selectedLineIds.has(r.line.id));

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedLineIds(new Set());
    } else {
      setSelectedLineIds(new Set(visibleLineRows.map((r) => r.line.id)));
    }
  };

  const toggleLine = (id: string) => {
    setSelectedLineIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCopySelected = () => {
    const selectedLines = visibleLineRows
      .filter((r) => selectedLineIds.has(r.line.id))
      .map((r) => r.line);

    const items = selectedLines.map((line) => ({
      poNo: line.poNo,
      shipToId: line.shipToId,
      destinationId: line.destinationId,
      termId: line.termId,
      gradeId: line.gradeId,
      requestETD: line.requestETD || '',
      requestETA: line.requestETA || '',
      qty: line.qty,
      asap: line.asap,
      otherRequested: line.otherRequested || ''
    }));

    navigate('/orders/create', {
      state: {
        importedDraft: {
          note: '',
          items
        }
      }
    });
  };

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

      {/* Floating copy bar */}
      {selectedLineIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-indigo-700 dark:bg-indigo-600 text-white px-5 py-3 rounded-full shadow-2xl shadow-indigo-900/40">
          <span className="text-sm font-semibold whitespace-nowrap">
            {selectedLineIds.size} line{selectedLineIds.size !== 1 ? 's' : ''}{' '}
            selected
          </span>
          <button
            onClick={handleCopySelected}
            className="inline-flex items-center gap-2 bg-white text-indigo-700 hover:bg-indigo-50 font-bold text-sm px-4 py-1.5 rounded-full transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            Copy to New Order
          </button>
          <button
            onClick={() => setSelectedLineIds(new Set())}
            className="hover:text-indigo-200 transition-colors"
            title="Clear selection"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 ui-radius-card border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        {/* Order-level filter bar */}
        <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/30 flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">
            Order
          </span>
          <input
            value={orderFilters.orderNo}
            onChange={(e) =>
              setOrderFilters((prev) => ({ ...prev, orderNo: e.target.value }))
            }
            className="h-6 text-[11px] px-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 placeholder-slate-400 outline-none focus:border-indigo-400 dark:focus:border-indigo-500 w-28"
            placeholder="Order No..."
          />
          <input
            value={orderFilters.company}
            onChange={(e) =>
              setOrderFilters((prev) => ({ ...prev, company: e.target.value }))
            }
            className="h-6 text-[11px] px-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 placeholder-slate-400 outline-none focus:border-indigo-400 dark:focus:border-indigo-500 w-32"
            placeholder="Company..."
          />
          <input
            value={orderFilters.createdBy}
            onChange={(e) =>
              setOrderFilters((prev) => ({
                ...prev,
                createdBy: e.target.value
              }))
            }
            className="h-6 text-[11px] px-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 placeholder-slate-400 outline-none focus:border-indigo-400 dark:focus:border-indigo-500 w-28"
            placeholder="Created By..."
          />
          <select
            value={orderFilters.orderStatus}
            onChange={(e) =>
              setOrderFilters((prev) => ({
                ...prev,
                orderStatus: e.target.value as OrderProgressStatus | 'ALL'
              }))
            }
            className="h-6 text-[11px] px-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 outline-none focus:border-indigo-400 dark:focus:border-indigo-500 w-28"
          >
            {orderStatusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {hasAnyFilter && (
            <button
              onClick={clearAllFilters}
              className="h-6 px-2 text-[11px] rounded border border-rose-300 dark:border-rose-700 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 whitespace-nowrap"
            >
              Clear all
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs ui-table-standard">
            <thead className="bg-slate-50/70 dark:bg-slate-950/40 ui-table-head">
              <tr>
                {/* Select-all checkbox */}
                <th className="px-2 py-1.5 w-8 text-center">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleSelectAll}
                    className="w-3.5 h-3.5 accent-indigo-600 cursor-pointer"
                    title="Select all visible lines"
                  />
                </th>
                {/* PO No */}
                <th className="px-2 py-1.5 text-left w-28">
                  <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    PO No
                  </div>
                  <input
                    value={lineFilters.poNo}
                    onChange={(e) =>
                      setLineFilters((prev) => ({
                        ...prev,
                        poNo: e.target.value
                      }))
                    }
                    className="w-full h-5 text-[10px] px-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 placeholder-slate-400 outline-none focus:border-indigo-400 font-normal"
                    placeholder="Filter..."
                  />
                </th>
                {/* Grade */}
                <th className="px-2 py-1.5 text-left w-24">
                  <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Grade
                  </div>
                  <input
                    value={lineFilters.grade}
                    onChange={(e) =>
                      setLineFilters((prev) => ({
                        ...prev,
                        grade: e.target.value
                      }))
                    }
                    className="w-full h-5 text-[10px] px-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 placeholder-slate-400 outline-none focus:border-indigo-400 font-normal"
                    placeholder="Filter..."
                  />
                </th>
                {/* Term */}
                <th className="px-2 py-1.5 text-left w-20">
                  <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Term
                  </div>
                  <input
                    value={lineFilters.term}
                    onChange={(e) =>
                      setLineFilters((prev) => ({
                        ...prev,
                        term: e.target.value
                      }))
                    }
                    className="w-full h-5 text-[10px] px-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 placeholder-slate-400 outline-none focus:border-indigo-400 font-normal"
                    placeholder="Filter..."
                  />
                </th>
                {/* Ship-To */}
                <th className="px-2 py-1.5 text-left w-32">
                  <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Ship-To
                  </div>
                  <input
                    value={lineFilters.shipTo}
                    onChange={(e) =>
                      setLineFilters((prev) => ({
                        ...prev,
                        shipTo: e.target.value
                      }))
                    }
                    className="w-full h-5 text-[10px] px-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 placeholder-slate-400 outline-none focus:border-indigo-400 font-normal"
                    placeholder="Filter..."
                  />
                </th>
                {/* Destination */}
                <th className="px-2 py-1.5 text-left w-28">
                  <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Destination
                  </div>
                  <input
                    value={lineFilters.destination}
                    onChange={(e) =>
                      setLineFilters((prev) => ({
                        ...prev,
                        destination: e.target.value
                      }))
                    }
                    className="w-full h-5 text-[10px] px-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 placeholder-slate-400 outline-none focus:border-indigo-400 font-normal"
                    placeholder="Filter..."
                  />
                </th>
                <th className="px-2 py-1.5 text-right text-[10px] font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap w-12">
                  Qty
                </th>
                <th className="px-2 py-1.5 text-right text-[10px] font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap w-24">
                  Price
                </th>
                <th className="px-2 py-1.5 text-left text-[10px] font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap w-24">
                  Req ETD
                </th>
                <th className="px-2 py-1.5 text-left text-[10px] font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap w-24">
                  Req ETA
                </th>
                <th className="px-2 py-1.5 text-left text-[10px] font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap w-24">
                  Act ETD
                </th>
                <th className="px-2 py-1.5 text-center text-[10px] font-semibold text-slate-500 dark:text-slate-400 w-12">
                  ASAP
                </th>
                {/* Line Status */}
                <th className="px-2 py-1.5 text-left w-36">
                  <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Line Status
                  </div>
                  <select
                    value={lineFilters.lineStatus}
                    onChange={(e) =>
                      setLineFilters((prev) => ({
                        ...prev,
                        lineStatus: e.target.value as OrderLineStatus | 'ALL'
                      }))
                    }
                    className="w-full h-5 text-[10px] px-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 outline-none focus:border-indigo-400 font-normal"
                  >
                    {lineStatusOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </th>
                <th className="px-2 py-1.5 text-right text-[10px] font-semibold text-slate-500 dark:text-slate-400 w-16">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {pagedRows.map((row) => {
                if (row.type === 'group') {
                  const { order, lineCount } = row;
                  return (
                    <tr
                      key={`group-${order.orderNo}`}
                      className="bg-indigo-50/70 dark:bg-indigo-950/25 border-t-2 border-indigo-200 dark:border-indigo-800"
                    >
                      <td className="px-2 py-1.5 w-8" />
                      <td colSpan={13} className="px-3 py-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="font-bold text-indigo-900 dark:text-indigo-300 text-xs whitespace-nowrap">
                              {order.orderNo}
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {getCompanyName(order.companyId)}
                            </span>
                            <span className="text-[11px] text-slate-400 dark:text-slate-500 whitespace-nowrap">
                              by {order.createdBy}
                            </span>
                            <OrderStatusBadge status={order.status} />
                            <span className="text-[10px] text-slate-400 whitespace-nowrap">
                              {lineCount} line{lineCount !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <ActionIconLink
                              to={`/orders/edit/${order.orderNo}?readonly=1`}
                              tone="indigo"
                              title="Detail"
                            >
                              <Eye className="w-3 h-3" />
                            </ActionIconLink>
                            {canCreate && (
                              <ActionIconLink
                                to={`/orders/edit/${order.orderNo}`}
                                tone="emerald"
                                title="Edit"
                              >
                                <Pencil className="w-3 h-3" />
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
                                <Trash2 className="w-3 h-3" />
                              </ActionIconButton>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                }

                const { order, line } = row;
                return (
                  <tr
                    key={`line-${line.id}`}
                    className="bg-white dark:bg-slate-900 hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-2 py-1.5 text-center w-8">
                      <input
                        type="checkbox"
                        checked={selectedLineIds.has(line.id)}
                        onChange={() => toggleLine(line.id)}
                        className="w-3.5 h-3.5 accent-indigo-600 cursor-pointer"
                      />
                    </td>
                    <td className="px-2 py-1.5 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      {line.poNo}
                    </td>
                    <td className="px-2 py-1.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {getGradeName(line.gradeId)}
                    </td>
                    <td className="px-2 py-1.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {getTermName(line.termId)}
                    </td>
                    <td className="px-2 py-1.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {getShipToName(line.shipToId)}
                    </td>
                    <td className="px-2 py-1.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {getDestinationName(line.destinationId)}
                    </td>
                    <td className="px-2 py-1.5 text-right font-semibold text-slate-700 dark:text-slate-300">
                      {line.qty}
                    </td>
                    <td className="px-2 py-1.5 text-right text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {line.price != null
                        ? `${line.currency || ''} ${line.price.toLocaleString()}`.trim()
                        : '—'}
                    </td>
                    <td className="px-2 py-1.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {line.requestETD || '—'}
                    </td>
                    <td className="px-2 py-1.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {line.requestETA || '—'}
                    </td>
                    <td className="px-2 py-1.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {line.actualETD || '—'}
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      {line.asap ? (
                        <span className="text-amber-600 dark:text-amber-400 font-bold text-[9px] bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded">
                          ASAP
                        </span>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600 text-[10px]">
                          —
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-1.5">
                      <LineStatusBadge
                        status={line.status}
                        className="text-[9px]"
                      />
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      <ActionIconLink
                        to={`/orders/${order.orderNo}?lineId=${line.id}`}
                        tone="indigo"
                        title="Line Detail"
                      >
                        <Eye className="w-3 h-3" />
                      </ActionIconLink>
                    </td>
                  </tr>
                );
              })}
              {flatRows.length === 0 && (
                <tr>
                  <td
                    colSpan={14}
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

      {/* Pagination */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <span>
            {groupOrderNos.length === 0
              ? 'No orders'
              : `${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, groupOrderNos.length)} of ${groupOrderNos.length} orders`}
          </span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="h-7 text-xs px-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 outline-none focus:border-indigo-400"
          >
            {[10, 20, 50].map((n) => (
              <option key={n} value={n}>
                {n} / page
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage(1)}
            disabled={safePage <= 1}
            className="h-7 w-7 inline-flex items-center justify-center rounded border border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 disabled:opacity-30 hover:enabled:bg-slate-100 dark:hover:enabled:bg-slate-800 text-xs font-bold"
          >
            «
          </button>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage <= 1}
            className="h-7 w-7 inline-flex items-center justify-center rounded border border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 disabled:opacity-30 hover:enabled:bg-slate-100 dark:hover:enabled:bg-slate-800"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          {Array.from({ length: pageCount }, (_, i) => i + 1)
            .filter(
              (p) => p === 1 || p === pageCount || Math.abs(p - safePage) <= 1
            )
            .reduce<(number | '…')[]>((acc, p, idx, arr) => {
              if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1)
                acc.push('…');
              acc.push(p);
              return acc;
            }, [])
            .map((p, idx) =>
              p === '…' ? (
                <span
                  key={`ellipsis-${idx}`}
                  className="h-7 w-7 inline-flex items-center justify-center text-slate-400 text-xs"
                >
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p as number)}
                  className={`h-7 w-7 inline-flex items-center justify-center rounded border text-xs font-semibold transition-colors ${
                    p === safePage
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {p}
                </button>
              )
            )}

          <button
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            disabled={safePage >= pageCount}
            className="h-7 w-7 inline-flex items-center justify-center rounded border border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 disabled:opacity-30 hover:enabled:bg-slate-100 dark:hover:enabled:bg-slate-800"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setPage(pageCount)}
            disabled={safePage >= pageCount}
            className="h-7 w-7 inline-flex items-center justify-center rounded border border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 disabled:opacity-30 hover:enabled:bg-slate-100 dark:hover:enabled:bg-slate-800 text-xs font-bold"
          >
            »
          </button>
        </div>
      </div>
    </div>
  );
};
