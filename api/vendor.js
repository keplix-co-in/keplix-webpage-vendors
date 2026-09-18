import api, { uploadWithFetch } from '@/lib/api';

export const vendorAPI = {
  getVendorProfile: () => api.get('/accounts/vendor/profile'),
  createVendorProfile: (data) => api.post('/accounts/vendor/profile', data),
  updateProfile: (data) => api.put('/accounts/vendor/profile', data),

  createVendorProfileWithImage: (formData) =>
    uploadWithFetch('POST', '/accounts/vendor/profile', formData),
  updateProfileWithImage: (formData) =>
    uploadWithFetch('PUT', '/accounts/vendor/profile', formData),

  updateOnlineStatus: (is_online) =>
    api.patch('/accounts/vendor/online-status', { is_online }),
};

export const documentsAPI = {
  getDocuments: () => api.get('/accounts/documents'),
  // Field name is `file_url` — the route is uploadSingle('file_url').
  uploadDocument: (formData) => uploadWithFetch('POST', '/accounts/documents', formData),
  deleteDocument: (docId) => api.delete(`/accounts/documents/${docId}`),
};

export default vendorAPI;
