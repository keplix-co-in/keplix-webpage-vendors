'use client';

import Confirmation from '../../_components/Confirmation';

export default function VerifiedPhonePage() {
  return (
    <Confirmation
      message="Your phone number has been verified successfully!"
      ctaLabel="Start onboarding"
      ctaHref="/onboarding/welcome"
    />
  );
}
