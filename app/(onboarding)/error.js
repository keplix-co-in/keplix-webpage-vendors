'use client';

import { useEffect } from 'react';
import {
  FullPageState,
  HomeButton,
  RetryButton,
  logBoundaryError,
} from '@/components/shell/RouteFallback';

/**
 * Boundary for the registration steps.
 *
 * WHY it belongs at the group level: error.js does not wrap the layout in its
 * own segment, so the OnboardingDraftProvider above it stays mounted — the
 * in-memory file slots and part-filled fields survive, and Retry re-renders the
 * step with the draft intact instead of sending the vendor back to step one.
 */
export default function OnboardingError({ error, retry, reset }) {
  useEffect(() => {
    logBoundaryError('onboarding', error);
  }, [error]);

  return (
    <FullPageState
      title="This step could not be loaded"
      body="Your progress so far is still here. Retry to carry on, or go back to the checklist and pick the step up again."
      action={
        <>
          <RetryButton retry={retry} reset={reset} />
          <HomeButton href="/onboarding">Back to checklist</HomeButton>
        </>
      }
      footer={error?.digest ? `Reference: ${error.digest}` : null}
    />
  );
}
