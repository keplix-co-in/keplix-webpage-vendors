import { formatRelativeDay, formatMoney } from '@/lib/format';

/**
 * One place that knows the shape of a booking row from
 * GET /service_api/vendor/:id/bookings.
 *
 * The field names mirror the mapping in keplix-frontend Bookings.jsx (~L180):
 * service/user/vehicle arrive as nested relations, while status and
 * vendor_status are separate columns that mean different things — vendor_status
 * is the accept/reject decision, status is where the job actually is.
 */
export const readBooking = (booking = {}) => ({
  id: booking.id,
  token: booking.token ?? `KPX-${booking.id ?? ''}`,
  serviceName: booking.service?.name ?? 'Service',
  category: booking.service?.category ?? 'General',
  price: booking.service?.price ?? booking.total_amount ?? booking.amount ?? 0,
  durationMinutes: booking.service?.duration ?? null,
  customerName: booking.user?.userProfile?.name ?? booking.user?.name ?? 'Customer',
  customerPhone: booking.user?.userProfile?.phone ?? booking.user?.phone ?? null,
  userId: booking.user?.id ?? booking.userId ?? null,
  registration: booking.vehicle?.registration ?? null,
  vehicleModel: booking.vehicle?.model ?? null,
  vehicleMake: booking.vehicle?.make ?? null,
  odometer: booking.vehicle?.odometer_km ?? booking.odometer_km ?? null,
  time: booking.booking_time ?? null,
  date: booking.booking_date ?? null,
  status: String(booking.status ?? '').toLowerCase(),
  vendorStatus: String(booking.vendor_status ?? booking.vendorStatus ?? '').toLowerCase(),
  earlyStartRequested: Boolean(booking.early_start_requested_at ?? booking.early_start_requested),
  conversationId: booking.conversation?.id ?? null,
  hasHealthSheet: Boolean(booking.healthSheet?.id),
  createdAt: booking.createdAt ?? null,
  raw: booking,
});

export const readWalkIn = (job = {}) => ({
  id: job.id,
  customerName: job.customer_name ?? 'Customer',
  customerPhone: job.customer_phone ?? null,
  registration: job.vehicle?.registration ?? null,
  vehicleModel: job.vehicle?.model ?? null,
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

export const slotLabel = (booking) => {
  const { time, date } = booking;
  return { time: time || '—', date: date ? formatRelativeDay(date) : '' };
};

export const priceLabel = (booking) => formatMoney(booking.price);
