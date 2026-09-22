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
        // NOT DATA. The backend's earning controller returns a hard-coded 0 for
        // this field — it has never been computed from anything. Kept in the
        // normalised shape so web and mobile stay identical, but no web screen
        // renders it: a "0% growth" chip is a claim about the business, and the
        // server has no basis for it. If growth is ever really calculated,
        // that is the moment to surface it.
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
};

/**
 * Booking payments are a CUSTOMER concern and are deliberately absent here.
 *
 * The mobile client carries getPaymentByBooking/createPaymentOrder/verifyPayment
 * pointed at `/service_api/bookings/:id/payment*`, but those paths are not
 * mounted — user booking routes live under `/service_api/user`, so every one of
 * them 404s. Nothing in this portal called them, so they are not ported rather
 * than shipped broken. A vendor never charges a booking; the customer pays in
 * the customer app and the vendor only ever reads the result.
 *
 * If a vendor→Keplix payment screen (subscription/ads, as in the app's
 * Payment4.jsx) is ever built, the working endpoints are:
 *   POST /service_api/vendor/payments/order/create  { amount, currency?, gateway? }
 *   POST /service_api/vendor/payments/verify        { orderId, paymentId, signature, gateway }
 * Note the verify body is camelCase, not the razorpay_* snake_case the customer
 * flow uses.
 */

export default paymentsAPI;
