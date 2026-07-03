import React from 'react';
import { FiCopy } from 'react-icons/fi';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Input, Textarea } from '../ui/Input';
import { Badge } from '../ui/Badge';

export function CodeModal({ open, onClose, title, actionLabel, variant = 'primary', value, onChange, onSubmit, loading, error }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Close</Button>
          <Button variant={variant} loading={loading} onClick={onSubmit}>{actionLabel}</Button>
        </>
      }
    >
      <p className="mb-3 text-sm text-stone-500 dark:text-stone-400">
        Enter the code shared by the other party to confirm this action.
      </p>
      <Input placeholder="Enter code" value={value} onChange={onChange} autoFocus />
      {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </Modal>
  );
}

export function ReviewModal({ open, onClose, onSubmit, loading, value, onChange }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Leave a review"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button loading={loading} onClick={onSubmit}>Submit review</Button>
        </>
      }
    >
      <Textarea rows={4} placeholder="Share your experience…" value={value} onChange={onChange} />
    </Modal>
  );
}

export function ListingsModal({ open, onClose, order }) {
  return (
    <Modal open={open} onClose={onClose} title="Requested items">
      <ul className="space-y-2">
        {order?.listings?.map((l, i) => (
          <li
            key={i}
            className="flex items-center justify-between gap-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 px-4 py-2.5"
          >
            <span className="font-medium text-stone-800 dark:text-stone-100">{l.name}</span>
            <span className="text-sm text-stone-500 dark:text-stone-400">
              {l.quantity}kg · {l.food_type} · {l.expiry}h
            </span>
          </li>
        ))}
      </ul>
    </Modal>
  );
}

export function ReviewBlock({ label, review, sentiment }) {
  if (!review) return null;
  return (
    <div className="relative mt-2 rounded-xl bg-stone-50 dark:bg-stone-800/60 p-3">
      {sentiment && (
        <span className="absolute top-2 right-2">
          <Badge tone={sentiment === 'Positive' ? 'brand' : 'red'}>{sentiment}</Badge>
        </span>
      )}
      <p className="text-xs font-semibold text-stone-500 dark:text-stone-400">{label}</p>
      <p className="mt-0.5 text-sm text-stone-700 dark:text-stone-200 pr-16">{review}</p>
    </div>
  );
}

export function CodeField({ label, code, onCopy }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-stone-500 dark:text-stone-400">{label}</label>
      <div className="flex items-center gap-2">
        <code className="flex-1 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-3 py-2 font-mono text-sm tracking-[0.2em] text-stone-800 dark:text-stone-100">
          {code || '—'}
        </code>
        <Button variant="secondary" size="sm" onClick={onCopy}>
          <FiCopy size={14} /> Copy
        </Button>
      </div>
    </div>
  );
}
