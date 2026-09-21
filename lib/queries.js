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

export function useBookings(params) {
  const { vendorId } = useAuth();
  return useQuery({
    queryKey: ['bookings', vendorId, params ?? null],
    enabled: Boolean(vendorId),
    queryFn: async () => unwrap(await bookingsAPI.getVendorBookings(vendorId, params), 'bookings'),
  });
}

export function useWalkIns(params) {
  const { vendorId } = useAuth();
  return useQuery({
    queryKey: ['walk-ins', params ?? null],
    enabled: Boolean(vendorId),
    queryFn: async () => unwrap(await walkInsAPI.getWalkInJobs(params), 'walk_in_jobs', 'jobs'),
  });
}

export function useEarnings() {
  const { vendorId } = useAuth();
  return useQuery({
    queryKey: ['earnings', vendorId],
    enabled: Boolean(vendorId),
    queryFn: async () => {
      const result = await paymentsAPI.getEarnings(vendorId);
      return result?.success ? result.data : null;
    },
  });
}

export function useServices() {
  const { vendorId } = useAuth();
  return useQuery({
    queryKey: ['services', vendorId],
    enabled: Boolean(vendorId),
    queryFn: async () => unwrap(await servicesAPI.getVendorServices(vendorId), 'services'),
  });
}

export { unwrap };
