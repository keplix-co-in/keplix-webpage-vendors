'use client';

import Confirmation from '../../_components/Confirmation';

export default function VerifiedEmailPage() {
  return (
    <Confirmation
      message="Your email address has been verified successfully!"
      ctaLabel="Start onboarding"
      ctaHref="/onboarding/welcome"
    />
  );
}
