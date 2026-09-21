import api from '@/lib/api';

export const authAPI = {
  signup: (userData) => api.post('/accounts/auth/signup', userData),
  login: (credentials) => api.post('/accounts/auth/login', credentials),
  logout: () => api.post('/accounts/auth/logout'),
  getProfile: () => api.get('/accounts/auth/profile'),
  updateProfile: (profileData) => api.put('/accounts/auth/profile', profileData),

  // Phone OTP endpoints exist on the backend but are deliberately not used:
  // verify-phone-otp returns no tokens and /login matches on email only, so a
  // phone-only account can never actually sign in. The mobile app does not use
  // them either.
  sendEmailOTP: (email) => api.post('/accounts/auth/send-email-otp', { email }),
  verifyEmailOTP: (email, otp) => api.post('/accounts/auth/verify-email-otp', { email, otp }),

  // Password recovery is OTP-only. The link-based /forgot-password endpoint is
  // not wrapped here because it 500s unconditionally: its controller writes
  // resetPasswordToken/resetPasswordExpires, neither of which exists on the
  // User model (verified against the live backend).
  sendPasswordResetOTP: (email) => api.post('/accounts/auth/send-password-reset-otp', { email }),
  resetPasswordOTP: (email, otp, newPassword) =>
    api.post('/accounts/auth/reset-password-otp', { email, otp, password: newPassword }),

  changePassword: (payload) => api.put('/accounts/auth/password/change', payload),

  // The backend verifies the id token against GOOGLE_ALLOWED_AUDIENCES, so the
  // web OAuth client ID must be listed there for this to succeed.
  googleAuth: (googleData) => api.post('/accounts/auth/google', googleData),
};

export default authAPI;
