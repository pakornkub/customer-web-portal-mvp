import React, { useState } from 'react';
import { useStore } from '../store';
import { OrderStatus, Role } from '../types';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
  Search,
  Filter,
  Eye,
  ArrowUpDown,
  ChevronRight,
  FileText,
  CheckCircle2,
  Ship,
  Package,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';

export const Orders: React.FC = () => {
  const { orders, currentUser, deleteOrder, addActivity } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleDelete = async (orderNo: string, e: React.MouseEvent) => {
    e.preventDefault();
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Delete Draft Order?',
      text: `Are you sure you want to delete draft order ${orderNo}?`,
      showCancelButton: true,
      confirmButtonColor: '#DC2626',
      cancelButtonColor: '#64748B',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      deleteOrder(orderNo);
      addActivity(
        'Delete Draft',
        currentUser!.username,
        `Deleted draft order ${orderNo}`
      );
      Swal.fire({
        icon: 'success',
        title: 'Draft Deleted',
        text: `Draft order ${orderNo} has been deleted`,
        timer: 1500,
        showConfirmButton: false
      });
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesUser = currentUser?.customerCompanyId
      ? o.customerCompanyId === currentUser.customerCompanyId
      : true;
    const matchesSearch =
      o.orderNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerCompanyId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    return matchesUser && matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Order Management
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Track the lifecycle of your supplies.
          </p>
        </div>
        {[Role.MAIN_TRADER, Role.UBE_JAPAN, Role.ADMIN].includes(
          currentUser?.role!
        ) && (
          <Link
            to="/orders/create"
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 dark:shadow-indigo-500/10 transition-all flex items-center gap-2 shrink-0"
          >
            <Plus size={18} />
            New Order
          </Link>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-3 items-center bg-slate-50/30 dark:bg-slate-950/20">
          <div className="relative flex-1 w-full">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={14}
            />
            <input
              type="text"
              placeholder="Filter orders..."
              className="shadcn-input pl-10 h-8 text-xs bg-white dark:bg-slate-900"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="shadcn-input h-8 text-xs w-full md:w-32 bg-white dark:bg-slate-900"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Status</option>
            {Object.values(OrderStatus).map((status) => (
              <option key={status} value={status}>
                {status.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="modern-table modern-table-compact min-w-full">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                <th className="min-w-[140px] text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide px-4 py-3">
                  Order Ref
                </th>
                <th className="min-w-[160px] text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide px-4 py-3">
                  Created By
                </th>
                <th className="min-w-[120px] text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide px-4 py-3">
                  Created
                </th>
                <th className="min-w-[140px] text-center text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide px-4 py-3">
                  Status
                </th>
                <th className="min-w-[140px] text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide px-4 py-3">
                  Documents
                </th>
                <th className="min-w-[100px] text-right text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide px-4 py-3">
                  Lines
                </th>
                <th className="w-28 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide px-4 py-3">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredOrders.map((order) => (
                <tr
                  key={order.orderNo}
                  className="group transition-all hover:bg-slate-50 dark:hover:bg-slate-800/40"
                >
                  <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                    {order.orderNo}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                    {order.createdBy}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-400 dark:text-slate-500">
                    {formatDate(order.orderDate)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide ${
                        order.status === OrderStatus.DRAFT
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                          : order.status === OrderStatus.CREATED
                            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900'
                            : order.status === OrderStatus.CONFIRMED
                              ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900'
                              : order.status === OrderStatus.VESSEL_BOOKED
                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900'
                                : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900'
                      }`}
                    >
                      {order.status === OrderStatus.DRAFT && (
                        <FileText size={12} />
                      )}
                      {order.status === OrderStatus.CREATED && (
                        <FileText size={12} />
                      )}
                      {order.status === OrderStatus.CONFIRMED && (
                        <CheckCircle2 size={12} />
                      )}
                      {order.status === OrderStatus.VESSEL_BOOKED && (
                        <Ship size={12} />
                      )}
                      {order.status === OrderStatus.VESSEL_DEPARTED && (
                        <Package size={12} />
                      )}
                      {order.status === OrderStatus.RECEIVED_PO && (
                        <FileText size={12} />
                      )}
                      {order.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {order.status === OrderStatus.RECEIVED_PO ||
                    order.status === OrderStatus.VESSEL_DEPARTED ? (
                      <div className="flex gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            order.documents.some(
                              (d) => d.type === 'Shipping Document'
                            )
                              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                          }`}
                        >
                          {order.documents.some(
                            (d) => d.type === 'Shipping Document'
                          )
                            ? '✓'
                            : '○'}{' '}
                          Ship Doc
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            order.documents.some((d) => d.type === 'BL')
                              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                          }`}
                        >
                          {order.documents.some((d) => d.type === 'BL')
                            ? '✓'
                            : '○'}{' '}
                          BL
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-300 dark:text-slate-700">
                        -
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end">
                      <span className="text-md font-bold text-slate-500 dark:text-slate-400">
                        {order.items.length}
                      </span>
                      {order.items.some((i) => i.asap) && (
                        <span className="mb-[0.8px] ml-2 text-[9px] bg-rose-500 text-white px-2 py-0.5 rounded-full font-bold uppercase">
                          ASAP
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right align-middle">
                    <div className="flex items-center justify-end gap-2">
                      {order.status === OrderStatus.DRAFT && (
                        <>
                          <button
                            onClick={(e) => handleDelete(order.orderNo, e)}
                            className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:text-white dark:hover:text-white hover:bg-rose-600 dark:hover:bg-rose-600 hover:border-rose-600 dark:hover:border-rose-600 transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                          <Link
                            to={`/orders/edit/${order.orderNo}`}
                            className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:text-white dark:hover:text-white hover:bg-indigo-600 dark:hover:bg-indigo-600 hover:border-indigo-600 dark:hover:border-indigo-600 transition-all"
                          >
                            <Edit size={16} />
                          </Link>
                        </>
                      )}
                      <Link
                        to={`/orders/${order.orderNo}`}
                        className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:border-indigo-300 dark:hover:border-indigo-800 transition-all"
                      >
                        <Eye size={16} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-slate-400 dark:text-slate-500 text-sm italic"
                  >
                    No orders found matching criteria.
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
