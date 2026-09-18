/**
 * Rating display helpers.
 *
 * A vendor with no reviews yet has no rating — not a rating of zero, and
 * certainly not an invented 4.0. Showing "0.0" reads as "rated badly", so
 * every surface renders the same "New" label instead.
 *
 * Mirrors the pattern already used in Vendor/Profile/Profile.jsx.
 *
 * NOTE: the customer app has its own copy of this file (separate codebase).
 * Keep the two in sync by hand.
 */

/** Label shown when a vendor/service has no rating yet. */
export const NO_RATING_LABEL = 'New';

/** True only for a real, positive numeric rating. */
export const hasRating = (value) => {
  const n = parseFloat(value);
  return Number.isFinite(n) && n > 0;
};

/** "4.3" for a real rating, "New" for none. Always safe to render. */
export const formatRating = (value) =>
  (hasRating(value) ? parseFloat(value).toFixed(1) : NO_RATING_LABEL);

export default formatRating;
