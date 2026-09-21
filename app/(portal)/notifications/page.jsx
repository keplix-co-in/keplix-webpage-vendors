'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, IndianRupee, Star, MessageSquare, X, Check } from 'lucide-react';
import { usePortalHeader } from '../layout';
import { Card, EmptyState } from '@/components/ui/Card';
import { notificationsAPI } from '@/api/customers';
import { unwrap } from '@/lib/queries';
import { toNotification } from '@/lib/entities';
import { formatDateTime } from '@/lib/format';

const LOOK = {
  booking: { Icon: Bell, bg: 'var(--color-primary-tint)', fg: 'var(--color-primary)' },
  payment: { Icon: IndianRupee, bg: 'var(--color-success-tint)', fg: 'var(--color-success-dark)' },
  review: { Icon: Star, bg: 'var(--color-warning-tint)', fg: 'var(--color-warning-dark)' },
  message: { Icon: MessageSquare, bg: '#EFF6FF', fg: '#2563EB' },
  problem: { Icon: X, bg: 'var(--color-danger-tint)', fg: 'var(--color-danger)' },
  done: { Icon: Check, bg: 'var(--color-success-tint)', fg: 'var(--color-success-dark)' },
};

// Ordered on purpose: BOOKING_CANCELLED_BY_CUSTOMER contains "booking", so the
// more specific matches must run first or every cancellation shows the plain
// booking bell. Types are the constants in keplix-backend's notification
// templates (BOOKING_*, PAYMENT_RECEIVED, PAYOUT_SETTLED, REFUND_*, NEW_MESSAGE,
// SERVICE_*, DISPUTE_*, EARLY_START_*).
const RULES = [
  [/cancel|declin|expire|missed|dispute|refund_failed/, 'problem'],
  [/payment|payout|refund/, 'payment'],
  [/message/, 'message'],
  [/review/, 'review'],
  [/completed|settled|resolved|confirmed|accepted/, 'done'],
];

// `type` is null on every row written before that column existed, so the title
// stands in for it.
const lookFor = (type, title = '') => {
  const value = String(type ?? title).toLowerCase();
  const match = RULES.find(([pattern]) => pattern.test(value));
  return LOOK[match ? match[1] : 'booking'];
};

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  usePortalHeader('Notifications', 'Bookings, payments, cancellations and messages');

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => unwrap(await notificationsAPI.getNotifications(), 'notifications').map(toNotification),
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
          const { Icon, bg, fg } = lookFor(notification.type, notification.title);
          const unread = !notification.read;

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
                  {notification.body}
                </span>
              </span>

              <span className="text-[11.5px] text-[var(--color-disabled)] shrink-0 whitespace-nowrap">
                {formatDateTime(notification.at)}
              </span>
            </button>
          );
        })
      )}
    </Card>
  );
}
