import api from '@/lib/api';

export const authAPI = {
  signup: (userData) => api.post('/accounts/auth/signup', userData),
  login: (credentials) => api.post('/accounts/auth/login', credentials),
  logout: () => api.post('/accounts/auth/logout'),
  getProfile: () => api.get('/accounts/auth/profile'),
  updateProfile: (profileData) => api.put('/accounts/auth/profile', profileData),
  registerVendor: (vendorData) => api.post('/accounts/auth/register-vendor', vendorData),

  sendPhoneOTP: (phone_number) => api.post('/accounts/auth/send-phone-otp', { phone_number }),
  verifyPhoneOTP: (phone_number, otp) =>
    api.post('/accounts/auth/verify-phone-otp', { phone_number, otp }),

  sendEmailOTP: (email) => api.post('/accounts/auth/send-email-otp', { email }),
  verifyEmailOTP: (email, otp) => api.post('/accounts/auth/verify-email-otp', { email, otp }),

  forgotPassword: (email) => api.post('/accounts/auth/forgot-password', { email }),
  sendPasswordResetOTP: (email) => api.post('/accounts/auth/send-password-reset-otp', { email }),
  resetPasswordOTP: (email, otp, newPassword) =>
    api.post('/accounts/auth/reset-password-otp', { email, otp, password: newPassword }),

  changePassword: (payload) => api.put('/accounts/auth/password/change', payload),

  // The backend verifies the id token against GOOGLE_ALLOWED_AUDIENCES, so the
  // web OAuth client ID must be listed there for this to succeed.
  googleAuth: (googleData) => api.post('/accounts/auth/google', googleData),
};

export default authAPI;
