'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  X,
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
      { href: '/support', label: 'Support & FAQs', Icon: HelpCircle },
    ],
  },
];

/**
 * At `lg` and up this is the sticky sidebar. Below `lg` it is an off-canvas
 * drawer: `open`/`onClose` come from the portal layout, the header's menu
 * button opens it, and a link tap, the backdrop, the close button or Escape
 * closes it. While closed on mobile it is `invisible`, which also takes its
 * links out of the tab order.
 */
export default function PortalNav({ badges = {}, open = false, onClose = () => {} }) {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const closeRef = useRef(null);

  const isActive = (href) => pathname === href || pathname.startsWith(`${href}/`);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    // Stop the page behind the drawer from scrolling while it is open.
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    // Move focus into the drawer so keyboard and screen-reader users land in it.
    const frame = requestAnimationFrame(() => closeRef.current?.focus());
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [open, onClose]);

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/35 lg:hidden"
        />
      )}
      <nav
        id="portal-nav"
        aria-label="Portal"
        className={`kx-nav bg-white flex flex-col min-w-0 fixed inset-y-0 left-0 z-50 w-[280px] max-w-[85vw] h-dvh shadow-xl duration-200 lg:sticky lg:top-0 lg:z-auto lg:w-auto lg:max-w-none lg:h-screen lg:shadow-none lg:translate-x-0 lg:visible ${
          // visibility is transitioned only on close (so it turns hidden after the
          // slide-out). On open it must flip at once: mid-transition the drawer
          // still computes as hidden and its close button can't take focus.
          open ? 'translate-x-0 visible transition-transform' : '-translate-x-full invisible transition-[transform,visibility]'
        }`}
        style={{ borderRight: '1px solid var(--color-line)' }}
      >
        <div
          className="px-5 pt-[22px] pb-[18px] flex items-center justify-between gap-3"
          style={{ borderBottom: '1px solid var(--color-divider)' }}
        >
          <BrandLockup label="Partner portal" sublabel="Vendor portal" />
          <button
            ref={closeRef}
            type="button"
            aria-label="Close menu"
            onClick={onClose}
            className="lg:hidden w-10 h-10 -mr-2 rounded-full flex items-center justify-center cursor-pointer"
          >
            <X size={20} color="var(--color-ink-body)" />
          </button>
        </div>

        <div className="kx-scroll flex-1 overflow-y-auto p-3 flex flex-col min-w-0">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="mb-[18px]">
              <div className="text-[11px] font-bold tracking-[1px] text-[var(--color-disabled)] px-2.5 pb-2 whitespace-nowrap">
                {group.label}
              </div>

              {group.items.map(({ href, label, Icon, badgeKey }) => {
                const active = isActive(href);
                const badge = badgeKey ? badges[badgeKey] : null;

                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onClose}
                    aria-current={active ? 'page' : undefined}
                    className="flex items-center gap-2.5 px-2.5 py-[11px] lg:py-[9px] rounded-[10px] mb-0.5 text-[14px] lg:text-[13.5px] whitespace-nowrap"
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
                        className="text-[11px] font-bold text-white rounded-[var(--radius-pill)] px-1.5 py-px"
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
            className="w-full flex items-center gap-2.5 px-2.5 py-[11px] lg:py-[9px] rounded-[10px] text-[13.5px] font-bold cursor-pointer"
            style={{ color: 'var(--color-danger)' }}
          >
            <span className="w-[18px] flex items-center justify-center">
              <LogOut size={15} />
            </span>
            <span>Log out</span>
          </button>
        </div>

        {/* Hidden in the mobile drawer: a vendor reading this on a phone is
            better served by the nav links than by an app ad. */}
        <div
          className="kx-nav-cta p-3.5 max-lg:hidden"
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
    </>
  );
}
