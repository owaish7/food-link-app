import React from 'react';
import { cn } from '../../lib/cn';

const base =
  'w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-3.5 py-2.5 text-sm text-stone-800 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 disabled:opacity-60';

export function Label({ children, className, ...p }) {
  return (
    <label
      className={cn('block text-sm font-medium text-stone-600 dark:text-stone-300 mb-1.5', className)}
      {...p}
    >
      {children}
    </label>
  );
}

export function Input({ className, ...p }) {
  return <input className={cn(base, className)} {...p} />;
}

export function Textarea({ className, ...p }) {
  return <textarea className={cn(base, 'resize-none', className)} {...p} />;
}

export function Select({ className, children, ...p }) {
  return (
    <select className={cn(base, 'cursor-pointer', className)} {...p}>
      {children}
    </select>
  );
}

export function Field({ label, htmlFor, children, className }) {
  return (
    <div className={className}>
      {label && <Label htmlFor={htmlFor}>{label}</Label>}
      {children}
    </div>
  );
}
