import api from '@/lib/api';

export const reviewsAPI = {
  // The vendor is identified by the bearer token — no id is passed, so a caller
  // cannot read another vendor's reviews.
  getVendorReviews: (params = {}) => api.get('/interactions/api/vendor/reviews', { params }),
  replyToReview: (reviewId, reply) =>
    api.post(`/interactions/api/vendor/reviews/${reviewId}/reply`, { reply }),
};

/**
 * Vendor-to-Keplix feedback. The route's own swagger block documents
 * `{ comment, rating }`, but the controller destructures
 * `{ title, message, category }` and 500s on anything else — verified against
 * the live backend, where the documented shape fails and this one returns 201.
 */
export const feedbackAPI = {
  getFeedback: (params = {}) => api.get('/interactions/api/vendor/', { params }),
  createFeedback: ({ title, message, category }) =>
    api.post('/interactions/api/vendor/create', { title, message, category }),
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
