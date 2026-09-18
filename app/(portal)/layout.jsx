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
  const { user, loading, vendorId, setVendorProfile } = useAuth();
  const [header, setHeader] = useState({ title: '', subtitle: '' });
  const [onlineBusy, setOnlineBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace('/sign-in');
  }, [loading, user, router]);

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
    queryKey: ['bookings', vendorId],
    enabled: Boolean(vendorId),
    queryFn: async () => {
      const result = await bookingsAPI.getVendorBookings(vendorId);
      if (!result?.success) return [];
      return result.data?.bookings ?? result.data?.results ?? result.data ?? [];
    },
  });

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    enabled: Boolean(user),
    queryFn: async () => {
      const result = await notificationsAPI.getNotifications();
      if (!result?.success) return [];
      return result.data?.notifications ?? result.data?.results ?? result.data ?? [];
    },
  });

  useVendorSocket({ vendorId, queryClient, toast });

  const badges = useMemo(() => {
    const list = Array.isArray(bookings) ? bookings : [];
    const notifs = Array.isArray(notifications) ? notifications : [];
    return {
      pendingBookings: list.filter(
        (b) => String(b?.vendor_status ?? b?.status ?? '').toLowerCase() === 'pending'
      ).length,
      unreadNotifications: notifs.filter((n) => !(n?.is_read ?? n?.read)).length,
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
