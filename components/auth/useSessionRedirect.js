'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { landingRouteFor, useAuth } from '@/context/AuthContext';

/**
 * Sends a vendor who is already signed in to where they belong, so the
 * pre-portal pages (entry, welcome, sign in, sign up) are never shown to them.
 *
 * Returns `pending`: true while the session is still being restored or a
 * redirect is on its way. Screens render a loader in that window instead of
 * their form — otherwise a signed-in vendor sees the Welcome page flash before
 * being forwarded, which is exactly what this exists to stop.
 *
 * The dev-preview stand-in is deliberately not treated as a session: it is a
 * testing aid, and forwarding it would make simply opening the site land inside
 * the portal.
 */
export function useSessionRedirect() {
  const router = useRouter();
  const { user, loading, isPreview, hadSession } = useAuth();

  // Only a session that was already there when the app loaded. A vendor who
  // signs in on THIS page is already being navigated by the sign-in flow, which
  // knows about a remembered destination; redirecting here as well would race
  // it and could send them to the dashboard instead of the page they asked for.
  const target = !loading && user && hadSession && !isPreview ? landingRouteFor(user) : null;

  useEffect(() => {
    if (target) router.replace(target);
  }, [target, router]);

  // "Signed in" means "has somewhere to go". A session that resolves to no
  // vendor landing (an account that is not a vendor) counts as signed out, so
  // it falls through to the sign-in flow instead of leaving a blank screen.
  return { pending: loading || Boolean(target), signedIn: Boolean(target), loading };
}

export default useSessionRedirect;
