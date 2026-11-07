// Stand-in for lib/api.js when testing api/auth.js.
export const apiCalls = [];
export const apiHandlers = { post: async () => ({ success: true, data: {} }) };
const api = {
  post: (...a) => { apiCalls.push(['post', ...a]); return apiHandlers.post(...a); },
  get: async () => ({ success: true }), put: async () => ({ success: true }), delete: async () => ({ success: true }),
};
export default api;
