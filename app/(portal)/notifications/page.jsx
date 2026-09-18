'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, IndianRupee, Star, MessageSquare, X, Check } from 'lucide-react';
import { usePortalHeader } from '../layout';
import { Card, EmptyState } from '@/components/ui/Card';
import { notificationsAPI } from '@/api/customers';
import { unwrap } from '@/lib/queries';
import { formatDateTime } from '@/lib/format';

// The icon and tint are chosen from the notification type the backend sends.
const LOOK = {
  booking: { Icon: Bell, bg: 'var(--color-primary-tint)', fg: 'var(--color-primary)' },
  payment: { Icon: IndianRupee, bg: 'var(--color-success-tint)', fg: 'var(--color-success-dark)' },
  review: { Icon: Star, bg: 'var(--color-warning-tint)', fg: 'var(--color-warning-dark)' },
  message: { Icon: MessageSquare, bg: '#EFF6FF', fg: '#2563EB' },
  cancellation: { Icon: X, bg: 'var(--color-danger-tint)', fg: 'var(--color-danger)' },
  verification: { Icon: Check, bg: 'var(--color-success-tint)', fg: 'var(--color-success-dark)' },
};

const lookFor = (type = '') => {
  const value = String(type).toLowerCase();
  const key = Object.keys(LOOK).find((k) => value.includes(k));
  return LOOK[key] ?? LOOK.booking;
};

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  usePortalHeader('Notifications', 'Bookings, payments, cancellations and messages');

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => unwrap(await notificationsAPI.getNotifications(), 'notifications'),
  });

  const markRead = async (id) => {
    await notificationsAPI.markRead(id);
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  return (
    <Card padded={false} className="max-w-[820px]">
      {isLoading ? (
        <div className="px-[22px] py-8 text-[13px] text-[var(--color-muted)]">Loading…</div>
      ) : notifications.length === 0 ? (
        <EmptyState title="Nothing new" body="Booking, payment and review alerts land here." />
      ) : (
        notifications.map((notification) => {
          const { Icon, bg, fg } = lookFor(notification.type ?? notification.category);
          const unread = !(notification.is_read ?? notification.read);

          return (
            <button
              key={notification.id}
              type="button"
              onClick={() => unread && markRead(notification.id)}
              className="w-full text-left px-[22px] py-4 flex items-start gap-4"
              style={{
                borderBottom: '1px solid var(--color-divider)',
                background: unread ? '#F5F3FF' : 'white',
                cursor: unread ? 'pointer' : 'default',
              }}
            >
              <span
                className="w-9 h-9 rounded-[var(--radius-well)] flex items-center justify-center shrink-0"
                style={{ background: bg }}
              >
                <Icon size={16} color={fg} />
              </span>

              <span className="flex-1 min-w-0">
                <span className="block text-[13.5px] font-bold">
                  {notification.title ?? 'Notification'}
                </span>
                <span className="block text-[12.5px] text-[var(--color-muted)] leading-[1.6]">
                  {notification.body ?? notification.message}
                </span>
              </span>

              <span className="text-[11.5px] text-[var(--color-disabled)] shrink-0 whitespace-nowrap">
                {formatDateTime(notification.createdAt ?? notification.created_at)}
              </span>
            </button>
          );
        })
      )}
    </Card>
  );
}
