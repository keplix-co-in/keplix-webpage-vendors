'use client';

import Link from 'next/link';
import { Bell, Menu } from 'lucide-react';
import { Toggle } from '@/components/ui/Field';
import Avatar from '@/components/ui/Avatar';
import AlertSettings from './AlertSettings';

/**
 * Sticky portal header. The prototype's "Workflow map" pill is replaced by the
 * real controls the Dashboard design shows: the accepting-jobs toggle, a
 * notification bell with an unread dot, and the account pill.
 */
/*
 * Below `lg` the header becomes two rows: the menu button and controls on top,
 * the page title underneath (`max-lg:order-last basis-full`). The controls
 * used to be a ~425–530px row that never shrank, so at 375px every portal page
 * scrolled sideways by ~150px. On phones the bell is hidden (Notifications is
 * in the drawer) and its unread dot moves onto the menu button, and the profile
 * pill shows only the avatar.
 */
export default function PortalHeader({
  title,
  subtitle,
  businessName,
  image,
  online,
  onToggleOnline,
  onlineBusy = false,
  hasUnread = false,
  onOpenMenu,
  menuOpen = false,
}) {
  return (
    <header
      className="bg-white px-4 sm:px-7 py-3 lg:py-3.5 flex items-center gap-x-3 gap-y-2.5 lg:gap-5 sticky top-0 z-30 flex-wrap"
      style={{ borderBottom: '1px solid var(--color-line)' }}
    >
      {onOpenMenu && (
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Open menu"
          aria-controls="portal-nav"
          aria-expanded={menuOpen}
          className="lg:hidden w-10 h-10 -ml-1.5 rounded-full flex items-center justify-center relative cursor-pointer shrink-0"
        >
          <Menu size={22} color="var(--color-ink-body)" />
          {hasUnread && (
            <span
              className="sm:hidden absolute top-[8px] right-[7px] w-2 h-2 rounded-full"
              style={{ background: 'var(--color-danger-light)', border: '2px solid white' }}
            />
          )}
        </button>
      )}

      <div className="flex-1 min-w-0 max-lg:order-last max-lg:basis-full">
        <h1 className="text-[17px] sm:text-[19px] font-bold tracking-[-0.3px] truncate">{title}</h1>
        {subtitle && <p className="text-[12.5px] text-[var(--color-muted)] truncate">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-2 sm:gap-3 min-w-0 max-lg:ml-auto">
        {onToggleOnline && (
          <div
            className="flex items-center gap-2 sm:gap-3 rounded-[var(--radius-pill)] pl-3 sm:pl-4 pr-2.5 py-1.5"
            style={{
              border: `1px solid ${online ? '#D1FAE5' : 'var(--color-line)'}`,
              background: online ? 'var(--color-success-tint)' : 'var(--color-divider)',
            }}
          >
            <span
              className="text-[12.5px] font-bold whitespace-nowrap"
              style={{ color: online ? 'var(--color-success-dark)' : 'var(--color-muted)' }}
            >
              {online ? 'Accepting jobs' : 'Offline'}
            </span>
            {/* onlineBusy is checked here because Toggle has no disabled state:
                a second click while the request is in flight would send the
                opposite value and race the first. */}
            <Toggle
              checked={Boolean(online)}
              onChange={(next) => !onlineBusy && onToggleOnline(next)}
              label="Accepting jobs"
            />
          </div>
        )}

        <AlertSettings />

        <Link
          href="/notifications"
          aria-label="Notifications"
          className="max-sm:hidden w-10 h-10 rounded-full flex items-center justify-center relative"
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
          aria-label={businessName || 'My workshop'}
          className="flex items-center gap-2.5 rounded-[var(--radius-pill)] p-[5px] md:pr-3.5 bg-white shrink-0"
          style={{ border: '1px solid var(--color-line)' }}
        >
          <Avatar src={image} name={businessName} size={28} />
          <span className="max-md:hidden text-[12.5px] font-bold text-[var(--color-ink-secondary)] max-w-[180px] truncate">
            {businessName || 'My workshop'}
          </span>
        </Link>
      </div>
    </header>
  );
}
