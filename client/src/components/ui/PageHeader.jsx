import React from 'react';
import { cn } from '../../lib/cn';

export default function PageHeader({ title, subtitle, action, className }) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6', className)}>
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-white">{title}</h1>
        {subtitle && <p className="mt-1 text-stone-500 dark:text-stone-400">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
