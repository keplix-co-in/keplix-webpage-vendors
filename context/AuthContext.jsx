'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/api/auth';
import { vendorAPI } from '@/api/vendor';
import { tokenStore } from '@/lib/tokenStore';
import { onSessionExpired } from '@/lib/sessionExpiry';
import { resolveVendorLanding, VENDOR_LANDING } from '@/shared/utils/vendorLanding';

const AuthContext = createContext(null);

// The shared rule returns mobile screen names; the portal maps them to routes
// here so the landing logic itself stays identical to the app's.
export const ROUTE_FOR_LANDING = {
  [VENDOR_LANDING.NEW]: '/onboarding/welcome',
  [VENDOR_LANDING.RESUME]: '/onboarding',
  [VENDOR_LANDING.HOME]: '/dashboard',
};

export function AuthProvider({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [vendorProfile, setVendorProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(() => {
    tokenStore.clearAll();
    setUser(null);
    setVendorProfile(null);
  }, []);

  const signOut = useCallback(async () => {
    // Blacklists the token server-side; a failure here should still log the
    // vendor out locally rather than trapping them in the portal.
    try {
      await authAPI.logout();
    } finally {
      clearSession();
      router.replace('/sign-in');
    }
  }, [clearSession, router]);

  // Restore the session on load. The access token lasts a day, and the API
  // layer refreshes it transparently, so a plain profile read is enough.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!tokenStore.getAccessToken()) {
        setLoading(false);
        return;
      }

      const cached = tokenStore.getUser();
      if (cached && !cancelled) setUser(cached);

      const result = await authAPI.getProfile();
      if (cancelled) return;

      if (result?.success) {
        const profile = result.data?.user ?? result.data;
        setUser(profile);
        tokenStore.setUser(profile);
      } else if (result?.status === 401) {
        clearSession();
      }

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [clearSession]);

  // A 401 that survives a refresh attempt means the session is genuinely gone.
  useEffect(
    () =>
      onSessionExpired(() => {
        clearSession();
        router.replace('/sign-in?expired=1');
      }),
    [clearSession, router]
  );

  const loadVendorProfile = useCallback(async () => {
    const result = await vendorAPI.getVendorProfile();
    if (result?.success) {
      const profile = result.data?.vendor ?? result.data?.profile ?? result.data;
      setVendorProfile(profile);
      return profile;
    }
    return null;
  }, []);

  /**
   * Completes a sign-in once the backend has returned tokens and a user.
   * Runs the same landing rule as the mobile app: a customer account is refused
   * and signed straight back out, an unfinished registration goes to onboarding.
   */
  const completeSignIn = useCallback(
    ({ access, refresh, user: signedInUser, isNewUser = false }) => {
      const landing = resolveVendorLanding(signedInUser, isNewUser);

      if (!landing.ok) {
        tokenStore.clearAll();
        setUser(null);
        return landing;
      }

      tokenStore.setTokens({ access, refresh });
      tokenStore.setUser(signedInUser);
      setUser(signedInUser);

      return { ...landing, route: ROUTE_FOR_LANDING[landing.route] ?? '/dashboard' };
    },
    []
  );

  const value = useMemo(
    () => ({
      user,
      setUser: (next) => {
        setUser(next);
        tokenStore.setUser(next);
      },
      vendorProfile,
      setVendorProfile,
      loadVendorProfile,
      // The USER id, not the vendor profile id. Both the vendor-scoped REST
      // paths (/service_api/vendor/:vendorId/...) and the socket's personal
      // room (`user_<id>`, checked against authUser.id in keplix-backend
      // socket.js) are keyed by it — the mobile app does the same
      // (HomePage.jsx L370-373). Using vendorProfile.id here silently breaks
      // realtime and returns another vendor's data where the ids differ.
      vendorId: user?.id ?? user?.user_id ?? null,
      loading,
      isAuthenticated: Boolean(user),
      completeSignIn,
      signOut,
      clearSession,
    }),
    [user, vendorProfile, loadVendorProfile, loading, completeSignIn, signOut, clearSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

export default AuthProvider;
