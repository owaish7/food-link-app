import React from 'react';
import { cn } from '../../lib/cn';

export default function EmptyState({ icon, title, description, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-16 px-6', className)}>
      {icon && (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 text-3xl">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-stone-800 dark:text-stone-100">{title}</h3>
      {description && (
        <p className="mt-1.5 text-sm text-stone-500 dark:text-stone-400 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
