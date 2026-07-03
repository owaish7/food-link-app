import React from 'react';
import { cn } from '../../lib/cn';
import Spinner from './Spinner';

const variants = {
  primary: 'bg-brand-600 hover:bg-brand-700 text-white shadow-soft',
  accent: 'bg-accent-500 hover:bg-accent-600 text-white shadow-soft',
  secondary:
    'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700',
  ghost: 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800',
  danger: 'bg-red-600 hover:bg-red-700 text-white shadow-soft',
  subtle:
    'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-900/50',
};

const sizes = {
  sm: 'text-sm px-3 py-1.5 gap-1.5 rounded-lg',
  md: 'text-sm px-4 py-2.5 gap-2 rounded-xl',
  lg: 'text-base px-6 py-3 gap-2 rounded-xl',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  children,
  ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading && <Spinner size={size === 'sm' ? 14 : 16} />}
      {children}
    </button>
  );
}
