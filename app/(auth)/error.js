'use client';

import { useEffect } from 'react';
import {
  FullPageState,
  HomeButton,
  RetryButton,
  logBoundaryError,
} from '@/components/shell/RouteFallback';

/**
 * Boundary for sign-in, sign-up, OTP and password reset.
 *
 * Worth having its own rather than relying on the app-level one: a vendor who
 * cannot sign in has no nav and no dashboard to fall back to, so the only
 * useful exits are "try this screen again" and "start from sign-in". Credential
 * and OTP failures are handled inline by those screens — this catches a genuine
 * render/loading crash.
 */
export default function AuthError({ error, retry, reset }) {
  useEffect(() => {
    logBoundaryError('auth', error);
  }, [error]);

  return (
    <FullPageState
      title="Something went wrong"
      body="We could not load this screen. Retrying usually clears it; your account is not affected."
      action={
        <>
          <RetryButton retry={retry} reset={reset} />
          <HomeButton href="/sign-in">Back to sign in</HomeButton>
        </>
      }
      footer={error?.digest ? `Reference: ${error.digest}` : null}
    />
  );
}
