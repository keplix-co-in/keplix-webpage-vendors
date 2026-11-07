import api from '@/lib/api';
import { supabase, setHoldMirror } from '@/lib/supabase';
import { tokenStore } from '@/lib/tokenStore';

/*
 * 2026-11 Supabase Auth migration.
 *
 * Sign-in, sign-up, email codes and password resets now go to Supabase; the
 * backend's old /login, /signup, /google, OTP and reset routes answer 426.
 * Keplix's database no longer stores passwords.
 *
 * Every method keeps its old name and its `{ success, data | error, status,
 * details }` result shape, so the sign-in, sign-up and reset screens did not
 * change. After a Supabase sign-in, /accounts/auth/supabase/sync returns the
 * same `{ user, isNewUser }` the old login did, and `access` is the Supabase
 * access token.
 */

const ok = (data) => ({ success: true, data, status: 200 });
const fail = (error, details) => ({ success: false, error, status: details?.status ?? 400, details });

// Supabase's wording -> the messages these screens showed before.
const friendly = (error, fallback) => {
  const msg = String(error?.message || '');
  if (/invalid login credentials/i.test(msg)) return 'Invalid email or password';
  if (/expired|invalid.*(otp|token)|token.*(invalid|expired)/i.test(msg)) return 'Invalid or expired code';
  if (/already registered|already exists/i.test(msg)) return 'An account with this email already exists';
  if (/rate limit|too many|security purposes/i.test(msg)) return 'Too many attempts. Please wait a minute and try again.';
  if (/password/i.test(msg) && /(characters|weak|short)/i.test(msg)) return msg;
  return fallback;
};

// Supabase signUp already emails the first confirmation code, so the sign-up
// screen's follow-up sendEmailOTP for that address must not send a second one
// (and would hit Supabase's 60-second resend limit). Resends still go out.
let justSignedUp = null;

/**
 * Turn a fresh Supabase session into the portal's `{ user, access, isNewUser }`
 * via the backend sync endpoint (creates the Keplix user on first sign-in).
 */
const syncSession = async (session, extra = {}) => {
  const access = session.access_token;
  tokenStore.setAccessToken(access);
  const result = await api.post('/accounts/auth/supabase/sync', { role: 'vendor', ...extra });
  if (!result?.success) {
    await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
    tokenStore.clearTokens();
    return result;
  }
  return ok({ user: result.data?.user, isNewUser: !!result.data?.isNewUser, access, refresh: null });
};

const withHeldMirror = async (fn) => {
  setHoldMirror(true);
  try {
    return await fn();
  } finally {
    setHoldMirror(false);
  }
};

export const authAPI = {
  signup: async ({ email, password }) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return fail(friendly(error, 'Registration failed. Please try again.'), { message: error.message });
    // Supabase hides "already registered" (no identities) to avoid leaking
    // which emails exist; the old backend said so plainly, and so do we.
    if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      return fail('An account with this email already exists');
    }
    justSignedUp = email.trim().toLowerCase();
    return ok({ email });
  },

  login: ({ email, password }) =>
    withHeldMirror(async () => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data?.session) {
        if (/not confirmed/i.test(error?.message || '')) {
          return fail('Your account is not verified yet.', { code: 'UNVERIFIED', status: 403 });
        }
        return fail(friendly(error, 'Invalid email or password'), { status: 401 });
      }
      return syncSession(data.session);
    }),

  // Ends this browser's Supabase session. scope 'local' (used everywhere in
  // this file) because a global sign-out would also end the vendor's
  // mobile-app session on the same Supabase account. Any argument is
  // ignored; the signature is kept so callers did not have to change.
  logout: async () => {
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch {
      // Local cleanup still happens in AuthContext.clearSession.
    }
    return ok({});
  },

  getProfile: () => api.get('/accounts/auth/profile'),
  updateProfile: (profileData) => api.put('/accounts/auth/profile', profileData),

  // Resend the sign-up confirmation code (6 digits, Supabase template {{ .Token }}).
  sendEmailOTP: async (email) => {
    const normalised = String(email || '').trim().toLowerCase();
    if (justSignedUp && justSignedUp === normalised) {
      justSignedUp = null;
      return ok({});
    }
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    return error ? fail(friendly(error, 'Could not send the code.')) : ok({});
  },

  // Confirms the address. The screen then signs in with the password it held.
  verifyEmailOTP: async (email, otp) => {
    const { error } = await withHeldMirror(() => supabase.auth.verifyOtp({ email, token: otp, type: 'signup' }));
    if (error) return fail(friendly(error, 'Invalid OTP, retry again'));
    // verifyOtp opens a session that was never synced with the backend; drop
    // it so a failed follow-up login can't leave it to be restored on reload.
    await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
    return ok({});
  },

  sendPasswordResetOTP: async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return error ? fail(friendly(error, 'We could not send the reset code.')) : ok({});
  },

  // Verifies the recovery code, sets the new password, then signs out so the
  // vendor signs in fresh — the same end state as the old reset endpoint.
  // An invalid code returns a message containing "code", which sends the
  // reset screen back to the code step.
  resetPasswordOTP: (email, otp, newPassword) =>
    withHeldMirror(async () => {
      const { error: codeError } = await supabase.auth.verifyOtp({ email, token: otp, type: 'recovery' });
      if (codeError) return fail('Invalid or expired code');
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
      tokenStore.clearTokens();
      return error ? fail(friendly(error, 'Failed to reset password. Please try again.')) : ok({});
    }),

  // Checks the current password, then changes it in Supabase.
  changePassword: async ({ old_password, current_password, new_password, password } = {}) => {
    const current = old_password ?? current_password;
    const next = new_password ?? password;
    const { data } = await supabase.auth.getUser();
    const email = data?.user?.email;
    if (!email) return fail('Please sign in again.', { status: 401 });
    const { error: checkError } = await withHeldMirror(() =>
      supabase.auth.signInWithPassword({ email, password: current })
    );
    if (checkError) return fail('Current password is incorrect');
    const { error } = await supabase.auth.updateUser({ password: next });
    return error ? fail(friendly(error, 'Could not change the password.')) : ok({});
  },

  // GIS id token -> Supabase session. The Supabase Google provider must list
  // the web OAuth client ID (Authentication > Providers > Google).
  googleAuth: ({ idToken, role = 'vendor' }) =>
    withHeldMirror(async () => {
      const { data, error } = await supabase.auth.signInWithIdToken({ provider: 'google', token: idToken });
      if (error || !data?.session) return fail('Google sign-in failed. Please try again.', { status: 401 });
      return syncSession(data.session, { role });
    }),

  // Background (Web Push) alerts. `subscription` is PushSubscription.toJSON().
  registerWebPush: (subscription) => api.post('/accounts/auth/web-push', subscription),
  unregisterWebPush: (endpoint) => api.delete('/accounts/auth/web-push', { data: { endpoint } }),
};

export default authAPI;
