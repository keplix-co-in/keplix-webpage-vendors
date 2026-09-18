'use client';

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

export default Card;
