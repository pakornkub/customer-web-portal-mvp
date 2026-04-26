import React from 'react';
import { Link } from 'react-router-dom';

const toneClassMap: Record<'indigo' | 'emerald' | 'rose' | 'slate', string> = {
  indigo:
    'text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50',
  emerald:
    'text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50',
  rose: 'text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 border-rose-200 dark:border-rose-800 bg-rose-50/70 dark:bg-rose-900/30 hover:bg-rose-100 dark:hover:bg-rose-900/50',
  slate:
    'text-slate-600 dark:text-slate-300 hover:text-slate-700 dark:hover:text-slate-200 border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700'
};

const baseClassName =
  'w-7 h-7 ui-radius-control border inline-flex items-center justify-center transition-colors';

export const ActionIconLink: React.FC<{
  to: string;
  title: string;
  tone?: 'indigo' | 'emerald' | 'rose' | 'slate';
  children: React.ReactNode;
}> = ({ to, title, tone = 'slate', children }) => (
  <Link
    to={to}
    title={title}
    aria-label={title}
    className={`${baseClassName} ${toneClassMap[tone]}`}
  >
    {children}
  </Link>
);

export const ActionIconButton: React.FC<{
  title: string;
  tone?: 'indigo' | 'emerald' | 'rose' | 'slate';
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}> = ({ title, tone = 'slate', onClick, disabled = false, children }) => (
  <button
    type="button"
    title={title}
    aria-label={title}
    onClick={onClick}
    disabled={disabled}
    className={`${baseClassName} ${toneClassMap[tone]} ${
      disabled ? 'opacity-50 cursor-not-allowed' : ''
    }`}
  >
    {children}
  </button>
);
