'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { bookingsAPI, walkInsAPI } from '@/api/bookings';
import { paymentsAPI } from '@/api/money';
import { servicesAPI } from '@/api/services';

/**
 * The API layer resolves errors instead of throwing, so each hook unwraps the
 * envelope and falls back to an empty list.
 *
 * The backend is not consistent about where a list lives, and each shape has
 * bitten a screen: a bare array (services, documents, bookings), a named key
 * (`{ notifications }`), and `{ data, pagination }` (reviews, conversations).
 * `data` used to be missing here, so reviews and chat flattened to [] even when
 * the server had rows — the cards simply rendered empty.
 */
const unwrap = (result, ...keys) => {
  if (!result?.success) return [];
  const data = result.data;
  if (Array.isArray(data)) return data;
  for (const key of [...keys, 'data', 'results']) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  return [];
};

/**
 * Turns a resolved-but-failed envelope into a thrown error.
 *
 * WHY: the API layer resolves errors instead of throwing, so `unwrap` returned
 * [] for "the request failed" and for "there is genuinely nothing" alike. React
 * Query therefore never populated `error`, screens could not tell the two
 * apart, and an outage rendered as a cheerful empty state (and ₹0 tiles).
 * Throwing here is what makes `isError`/`refetch` mean anything upstream.
 *
 * Callers that keep a `= []` default are unaffected: on error `data` is
 * undefined, so they still fall back to the empty list they showed before.
 */
const unwrapOrThrow = (result, ...keys) => {
  if (!result?.success) {
    // Message is for logs/devtools only — screens show their own copy so no
    // server text reaches the vendor.
    throw new Error(result?.error || 'Request failed');
  }
  return unwrap(result, ...keys);
};

export function useBookings(params) {
  const { vendorId } = useAuth();
  return useQuery({
    queryKey: ['bookings', vendorId, params ?? null],
    enabled: Boolean(vendorId),
    queryFn: async () =>
      unwrapOrThrow(await bookingsAPI.getVendorBookings(vendorId, params), 'bookings'),
  });
}

export function useWalkIns(params) {
  const { vendorId } = useAuth();
  return useQuery({
    queryKey: ['walk-ins', params ?? null],
    enabled: Boolean(vendorId),
    queryFn: async () =>
      unwrapOrThrow(await walkInsAPI.getWalkInJobs(params), 'walk_in_jobs', 'jobs'),
  });
}

export function useEarnings() {
  const { vendorId } = useAuth();
  return useQuery({
    queryKey: ['earnings', vendorId],
    enabled: Boolean(vendorId),
    queryFn: async () => {
      const result = await paymentsAPI.getEarnings(vendorId);
      // WHY throw rather than return null: null was indistinguishable from "a
      // brand-new vendor has earned nothing", and the tiles happily rendered
      // ₹0 for a failed call. See unwrapOrThrow above.
      if (!result?.success) throw new Error(result?.error || 'Could not load earnings');
      return result.data;
    },
  });
}

export function useServices() {
  const { vendorId } = useAuth();
  return useQuery({
    queryKey: ['services', vendorId],
    enabled: Boolean(vendorId),
    queryFn: async () =>
      unwrapOrThrow(await servicesAPI.getVendorServices(vendorId), 'services'),
  });
}

export { unwrap, unwrapOrThrow };
