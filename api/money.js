import api from '@/lib/api';

export const paymentsAPI = {
  // The backend has used both singular and plural field names over time, so the
  // mobile client normalises them and every screen reads one shape. Kept
  // identical here so web and mobile cannot drift.
  getEarnings: async (vendorId) => {
    if (!vendorId) return { success: false, error: 'Vendor ID missing' };

    const response = await api.get(`/service_api/vendor/${vendorId}/earning`);
    if (!response?.success) return response;

    const payload = response.data || {};
    return {
      ...response,
      data: {
        ...payload,
        today_earnings: payload.today_earnings || payload.today_earning || 0,
        total_earnings: payload.total_earnings || payload.total_earning || 0,
        growth_percentage: payload.growth_percentage || 0,
        today_earning: payload.today_earning || payload.today_earnings || 0,
        total_earning: payload.total_earning || payload.total_earnings || 0,
        week_earnings: payload.week_earnings || payload.week_earning || 0,
        month_earnings: payload.month_earnings || payload.month_earning || 0,
        pending_earnings: payload.pending_earnings || payload.pending_earning || 0,
      },
    };
  },

  getVendorPayments: (vendorId) => api.get(`/service_api/vendor/${vendorId}/payments`),
  getPaymentByBooking: (bookingId) => api.get(`/service_api/bookings/${bookingId}/payment`),
  createPaymentOrder: (bookingId, paymentData) =>
    api.post(`/service_api/bookings/${bookingId}/payment/create`, paymentData),
  verifyPayment: (paymentData) => api.post('/service_api/payments/verify', paymentData),
};

export default paymentsAPI;
