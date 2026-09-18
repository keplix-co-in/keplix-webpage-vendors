/**
 * Formats a service duration in MINUTES for display.
 *
 * Matches the vocabulary vendors already see when they set a duration in
 * VendorServices/EditService.jsx (`DURATIONS` = '30 min', '45 min', '1 Hour',
 * '1.5 Hours', …), so a service reads the same wherever it appears rather than
 * switching between "90 min" here and "1.5 Hours" there.
 *
 * `Service.duration` is a required Int on the backend, but a walk-in job can
 * carry custom services with no duration at all — those return null so callers
 * can omit the field instead of printing a misleading "0 min".
 */
export const formatDuration = (minutes) => {
  const mins = Number(minutes);
  if (!Number.isFinite(mins) || mins <= 0) return null;

  if (mins < 60) return `${mins} min`;

  const hours = mins / 60;
  // Whole hours read as "2 Hours"; halves as "1.5 Hours". Anything else keeps
  // its minutes rather than being rounded into a wrong number.
  if (Number.isInteger(hours)) return `${hours} ${hours === 1 ? 'Hour' : 'Hours'}`;
  if (Math.abs(hours * 2 - Math.round(hours * 2)) < 1e-9) return `${hours} Hours`;

  const wholeHours = Math.floor(hours);
  const remainder = mins - wholeHours * 60;
  return `${wholeHours}h ${remainder}m`;
};

/**
 * Total duration across selected services, in minutes.
 * Services without a duration contribute nothing rather than breaking the sum.
 */
export const totalDurationMinutes = (services = []) =>
  services.reduce((sum, s) => {
    const mins = Number(s?.duration);
    return sum + (Number.isFinite(mins) && mins > 0 ? mins : 0);
  }, 0);

export default formatDuration;
