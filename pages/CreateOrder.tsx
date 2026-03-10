import React, { useEffect, useMemo, useState } from 'react';
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams
} from 'react-router-dom';
import { Controller, useForm, useFieldArray } from 'react-hook-form';
import Select, { SingleValue } from 'react-select';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  ArrowLeft,
  Save,
  Send,
  Pencil,
  Plus,
  Trash2,
  ClipboardCopy,
  Info,
  Hash,
  Calendar,
  FileText
} from 'lucide-react';
import Swal from '../utils/swal';
import { ActionIconButton } from '../components/ActionIconButton';
import {
  useStore,
  canUserAccessShipTo,
  canUserRunLineAction,
  deriveOrderProgressStatus,
  getVisibleOrdersForUser
} from '../store';
import { LineAction, Order, OrderLineStatus, UserGroup } from '../types';

const lineSchema = z
  .object({
    poNo: z.string().min(1, 'PO required'),
    shipToId: z.string().min(1, 'Select ship-to'),
    destinationId: z.string().min(1, 'Select destination'),
    termId: z.string().min(1, 'Select term'),
    gradeId: z.string().min(1, 'Select grade'),
    requestETD: z.string().optional(),
    requestETA: z.string().optional(),
    qty: z.number().min(1, 'Qty must be at least 1'),
    asap: z.boolean(),
    otherRequested: z.string().optional()
  })
  .refine((line) => line.asap || !!line.requestETD || !!line.requestETA, {
    message: 'Set ETD/ETA or select ASAP',
    path: ['requestETA']
  });

const schema = z
  .object({
    note: z.string().optional(),
    items: z.array(lineSchema).min(1, 'Add at least 1 line')
  })
  .superRefine((data, ctx) => {
    const poNoBuckets = new Map<string, number[]>();

    data.items.forEach((line, index) => {
      const normalizedPoNo = line.poNo.trim().toLowerCase();
      if (!normalizedPoNo) return;
      const found = poNoBuckets.get(normalizedPoNo);
      if (found) {
        found.push(index);
        return;
      }
      poNoBuckets.set(normalizedPoNo, [index]);
    });

    poNoBuckets.forEach((indexes) => {
      if (indexes.length < 2) return;
      indexes.forEach((index) => {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'PO must be unique per row',
          path: ['items', index, 'poNo']
        });
      });
    });
  });

type FormData = z.infer<typeof schema>;

type SelectOption = {
  value: string;
  label: string;
};

export const CreateOrder: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { orderNo } = useParams();
  const [searchParams] = useSearchParams();

  const {
    currentUser,
    theme,
    companies,
    masterData,
    linePermissionMatrix,
    orders,
    addOrder,
    updateOrder
  } = useStore();
  const editingOrder = orderNo
    ? orders.find((order) => order.orderNo === orderNo)
    : null;
  const canAccessEditingOrder = useMemo(() => {
    if (!editingOrder) return true;
    return Boolean(
      getVisibleOrdersForUser(orders, currentUser).find(
        (order) => order.orderNo === editingOrder.orderNo
      )
    );
  }, [editingOrder, orders, currentUser]);
  const importedDraft =
    !editingOrder &&
    (
      location.state as {
        importedDraft?: {
          note?: string;
          items: Array<{
            poNo: string;
            shipToId: string;
            destinationId: string;
            termId: string;
            gradeId: string;
            requestETD?: string;
            requestETA?: string;
            qty: number;
            asap: boolean;
            otherRequested?: string;
          }>;
        };
      } | null
    )?.importedDraft;

  const isEdit = Boolean(editingOrder);
  const isHeaderDetailMode = isEdit && searchParams.get('readonly') === '1';
  const isReadOnly = isHeaderDetailMode;

  const today = useMemo(
    () =>
      new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }),
    []
  );

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

  const shipToOptions = useMemo<SelectOption[]>(
    () =>
      shipTos.map((item) => ({
        value: item.id,
        label: `${item.name} (${item.groupSaleType})`
      })),
    [shipTos]
  );

  const destinationOptions = useMemo<SelectOption[]>(
    () => destinations.map((item) => ({ value: item.id, label: item.name })),
    [destinations]
  );

  const termOptions = useMemo<SelectOption[]>(
    () => terms.map((item) => ({ value: item.id, label: item.name })),
    [terms]
  );

  const gradeOptions = useMemo<SelectOption[]>(
    () => grades.map((item) => ({ value: item.id, label: item.name })),
    [grades]
  );

  const shipToLabelById = useMemo(
    () => new Map(shipTos.map((item) => [item.id, item.name])),
    [shipTos]
  );

  const destinationLabelById = useMemo(
    () => new Map(destinations.map((item) => [item.id, item.name])),
    [destinations]
  );

  const termLabelById = useMemo(
    () => new Map(terms.map((item) => [item.id, item.name])),
    [terms]
  );

  const gradeLabelById = useMemo(
    () => new Map(grades.map((item) => [item.id, item.name])),
    [grades]
  );

  const selectStyles = useMemo(() => {
    const isDark = theme === 'dark';
    return {
      menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
      control: (base: any, state: any) => ({
        ...base,
        minHeight: 32,
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
        minHeight: 30,
        padding: '0 8px'
      }),
      indicatorSeparator: (base: any) => ({
        ...base,
        marginTop: 5,
        marginBottom: 5,
        backgroundColor: isDark ? '#334155' : '#cbd5e1'
      }),
      dropdownIndicator: (base: any) => ({
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
    };
  }, [theme]);

  const SELECT_MENU_PROPS = useMemo(
    () => ({
      menuPortalTarget: document.body,
      menuPosition: 'fixed' as const,
      styles: selectStyles
    }),
    [selectStyles]
  );

  const companyName =
    companies.find((company) => company.id === companyId)?.name || companyId;

  const {
    register,
    control,
    handleSubmit,
    getValues,
    setValue,
    watch,
    formState: { errors }
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      note: editingOrder?.note || importedDraft?.note || '',
      items: editingOrder?.items.map((line) => ({
        poNo: line.poNo,
        shipToId: line.shipToId,
        destinationId: line.destinationId,
        termId: line.termId,
        gradeId: line.gradeId,
        requestETD: line.requestETD,
        requestETA: line.requestETA,
        qty: line.qty,
        asap: line.asap,
        otherRequested: line.otherRequested || ''
      })) ||
        importedDraft?.items || [
          {
            poNo: '',
            shipToId: '',
            destinationId: '',
            termId: '',
            gradeId: '',
            requestETD: '',
            requestETA: '',
            qty: 1,
            asap: false,
            otherRequested: ''
          }
        ]
    }
  });

  const { fields, append, remove, insert, move } = useFieldArray({
    control,
    name: 'items'
  });

  const watchedItems = watch('items');

  const selectableLineFieldIds = useMemo(
    () =>
      fields
        .filter((_, index) => {
          const lineStatus = editingOrder?.items[index]?.status;
          return !lineStatus || lineStatus === OrderLineStatus.DRAFT;
        })
        .map((field) => field.id),
    [fields, editingOrder]
  );

  const [selectedLineIds, setSelectedLineIds] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    setSelectedLineIds((prev) => {
      const retained = new Set(
        Array.from(prev).filter((lineId) =>
          selectableLineFieldIds.includes(lineId)
        )
      );
      return retained;
    });
  }, [selectableLineFieldIds]);

  const allLinesSelected =
    selectableLineFieldIds.length > 0 &&
    selectableLineFieldIds.every((lineId) => selectedLineIds.has(lineId));

  const toggleSelectAllLines = () => {
    if (allLinesSelected) {
      setSelectedLineIds(new Set());
      return;
    }
    setSelectedLineIds(new Set(selectableLineFieldIds));
  };

  const toggleSelectLine = (lineId: string) => {
    setSelectedLineIds((prev) => {
      const next = new Set(prev);
      if (next.has(lineId)) {
        next.delete(lineId);
      } else {
        next.add(lineId);
      }
      return next;
    });
  };

  const getFieldErrorMessage = (
    index: number,
    field:
      | 'poNo'
      | 'shipToId'
      | 'destinationId'
      | 'termId'
      | 'gradeId'
      | 'qty'
      | 'requestETD'
      | 'requestETA'
  ) => {
    const error = errors.items?.[index]?.[field];
    if (!error) return '';
    return String(error.message || 'Invalid value');
  };

  const hasFieldError = (
    index: number,
    field:
      | 'poNo'
      | 'shipToId'
      | 'destinationId'
      | 'termId'
      | 'gradeId'
      | 'qty'
      | 'requestETD'
      | 'requestETA'
  ) => Boolean(errors.items?.[index]?.[field]);

  const renderAsapBadge = (isAsap: boolean) => {
    if (!isAsap) {
      return (
        <span className="text-xs text-slate-400 dark:text-slate-500">-</span>
      );
    }

    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-500 text-white animate-pulse">
        ASAP
      </span>
    );
  };

  const duplicateLine = (index: number) => {
    if (isReadOnly) return;
    const line = getValues(`items.${index}`);
    if (!line) return;
    append({
      ...line,
      qty: Number(line.qty) > 0 ? Number(line.qty) : 1
    });
  };

  const moveLineUp = (index: number) => {
    if (isReadOnly) return;
    if (index <= 0) return;
    move(index, index - 1);
  };

  const moveLineDown = (index: number) => {
    if (isReadOnly) return;
    if (index >= fields.length - 1) return;
    move(index, index + 1);
  };

  if (!currentUser?.canCreateOrder) {
    return (
      <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 ui-radius-card">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          Access denied
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          You do not have create-order permission. Please contact Admin.
        </p>
      </div>
    );
  }

  if (isEdit && !canAccessEditingOrder) {
    return (
      <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 ui-radius-card">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          Access denied
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          You cannot view or edit this order.
        </p>
      </div>
    );
  }

  const submit = (isDraft: boolean) => {
    handleSubmit(async (data) => {
      if (!currentUser) return;

      if (!isDraft && selectedLineIds.size === 0) {
        Swal.fire({
          icon: 'warning',
          title: 'No line selected',
          text: 'Please select at least 1 line to submit.'
        });
        return;
      }

      if (
        !isDraft &&
        !canUserRunLineAction(
          currentUser,
          OrderLineStatus.DRAFT,
          LineAction.SUBMIT_LINE,
          linePermissionMatrix
        )
      ) {
        Swal.fire({
          icon: 'error',
          title: 'Permission denied',
          text: 'You cannot submit draft lines.'
        });
        return;
      }

      if (!isDraft) {
        const selectedCount = selectedLineIds.size;
        const totalCount = selectableLineFieldIds.length;
        const result = await Swal.fire({
          icon: 'question',
          title: 'Confirm submit',
          text: `Submit ${selectedCount} of ${totalCount} line(s) to SALE?`,
          showCancelButton: true,
          confirmButtonText: 'Submit',
          cancelButtonText: 'Cancel'
        });

        if (!result.isConfirmed) return;
      } else {
        const result = await Swal.fire({
          icon: 'question',
          title: 'Confirm save draft',
          text: 'Save current order lines as draft?',
          showCancelButton: true,
          confirmButtonText: 'Save Draft',
          cancelButtonText: 'Cancel'
        });

        if (!result.isConfirmed) return;
      }

      const nextLines = data.items.map((line, index) => {
        const currentFieldId = fields[index]?.id;
        const isSelected = currentFieldId
          ? selectedLineIds.has(currentFieldId)
          : false;
        const previousLine = editingOrder?.items[index];
        const previousStatus = editingOrder?.items[index]?.status;

        if (
          isDraft &&
          previousLine &&
          previousLine.status !== OrderLineStatus.DRAFT
        ) {
          return previousLine;
        }

        const nextStatus = isDraft
          ? OrderLineStatus.DRAFT
          : isSelected &&
              (previousStatus === OrderLineStatus.DRAFT || !previousStatus)
            ? OrderLineStatus.CREATED
            : previousStatus || OrderLineStatus.DRAFT;

        return {
          id:
            editingOrder?.items[index]?.id ||
            Math.random().toString(36).slice(2, 11),
          poNo: line.poNo,
          shipToId: line.shipToId,
          status: nextStatus,
          destinationId: line.destinationId,
          termId: line.termId,
          requestETD: line.requestETD || '',
          requestETA: line.requestETA || '',
          gradeId: line.gradeId,
          qty: line.qty,
          asap: line.asap,
          otherRequested: line.otherRequested || '',
          price: editingOrder?.items[index]?.price,
          currency: editingOrder?.items[index]?.currency,
          saleNote: editingOrder?.items[index]?.saleNote,
          quotationNo: editingOrder?.items[index]?.quotationNo,
          actualETD: editingOrder?.items[index]?.actualETD,
          documents: editingOrder?.items[index]?.documents || []
        };
      });

      const status = deriveOrderProgressStatus(nextLines);

      if (editingOrder) {
        updateOrder(editingOrder.orderNo, {
          note: data.note || '',
          items: nextLines,
          status
        });
      } else {
        const order: Order = {
          orderNo: `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
          orderDate: new Date().toISOString(),
          note: data.note || '',
          status,
          companyId,
          createdBy: currentUser.username,
          updatedBy: currentUser.username,
          createdAt: '',
          updatedAt: '',
          quotationNo: '',
          actualETD: '',
          items: nextLines,
          documents: []
        };
        addOrder(order);
      }

      navigate('/orders');
    })();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="ui-page-title">
            {isReadOnly
              ? 'Order Detail'
              : isEdit
                ? 'Edit Order'
                : 'Create Order'}
          </h1>
          <p className="ui-page-subtitle">
            Order is header only. Workflow and status run by each line.
          </p>
        </div>
        <div className="flex gap-2">
          {isEdit && (
            <button
              onClick={() => navigate('/orders')}
              className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-4 py-2 ui-radius-control text-sm font-bold inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          )}
          {!isReadOnly && (
            <button
              onClick={() => submit(true)}
              className="bg-slate-600 text-white px-4 py-2 ui-radius-control text-sm font-bold inline-flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Draft
            </button>
          )}
          {isReadOnly && isEdit && editingOrder && (
            <button
              onClick={() => navigate(`/orders/edit/${editingOrder.orderNo}`)}
              className="bg-emerald-600 text-white px-4 py-2 ui-radius-control text-sm font-bold inline-flex items-center gap-2"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </button>
          )}
          <button
            onClick={() => submit(false)}
            className="bg-indigo-600 text-white px-4 py-2 ui-radius-control text-sm font-bold inline-flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Submit Selected
          </button>
        </div>
      </div>

      <div className="border-b border-slate-200 dark:border-slate-800" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 ui-radius-panel p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b dark:border-slate-800 pb-3">
            <Info size={16} className="text-indigo-600 dark:text-indigo-400" />
            <h2 className="ui-subheader">Header Information</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="ui-form-label flex items-center gap-1.5">
                <Hash size={12} /> Order Number
              </label>
              {isReadOnly ? (
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 py-2">
                  {editingOrder?.orderNo || 'Auto-generated'}
                </p>
              ) : (
                <div className="shadcn-input flex items-center bg-slate-50 dark:bg-slate-950 border-dashed text-slate-400 font-medium">
                  Auto-generated
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="ui-form-label flex items-center gap-1.5">
                <Calendar size={12} /> Order Date
              </label>
              {isReadOnly ? (
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 py-2">
                  {editingOrder?.orderDate
                    ? new Date(editingOrder.orderDate).toLocaleDateString(
                        'en-GB'
                      )
                    : today}
                </p>
              ) : (
                <div className="shadcn-input flex items-center bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-medium">
                  {today}
                </div>
              )}
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <label className="ui-form-label flex items-center gap-1.5">
                <FileText size={12} /> Notes / Instructions
              </label>
              {isReadOnly ? (
                <div className="min-h-[60px] py-2 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {getValues('note') || '-'}
                </div>
              ) : (
                <textarea
                  {...register('note')}
                  rows={2}
                  className="shadcn-input min-h-[60px] py-2 resize-none"
                  placeholder="Optional order note"
                  disabled={isReadOnly}
                />
              )}
            </div>
          </div>
        </div>

        <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 ui-radius-panel p-5 flex flex-col justify-center space-y-3">
          <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
            <Info size={20} />
            <h3 className="font-bold text-sm">Logistics Hint</h3>
          </div>
          <p className="text-xs text-indigo-600/80 dark:text-indigo-400/80 leading-relaxed font-medium">
            Consignment lines are processed per shipping destination. Marking a
            line as <span className="font-bold">ASAP</span> helps prioritize the
            workflow.
          </p>
          <div className="pt-2">
            <span className="ui-kicker text-indigo-400 dark:text-indigo-600">
              Client Entity
            </span>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {companyName}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 ui-radius-card border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/40 dark:bg-slate-950/20">
          <h2 className="ui-section-title">Consignment Line Items</h2>
          {!isReadOnly && (
            <button
              onClick={() =>
                append({
                  poNo: '',
                  shipToId: '',
                  destinationId: '',
                  termId: '',
                  gradeId: '',
                  requestETD: '',
                  requestETA: '',
                  qty: 1,
                  asap: false,
                  otherRequested: ''
                })
              }
              className="bg-indigo-600 text-white px-3 py-1.5 ui-radius-control text-xs font-bold inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Line Item
            </button>
          )}
        </div>

        {errors.items && (
          <div className="px-4 py-2 text-xs font-bold text-rose-600 dark:text-rose-300 bg-rose-50 dark:bg-rose-900/30">
            Please fix highlighted fields.
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1780px] ui-table-standard">
            <thead className="bg-slate-50 dark:bg-slate-950/40 ui-table-head">
              <tr>
                <th className="px-3 py-2 text-center w-[52px]">
                  <input
                    type="checkbox"
                    checked={allLinesSelected}
                    onChange={toggleSelectAllLines}
                    disabled={selectableLineFieldIds.length === 0}
                    className="w-3.5 h-3.5"
                    title="Select all lines"
                    aria-label="Select all lines"
                  />
                </th>
                <th className="px-3 py-2 text-center w-[60px]">No</th>
                <th className="px-3 py-2 text-center w-[180px]">PO</th>
                <th className="px-3 py-2 text-center w-[250px]">Ship-to</th>
                <th className="px-3 py-2 text-center w-[250px]">Destination</th>
                <th className="px-3 py-2 text-center w-[220px]">Term</th>
                <th className="px-3 py-2 text-center w-[220px]">Grade</th>
                <th className="px-3 py-2 text-center w-[110px]">Qty</th>
                <th className="px-3 py-2 text-center w-[90px]">ASAP</th>
                <th className="px-3 py-2 text-center w-[170px]">Req ETD</th>
                <th className="px-3 py-2 text-center w-[170px]">Req ETA</th>
                <th className="px-3 py-2 text-center w-[260px]">Other</th>
                {!isReadOnly && (
                  <th className="px-3 py-2 text-right w-[110px]">Action</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {fields.map((field, index) => (
                <tr key={field.id}>
                  {(() => {
                    const lineStatus =
                      editingOrder?.items[index]?.status ||
                      OrderLineStatus.DRAFT;
                    const isLineSelectable =
                      lineStatus === OrderLineStatus.DRAFT;
                    const isLineLocked =
                      isReadOnly || lineStatus !== OrderLineStatus.DRAFT;

                    return (
                      <>
                        <td className="px-3 py-2 text-center w-[52px]">
                          <input
                            type="checkbox"
                            checked={selectedLineIds.has(field.id)}
                            onChange={() => toggleSelectLine(field.id)}
                            disabled={!isLineSelectable}
                            className="w-3.5 h-3.5"
                            title={`Select line ${index + 1}`}
                            aria-label={`Select line ${index + 1}`}
                          />
                        </td>
                        <td className="px-3 py-2 w-[60px]">
                          <div className="flex flex-col items-center justify-center gap-0.5">
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-none">
                              {index + 1}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 w-[180px]">
                          {isReadOnly ? (
                            <span className="text-xs text-slate-700 dark:text-slate-300">
                              {getValues(`items.${index}.poNo`) || '-'}
                            </span>
                          ) : isLineLocked ? (
                            <span className="text-xs text-slate-700 dark:text-slate-300">
                              {getValues(`items.${index}.poNo`) || '-'}
                            </span>
                          ) : (
                            <input
                              {...register(`items.${index}.poNo`)}
                              disabled={isLineLocked}
                              className={`shadcn-input h-8 text-xs ${
                                hasFieldError(index, 'poNo')
                                  ? 'border-rose-400 focus:ring-rose-300'
                                  : ''
                              } w-full`}
                            />
                          )}
                          {getFieldErrorMessage(index, 'poNo') && (
                            <p className="mt-1 ui-form-error">
                              {getFieldErrorMessage(index, 'poNo')}
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-2 w-[250px]">
                          {isReadOnly ? (
                            <span className="text-xs text-slate-700 dark:text-slate-300">
                              {shipToLabelById.get(
                                getValues(`items.${index}.shipToId`)
                              ) ||
                                getValues(`items.${index}.shipToId`) ||
                                '-'}
                            </span>
                          ) : isLineLocked ? (
                            <span className="text-xs text-slate-700 dark:text-slate-300">
                              {shipToLabelById.get(
                                getValues(`items.${index}.shipToId`)
                              ) ||
                                getValues(`items.${index}.shipToId`) ||
                                '-'}
                            </span>
                          ) : (
                            <Controller
                              control={control}
                              name={`items.${index}.shipToId` as const}
                              render={({ field }) => (
                                <Select
                                  options={shipToOptions}
                                  value={
                                    shipToOptions.find(
                                      (option) => option.value === field.value
                                    ) || null
                                  }
                                  onChange={(
                                    option: SingleValue<SelectOption>
                                  ) => {
                                    const selectedId = option?.value || '';
                                    field.onChange(selectedId);
                                    const selectedShipTo = shipTos.find(
                                      (s) => s.id === selectedId
                                    );
                                    if (
                                      selectedShipTo &&
                                      selectedShipTo.destinationIds.length === 1
                                    ) {
                                      setValue(
                                        `items.${index}.destinationId`,
                                        selectedShipTo.destinationIds[0]
                                      );
                                    } else {
                                      const currentDestId = getValues(
                                        `items.${index}.destinationId`
                                      );
                                      if (
                                        !selectedId ||
                                        (selectedShipTo &&
                                          currentDestId &&
                                          !selectedShipTo.destinationIds.includes(
                                            currentDestId
                                          ))
                                      ) {
                                        setValue(
                                          `items.${index}.destinationId`,
                                          ''
                                        );
                                      }
                                    }
                                  }}
                                  onBlur={field.onBlur}
                                  isDisabled={isLineLocked}
                                  placeholder="Select"
                                  classNamePrefix="line-shipto"
                                  {...SELECT_MENU_PROPS}
                                />
                              )}
                            />
                          )}
                          {getFieldErrorMessage(index, 'shipToId') && (
                            <p className="mt-1 ui-form-error">
                              {getFieldErrorMessage(index, 'shipToId')}
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-2 w-[250px]">
                          {isReadOnly ? (
                            <span className="text-xs text-slate-700 dark:text-slate-300">
                              {destinationLabelById.get(
                                getValues(`items.${index}.destinationId`)
                              ) ||
                                getValues(`items.${index}.destinationId`) ||
                                '-'}
                            </span>
                          ) : isLineLocked ? (
                            <span className="text-xs text-slate-700 dark:text-slate-300">
                              {destinationLabelById.get(
                                getValues(`items.${index}.destinationId`)
                              ) ||
                                getValues(`items.${index}.destinationId`) ||
                                '-'}
                            </span>
                          ) : (
                            <Controller
                              control={control}
                              name={`items.${index}.destinationId` as const}
                              render={({ field }) => {
                                const currentShipToId =
                                  watchedItems?.[index]?.shipToId || '';
                                const currentShipTo = shipTos.find(
                                  (s) => s.id === currentShipToId
                                );
                                const filteredDestinationOptions =
                                  currentShipTo &&
                                  currentShipTo.destinationIds.length > 0
                                    ? destinationOptions.filter((opt) =>
                                        currentShipTo.destinationIds.includes(
                                          opt.value
                                        )
                                      )
                                    : destinationOptions;
                                return (
                                  <Select
                                    options={filteredDestinationOptions}
                                    value={
                                      filteredDestinationOptions.find(
                                        (option) => option.value === field.value
                                      ) || null
                                    }
                                    onChange={(
                                      option: SingleValue<SelectOption>
                                    ) => field.onChange(option?.value || '')}
                                    onBlur={field.onBlur}
                                    isDisabled={isLineLocked}
                                    placeholder="Select"
                                    classNamePrefix="line-destination"
                                    {...SELECT_MENU_PROPS}
                                  />
                                );
                              }}
                            />
                          )}
                          {getFieldErrorMessage(index, 'destinationId') && (
                            <p className="mt-1 ui-form-error">
                              {getFieldErrorMessage(index, 'destinationId')}
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-2 w-[220px]">
                          {isReadOnly ? (
                            <span className="text-xs text-slate-700 dark:text-slate-300">
                              {termLabelById.get(
                                getValues(`items.${index}.termId`)
                              ) ||
                                getValues(`items.${index}.termId`) ||
                                '-'}
                            </span>
                          ) : isLineLocked ? (
                            <span className="text-xs text-slate-700 dark:text-slate-300">
                              {termLabelById.get(
                                getValues(`items.${index}.termId`)
                              ) ||
                                getValues(`items.${index}.termId`) ||
                                '-'}
                            </span>
                          ) : (
                            <Controller
                              control={control}
                              name={`items.${index}.termId` as const}
                              render={({ field }) => (
                                <Select
                                  options={termOptions}
                                  value={
                                    termOptions.find(
                                      (option) => option.value === field.value
                                    ) || null
                                  }
                                  onChange={(
                                    option: SingleValue<SelectOption>
                                  ) => field.onChange(option?.value || '')}
                                  onBlur={field.onBlur}
                                  isDisabled={isLineLocked}
                                  placeholder="Select"
                                  classNamePrefix="line-term"
                                  {...SELECT_MENU_PROPS}
                                />
                              )}
                            />
                          )}
                          {getFieldErrorMessage(index, 'termId') && (
                            <p className="mt-1 ui-form-error">
                              {getFieldErrorMessage(index, 'termId')}
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-2 w-[220px]">
                          {isReadOnly ? (
                            <span className="text-xs text-slate-700 dark:text-slate-300">
                              {gradeLabelById.get(
                                getValues(`items.${index}.gradeId`)
                              ) ||
                                getValues(`items.${index}.gradeId`) ||
                                '-'}
                            </span>
                          ) : isLineLocked ? (
                            <span className="text-xs text-slate-700 dark:text-slate-300">
                              {gradeLabelById.get(
                                getValues(`items.${index}.gradeId`)
                              ) ||
                                getValues(`items.${index}.gradeId`) ||
                                '-'}
                            </span>
                          ) : (
                            <Controller
                              control={control}
                              name={`items.${index}.gradeId` as const}
                              render={({ field }) => (
                                <Select
                                  options={gradeOptions}
                                  value={
                                    gradeOptions.find(
                                      (option) => option.value === field.value
                                    ) || null
                                  }
                                  onChange={(
                                    option: SingleValue<SelectOption>
                                  ) => field.onChange(option?.value || '')}
                                  onBlur={field.onBlur}
                                  isDisabled={isLineLocked}
                                  placeholder="Select"
                                  classNamePrefix="line-grade"
                                  {...SELECT_MENU_PROPS}
                                />
                              )}
                            />
                          )}
                          {getFieldErrorMessage(index, 'gradeId') && (
                            <p className="mt-1 ui-form-error">
                              {getFieldErrorMessage(index, 'gradeId')}
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-2 w-[110px]">
                          {isReadOnly ? (
                            <span className="text-xs text-slate-700 dark:text-slate-300">
                              {Number(getValues(`items.${index}.qty`) || 0)}
                            </span>
                          ) : isLineLocked ? (
                            <span className="text-xs text-slate-700 dark:text-slate-300">
                              {Number(getValues(`items.${index}.qty`) || 0)}
                            </span>
                          ) : (
                            <input
                              type="number"
                              {...register(`items.${index}.qty`, {
                                valueAsNumber: true
                              })}
                              disabled={isLineLocked}
                              className={`shadcn-input h-8 text-xs ${
                                hasFieldError(index, 'qty')
                                  ? 'border-rose-400 focus:ring-rose-300'
                                  : ''
                              } w-full`}
                            />
                          )}
                          {getFieldErrorMessage(index, 'qty') && (
                            <p className="mt-1 ui-form-error">
                              {getFieldErrorMessage(index, 'qty')}
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-2 w-[90px] text-center">
                          {isLineLocked ? (
                            renderAsapBadge(
                              Boolean(getValues(`items.${index}.asap`))
                            )
                          ) : (
                            <input
                              type="checkbox"
                              {...register(`items.${index}.asap`)}
                              disabled={isLineLocked}
                            />
                          )}
                        </td>
                        <td className="px-3 py-2 w-[170px]">
                          {isReadOnly ? (
                            <span className="text-xs text-slate-700 dark:text-slate-300">
                              {getValues(`items.${index}.requestETD`) || '-'}
                            </span>
                          ) : isLineLocked ? (
                            <span className="text-xs text-slate-700 dark:text-slate-300">
                              {getValues(`items.${index}.requestETD`) || '-'}
                            </span>
                          ) : (
                            <input
                              type="date"
                              {...register(`items.${index}.requestETD`)}
                              disabled={isLineLocked}
                              className={`shadcn-input h-8 text-xs ${
                                hasFieldError(index, 'requestETD')
                                  ? 'border-rose-400 focus:ring-rose-300'
                                  : ''
                              } w-full`}
                            />
                          )}
                          {getFieldErrorMessage(index, 'requestETD') && (
                            <p className="mt-1 ui-form-error">
                              {getFieldErrorMessage(index, 'requestETD')}
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-2 w-[170px]">
                          {isReadOnly ? (
                            <span className="text-xs text-slate-700 dark:text-slate-300">
                              {getValues(`items.${index}.requestETA`) || '-'}
                            </span>
                          ) : isLineLocked ? (
                            <span className="text-xs text-slate-700 dark:text-slate-300">
                              {getValues(`items.${index}.requestETA`) || '-'}
                            </span>
                          ) : (
                            <input
                              type="date"
                              {...register(`items.${index}.requestETA`)}
                              disabled={isLineLocked}
                              className={`shadcn-input h-8 text-xs ${
                                hasFieldError(index, 'requestETA')
                                  ? 'border-rose-400 focus:ring-rose-300'
                                  : ''
                              } w-full`}
                            />
                          )}
                          {getFieldErrorMessage(index, 'requestETA') && (
                            <p className="mt-1 ui-form-error">
                              {getFieldErrorMessage(index, 'requestETA')}
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-2 w-[260px]">
                          {isReadOnly ? (
                            <span className="text-xs text-slate-700 dark:text-slate-300">
                              {getValues(`items.${index}.otherRequested`) ||
                                '-'}
                            </span>
                          ) : isLineLocked ? (
                            <span className="text-xs text-slate-700 dark:text-slate-300">
                              {getValues(`items.${index}.otherRequested`) ||
                                '-'}
                            </span>
                          ) : (
                            <input
                              {...register(`items.${index}.otherRequested`)}
                              disabled={isLineLocked}
                              className="shadcn-input h-8 text-xs w-full"
                            />
                          )}
                        </td>
                        {!isReadOnly && (
                          <td className="px-3 py-2 w-[110px] text-right">
                            {isLineLocked ? (
                              <span className="text-xs text-slate-400">-</span>
                            ) : (
                              <div className="inline-flex items-center gap-1.5">
                                <ActionIconButton
                                  onClick={() => duplicateLine(index)}
                                  tone="slate"
                                  title="Duplicate row"
                                  disabled={isLineLocked}
                                >
                                  <ClipboardCopy className="w-3.5 h-3.5" />
                                </ActionIconButton>
                                <ActionIconButton
                                  onClick={() => remove(index)}
                                  tone="rose"
                                  title="Delete line"
                                  disabled={isLineLocked}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </ActionIconButton>
                              </div>
                            )}
                          </td>
                        )}
                      </>
                    );
                  })()}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 text-xs border-t border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/20 flex items-center justify-between">
          <span className="ui-kicker text-slate-500 dark:text-slate-400">
            Aggregate Consignment Volume
          </span>
          <span className="font-bold text-indigo-600 dark:text-indigo-300">
            {getValues('items')?.reduce(
              (sum, line) => sum + (Number(line.qty) || 0),
              0
            ) || 0}{' '}
            units
          </span>
        </div>
      </div>
    </div>
  );
};
