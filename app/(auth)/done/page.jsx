'use client';

import Confirmation from '../_components/Confirmation';

export default function PasswordChangedPage() {
  return (
    <Confirmation
      message="Your password has been changed successfully!"
      ctaLabel="Sign in"
      ctaHref="/sign-in"
    />
  );
}
