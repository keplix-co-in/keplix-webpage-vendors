'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, ChevronDown, Lock, Search, X } from 'lucide-react';
import { isDevBuild, isPreviewOn, setPreview } from '@/lib/devPreview';

/**
 * Screen index — the web counterpart to the app's VendorScreenTester.
 *
 * Every page in one list so a screen can be opened directly instead of walked
 * to through a flow. Guarded pages need the preview toggle below, which stands
 * in a fake vendor so the auth guard lets them through.
 *
 * Dev only: a production build renders the notice instead, and the preview flag
 * is compiled out entirely.
 */

const GROUPS = [
  {
    name: 'Auth',
    screens: [
      { path: '/welcome', name: 'Welcome', desc: 'Entry screen — sign up, sign in, Google' },
      { path: '/sign-in', name: 'Sign In', desc: 'Email and password' },
      { path: '/sign-up', name: 'Sign Up', desc: 'Create an account, sends an email OTP' },
      { path: '/sign-up/otp', name: 'Sign Up OTP', desc: 'Verify the emailed code' },
      { path: '/forgot-password', name: 'Forgot Password', desc: 'Request a reset code' },
      { path: '/forgot-password/otp', name: 'Reset OTP', desc: 'Code entry, including the error state' },
      { path: '/reset-password', name: 'Reset Password', desc: 'New password with the rule checklist' },
      { path: '/verified/email', name: 'Email Verified', desc: 'Purple confirmation' },
      { path: '/done', name: 'Password Changed', desc: 'Purple confirmation' },
    ],
  },
  {
    name: 'Onboarding',
    screens: [
      { path: '/onboarding/welcome', name: 'Onboarding Welcome', desc: 'What you need before starting' },
      { path: '/onboarding', name: 'Onboarding Hub', desc: 'Four steps, completable in any order' },
      { path: '/onboarding/workshop', name: 'Workshop Information', desc: 'Step 1 — shop details and photos' },
      { path: '/onboarding/address', name: 'Shop Address', desc: 'Leaflet map pin and address fields' },
      { path: '/onboarding/owner', name: 'Owner Details', desc: 'Step 1 — owner identity' },
      { path: '/onboarding/documents', name: 'Workshop Documents', desc: 'Step 2 — GSTIN, PAN, payout details' },
      { path: '/onboarding/timings', name: 'Workshop Timings', desc: 'Step 3 — opening hours' },
      { path: '/onboarding/breaks', name: 'Breaks & Holidays', desc: 'Step 3 — mid-day breaks' },
      { path: '/onboarding/services', name: 'Choose Services', desc: 'Step 4 — pick categories' },
      { path: '/onboarding/services/setup', name: 'Service Setup', desc: 'Step 4 — price the services' },
      { path: '/onboarding/success', name: 'Registration Success', desc: 'Purple confirmation' },
    ],
  },
  {
    name: 'Workspace',
    guarded: true,
    screens: [
      { path: '/dashboard', name: 'Dashboard', desc: 'Counters, today’s schedule, live walk-ins' },
      { path: '/bookings', name: 'Bookings', desc: 'Tabs, day strip, accept and decline' },
      { path: '/bookings/{id}', name: 'Booking Detail', desc: 'Rows, timeline and job actions', dynamic: true },
      { path: '/bookings/{id}/reject', name: 'Reject Order', desc: 'Reasons modal', dynamic: true },
      { path: '/bookings/{id}/rejected', name: 'Rejection Sent', desc: 'Confirmation', dynamic: true },
      { path: '/bookings/{id}/inspection', name: 'Vehicle Inspection', desc: 'Health sheet, required before closing', dynamic: true },
      { path: '/bookings/{id}/completion', name: 'Service Completion', desc: 'Photos, notes, final bill', dynamic: true },
      { path: '/bookings/{id}/completed', name: 'Job Completed', desc: 'Confirmation', dynamic: true },
    ],
  },
  {
    name: 'Walk-ins',
    guarded: true,
    screens: [
      { path: '/walk-in/new', name: 'Walk-in Check-in', desc: 'Log a car already on the forecourt' },
      { path: '/walk-in/{id}', name: 'Walk-in Detail', desc: 'Start, notify, close', dynamic: true },
      { path: '/walk-in/{id}/inspection', name: 'Walk-in Inspection', desc: 'Same health sheet', dynamic: true },
      { path: '/walk-in/{id}/close', name: 'Close Walk-in', desc: 'Amount collected and payment mode', dynamic: true },
      { path: '/walk-in/{id}/closed', name: 'Walk-in Closed', desc: 'Teal confirmation', dynamic: true },
    ],
  },
  {
    name: 'Catalog & money',
    guarded: true,
    screens: [
      { path: '/services', name: 'Service Catalog', desc: 'List, pause toggle, edit' },
      { path: '/services/new', name: 'Add Service', desc: 'Create a service' },
      { path: '/services/{id}/edit', name: 'Edit Service', desc: 'Edit or delete a service', dynamic: true },
      { path: '/earnings', name: 'Earnings & Payouts', desc: 'Totals, transactions, payout account' },
      { path: '/earnings/{id}', name: 'Transaction Receipt', desc: 'One settled payment', dynamic: true },
    ],
  },
  {
    name: 'Customers',
    guarded: true,
    screens: [
      { path: '/reviews', name: 'Customer Reviews', desc: 'Ratings and replies' },
      { path: '/messages', name: 'Messages', desc: 'Booking-linked chat over sockets' },
      { path: '/notifications', name: 'Notifications', desc: 'Bookings, payments, reviews' },
    ],
  },
  {
    name: 'Shop',
    guarded: true,
    screens: [
      { path: '/profile', name: 'Business Profile', desc: 'Shop details' },
      { path: '/documents', name: 'My Documents', desc: 'Payout fields and verified documents' },
      { path: '/timings', name: 'Timings & Holidays', desc: 'Hours, breaks, closures' },
      { path: '/support', name: 'Support & FAQs', desc: 'The ten real FAQ entries' },
      { path: '/support/chat', name: 'Support Chat', desc: 'Local notes plus email' },
    ],
  },
];

const TEST_ACCOUNTS = [
  'autocare.delhi@vendor.com',
  'speedfix.mumbai@vendor.com',
  'carzone.bangalore@vendor.com',
];

export default function ScreenIndexPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [sampleId, setSampleId] = useState('1');
  const [open, setOpen] = useState(() => GROUPS.map((g) => g.name));
  const [preview, setPreviewState] = useState(() => isPreviewOn());

  const total = useMemo(() => GROUPS.reduce((sum, g) => sum + g.screens.length, 0), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return GROUPS;
    return GROUPS.map((group) => ({
      ...group,
      screens: group.screens.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.desc.toLowerCase().includes(q) ||
          s.path.toLowerCase().includes(q)
      ),
    })).filter((group) => group.screens.length > 0);
  }, [query]);

  const hrefFor = (screen) => screen.path.replace('{id}', sampleId || '1');

  const togglePreview = (on) => {
    setPreview(on);
    setPreviewState(on);
    // AuthContext reads the flag once on load, so the portal only picks this
    // up after a reload.
    router.refresh();
  };

  if (!isDevBuild) {
    return (
      <main className="min-h-screen grid place-items-center p-8">
        <p className="text-[13px] text-[var(--color-muted)] max-w-[420px] text-center leading-[1.7]">
          The screen index is available in development only.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen" style={{ background: 'var(--color-canvas)' }}>
      <div
        className="bg-white sticky top-0 z-20 px-7 py-5"
        style={{ borderBottom: '1px solid var(--color-line)' }}
      >
        <div className="max-w-[1000px] mx-auto">
          <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
            <div>
              <h1 className="text-[22px] font-bold tracking-[-0.4px]">Screen index</h1>
              <p className="text-[12.5px] text-[var(--color-muted)] mt-1">
                {total} screens · {GROUPS.length} groups · development only
              </p>
            </div>

            <label
              className="flex items-center gap-2.5 rounded-[var(--radius-pill)] px-4 py-2 cursor-pointer"
              style={{
                background: preview ? 'var(--color-primary-tint)' : 'var(--color-canvas)',
                border: `1px solid ${preview ? 'var(--color-primary-tint-border)' : 'var(--color-line)'}`,
              }}
            >
              <input
                type="checkbox"
                checked={preview}
                onChange={(e) => togglePreview(e.target.checked)}
                className="accent-[var(--color-primary)]"
              />
              <span
                className="text-[12.5px] font-bold"
                style={{ color: preview ? 'var(--color-primary-dark)' : 'var(--color-ink-body)' }}
              >
                Preview guarded pages
              </span>
            </label>
          </div>

          <div className="flex gap-2.5 flex-wrap">
            <div className="relative flex-1 min-w-[220px]">
              <Search
                size={15}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-disabled)]"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search screens…"
                aria-label="Search screens"
                className="w-full rounded-[var(--radius-field)] pl-10 pr-10 py-2.5 text-[13.5px] outline-none"
                style={{ background: 'var(--color-canvas)', border: '1px solid var(--color-line)' }}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-disabled)] cursor-pointer"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <label className="flex items-center gap-2 text-[12.5px] text-[var(--color-muted)]">
              Sample id
              <input
                value={sampleId}
                onChange={(e) => setSampleId(e.target.value)}
                aria-label="Sample id for dynamic routes"
                className="w-[76px] rounded-[var(--radius-well)] px-3 py-2 text-[13px] outline-none"
                style={{ background: 'var(--color-canvas)', border: '1px solid var(--color-line)' }}
              />
            </label>
          </div>
        </div>
      </div>

      <div className="max-w-[1000px] mx-auto px-7 py-6">
        {preview && (
          <div
            className="rounded-[var(--radius-small)] px-4 py-3 mb-5 text-[12.5px] leading-[1.6]"
            style={{ background: 'var(--color-warning-tint)', color: 'var(--color-warning-text)' }}
          >
            Preview is on — guarded pages open with a stand-in vendor. There is no real session, so
            every API call fails and pages show their empty states. Sign out from the sidebar to
            come back here.
          </div>
        )}

        {filtered.length === 0 ? (
          <p className="text-[13px] text-[var(--color-muted)] text-center py-16">
            No screens match “{query}”.
          </p>
        ) : (
          filtered.map((group) => {
            const expanded = open.includes(group.name);
            return (
              <section key={group.name} className="mb-4">
                <button
                  type="button"
                  onClick={() =>
                    setOpen((current) =>
                      current.includes(group.name)
                        ? current.filter((n) => n !== group.name)
                        : [...current, group.name]
                    )
                  }
                  aria-expanded={expanded}
                  className="w-full bg-white rounded-t-[var(--radius-portal)] px-5 py-3.5 flex items-center justify-between gap-3 cursor-pointer"
                  style={{
                    border: '1px solid var(--color-line)',
                    borderBottomLeftRadius: expanded ? 0 : 'var(--radius-portal)',
                    borderBottomRightRadius: expanded ? 0 : 'var(--radius-portal)',
                  }}
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <span className="text-[14.5px] font-bold">{group.name}</span>
                    {group.guarded && (
                      <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-[var(--color-disabled)]">
                        <Lock size={11} /> needs preview
                      </span>
                    )}
                  </span>
                  <span className="flex items-center gap-3 shrink-0">
                    <span className="text-[11.5px] text-[var(--color-muted)]">
                      {group.screens.length}
                    </span>
                    <ChevronDown
                      size={16}
                      className="transition-transform"
                      style={{ transform: expanded ? 'rotate(180deg)' : 'none' }}
                    />
                  </span>
                </button>

                {expanded && (
                  <div
                    className="bg-white rounded-b-[var(--radius-portal)]"
                    style={{
                      border: '1px solid var(--color-line)',
                      borderTop: 'none',
                    }}
                  >
                    {group.screens.map((screen) => (
                      <Link
                        key={screen.path}
                        href={hrefFor(screen)}
                        className="px-5 py-3.5 flex items-center gap-4"
                        style={{ borderTop: '1px solid var(--color-divider)' }}
                      >
                        <span className="flex-1 min-w-0">
                          <span className="block text-[13.5px] font-bold">{screen.name}</span>
                          <span className="block text-[12px] text-[var(--color-muted)] mt-0.5">
                            {screen.desc}
                          </span>
                          <span className="block text-[11px] text-[var(--color-disabled)] mt-1 font-mono">
                            {hrefFor(screen)}
                          </span>
                        </span>
                        <span
                          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                          style={{ background: 'var(--color-primary)' }}
                        >
                          <ArrowRight size={15} color="#fff" />
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            );
          })
        )}

        <div
          className="rounded-[var(--radius-portal)] p-5 mt-6"
          style={{ background: 'var(--color-primary-tint)', border: '1px solid var(--color-primary-tint-border)' }}
        >
          <div className="text-[13.5px] font-bold text-[var(--color-primary-dark)] mb-2">
            Testing notes
          </div>
          <ul className="text-[12.5px] text-[var(--color-ink-body)] leading-[1.8] list-disc pl-5">
            <li>Dynamic routes use the sample id above — set it to a real booking or job id.</li>
            <li>
              Seed accounts from the app&apos;s own tester (password <code>Test@123</code>):{' '}
              {TEST_ACCOUNTS.join(', ')}.
            </li>
            <li>
              Pages need the backend on <code>{process.env.NEXT_PUBLIC_API_URL}</code>; without it
              they render their empty and error states, which is still worth checking.
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}
