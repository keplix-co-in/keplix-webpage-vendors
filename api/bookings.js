import api, { uploadWithFetch } from '@/lib/api';
import { stopAlertBeep } from '@/lib/alertSound';

export const bookingsAPI = {
  getVendorBookings: (vendorId, params = {}) => {
    if (!vendorId) return Promise.resolve({ success: false, error: 'Vendor ID missing' });
    return api.get(`/service_api/vendor/${vendorId}/bookings`, { params });
  },

  updateVendorBooking: (vendorId, bookingId, bookingData) =>
    api.patch(`/service_api/vendor/${vendorId}/bookings/update/${bookingId}`, bookingData),

  updateBookingStatus: (vendorId, bookingId, status) =>
    api.patch(`/service_api/vendor/${vendorId}/bookings/update/${bookingId}`, { status }),

  // accept / reject
  // Any accept/reject silences a ringing new-request beep, from every screen
  // that calls this (list, detail, reject form) — see lib/alertSound.js.
  respondToServiceRequest: (vendorId, bookingId, vendor_status, extra = {}) => {
    stopAlertBeep();
    return api.patch(`/service_api/vendor/${vendorId}/bookings/${bookingId}/respond`, {
      vendor_status,
      ...extra,
    });
  },

  // A request, not a state change: the customer has to approve before the job
  // can actually start early.
  requestEarlyStart: (vendorId, bookingId) => {
    if (!vendorId) return Promise.resolve({ success: false, error: 'Vendor ID missing' });
    return api.post(`/service_api/vendor/${vendorId}/bookings/${bookingId}/early-start`);
  },

  // Multipart: photos + notes. Carries the backend's `code` so a
  // HEALTH_SHEET_REQUIRED rejection stays distinguishable from a real failure.
  completeBooking: (vendorId, bookingId, formData) =>
    uploadWithFetch(
      'PATCH',
      `/service_api/vendor/${vendorId}/bookings/update/${bookingId}`,
      formData
    ),
};

export const walkInsAPI = {
  // No vendorId in the URL: the backend scopes walk-ins to the caller's JWT.
  createWalkInJob: (payload) => api.post('/service_api/vendor/walk-in-jobs', payload),
  getWalkInJobs: (params = {}) => api.get('/service_api/vendor/walk-in-jobs', { params }),
  getWalkInJob: (id) => api.get(`/service_api/vendor/walk-in-jobs/${id}`),

  // Closing sends { status:'completed', amount_collected, payment_mode } in one
  // request. The health-sheet gate runs before any write, so a 409 persists
  // nothing and the identical payload can be resent once the sheet is saved.
  updateWalkInJobStatus: (id, payload) =>
    api.patch(
      `/service_api/vendor/walk-in-jobs/${id}/status`,
      typeof payload === 'string' ? { status: payload } : payload
    ),

  updateWalkInJob: (id, payload) => api.patch(`/service_api/vendor/walk-in-jobs/${id}`, payload),
  resendWalkInJobNotification: (id) => api.post(`/service_api/vendor/walk-in-jobs/${id}/notify`),
};

export const inspectionAPI = {
  getHealthComponents: () => api.get('/service_api/vendor/health-components'),
  submitHealthSheet: (formData) =>
    uploadWithFetch('POST', '/service_api/vendor/health-sheets', formData),
  getHealthSheet: (id) => api.get(`/service_api/vendor/health-sheets/${id}`),
  getBookingHealthSheet: (bookingId) =>
    api.get(`/service_api/vendor/bookings/${bookingId}/health-sheet`),
  getWalkInHealthSheet: (walkInId) =>
    api.get(`/service_api/vendor/walk-in-jobs/${walkInId}/health-sheet`),
};

export default bookingsAPI;
