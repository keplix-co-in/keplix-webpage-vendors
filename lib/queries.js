'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { bookingsAPI, walkInsAPI } from '@/api/bookings';
import { paymentsAPI } from '@/api/money';
import { servicesAPI } from '@/api/services';

/**
 * The API layer resolves errors instead of throwing, so each hook unwraps the
 * envelope and falls back to an empty list. The backend has returned payloads
 * under several shapes over time (bare array, {results}, {bookings}), which the
 * mobile screens each handle inline — this is the one place that does it here.
 */
const unwrap = (result, ...keys) => {
  if (!result?.success) return [];
  const data = result.data;
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  if (Array.isArray(data?.results)) return data.results;
  return Array.isArray(data) ? data : [];
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

export function usePayments() {
  const { vendorId } = useAuth();
  return useQuery({
    queryKey: ['payments', vendorId],
    enabled: Boolean(vendorId),
    queryFn: async () => unwrap(await paymentsAPI.getVendorPayments(vendorId), 'payments', 'transactions'),
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
