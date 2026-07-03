import React from 'react';
import { cn } from '../../lib/cn';

const tones = {
  brand:
    'bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300 border-brand-200/60 dark:border-brand-800',
  amber:
    'bg-accent-50 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300 border-accent-200/60 dark:border-accent-800',
  blue: 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300 border-sky-200/60 dark:border-sky-800',
  red: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200/60 dark:border-red-800',
  gray: 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300 border-stone-200/60 dark:border-stone-700',
};

const dotColor = {
  brand: 'bg-brand-500',
  amber: 'bg-accent-500',
  blue: 'bg-sky-500',
  red: 'bg-red-500',
  gray: 'bg-stone-400',
};

export function Badge({ tone = 'gray', className, children, dot = false }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize',
        tones[tone],
        className
      )}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dotColor[tone])} />}
      {children}
    </span>
  );
}

const statusTone = {
  requested: 'amber',
  accepted: 'brand',
  fulfilled: 'blue',
  cancelled: 'red',
  declined: 'gray',
  dismissed: 'gray',
};

export function StatusBadge({ status, className }) {
  const tone = statusTone[status] || 'gray';
  return (
    <Badge tone={tone} dot className={className}>
      {status}
    </Badge>
  );
}
