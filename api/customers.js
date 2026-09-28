import api from '@/lib/api';

export const reviewsAPI = {
  // The vendor is identified by the bearer token — no id is passed, so a caller
  // cannot read another vendor's reviews.
  getVendorReviews: (params = {}) => api.get('/interactions/api/vendor/reviews', { params }),
  replyToReview: (reviewId, reply) =>
    api.post(`/interactions/api/vendor/reviews/${reviewId}/reply`, { reply }),
};

/**
 * Vendor-to-Keplix feedback. Routes moved to `/vendor/feedback` and
 * `/vendor/feedback/create` (previously unprefixed `/vendor/` and
 * `/vendor/create`, which collided with sibling routers) and the backend now
 * validates the body as `{ title, message, category }`, rejecting anything
 * else instead of 500ing.
 */
export const feedbackAPI = {
  getFeedback: (params = {}) => api.get('/interactions/api/vendor/feedback', { params }),
  createFeedback: ({ title, message, category }) =>
    api.post('/interactions/api/vendor/feedback/create', { title, message, category }),
};

/**
 * Chat uses the vendor conversation routes in routes/vendor/interactions.js.
 * The mobile client still calls an older `/interactions/chat/:customerId` path
 * that is not mounted for vendors; these are the routes the backend actually
 * serves, so the web portal talks to them directly.
 */
export const chatAPI = {
  getConversations: () => api.get('/interactions/api/vendor/conversations'),
  createConversation: (bookingId) =>
    api.post('/interactions/api/vendor/chat/create', { bookingId }),
  getMessages: (conversationId) => api.get(`/interactions/api/vendor/chat/${conversationId}`),
  sendMessage: ({ conversationId, bookingId, message_text }) =>
    api.post('/interactions/api/vendor/chat/send', {
      ...(conversationId ? { conversationId } : {}),
      ...(bookingId ? { bookingId } : {}),
      message_text,
    }),
};

export const notificationsAPI = {
  getNotifications: (params = {}) =>
    api.get('/interactions/api/vendor/notifications', { params }),
  markRead: (id) => api.put(`/interactions/api/vendor/notifications/${id}/mark-read`),
};

export default reviewsAPI;
