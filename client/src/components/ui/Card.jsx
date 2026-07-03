import React from 'react';
import { cn } from '../../lib/cn';

export default function Card({ className, children, hover = false, ...props }) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 rounded-2xl shadow-card',
        hover && 'transition-all duration-300 hover:-translate-y-1 hover:shadow-glow',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
