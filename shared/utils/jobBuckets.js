import isJobOverdue from './overdue';

/**
 * How the dashboard sorts work into Pending / Ongoing / In queue.
 *
 * Ported from keplix-frontend HomePage.jsx (~L160-264) rather than re-derived,
 * because each rule here exists to fix a specific reported bug. Keep the two in
 * step: if one changes, the same job would be counted differently on web and on
 * the phone.
 */

// 'confirmed' means ACCEPTED, not STARTED. Counting it as ongoing is what made a
// 3pm job show as in-progress all morning. The backend sets in_progress exactly
// when the slot arrives, so that status alone is the answer. ('ongoing' is not a
// value anything writes; kept so any legacy row carrying it still displays.)
const isOngoingStatus = (booking) =>
  booking?.vendor_status === 'accepted' && ['ongoing', 'in_progress'].includes(booking?.status);

export const bucketJobs = (bookings = [], walkIns = [], now = Date.now()) => {
  const list = Array.isArray(bookings) ? bookings : [];
  const walkInList = Array.isArray(walkIns) ? walkIns : [];

  // Never filtered by age: dropping older requests is what made vendors report
  // that accept/reject "doesn't work" — the request vanished from the screen
  // while the backend would still have accepted it.
  const awaitingDecision = list.filter((b) => b.vendor_status === 'pending');

  // A job whose duration has elapsed but was never closed leaves Ongoing and is
  // counted as Pending, so it reads as work needing attention rather than work
  // in progress. isJobOverdue returns false when duration or start time is
  // unknown, so anything unjudgeable stays in Ongoing.
  const ongoing = list.filter((b) => isOngoingStatus(b) && !isJobOverdue(b, now));
  const overdue = list.filter((b) => isOngoingStatus(b) && isJobOverdue(b, now));

  // Accepted but not started. 'pending' belongs here for a non-obvious reason:
  // when a customer's payment fails the webhook resets booking.status to
  // 'pending' without touching vendor_status, leaving
  // {vendor_status:'accepted', status:'pending'} — accepted work awaiting its
  // slot, which used to match no bucket at all and vanish from the dashboard.
  const queue = list.filter(
    (b) =>
      b.vendor_status === 'accepted' && ['confirmed', 'scheduled', 'pending'].includes(b.status)
  );

  // Walk-ins join the same buckets, except Pending: a walk-in has no accept
  // step, so `open` is queue work, not an awaiting-decision request.
  const walkInQueue = walkInList.filter((w) => w.status === 'open');
  const walkInOngoing = walkInList.filter(
    (w) => w.status === 'in_progress' && !isJobOverdue(w, now)
  );
  const walkInOverdue = walkInList.filter((w) => w.status === 'in_progress' && isJobOverdue(w, now));

  return {
    awaitingDecision,
    ongoing: [...ongoing, ...walkInOngoing],
    queue: [...queue, ...walkInQueue],
    overdue: [...overdue, ...walkInOverdue],
    // "Deal with me": requests awaiting a decision plus work that has run past
    // its duration. The order panel deliberately uses awaitingDecision instead,
    // since that is all it can act on.
    pendingCount: awaitingDecision.length + overdue.length + walkInOverdue.length,
  };
};

export default bucketJobs;
