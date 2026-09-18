/**
 * Whether an in-progress job has run past its expected duration.
 *
 * A service carries a `duration` in MINUTES (Service.duration, a required Int in
 * the backend schema, set by the vendor in VendorServices/EditService.jsx). Once
 * that long has passed since the job started and it still is not completed, the
 * homepage moves it out of Ongoing and counts it under Pending so the vendor
 * notices.
 *
 * START TIME — the two job types differ, and only one of them is exact:
 *
 *   walk-in jobs  `started_at` — a real column on WalkInJob, set when the job
 *                 is moved to in_progress. Accurate.
 *
 *   bookings      no such column exists. Booking has only booking_date,
 *                 booking_time, createdAt and updatedAt. `updatedAt` is used as
 *                 a PROXY: it changes when the vendor flips the status to
 *                 in_progress, so at that moment it equals the true start. It is
 *                 imprecise afterwards, because any later write to the row also
 *                 moves it — which pushes the deadline outward and makes this
 *                 check conservative. It will under-report overdue jobs, never
 *                 over-report them. Adding `started_at` to Booking is the
 *                 correct fix and would make this exact.
 *
 * Anything with no usable duration or no usable start time is treated as NOT
 * overdue. Guessing would move real jobs out of Ongoing on no evidence, which is
 * worse than leaving them where the vendor expects to find them.
 */

/** Minutes a job is allowed to run before it counts as overdue. */
export const getJobDurationMinutes = (job) => {
  const raw =
    job?.duration ??
    job?.service?.duration ??
    job?.services?.reduce?.((sum, s) => sum + (Number(s?.duration) || 0), 0);

  const minutes = Number(raw);
  return Number.isFinite(minutes) && minutes > 0 ? minutes : null;
};

/** Best available start timestamp in ms, or null when there isn't one. */
export const getJobStartedAt = (job) => {
  // Walk-in jobs carry a real started_at. Bookings do not — see the file header
  // for why updatedAt stands in.
  const candidate = job?.started_at ?? job?.startedAt ?? job?.updatedAt;
  if (!candidate) return null;

  const ms = new Date(candidate).getTime();
  return Number.isFinite(ms) ? ms : null;
};

/**
 * @param {object} job - a booking or walk-in job
 * @param {number} [now=Date.now()] - injectable for testing
 * @returns {boolean} true only when duration AND start time are both known and
 *   the elapsed time exceeds the duration.
 */
export const isJobOverdue = (job, now = Date.now()) => {
  const minutes = getJobDurationMinutes(job);
  if (minutes === null) return false;

  const startedAt = getJobStartedAt(job);
  if (startedAt === null) return false;

  return now - startedAt > minutes * 60 * 1000;
};

export default isJobOverdue;
