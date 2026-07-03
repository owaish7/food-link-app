import React, { createContext, useContext, useState, useCallback } from 'react';
import { IoCheckmarkCircle, IoAlertCircle, IoInformationCircle, IoClose } from 'react-icons/io5';
import { cn } from '../lib/cn';

const ToastContext = createContext(null);

// Safe to call even outside a provider (returns no-op) so pages never crash.
export const useToast = () => useContext(ToastContext) || noopToast;
const noopToast = { success() {}, error() {}, info() {} };

let counter = 0;

const icons = {
  success: <IoCheckmarkCircle />,
  error: <IoAlertCircle />,
  info: <IoInformationCircle />,
};

const tone = {
  success: 'text-brand-600 dark:text-brand-400',
  error: 'text-red-600 dark:text-red-400',
  info: 'text-sky-600 dark:text-sky-400',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback(
    (type, message, opts = {}) => {
      counter += 1;
      const id = counter;
      setToasts((t) => [...t, { id, type, message }]);
      setTimeout(() => dismiss(id), opts.duration ?? 4000);
      return id;
    },
    [dismiss]
  );

  const api = {
    success: (m, o) => push('success', m, o),
    error: (m, o) => push('error', m, o),
    info: (m, o) => push('info', m, o),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2.5 w-[min(92vw,22rem)]">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="animate-toast-in flex items-start gap-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-card px-4 py-3"
          >
            <span className={cn('text-xl mt-0.5 shrink-0', tone[t.type])}>{icons[t.type]}</span>
            <p className="flex-1 text-sm font-medium text-stone-700 dark:text-stone-200">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss"
              className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 shrink-0"
            >
              <IoClose />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
