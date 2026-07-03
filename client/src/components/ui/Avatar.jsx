import React from 'react';
import { cn } from '../../lib/cn';

const palette = [
  'bg-brand-500',
  'bg-accent-500',
  'bg-sky-500',
  'bg-rose-500',
  'bg-violet-500',
  'bg-teal-500',
];

function hashStr(s = '') {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export default function Avatar({ name = '', size = 40, className }) {
  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() || '')
      .join('') || '?';
  const color = palette[hashStr(name) % palette.length];
  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-full font-semibold text-white select-none shrink-0',
        color,
        className
      )}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initials}
    </div>
  );
}
