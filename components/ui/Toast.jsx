'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const TONE = {
  success: { bg: 'var(--color-success-tint)', fg: 'var(--color-success-dark)', Icon: CheckCircle2 },
  error: { bg: 'var(--color-danger-tint)', fg: 'var(--color-danger)', Icon: AlertCircle },
  info: { bg: 'var(--color-primary-tint)', fg: 'var(--color-primary-dark)', Icon: Info },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message, tone = 'info') => {
      const id = Math.random().toString(36).slice(2);
      setToasts((current) => [...current, { id, message, tone }]);
      setTimeout(() => dismiss(id), 5000);
    },
    [dismiss]
  );

  const value = useMemo(
    () => ({
      show,
      success: (message) => show(message, 'success'),
      error: (message) => show(message, 'error'),
      info: (message) => show(message, 'info'),
    }),
    [show]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Full width on phones; a fixed w-[340px] toast used to spill past a
          327px-wide container at 375px. */}
      <div className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[340px] z-[100] flex flex-col gap-2.5">
        {toasts.map(({ id, message, tone }) => {
          const { bg, fg, Icon } = TONE[tone] ?? TONE.info;
          return (
            <div
              key={id}
              role="status"
              className="flex items-start gap-2.5 rounded-[14px] px-4 py-3 text-[13px] font-medium w-full"
              style={{ background: bg, color: fg, boxShadow: 'var(--shadow-modal)' }}
            >
              <Icon size={16} className="mt-px shrink-0" />
              <span className="flex-1 leading-[1.5]">{message}</span>
              <button
                type="button"
                onClick={() => dismiss(id)}
                aria-label="Dismiss"
                className="shrink-0 cursor-pointer opacity-70 hover:opacity-100 p-2 -m-2"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
};

export default ToastProvider;
