'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { authAPI } from '@/api/auth';
import { tokenStore } from '@/lib/tokenStore';
import { onSessionExpired } from '@/lib/sessionExpiry';
import { closeSocket } from '@/lib/socket';
import { disableWebPush } from '@/lib/webPush';
import { rememberNext } from '@/lib/nextTarget';
import { resolveVendorLanding, VENDOR_LANDING } from '@/shared/utils/vendorLanding';
import {
  clearLegacyPreviewFlag,
  isDevBuild,
  isPreviewOn,
  PREVIEW_USER,
  setPreview,
} from '@/lib/devPreview';

const AuthContext = createContext(null);

/**
 * Normalises `id` to the User id, whichever endpoint the payload came from.
 *
 * The two disagree: `/accounts/auth/login` returns the user, so `id` is the
 * User id; `/accounts/auth/profile` returns the vendor profile for a vendor, so
 * its `id` is the VendorProfile id with the User id under `userId`. Storing the
 * profile shape as-is silently swapped the id after a reload, and the
 * vendor-scoped routes are keyed by the User id — `/vendor/<profileId>/earning`
 * and `/payments` answer 403, while bookings and services happen to accept
 * either, so it failed in only some places.
 */
const withUserId = (payload) => {
  if (!payload) return payload;
  const id = payload.userId ?? payload.user_id ?? payload.user?.id ?? payload.id;
  return { ...payload, id };
};

// The shared rule returns mobile screen names; the portal maps them to routes
// here so the landing logic itself stays identical to the app's.
export const ROUTE_FOR_LANDING = {
  [VENDOR_LANDING.NEW]: '/onboarding/welcome',
  [VENDOR_LANDING.RESUME]: '/onboarding',
  [VENDOR_LANDING.HOME]: '/dashboard',
};

/**
 * Where a signed-in vendor belongs: dashboard, the onboarding hub, or the
 * onboarding intro. The same rule the app applies after login, so a vendor with
 * unfinished registration is never dropped into a portal they cannot use yet.
 * Returns null for an account that must not be in the vendor portal at all.
 */
export const landingRouteFor = (user) => {
  const landing = resolveVendorLanding(user, false);
  return landing.ok ? (ROUTE_FOR_LANDING[landing.route] ?? '/dashboard') : null;
};

export function AuthProvider({ children }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [vendorProfile, setVendorProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPreview, setIsPreview] = useState(false);
  // True only when a session was already there as the app loaded. Distinguishes
  // "arrived signed in" (forward them on) from "just signed in on this page"
  // (that page's own flow is already navigating, and must not be raced).
  const [hadSession, setHadSession] = useState(false);
  // A session existed and was invalidated (as opposed to never having one). The
  // portal guard uses it to send the vendor to /sign-in?expired=1; without it
  // the guard's plain /sign-in redirect overwrote the API layer's, and the
  // "your session expired" message never appeared.
  const [sessionEnded, setSessionEnded] = useState(false);

  const clearSession = useCallback(() => {
    // WHY here rather than in signOut: every way a session ends (logout, a 401
    // on restore, session expiry) funnels through clearSession, and the socket
    // must go with it — otherwise the shell's still-mounted listener kept a
    // connection authenticated as the signed-out vendor.
    closeSocket();
    tokenStore.clearAll();
    // WHY: the query cache outlives the session. Without this, a second vendor
    // signing in on the same tab was served the previous vendor's cached
    // profile, notifications and chats until each query went stale.
    queryClient.clear();
    setUser(null);
    setVendorProfile(null);
  }, [queryClient]);

  const signOut = useCallback(async () => {
    // Leaving preview has to turn the flag off too, or the guard would let the
    // stand-in vendor straight back in and Log out would look broken.
    if (isDevBuild && isPreviewOn()) {
      setPreview(false);
      setIsPreview(false);
      clearSession();
      // A full page load, not router.replace: clearing the session makes the
      // portal layout's guard redirect to /sign-in, and it wins the race
      // against a client-side navigation. Reloading also guarantees every bit
      // of preview state is dropped, which is the point of exiting.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign('/dev/screens');
      return;
    }

    // Blacklists the token server-side; a failure here should still log the
    // vendor out locally rather than trapping them in the portal.
    try {
      // Drop this browser's push subscription while the token is still valid, so
      // the next person to use it is not sent this vendor's booking alerts.
      await disableWebPush();
      await authAPI.logout(tokenStore.getRefreshToken());
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
      // Dev-only: lets /dev/screens open guarded pages with no session. The
      // condition is compiled out of a production build, so this cannot run
      // there even with the flag set.
      clearLegacyPreviewFlag();
      if (isDevBuild && isPreviewOn()) {
        setUser(PREVIEW_USER);
        setIsPreview(true);
        setLoading(false);
        return;
      }

      if (!tokenStore.getAccessToken()) {
        setLoading(false);
        return;
      }

      const cached = tokenStore.getUser();
      if (cached && !cancelled) setUser(cached);

      const result = await authAPI.getProfile();
      if (cancelled) return;

      if (result?.success) {
        const profile = withUserId(result.data?.user ?? result.data);
        setUser(profile);
        tokenStore.setUser(profile);
        setHadSession(true);
      } else if (result?.status === 401) {
        clearSession();
        setSessionEnded(true);
      } else if (cached) {
        // The profile call failed for a reason other than an expired session
        // (offline, a 5xx); keep trusting the cached vendor rather than
        // signing them out over a blip.
        setHadSession(true);
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
        // In preview there is no session to expire — every API call 401s by
        // design, and reacting to that would bounce the tester out of the page
        // it was opened to look at.
        if (isDevBuild && isPreviewOn()) return;
        // Remember the page they were on, so signing back in returns them to it
        // rather than to the dashboard.
        rememberNext(window.location.pathname + window.location.search);
        clearSession();
        setSessionEnded(true);
        router.replace('/sign-in?expired=1');
      }),
    [clearSession, router]
  );

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

      const normalised = withUserId(signedInUser);
      tokenStore.setTokens({ access, refresh });
      tokenStore.setUser(normalised);
      setUser(normalised);

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
      // Fed by the portal layout's ['vendor-profile', vendorId] query — that
      // query is the single fetch; this is only a convenient handle on it.
      vendorProfile,
      setVendorProfile,
      // The USER id, not the vendor profile id. Both the vendor-scoped REST
      // paths (/service_api/vendor/:vendorId/...) and the socket's personal
      // room (`user_<id>`, checked against authUser.id in keplix-backend
      // socket.js) are keyed by it — the mobile app does the same
      // (HomePage.jsx L370-373). Using vendorProfile.id here silently breaks
      // realtime and returns another vendor's data where the ids differ.
      // `userId` first: it is unambiguous on the profile payload, where `id` is
      // the VendorProfile id. withUserId() already normalises `id`, so this is
      // a second line of defence rather than the only one.
      vendorId: user?.userId ?? user?.user_id ?? user?.id ?? null,
      loading,
      isAuthenticated: Boolean(user),
      // True only for the dev stand-in vendor. Screens that would normally
      // forward a signed-in vendor onward check this so preview never hijacks
      // the pre-portal pages.
      isPreview,
      hadSession,
      sessionEnded,
      completeSignIn,
      signOut,
      clearSession,
    }),
    [
      user,
      vendorProfile,
      loading,
      isPreview,
      hadSession,
      sessionEnded,
      completeSignIn,
      signOut,
      clearSession,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

export default AuthProvider;
