'use client';

import { useEffect } from 'react';
import {
  FullPageState,
  HomeButton,
  RetryButton,
  logBoundaryError,
} from '@/components/shell/RouteFallback';

/**
 * Catch-all boundary for anything under the root layout that has no closer
 * error.js of its own (app/page.js, /dev/screens).
 *
 * Nothing about the thrown error reaches the screen — the vendor gets copy they
 * can act on and, if it repeats, a reference code to quote to support.
 */
export default function AppError({ error, retry, reset }) {
  useEffect(() => {
    logBoundaryError('app', error);
  }, [error]);

  return (
    <FullPageState
      title="Something went wrong"
      body="We hit an unexpected problem loading this page. Retrying usually clears it — nothing you have saved is affected."
      action={
        <>
          <RetryButton retry={retry} reset={reset} />
          <HomeButton />
        </>
      }
      footer={error?.digest ? `Reference: ${error.digest}` : null}
    />
  );
}
