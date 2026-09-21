/**
 * Maps backend rows onto the flat shapes the cards render.
 *
 * Every field name here was checked against the live API or the controller that
 * builds the response — the earlier pages guessed (`customer_name`,
 * `created_at`, `body`) and most guesses never matched, so cards rendered their
 * placeholders while the data sat unused in the response.
 */

const num = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

/** Prisma exposes the customer's name under user.userProfile, not on the user. */
export const customerNameOf = (booking) => booking?.user?.userProfile?.name || null;

/**
 * Booking → earnings row.
 *
 * The mobile Earnings screen builds this list from bookings rather than from
 * /payments, and so does this: GET /service_api/vendor/:id/payments returns the
 * vendor's own payments TO Keplix (method razorpay/stripe, payout status
 * `not_applicable`), which are not job earnings at all.
 *
 * Fee and net are only what the payment row reports. Mobile falls back to a 15%
 * estimate when neither is present; a receipt should not show a number the
 * backend never produced, so they stay null and the card shows "—".
 */
export const isEarningBooking = (booking) => {
  const status = String(booking?.status ?? '').toLowerCase();
  const vendorStatus = String(booking?.vendor_status ?? '').toLowerCase();
  return !['cancelled', 'canceled', 'rejected'].includes(status) && vendorStatus !== 'rejected';
};

export const toEarningRow = (booking) => {
  const payment = booking?.payment ?? null;
  const amount = num(payment?.amount) ?? num(booking?.service?.price) ?? 0;

  let fee = num(payment?.platformFee);
  const net = num(payment?.vendorAmount) ?? (fee != null ? amount - fee : null);
  if (fee == null && net != null) fee = amount - net;

  const payout = String(payment?.vendorPayoutStatus ?? '').toLowerCase();

  return {
    id: booking.id,
    token: `KPX-${booking.id}`,
    customer: customerNameOf(booking),
    service: booking?.service?.name ?? null,
    at: booking?.updatedAt ?? booking?.booking_date ?? null,
    amount,
    fee,
    net,
    paid: payout === 'paid' || payout === 'settled',
    method: payment?.method ?? null,
    paidAt: payment?.createdAt ?? null,
    transactionId: payment?.transactionId ?? null,
  };
};

/** Conversation list row: the customer is reached through booking.user. */
export const toConversation = (conversation) => ({
  id: conversation.id,
  customer: customerNameOf(conversation.booking),
  service: conversation.booking?.service?.name ?? null,
  lastMessage: conversation.messages?.[0]?.message_text ?? null,
  bookingId: conversation.bookingId ?? conversation.booking?.id ?? null,
  // The backend creates a conversation for every booking, so the list holds
  // plenty that nobody has written in. It returns only the latest message per
  // conversation, which is enough to tell an empty one from one with traffic.
  hasMessages: (conversation.messages?.length ?? 0) > 0,
});

/** Chat message: the backend names the fields message_text / sent_at / senderId. */
export const toMessage = (message) => ({
  id: message.id,
  text: message.message_text,
  at: message.sent_at,
  senderId: message.senderId,
});

/** Notification: the body is `message`, read state is `is_read`. */
export const toNotification = (notification) => ({
  id: notification.id,
  title: notification.title,
  body: notification.message,
  read: Boolean(notification.is_read),
  type: notification.type ?? null,
  at: notification.createdAt,
});
