import React from 'react';
import { useStore } from '../store';
import { OrderStatus, Role } from '../types';
import {
  Plus,
  Clock,
  CheckCircle2,
  Ship,
  FileText,
  AlertCircle,
  TrendingUp,
  Package,
  Calendar,
  ArrowRight,
  // Added Command icon to imports
  Command
} from 'lucide-react';
import { Link } from 'react-router-dom';

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 group hover:-translate-y-1">
    <div className="flex items-center justify-between mb-4">
      <div
        className={`p-3 rounded-2xl ${color} bg-opacity-10 dark:bg-opacity-20 transition-colors group-hover:bg-opacity-20`}
      >
        <Icon size={24} className={color.replace('bg-', 'text-')} />
      </div>
      {trend && (
        <div className="flex flex-col items-end">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
            <TrendingUp size={12} /> {trend}%
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-medium">
            vs last month
          </span>
        </div>
      )}
    </div>
    <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
      {title}
    </h3>
    <div className="flex items-baseline gap-2 mt-1">
      <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
        {value}
      </p>
      <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
        units
      </span>
    </div>
  </div>
);

export const Dashboard: React.FC = () => {
  const { orders, currentUser } = useStore();

  const filteredOrders = currentUser?.customerCompanyId
    ? orders.filter(
        (o) => o.customerCompanyId === currentUser.customerCompanyId
      )
    : orders;

  const stats = [
    {
      title: 'Pending Review',
      value: filteredOrders.filter((o) => o.status === OrderStatus.CREATED)
        .length,
      icon: Clock,
      color: 'bg-amber-500',
      trend: 12
    },
    {
      title: 'Confirmed Orders',
      value: filteredOrders.filter((o) => o.status === OrderStatus.CONFIRMED)
        .length,
      icon: CheckCircle2,
      color: 'bg-indigo-500',
      trend: 8
    },
    {
      title: 'Vessel Booked',
      value: filteredOrders.filter(
        (o) => o.status === OrderStatus.VESSEL_BOOKED
      ).length,
      icon: Ship,
      color: 'bg-blue-500',
      trend: 5
    },
    {
      title: 'Order Completed',
      value: filteredOrders.filter(
        (o) => o.status === OrderStatus.VESSEL_DEPARTED
      ).length,
      icon: Package,
      color: 'bg-emerald-500',
      trend: 15
    }
  ];

  const urgentOrders = filteredOrders.filter(
    (o) =>
      o.items.some((i) => i.asap) && o.status !== OrderStatus.VESSEL_DEPARTED
  );

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Executive Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Overview of procurement pipeline and logistics status.
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
            Place New Order
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="font-extrabold text-lg text-slate-900 dark:text-white">
                  Recent Shipments
                </h2>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">
                  Live Tracking
                </p>
              </div>
              <Link
                to="/orders"
                className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 group"
              >
                View Logistics Board{' '}
                <ArrowRight
                  size={14}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>
            </div>
            <div className="overflow-x-auto">
              {filteredOrders.length > 0 ? (
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-950/50 text-slate-400 dark:text-slate-500 uppercase text-[10px] font-black tracking-widest border-b border-slate-100 dark:border-slate-800">
                      <th className="px-8 py-4 text-left">Ref Number</th>
                      <th className="px-8 py-4 text-left">Created By</th>
                      <th className="px-8 py-4 text-left">Submission</th>
                      <th className="px-8 py-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredOrders.slice(0, 5).map((order) => (
                      <tr
                        key={order.orderNo}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group"
                      >
                        <td className="px-8 py-5">
                          <Link
                            to={`/orders/${order.orderNo}`}
                            className="font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-2"
                          >
                            <div className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-500"></div>
                            {order.orderNo}
                          </Link>
                        </td>
                        <td className="px-8 py-5">
                          <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                            {order.createdBy}
                          </span>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                            <Calendar size={14} />
                            <span className="text-xs font-bold">
                              {formatDate(order.orderDate)}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-center">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide ${
                              order.status === OrderStatus.CREATED
                                ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900'
                                : order.status === OrderStatus.CONFIRMED
                                  ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900'
                                  : order.status === OrderStatus.VESSEL_BOOKED
                                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900'
                                    : order.status === OrderStatus.RECEIVED_PO
                                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-900'
                                      : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900'
                            }`}
                          >
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-20 text-center">
                  <Package
                    size={64}
                    className="mx-auto mb-4 text-slate-200 dark:text-slate-700"
                  />
                  <p className="text-slate-400 dark:text-slate-500 font-bold">
                    Your logistics pipeline is empty.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-500 dark:text-rose-400">
                <AlertCircle size={20} />
              </div>
              <h2 className="font-extrabold text-lg text-slate-900 dark:text-white">
                Urgent Attention
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {urgentOrders.length > 0 ? (
                urgentOrders.slice(0, 4).map((order) => (
                  <Link
                    key={order.orderNo}
                    to={`/orders/${order.orderNo}`}
                    className="block p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-rose-100 dark:hover:border-rose-900 transition-all group"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className="font-extrabold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {order.orderNo}
                      </span>
                      <span className="text-[10px] bg-rose-500 text-white px-2 py-0.5 rounded-full font-black animate-pulse">
                        ASAP
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-xs font-bold mb-4">
                      <Calendar size={14} />
                      Target ETA: {order.items[0]?.requestETA}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Awaiting Logistics
                      </span>
                      <ArrowRight
                        size={16}
                        className="text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-indigo-600"
                      />
                    </div>
                  </Link>
                ))
              ) : (
                <div className="py-12 text-center">
                  <CheckCircle2
                    size={48}
                    className="mx-auto text-emerald-100 mb-4"
                  />
                  <p className="text-sm font-bold text-slate-400">
                    Perfect! No urgent orders.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[2rem] p-8 text-white relative overflow-hidden group shadow-xl shadow-indigo-200">
            <div className="absolute top-0 right-0 p-8 opacity-10 transition-transform duration-700 group-hover:scale-150">
              <Command size={120} />
            </div>
            <div className="relative z-10">
              <h3 className="font-extrabold text-xl mb-2">Need Support?</h3>
              <p className="text-indigo-100 text-sm font-medium mb-6 leading-relaxed">
                Our logistics specialists are available 24/7 to help with your
                complex shipments.
              </p>
              <button className="bg-white text-indigo-600 px-6 py-2.5 rounded-xl font-extrabold text-sm hover:bg-indigo-50 transition-colors">
                Contact Agent
              </button>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
};
