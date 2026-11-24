// Pure helpers for the subscription screens (no React, no aliases) so they can
// be unit-tested with node:test.

export const TRIAL_WARN_DAYS = 7;

/**
 * Banner shown across the portal. Returns null when nothing needs saying.
 * `sub` is the /subscriptions/me shape. Status is derived by the server.
 */
export function bannerFor(sub) {
  if (!sub || !sub.status) return null;
  const days = Number.isFinite(Number(sub.days_left)) ? Number(sub.days_left) : null;
  if (sub.status === 'expired') {
    return {
      tone: 'danger',
      title: 'Your subscription has expired',
      body: 'Your garage is hidden from customers and cannot take new bookings. Renew to be listed again. Bookings you already have can still be finished.',
      cta: 'Renew now',
    };
  }
  if (sub.status === 'grace') {
    return {
      tone: 'warning',
      title: 'Your subscription has ended - grace period',
      body: 'You are still listed for now, but your garage will be hidden from customers when the grace period ends. Renew to keep getting bookings.',
      cta: 'Renew now',
    };
  }
  if (sub.status === 'trial' && days !== null && days <= TRIAL_WARN_DAYS) {
    return {
      tone: 'warning',
      title: days <= 0 ? 'Your free trial ends today' : `Your free trial ends in ${days} day${days === 1 ? '' : 's'}`,
      body: 'Choose a plan to stay listed and keep receiving bookings.',
      cta: 'Choose a plan',
    };
  }
  return null;
}

export const STATUS_LABEL = {
  trial: 'Free trial',
  active: 'Active',
  grace: 'Grace period',
  expired: 'Expired',
};

export const subStatusTone = (status) =>
  ({ trial: 'primary', active: 'success', grace: 'warning', expired: 'danger' })[status] ?? 'neutral';

export const PERIOD_LABEL = { trial: 'Trial', monthly: 'Monthly', yearly: 'Yearly' };

/** Price of a plan for a period, in rupees; null when it cannot be priced. */
export function planPrice(plan, period) {
  const raw = period === 'yearly' ? plan?.yearly_price : plan?.monthly_price;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/** Whole rupees saved by paying yearly instead of 12 months; 0 if none. */
export function yearlySaving(plan) {
  const m = Number(plan?.monthly_price);
  const y = Number(plan?.yearly_price);
  if (!Number.isFinite(m) || !Number.isFinite(y)) return 0;
  return Math.max(0, Math.round(m * 12 - y));
}

/** Plans sorted by sort_order, tolerant of a non-array payload. */
export const sortPlans = (plans) =>
  (Array.isArray(plans) ? [...plans] : []).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

/** Razorpay Checkout options for an /order response. Key and amount come from the server. */
export function checkoutOptions(order, { name, email, phone, onSuccess, onDismiss }) {
  return {
    key: order.key_id,
    order_id: order.order_id,
    amount: order.amount,
    currency: order.currency || 'INR',
    name: 'Keplix',
    description: `${order.plan_code} plan (${order.period})`,
    prefill: { name, email, contact: phone },
    theme: { color: '#4E46B4' },
    handler: onSuccess,
    modal: { ondismiss: onDismiss },
  };
}

const CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

/** Loads checkout.js once; resolves to the Razorpay constructor or null. */
export function loadCheckout() {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  return new Promise((resolve) => {
    const s = document.createElement('script');
    s.src = CHECKOUT_SRC;
    s.async = true;
    s.onload = () => resolve(window.Razorpay ?? null);
    s.onerror = () => resolve(null);
    document.body.appendChild(s);
  });
}

/**
 * Whole purchase flow, kept out of the React page so every outcome is testable.
 * Resolves to { status: 'paid' | 'verify_failed' | 'cancelled' | 'error', message? }
 * and never throws. The server (verify) alone decides that a payment worked.
 */
export async function purchasePlan({ planCode, period, prefill = {}, api, load = loadCheckout }) {
  try {
    const orderRes = await api.createOrder(planCode, period);
    if (!orderRes?.success) return { status: 'error', message: orderRes?.error || 'Could not start payment' };
    const Razorpay = await load();
    if (!Razorpay) return { status: 'error', message: 'Could not load the payment window. Check your connection.' };
    return await new Promise((resolve) => {
      const options = checkoutOptions(orderRes.data, {
        ...prefill,
        onSuccess: async (response) => {
          let v = null;
          try {
            v = await api.verify({
              razorpay_order_id: response?.razorpay_order_id,
              razorpay_payment_id: response?.razorpay_payment_id,
              razorpay_signature: response?.razorpay_signature,
            });
          } catch {
            v = null;
          }
          resolve(v?.success ? { status: 'paid' } : { status: 'verify_failed' });
        },
        onDismiss: () => resolve({ status: 'cancelled' }),
      });
      try {
        new Razorpay(options).open();
      } catch (err) {
        resolve({ status: 'error', message: err?.message || 'Could not start payment' });
      }
    });
  } catch (err) {
    return { status: 'error', message: err?.message || 'Could not start payment' };
  }
}
