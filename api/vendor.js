import api, { uploadWithFetch } from '@/lib/api';

export const vendorAPI = {
  getVendorProfile: () => api.get('/accounts/vendor/profile'),
  createVendorProfile: (data) => api.post('/accounts/vendor/profile', data),
  updateProfile: (data) => api.put('/accounts/vendor/profile', data),
  // A-023: emails the step-up code a profile write must carry as `payout_otp`
  // when it changes existing bank/UPI details. See lib/payoutChange.js.
  requestPayoutOtp: () => api.post('/accounts/vendor/profile/payout-otp'),

  createVendorProfileWithImage: (formData) =>
    uploadWithFetch('POST', '/accounts/vendor/profile', formData),
  updateProfileWithImage: (formData) =>
    uploadWithFetch('PUT', '/accounts/vendor/profile', formData),

  updateOnlineStatus: (is_online) =>
    api.patch('/accounts/vendor/online-status', { is_online }),
};

// Documents are list and upload only. The mobile client also has a delete
// call, but routes/vendor/documents.js exposes no DELETE — it would 404 — so
// it is deliberately absent here rather than carried over as a broken button.
export const documentsAPI = {
  getDocuments: () => api.get('/accounts/documents'),
  // Field name is `file_url` — the route is uploadSingle('file_url').
  uploadDocument: (formData) => uploadWithFetch('POST', '/accounts/documents', formData),
};

export default vendorAPI;
