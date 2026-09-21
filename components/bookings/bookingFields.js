import { formatRelativeDay, formatMoney } from '@/lib/format';

/**
 * One place that knows the shape of a booking row from
 * GET /service_api/vendor/:id/bookings.
 *
 * The endpoint returns a bare array of Booking rows including `user`
 * (with `userProfile`), `service`, `conversation` and `payment` — see
 * controllers/vendor/bookingController.js getVendorBookings. It does NOT include
 * the vehicle, the health sheet or any early-start record, so none of those are
 * read here: a field that can never resolve just renders blank.
 *
 * `status` and `vendor_status` are separate columns: vendor_status is the
 * accept/reject decision, status is where the job actually is.
 */
export const readBooking = (booking = {}) => {
  const profile = booking.user?.userProfile;

  return {
    id: booking.id,
    token: `KPX-${booking.id ?? ''}`,
    serviceName: booking.service?.name ?? 'Service',
    category: booking.service?.category ?? 'General',
    price: booking.service?.price ?? 0,
    durationMinutes: booking.service?.duration ?? null,
    customerName: profile?.name || 'Customer',
    customerPhone: profile?.phone || null,
    customerEmail: booking.user?.email ?? null,
    userId: booking.userId ?? booking.user?.id ?? null,
    time: booking.booking_time ?? null,
    date: booking.booking_date ?? null,
    status: String(booking.status ?? '').toLowerCase(),
    vendorStatus: String(booking.vendor_status ?? '').toLowerCase(),
    conversationId: booking.conversation?.id ?? null,
    paymentStatus: booking.payment?.status ?? null,
    createdAt: booking.createdAt ?? null,
    raw: booking,
  };
};

/** GET /service_api/vendor/walk-in-jobs — `{ data: [...] }`, detail wraps in `{ job }`. */
export const readWalkIn = (job = {}) => ({
  id: job.id,
  customerName: job.customer_name ?? 'Customer',
  customerPhone: job.customer_phone ?? null,
  registration: job.vehicle?.registration ?? null,
  vehicleModel: job.vehicle?.model ?? null,
  vehicleLabel: [job.vehicle?.make, job.vehicle?.model].filter(Boolean).join(' ') || null,
  description: job.description ?? null,
  status: String(job.status ?? '').toLowerCase(),
  services: Array.isArray(job.services) ? job.services : [],
  amountCollected: job.amount_collected ?? null,
  paymentMode: job.payment_mode ?? null,
  notificationStatus: job.notification_status ?? null,
  hasHealthSheet: Boolean(job.healthSheet?.id),
  startedAt: job.started_at ?? null,
  completedAt: job.completed_at ?? null,
  createdAt: job.createdAt ?? null,
  raw: job,
});

/**
 * Tab → backend status filter, taken from keplix-frontend Bookings.jsx (L57-63).
 * These strings are passed straight through as the `status` query param, so a
 * booking lands in exactly the same tab on web as it does in the app.
 */
export const BOOKING_TABS = [
  { id: 'ongoing', label: 'Ongoing', apiStatus: 'in_progress,service_completed,disputed' },
  { id: 'upcoming', label: 'Upcoming', apiStatus: 'pending,scheduled,confirmed' },
  { id: 'completed', label: 'Completed', apiStatus: 'completed,user_confirmed' },
  { id: 'canceled', label: 'Canceled', apiStatus: 'cancelled,canceled' },
];

/**
 * Query params that make the backend return a booking regardless of its date.
 *
 * With no `status`, getVendorBookings only returns rows dated today or later —
 * the "forward-looking" default — so a completed, cancelled or long-running
 * in-progress booking silently vanishes. Asking for any status outside
 * pending/confirmed/scheduled switches that date floor off.
 */
export const ALL_BOOKING_STATUSES =
  'pending,confirmed,scheduled,in_progress,service_completed,completed,user_confirmed,cancelled,disputed';

export const ANY_BOOKING = { status: ALL_BOOKING_STATUSES, limit: 500 };

/** Same set the app's dashboard requests (HomePage.jsx L274). */
export const DASHBOARD_BOOKINGS = {
  status: 'pending,scheduled,confirmed,in_progress,service_completed,completed,user_confirmed',
  limit: 200,
};

// booking_date is written as UTC midnight of the calendar day the customer
// picked (controllers/user/bookingController.js), so the ISO date part IS the
// day. Comparing through the browser's timezone would shift it a day in some
// zones.
export const dateKey = (value) => (value ? String(value).slice(0, 10) : null);

export const todayKey = () => new Date().toLocaleDateString('en-CA');

/** Minutes since midnight from "14:30" (canonical) or "2:30 PM" (older free text). */
export const timeToMinutes = (value) => {
  if (typeof value !== 'string') return null;
  const match = value.trim().match(/^(\d{1,2})\s*[:.]\s*(\d{1,2})\s*([ap]\.?m\.?)?$/i);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3]?.toLowerCase();
  if (meridiem) {
    if (hours < 1 || hours > 12) return null;
    hours = (hours % 12) + (meridiem.startsWith('p') ? 12 : 0);
  }
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
};

/** "14:30" → "2:30 PM". Unparseable text is shown as it came. */
export const formatSlotTime = (value) => {
  const total = timeToMinutes(value);
  if (total === null) return value || '—';
  const hours = Math.floor(total / 60);
  return `${hours % 12 === 0 ? 12 : hours % 12}:${String(total % 60).padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;
};

export const slotLabel = (booking) => {
  const { time, date } = booking;
  return { time: formatSlotTime(time), date: date ? formatRelativeDay(date) : '' };
};

export const priceLabel = (booking) => formatMoney(booking.price);

/** Label and badge tone for a booking, from the two status columns together. */
export const bookingBadge = (booking) => {
  if (booking.vendorStatus === 'pending') return { label: 'Pending', tone: 'warning' };
  if (booking.vendorStatus === 'rejected') return { label: 'Declined', tone: 'danger' };
  if (['cancelled', 'canceled'].includes(booking.status)) return { label: 'Cancelled', tone: 'danger' };
  if (booking.status === 'in_progress') return { label: 'In bay', tone: 'primary' };
  if (['completed', 'user_confirmed', 'service_completed'].includes(booking.status)) {
    return { label: 'Done', tone: 'success' };
  }
  return { label: 'Scheduled', tone: 'neutral' };
};
