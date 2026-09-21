'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import PortalNav from '@/components/shell/PortalNav';
import PortalHeader from '@/components/shell/PortalHeader';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { vendorAPI } from '@/api/vendor';
import { bookingsAPI } from '@/api/bookings';
import { notificationsAPI } from '@/api/customers';
import { useVendorSocket } from '@/lib/useVendorSocket';
import { DASHBOARD_BOOKINGS } from '@/components/bookings/bookingFields';
import { unwrap } from '@/lib/queries';
import { rememberNext } from '@/lib/nextTarget';
import { toNotification } from '@/lib/entities';

const HeaderContext = createContext(() => {});

/** Pages declare their own header text; the shell renders it once, sticky. */
export const usePortalHeader = (title, subtitle) => {
  const setHeader = useContext(HeaderContext);
  useEffect(() => {
    setHeader({ title, subtitle });
  }, [setHeader, title, subtitle]);
};

export default function PortalLayout({ children }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { user, loading, vendorId, setVendorProfile, isPreview, signOut, sessionEnded } = useAuth();
  const [header, setHeader] = useState({ title: '', subtitle: '' });
  const [onlineBusy, setOnlineBusy] = useState(false);

  useEffect(() => {
    if (loading || user) return;
    // Remember what they asked for, so signing in returns them there instead of
    // to the dashboard. A vendor following a link from an email lands on the
    // page it pointed at, not on a generic start.
    rememberNext(window.location.pathname + window.location.search);
    router.replace(sessionEnded ? '/sign-in?expired=1' : '/sign-in');
  }, [loading, user, sessionEnded, router]);

  const { data: profile } = useQuery({
    queryKey: ['vendor-profile'],
    enabled: Boolean(user),
    queryFn: async () => {
      const result = await vendorAPI.getVendorProfile();
      if (!result?.success) return null;
      return result.data?.vendor ?? result.data?.profile ?? result.data ?? null;
    },
  });

  useEffect(() => {
    if (profile) setVendorProfile(profile);
  }, [profile, setVendorProfile]);

  const { data: bookings } = useQuery({
    queryKey: ['bookings', vendorId, DASHBOARD_BOOKINGS],
    enabled: Boolean(vendorId),
    queryFn: async () => {
      return unwrap(await bookingsAPI.getVendorBookings(vendorId, DASHBOARD_BOOKINGS), 'bookings');
    },
  });

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    enabled: Boolean(user),
    queryFn: async () => {
      return unwrap(await notificationsAPI.getNotifications(), 'notifications').map(toNotification);
    },
  });

  useVendorSocket({ vendorId, queryClient, toast });

  const badges = useMemo(() => {
    const list = Array.isArray(bookings) ? bookings : [];
    const notifs = Array.isArray(notifications) ? notifications : [];
    return {
      pendingBookings: list.filter(
        (b) => b?.vendor_status === 'pending'
      ).length,
      unreadNotifications: notifs.filter((n) => !n.read).length,
    };
  }, [bookings, notifications]);

  const online = Boolean(profile?.is_online);

  const toggleOnline = async (next) => {
    setOnlineBusy(true);
    const result = await vendorAPI.updateOnlineStatus(next);
    setOnlineBusy(false);

    if (result?.success) {
      queryClient.invalidateQueries({ queryKey: ['vendor-profile'] });
      toast.success(next ? 'You are accepting jobs' : 'You are offline — no new requests');
    } else {
      toast.error(result?.error || 'Could not update your status');
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen grid place-items-center text-[13px] text-[var(--color-muted)]">
        Loading your workshop…
      </div>
    );
  }

  return (
    <HeaderContext.Provider value={setHeader}>
      <div className="kx-shell">
        <PortalNav badges={badges} />

        <div className="flex flex-col min-w-0">
          {isPreview && (
            <div
              className="px-7 py-2 flex items-center justify-between gap-4 flex-wrap text-[12px] font-bold"
              style={{ background: 'var(--color-warning-tint-strong)', color: 'var(--color-warning-text)' }}
            >
              <span>
                Dev preview — not a real session. Data is empty because every API call is
                unauthenticated.
              </span>
              <button
                type="button"
                onClick={signOut}
                className="underline cursor-pointer whitespace-nowrap"
              >
                Exit preview
              </button>
            </div>
          )}

          <PortalHeader
            title={header.title}
            subtitle={header.subtitle}
            businessName={profile?.business_name ?? user?.business_name}
            online={online}
            onToggleOnline={toggleOnline}
            onlineBusy={onlineBusy}
            hasUnread={badges.unreadNotifications > 0}
          />
          <main className="px-7 pt-[26px] pb-[60px] min-w-0">{children}</main>
        </div>
      </div>
    </HeaderContext.Provider>
  );
}
