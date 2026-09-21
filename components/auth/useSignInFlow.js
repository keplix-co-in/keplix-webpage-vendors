'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { authAPI } from '@/api/auth';
import { consumeNext } from '@/lib/nextTarget';

/**
 * Shared tail of every sign-in path (email, phone OTP, Google).
 *
 * The landing rule lives in shared/utils/vendorLanding.js and is applied by
 * AuthContext, so every path branches identically: a customer account is
 * refused and signed out, an unfinished registration lands on onboarding.
 *
 * A vendor who was sent here from a deep link (or an expired session) goes back
 * to that page afterwards — but only when their account is ready for the portal.
 * Someone with unfinished registration always goes to onboarding, never past it.
 */
export function useSignInFlow() {
  const router = useRouter();
  const { completeSignIn } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const land = (payload) => {
    const { user, access, refresh, isNewUser } = payload ?? {};
    const landing = completeSignIn({ access, refresh, user, isNewUser });

    if (!landing.ok) {
      setError(landing.errorMessage);
      return false;
    }

    // Consumed either way so a stale destination cannot linger into a later
    // sign-in, but honoured only when the vendor is headed for the dashboard.
    const next = consumeNext();
    router.replace(landing.route === '/dashboard' && next ? next : landing.route);
    return true;
  };

  const handleResult = (result) => {
    if (result?.success) return land(result.data);

    // The backend answers 403 UNVERIFIED when the account exists but has never
    // confirmed an email or phone — that is a verification step, not a wrong
    // password, so it gets its own message rather than "invalid credentials".
    if (result?.details?.code === 'UNVERIFIED') {
      setError('Your account is not verified yet. Verify your email or phone to continue.');
      return false;
    }

    setError(result?.error || 'We could not sign you in. Please try again.');
    return false;
  };

  const signInWithPassword = async (credentials) => {
    setBusy(true);
    setError(null);
    const result = await authAPI.login(credentials);
    setBusy(false);
    return handleResult(result);
  };

  const signInWithGoogle = async (idToken) => {
    setBusy(true);
    setError(null);
    // role is sent so a brand-new Google account is created as a vendor; the
    // backend refuses to change the role of an existing account.
    const result = await authAPI.googleAuth({ idToken, role: 'vendor' });
    setBusy(false);
    return handleResult(result);
  };

  return { busy, error, setError, land, handleResult, signInWithPassword, signInWithGoogle };
}

export default useSignInFlow;
