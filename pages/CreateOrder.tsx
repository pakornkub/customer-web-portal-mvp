import React, { useMemo, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useStore } from '../store';
import { Order, OrderStatus, Role } from '../types';
import {
  Plus,
  Trash2,
  Send,
  Info,
  ChevronUp,
  ChevronDown,
  AlertCircle,
  Copy,
  Calendar,
  Hash,
  FileText,
  Save
} from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const itemSchema = z
  .object({
    poNo: z.string().min(1, 'Required'),
    shipToId: z.string().min(1, 'Required'),
    destinationId: z.string().min(1, 'Required'),
    termId: z.string().min(1, 'Required'),
    gradeId: z.string().min(1, 'Required'),
    requestETD: z.string(),
    requestETA: z.string(),
    qty: z.number().min(1, 'Min 1'),
    asap: z.boolean(),
    otherRequested: z.string().optional().or(z.literal(''))
  })
  .superRefine((data, ctx) => {
    if (!data.asap && !data.requestETD && !data.requestETA) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Required',
        path: ['requestETD']
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Required',
        path: ['requestETA']
      });
    }
  });

const formSchema = z.object({
  note: z.string().optional().or(z.literal('')),
  items: z.array(itemSchema).min(1, 'At least one line item is required')
});

type FormData = z.infer<typeof formSchema>;

type ImportState = {
  importItems?: Array<{
    poNo: string;
    shipToId: string;
    destinationId: string;
    termId: string;
    gradeId: string;
    requestETD: string;
    requestETA: string;
    qty: number;
    asap: boolean;
    otherRequested?: string;
  }>;
  importNote?: string;
};

export const CreateOrder: React.FC = () => {
  const {
    masterData,
    currentUser,
    addOrder,
    updateOrder,
    orders,
    addNotification,
    companies
  } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { orderNo } = useParams();
  const isEditMode = !!orderNo;
  const existingOrder = isEditMode
    ? orders.find((o) => o.orderNo === orderNo)
    : null;
  const importState = location.state as ImportState | null;

  const today = useMemo(
    () =>
      new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }),
    []
  );

  const {
    register,
    control,
    handleSubmit,
    watch,
    getValues,
    reset,
    formState: { errors }
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      note: '',
      items: [
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

  // Populate form with existing data in edit mode
  useEffect(() => {
    if (isEditMode && existingOrder) {
      reset({
        note: existingOrder.note,
        items: existingOrder.items.map((item) => ({
          poNo: item.poNo,
          shipToId: item.shipToId || '',
          destinationId: item.destinationId,
          termId: item.termId,
          gradeId: item.gradeId,
          requestETD: item.requestETD,
          requestETA: item.requestETA,
          qty: item.qty,
          asap: item.asap,
          otherRequested: item.otherRequested || ''
        }))
      });
    }
  }, [isEditMode, existingOrder, reset]);

  useEffect(() => {
    if (isEditMode) return;
    if (!importState?.importItems?.length) return;

    reset({
      note: importState.importNote || '',
      items: importState.importItems.map((item) => ({
        ...item,
        otherRequested: item.otherRequested || ''
      }))
    });
  }, [importState, isEditMode, reset]);

  const { fields, append, remove, move, insert } = useFieldArray({
    control,
    name: 'items'
  });

  const watchedItems = watch('items');
  const totalQty = watchedItems.reduce(
    (acc, item) => acc + (Number(item.qty) || 0),
    0
  );

  const onSubmit = (data: FormData, isDraft: boolean = false) => {
    if (isEditMode && existingOrder) {
      // Update existing order
      updateOrder(existingOrder.orderNo, {
        note: data.note || '',
        status: isDraft ? OrderStatus.DRAFT : OrderStatus.CREATED,
        items: existingOrder.items.map((existingItem, index) => ({
          ...data.items[index],
          id: existingItem.id
        }))
      });
      if (!isDraft) {
        addNotification(
          `Order ${existingOrder.orderNo} updated and submitted for review`,
          Role.SALE,
          'email'
        );
      }
    } else {
      // Create new order
      const orderNo = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
      const newOrder: Order = {
        orderNo,
        orderDate: new Date().toISOString(),
        note: data.note || '',
        status: isDraft ? OrderStatus.DRAFT : OrderStatus.CREATED,
        customerCompanyId: currentUser?.customerCompanyId || 'C001',
        createdBy: currentUser?.username || 'system',
        updatedBy: currentUser?.username || 'system',
        items: data.items.map((item) => ({
          ...item,
          id: Math.random().toString(36).substr(2, 9)
        })),
        documents: [],
        createdAt: '',
        updatedAt: ''
      };

      addOrder(newOrder);
      if (!isDraft) {
        addNotification(
          `Order ${orderNo} submitted for review`,
          Role.SALE,
          'email'
        );
      }
    }
    navigate('/orders');
  };

  const handleSaveDraft = () => {
    const data = getValues();
    onSubmit(data, true);
  };

  const handleSubmitOrder = () => {
    handleSubmit((data) => onSubmit(data, false))();
  };

  const companyId = currentUser?.customerCompanyId || 'C001';
  const myGrades = masterData.grades.filter((g) => {
    const ids = Array.isArray(g.customerCompanyId)
      ? g.customerCompanyId
      : [g.customerCompanyId];
    return ids.includes(companyId);
  });
  const myShipTos = masterData.shipTos.filter((s) => {
    const ids = Array.isArray(s.customerCompanyId)
      ? s.customerCompanyId
      : [s.customerCompanyId];
    return ids.includes(companyId);
  });
  const myDest = masterData.destinations.filter((d) => {
    const ids = Array.isArray(d.customerCompanyId)
      ? d.customerCompanyId
      : [d.customerCompanyId];
    return ids.includes(companyId);
  });
  const myTerms = masterData.terms.filter((t) => {
    const ids = Array.isArray(t.customerCompanyId)
      ? t.customerCompanyId
      : [t.customerCompanyId];
    return ids.includes(companyId);
  });

  const duplicateRow = (index: number) => {
    const values = getValues(`items.${index}`);
    insert(index + 1, { ...values });
  };

  return (
    <div className="space-y-6 max-w-full pb-10">
      {/* Header Info Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold dark:text-white tracking-tight">
            {isEditMode ? 'Edit Purchase Order' : 'New Purchase Order'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            {isEditMode
              ? 'Update order details and save changes'
              : 'Step 1: Complete order header and consignment items.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/orders')}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveDraft}
            className="bg-slate-600 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-slate-700 flex items-center gap-2 shadow-lg transition-all transform active:scale-95"
          >
            <Save size={18} /> Save Draft
          </button>
          <button
            type="button"
            onClick={handleSubmitOrder}
            className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all transform active:scale-95"
          >
            <Send size={18} /> {isEditMode ? 'Update & Submit' : 'Submit Order'}
          </button>
        </div>
      </div>

      {/* Order Main Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b dark:border-slate-800 pb-3">
            <Info size={16} className="text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Header Information
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <Hash size={12} /> Order Number
              </label>
              <div className="shadcn-input flex items-center bg-slate-50 dark:bg-slate-950 border-dashed text-slate-400 font-medium cursor-not-allowed">
                Auto-generated
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <Calendar size={12} /> Order Date
              </label>
              <div className="shadcn-input flex items-center bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-medium cursor-not-allowed">
                {today}
              </div>
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <FileText size={12} /> Notes / Instructions
              </label>
              <textarea
                {...register('note')}
                rows={2}
                className="shadcn-input min-h-[60px] py-2 resize-none"
                placeholder="Add any global remarks or internal notes for this shipment..."
              />
            </div>
          </div>
        </div>

        <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 rounded-xl p-5 flex flex-col justify-center space-y-3">
          <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
            <AlertCircle size={20} />
            <h3 className="font-bold text-sm">Logistics Hint</h3>
          </div>
          <p className="text-xs text-indigo-600/80 dark:text-indigo-400/80 leading-relaxed font-medium">
            Consignment lines are processed per shipping destination. Marking a
            line as <span className="font-bold">ASAP</span> will trigger an
            urgent notification to Customer Service (CS) if the requested ETA is
            within 30 days.
          </p>
          <div className="pt-2">
            <span className="text-[10px] font-black uppercase text-indigo-400 dark:text-indigo-600 tracking-widest">
              Client Entity
            </span>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {companies.find((c) => c.id === companyId)?.name}
            </p>
          </div>
        </div>
      </div>

      {/* Consignment Items Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/30 dark:bg-slate-950/30">
          <div className="flex items-center gap-3">
            <h2 className="text-xs font-bold uppercase text-slate-500 tracking-widest">
              Consignment Line Items
            </h2>
            {errors.items && (
              <span className="text-[11px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/30 px-2 py-0.5 rounded border border-rose-100 dark:border-rose-900/50 flex items-center gap-1">
                <AlertCircle size={12} />{' '}
                {errors.items.message === 'At least one line item is required'
                  ? 'Min 1 row required'
                  : 'Validation Error'}
              </span>
            )}
          </div>
          <button
            type="button"
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
            className="text-xs font-bold text-white bg-indigo-600 px-4 py-1.5 rounded-lg hover:bg-indigo-700 transition-all flex items-center gap-1.5 shadow-md shadow-indigo-500/10"
          >
            <Plus size={14} /> Add Line Item
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="modern-table modern-table-compact min-w-full">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                <th className="w-16 text-center text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide px-4 py-3">
                  #
                </th>
                <th className="min-w-[140px] text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide px-4 py-3">
                  PO Ref.
                </th>
                <th className="min-w-[180px] text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide px-4 py-3">
                  Grade
                </th>
                <th className="min-w-[180px] text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide px-4 py-3">
                  Ship To
                </th>
                <th className="min-w-[160px] text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide px-4 py-3">
                  Dest.
                </th>
                <th className="min-w-[130px] text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide px-4 py-3">
                  Term
                </th>
                <th className="min-w-[100px] text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide px-4 py-3 text-right">
                  Qty
                </th>
                <th className="w-20 text-center text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide px-4 py-3">
                  ASAP
                </th>
                <th className="min-w-[150px] text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide px-4 py-3">
                  Req. ETD
                </th>
                <th className="min-w-[150px] text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide px-4 py-3">
                  Req. ETA
                </th>
                <th className="min-w-[200px] text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide px-4 py-3">
                  Other Req.
                </th>
                <th className="w-28 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide px-4 py-3">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {fields.map((field, index) => {
                const rowError = errors.items?.[index];
                return (
                  <tr
                    key={field.id}
                    className={`group transition-all ${rowError ? 'bg-rose-50/10' : ''}`}
                  >
                    <td className="text-center align-middle">
                      <div className="flex flex-col items-center justify-center opacity-40 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => move(index, index - 1)}
                          className="text-slate-400 hover:text-indigo-600 disabled:opacity-0"
                        >
                          <ChevronUp size={14} />
                        </button>
                        <span className="text-[10px] font-bold text-slate-500 leading-none py-1">
                          {index + 1}
                        </span>
                        <button
                          type="button"
                          disabled={index === fields.length - 1}
                          onClick={() => move(index, index + 1)}
                          className="text-slate-400 hover:text-indigo-600 disabled:opacity-0"
                        >
                          <ChevronDown size={14} />
                        </button>
                      </div>
                    </td>
                    <td>
                      <input
                        {...register(`items.${index}.poNo` as const)}
                        placeholder="PO-000..."
                        className={`shadcn-input h-8 border-slate-200 dark:border-slate-800 ${rowError?.poNo ? 'border-rose-400' : ''}`}
                      />
                    </td>
                    <td>
                      <select
                        {...register(`items.${index}.gradeId` as const)}
                        className={`shadcn-input h-8 border-slate-200 dark:border-slate-800 ${rowError?.gradeId ? 'border-rose-400' : ''}`}
                      >
                        <option value="">Select Grade</option>
                        {myGrades.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select
                        {...register(`items.${index}.shipToId` as const)}
                        className={`shadcn-input h-8 border-slate-200 dark:border-slate-800 ${rowError?.shipToId ? 'border-rose-400' : ''}`}
                      >
                        <option value="">Select Ship To</option>
                        {myShipTos.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select
                        {...register(`items.${index}.destinationId` as const)}
                        className={`shadcn-input h-8 border-slate-200 dark:border-slate-800 ${rowError?.destinationId ? 'border-rose-400' : ''}`}
                      >
                        <option value="">Select Dest.</option>
                        {myDest.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select
                        {...register(`items.${index}.termId` as const)}
                        className={`shadcn-input h-8 border-slate-200 dark:border-slate-800 ${rowError?.termId ? 'border-rose-400' : ''}`}
                      >
                        <option value="">Select Term</option>
                        {myTerms.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="number"
                        {...register(`items.${index}.qty` as const, {
                          valueAsNumber: true
                        })}
                        className={`shadcn-input h-8 text-right font-bold border-slate-200 dark:border-slate-800 ${rowError?.qty ? 'border-rose-400' : ''}`}
                      />
                    </td>
                    <td className="text-center align-middle">
                      <input
                        type="checkbox"
                        {...register(`items.${index}.asap` as const)}
                        className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                      />
                    </td>
                    <td>
                      <input
                        type="date"
                        {...register(`items.${index}.requestETD` as const)}
                        disabled={watchedItems[index]?.asap}
                        className={`shadcn-input h-8 border-slate-200 dark:border-slate-800 ${rowError?.requestETD ? 'border-rose-400' : ''} ${watchedItems[index]?.asap ? 'opacity-50 cursor-not-allowed' : ''}`}
                      />
                    </td>
                    <td>
                      <input
                        type="date"
                        {...register(`items.${index}.requestETA` as const)}
                        disabled={watchedItems[index]?.asap}
                        className={`shadcn-input h-8 border-slate-200 dark:border-slate-800 ${rowError?.requestETA ? 'border-rose-400' : ''} ${watchedItems[index]?.asap ? 'opacity-50 cursor-not-allowed' : ''}`}
                      />
                    </td>
                    <td>
                      <input
                        {...register(`items.${index}.otherRequested` as const)}
                        placeholder="Notes..."
                        className="shadcn-input h-8 border-slate-200 dark:border-slate-800 italic"
                      />
                    </td>

                    <td className="text-right align-middle">
                      <div className="flex items-center justify-end gap-1  group-hover:opacity-100 transition-all">
                        <button
                          type="button"
                          title="Duplicate Line"
                          onClick={() => duplicateRow(index)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          type="button"
                          title="Remove Line"
                          onClick={() => remove(index)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-50/50 dark:bg-slate-950/50">
              <tr className="border-t-2 border-slate-100 dark:border-slate-800">
                <td
                  colSpan={5}
                  className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase text-right tracking-widest"
                >
                  Aggregate Consignment Volume
                </td>
                <td className="px-4 py-3 text-right text-sm font-black text-indigo-600 dark:text-indigo-400 tabular-nums">
                  {totalQty.toLocaleString()} units
                </td>
                <td
                  colSpan={5}
                  className="px-4 py-3 text-right text-[11px] font-medium text-slate-400 italic"
                >
                  Total Lines: {fields.length}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {Object.keys(errors).length > 0 && (
        <div className="flex items-center gap-3 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 rounded-xl text-sm text-rose-600 dark:text-rose-400 font-bold shadow-sm animate-in fade-in slide-in-from-top-2">
          <AlertCircle size={20} className="shrink-0" />
          <p>
            Please review and correct the errors highlighted in the form before
            submitting. All logistical fields are mandatory.
          </p>
        </div>
      )}
    </div>
  );
};
