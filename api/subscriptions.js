import api from '@/lib/api';

// Contract: keplix-backend/docs/SUBSCRIPTIONS_API.md. Amounts from /plans and
// /payments are rupees; /order returns `amount` in paise (Razorpay's unit).
export const subscriptionsAPI = {
  getPlans: () => api.get('/subscriptions/plans'),
  getMine: () => api.get('/subscriptions/me'),
  createOrder: (plan_code, period) => api.post('/subscriptions/order', { plan_code, period }),
  verify: (payload) => api.post('/subscriptions/verify', payload),
  getPayments: () => api.get('/subscriptions/payments'),
};

export default subscriptionsAPI;
