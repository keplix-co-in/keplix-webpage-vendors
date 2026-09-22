import { OnboardingDraftProvider } from '@/components/onboarding/DraftProvider';

/**
 * The draft lives here rather than in each step, so the in-memory file slots
 * survive moving between steps — client-side navigation keeps this provider
 * mounted.
 *
 * This layout no longer declares `'use client'` itself: the provider it renders
 * is already a client component, and dropping the directive lets the layout
 * export metadata. Onboarding is a signed-in, half-filled application form —
 * nothing here should be indexed or followed.
 */
export const metadata = {
  robots: { index: false, follow: false },
};

export default function OnboardingLayout({ children }) {
  return <OnboardingDraftProvider>{children}</OnboardingDraftProvider>;
}
