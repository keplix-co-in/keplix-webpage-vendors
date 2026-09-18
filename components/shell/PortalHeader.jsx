'use client';

import Link from 'next/link';
import { Bell } from 'lucide-react';
import { initialsOf } from '@/lib/format';

/**
 * Sticky portal header. The prototype's "Workflow map" pill is replaced by the
 * real controls the Dashboard design shows: the accepting-jobs toggle, a
 * notification bell with an unread dot, and the account pill.
 */
export default function PortalHeader({
  title,
  subtitle,
  businessName,
  online,
  onToggleOnline,
  onlineBusy = false,
  hasUnread = false,
}) {
  return (
    <header
      className="bg-white px-7 py-3.5 flex items-center gap-5 sticky top-0 z-30 flex-wrap"
      style={{ borderBottom: '1px solid var(--color-line)' }}
    >
      <div className="flex-1 min-w-0">
        <h1 className="text-[19px] font-bold tracking-[-0.3px] truncate">{title}</h1>
        {subtitle && <p className="text-[12.5px] text-[var(--color-muted)] truncate">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {onToggleOnline && (
          <button
            type="button"
            onClick={() => onToggleOnline(!online)}
            disabled={onlineBusy}
            className="flex items-center gap-2 rounded-[var(--radius-pill)] pl-2.5 pr-3.5 py-1.5 text-[12.5px] font-bold cursor-pointer disabled:cursor-wait"
            style={{
              border: `1px solid ${online ? '#D1FAE5' : 'var(--color-line)'}`,
              background: online ? 'var(--color-success-tint)' : 'var(--color-divider)',
              color: online ? 'var(--color-success-dark)' : 'var(--color-muted)',
            }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: online ? 'var(--color-success)' : 'var(--color-disabled)' }}
            />
            {online ? 'Accepting jobs' : 'Offline'}
          </button>
        )}

        <Link
          href="/notifications"
          aria-label="Notifications"
          className="w-[38px] h-[38px] rounded-full flex items-center justify-center relative"
          style={{ border: '1px solid var(--color-line)', background: 'var(--color-canvas)' }}
        >
          <Bell size={18} color="var(--color-ink-body)" />
          {hasUnread && (
            <span
              className="absolute top-[7px] right-[9px] w-2 h-2 rounded-full"
              style={{ background: 'var(--color-danger-light)', border: '2px solid white' }}
            />
          )}
        </Link>

        <Link
          href="/profile"
          className="flex items-center gap-2.5 rounded-[var(--radius-pill)] pl-[5px] pr-3.5 py-[5px] bg-white"
          style={{ border: '1px solid var(--color-line)' }}
        >
          <span
            className="w-7 h-7 rounded-full text-white text-[12px] font-bold flex items-center justify-center"
            style={{ background: 'var(--color-primary)' }}
          >
            {initialsOf(businessName)}
          </span>
          <span className="text-[12.5px] font-bold text-[var(--color-ink-secondary)] max-w-[180px] truncate">
            {businessName || 'My workshop'}
          </span>
        </Link>
      </div>
    </header>
  );
}
