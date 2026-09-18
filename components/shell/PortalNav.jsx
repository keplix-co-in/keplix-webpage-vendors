'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarDays,
  UserPlus,
  Wrench,
  IndianRupee,
  Star,
  MessageSquare,
  Bell,
  Store,
  Folder,
  Clock,
  HelpCircle,
  LogOut,
} from 'lucide-react';
import BrandLockup from './BrandLockup';
import { useAuth } from '@/context/AuthContext';

/**
 * Sidebar from PortalNav.dc.html, with the glyph placeholders swapped for the
 * real icon set as the handoff instructs.
 *
 * The design's "Booking detail", "Vehicle inspection", "Service completion" and
 * "Transaction receipt" entries are deliberately absent: each needs a specific
 * job to mean anything, so they are reached through the flow that selects one
 * (Bookings → detail → Mark Done → Inspection → Completion; Earnings → Receipt).
 */
const NAV_GROUPS = [
  {
    label: 'Workspace',
    items: [
      { href: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
      { href: '/bookings', label: 'Bookings', Icon: CalendarDays, badgeKey: 'pendingBookings' },
      { href: '/walk-in/new', label: 'Walk-in check-in', Icon: UserPlus },
      { href: '/services', label: 'Service catalog', Icon: Wrench },
    ],
  },
  {
    label: 'Money',
    items: [{ href: '/earnings', label: 'Earnings & payouts', Icon: IndianRupee }],
  },
  {
    label: 'Customers',
    items: [
      { href: '/reviews', label: 'Reviews', Icon: Star },
      { href: '/messages', label: 'Messages', Icon: MessageSquare, badgeKey: 'unreadMessages' },
      { href: '/notifications', label: 'Notifications', Icon: Bell, badgeKey: 'unreadNotifications' },
    ],
  },
  {
    label: 'Shop',
    items: [
      { href: '/profile', label: 'Business profile', Icon: Store },
      { href: '/documents', label: 'My documents', Icon: Folder },
      { href: '/timings', label: 'Timings & holidays', Icon: Clock },
      { href: '/support', label: 'Support & FAQs', Icon: HelpCircle },
    ],
  },
];

export default function PortalNav({ badges = {} }) {
  const pathname = usePathname();
  const { signOut } = useAuth();

  const isActive = (href) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav
      className="kx-nav bg-white flex flex-col sticky top-0 h-screen min-w-0 max-[1000px]:h-auto max-[1000px]:static max-[1000px]:border-r-0 max-[1000px]:border-b"
      style={{ borderRight: '1px solid var(--color-line)', borderBottomColor: 'var(--color-line)' }}
    >
      <div
        className="px-5 pt-[22px] pb-[18px]"
        style={{ borderBottom: '1px solid var(--color-divider)' }}
      >
        <BrandLockup label="Partner portal" sublabel="Vendor portal" />
      </div>

      {/* min-width:0 on the strip and its groups is load-bearing below 1000px:
          without it the flex children refuse to shrink and the page scrolls
          sideways. */}
      <div className="kx-scroll flex-1 overflow-y-auto p-3 flex flex-col min-w-0 max-[1000px]:flex-row max-[1000px]:gap-[18px] max-[1000px]:overflow-x-auto">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-[18px] max-[1000px]:mb-0 max-[1000px]:min-w-max">
            <div className="text-[10px] font-bold tracking-[1px] text-[var(--color-disabled)] px-2.5 pb-2 whitespace-nowrap">
              {group.label}
            </div>

            {group.items.map(({ href, label, Icon, badgeKey }) => {
              const active = isActive(href);
              const badge = badgeKey ? badges[badgeKey] : null;

              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className="flex items-center gap-2.5 px-2.5 py-[9px] rounded-[10px] mb-0.5 text-[13.5px] whitespace-nowrap"
                  style={{
                    background: active ? 'var(--color-primary-tint)' : 'transparent',
                    color: active ? 'var(--color-primary-dark)' : 'var(--color-ink-body)',
                    fontWeight: active ? 700 : 500,
                  }}
                >
                  <span className="w-[18px] flex items-center justify-center shrink-0">
                    <Icon size={16} />
                  </span>
                  <span className="flex-1">{label}</span>
                  {badge > 0 && (
                    <span
                      className="text-[10px] font-bold text-white rounded-[var(--radius-pill)] px-1.5 py-px"
                      style={{ background: 'var(--color-danger-light)' }}
                    >
                      {badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* The only account action in the sidebar — sign-in and onboarding are
          deliberately not navigable from inside the portal. */}
      <div className="px-3 py-2.5" style={{ borderTop: '1px solid var(--color-divider)' }}>
        <button
          type="button"
          onClick={signOut}
          className="w-full flex items-center gap-2.5 px-2.5 py-[9px] rounded-[10px] text-[13.5px] font-bold cursor-pointer"
          style={{ color: 'var(--color-danger)' }}
        >
          <span className="w-[18px] flex items-center justify-center">
            <LogOut size={15} />
          </span>
          <span>Log out</span>
        </button>
      </div>

      <div
        className="kx-nav-cta p-3.5 max-[1000px]:hidden"
        style={{ borderTop: '1px solid var(--color-divider)' }}
      >
        <div className="rounded-[14px] p-3.5" style={{ background: 'var(--color-primary-tint)' }}>
          <div className="text-[12px] font-bold text-[var(--color-primary-dark)] mb-1">Mobile app</div>
          <div className="text-[11px] text-[var(--color-ink-body)] leading-[1.5] mb-2.5">
            Same account, same data. Work from the shop floor or the counter.
          </div>
          {/* Android package from keplix-frontend/app.config.js. */}
          <a
            href="https://play.google.com/store/apps/details?id=com.keplix.carservice"
            target="_blank"
            rel="noreferrer"
            className="block text-center w-full text-white text-[12px] font-bold rounded-[var(--radius-pill)] py-2"
            style={{ background: 'var(--color-primary)' }}
          >
            Get the app
          </a>
        </div>
      </div>
    </nav>
  );
}
