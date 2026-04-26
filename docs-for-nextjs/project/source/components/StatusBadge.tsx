import React from 'react';
import {
  AlertCircle,
  BadgeCheck,
  CalendarCheck,
  CheckCircle2,
  FileCheck,
  FileEdit,
  FileText,
  Send,
  Ship
} from 'lucide-react';
import { OrderLineStatus, OrderProgressStatus } from '../types';
import { formatStatusLabel } from '../utils/statusLabel';

type BadgeMeta = {
  label: string;
  className: string;
  Icon: React.ComponentType<{ className?: string }>;
};

const orderStatusMeta: Record<OrderProgressStatus, BadgeMeta> = {
  [OrderProgressStatus.CREATE]: {
    label: 'DRAFT',
    Icon: FileEdit,
    className:
      'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800'
  },
  [OrderProgressStatus.IN_PROGRESS]: {
    label: formatStatusLabel(OrderProgressStatus.IN_PROGRESS),
    Icon: AlertCircle,
    className:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800'
  },
  [OrderProgressStatus.COMPLETE]: {
    label: 'COMPLETE',
    Icon: CheckCircle2,
    className:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800'
  }
};

const lineStatusMeta: Record<OrderLineStatus, BadgeMeta> = {
  [OrderLineStatus.DRAFT]: {
    label: 'DRAFT',
    Icon: FileEdit,
    className:
      'bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
  },
  [OrderLineStatus.CREATED]: {
    label: 'CREATED',
    Icon: Send,
    className:
      'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-300'
  },
  [OrderLineStatus.WAIT_SALE_UEC_APPROVE_PO]: {
    label: 'WAIT SALE APPROVE PO',
    Icon: FileText,
    className:
      'bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-900/30 dark:border-orange-800 dark:text-orange-300'
  },
  [OrderLineStatus.APPROVED]: {
    label: 'CONFIRMED',
    Icon: BadgeCheck,
    className:
      'bg-violet-50 border-violet-200 text-violet-700 dark:bg-violet-900/30 dark:border-violet-800 dark:text-violet-300'
  },
  [OrderLineStatus.VESSEL_SCHEDULED]: {
    label: 'WAIT VESSEL DEPARTURE',
    Icon: CalendarCheck,
    className:
      'bg-sky-50 border-sky-200 text-sky-700 dark:bg-sky-900/30 dark:border-sky-800 dark:text-sky-300'
  },
  [OrderLineStatus.WAIT_MGR_UEC_APPROVE_PO]: {
    label: 'WAIT MGR APPROVE PO',
    Icon: BadgeCheck,
    className:
      'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-900/30 dark:border-purple-800 dark:text-purple-300'
  },
  [OrderLineStatus.VESSEL_DEPARTED]: {
    label: 'DEPARTED',
    Icon: Ship,
    className:
      'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-300'
  }
};

export const getOrderStatusMeta = (status: OrderProgressStatus) =>
  orderStatusMeta[status];

export const getLineStatusMeta = (status: OrderLineStatus) =>
  lineStatusMeta[status];

export const OrderStatusBadge: React.FC<{
  status: OrderProgressStatus;
  className?: string;
}> = ({ status, className = '' }) => {
  const meta = getOrderStatusMeta(status);
  const Icon = meta.Icon;
  return (
    <span
      className={`px-2 py-1 ui-radius-control text-[10px] font-bold border inline-flex items-center gap-1 uppercase ${meta.className} ${className}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {meta.label}
    </span>
  );
};

export const LineStatusBadge: React.FC<{
  status: OrderLineStatus;
  className?: string;
}> = ({ status, className = '' }) => {
  const meta = getLineStatusMeta(status);
  const Icon = meta.Icon;
  return (
    <span
      className={`px-2 py-1 ui-radius-control text-[10px] font-bold border inline-flex items-center gap-1 uppercase ${meta.className} ${className}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {meta.label}
    </span>
  );
};
