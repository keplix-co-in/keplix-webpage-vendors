'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Centred dialog over a blurred page — used by Remove Service, Reject Order and
 * the walk-in close sheet. Radius 24px with the handoff's modal shadow.
 */
export default function Modal({ open, onClose, title, headerTone, children, footer, width = 520 }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    // Stop the page behind the modal scrolling under it.
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ background: 'rgba(17,24,39,.35)', backdropFilter: 'blur(3px)' }}
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-[var(--radius-modal)] w-full my-auto overflow-hidden"
        style={{ maxWidth: width, boxShadow: 'var(--shadow-modal)' }}
      >
        {title && (
          <div
            className="flex items-center justify-between gap-4 px-5 sm:px-6 py-[18px]"
            style={
              headerTone === 'danger'
                ? { background: 'var(--color-danger)', color: '#fff' }
                : { borderBottom: '1px solid var(--color-divider)' }
            }
          >
            <div className="text-[16px] font-bold">{title}</div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="cursor-pointer opacity-70 hover:opacity-100 p-2.5 -m-2.5"
            >
              <X size={18} />
            </button>
          </div>
        )}

        <div className="px-5 sm:px-6 py-5 sm:py-6">{children}</div>

        {footer && (
          // Phones: buttons stack full width, primary action on top.
          <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-0 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end sm:flex-wrap [&>*]:w-full sm:[&>*]:w-auto">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
