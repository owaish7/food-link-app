import React from 'react';
import { cn } from '../../lib/cn';

export default function Skeleton({ className }) {
  return <div className={cn('skeleton', className)} />;
}
