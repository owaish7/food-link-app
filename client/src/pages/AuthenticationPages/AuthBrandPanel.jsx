import React from 'react';
import { FiSearch, FiCheckCircle, FiMessageCircle } from 'react-icons/fi';

const points = [
  { icon: <FiSearch />, text: 'Discover surplus food nearby' },
  { icon: <FiCheckCircle />, text: 'Request & accept in one tap' },
  { icon: <FiMessageCircle />, text: 'Coordinate pickup in real time' },
];

export default function AuthBrandPanel({ title, subtitle }) {
  return (
    <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-600 to-brand-800 p-10 text-white">
      <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-accent-400/20 blur-2xl" />

      <div className="relative">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-xl backdrop-blur">
            🍽️
          </span>
          <span className="font-display text-xl font-extrabold tracking-tight">FoodLink</span>
        </div>
        <h1 className="mt-10 font-display text-3xl font-extrabold leading-tight">{title}</h1>
        <p className="mt-4 max-w-sm text-brand-100">{subtitle}</p>
      </div>

      <ul className="relative mt-10 space-y-3">
        {points.map((p) => (
          <li key={p.text} className="flex items-center gap-3 text-brand-50">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">{p.icon}</span>
            <span className="text-sm font-medium">{p.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
