'use client';

import { OnboardingDraftProvider } from '@/components/onboarding/DraftProvider';

/**
 * The draft lives here rather than in each step, so the in-memory file slots
 * survive moving between steps — client-side navigation keeps this provider
 * mounted.
 */
export default function OnboardingLayout({ children }) {
  return <OnboardingDraftProvider>{children}</OnboardingDraftProvider>;
}
