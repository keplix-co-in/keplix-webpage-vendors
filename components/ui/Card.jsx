'use client';

import Button from './Button';

export function Card({ className = '', padded = true, style, children, ...props }) {
  return (
    <div
      className={[
        'bg-white border border-[var(--color-line)] rounded-[var(--radius-portal)]',
        padded ? 'p-[22px]' : '',
        className,
      ].join(' ')}
      style={{ boxShadow: 'var(--shadow-card)', ...style }}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, action, subtitle }) {
  return (
    <div className="flex items-center justify-between gap-4 mb-[18px]">
      <div className="min-w-0">
        <div className="text-[15px] font-bold">{title}</div>
        {subtitle && <div className="text-[12px] text-[var(--color-muted)] mt-0.5">{subtitle}</div>}
      </div>
      {action}
    </div>
  );
}

export function Kicker({ children, className = '' }) {
  return (
    <div
      className={`text-[10.5px] font-bold tracking-[1px] text-[var(--color-disabled)] uppercase ${className}`}
    >
      {children}
    </div>
  );
}

export function EmptyState({ title, body, action }) {
  return (
    <div className="text-center py-12 px-6">
      <div className="text-[15px] font-bold mb-1.5">{title}</div>
      {body && (
        <div className="text-[13px] text-[var(--color-muted)] leading-[1.6] max-w-[420px] mx-auto">
          {body}
        </div>
      )}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

/**
 * The failure twin of EmptyState.
 *
 * WHY: "no data" and "we could not load your data" used to render identically —
 * every list fell back to EmptyState and every money tile to ₹0, so an API
 * outage looked like a quiet day. This is the one place that says so, and it
 * always offers a way to try again.
 *
 * `error` is accepted only so the message can be logged; raw error text is
 * never rendered, because it can carry request URLs and server internals.
 */
export function ErrorState({
  title = 'We could not load this',
  body = 'Something went wrong on our side. Check your connection and try again.',
  onRetry,
  retryLabel = 'Retry',
}) {
  return (
    <div className="text-center py-12 px-6">
      <div className="text-[15px] font-bold mb-1.5">{title}</div>
      <div className="text-[13px] text-[var(--color-muted)] leading-[1.6] max-w-[420px] mx-auto">
        {body}
      </div>
      {onRetry && (
        <div className="mt-5 flex justify-center">
          <Button variant="outline" size="md" onClick={onRetry}>
            {retryLabel}
          </Button>
        </div>
      )}
    </div>
  );
}

/** Inline, one-line variant for a strip above a grid of tiles. */
export function ErrorNotice({ message, onRetry, retryLabel = 'Retry' }) {
  return (
    <div
      role="alert"
      className="rounded-[var(--radius-portal)] px-5 py-4 mb-5 flex items-center gap-4 flex-wrap"
      style={{
        background: 'var(--color-danger-tint)',
        border: '1px solid var(--color-danger-tint)',
        borderLeft: '4px solid var(--color-danger)',
      }}
    >
      <div className="flex-1 min-w-[200px] text-[12.5px] leading-[1.5] text-[var(--color-danger)] font-bold">
        {message}
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}

export default Card;
