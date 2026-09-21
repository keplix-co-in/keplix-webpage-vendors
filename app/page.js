'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import EntryLoader from '@/components/auth/EntryLoader';
import { useSessionRedirect } from '@/components/auth/useSessionRedirect';

/**
 * `/` is a router, not a page. A signed-in vendor is forwarded to where they
 * belong (dashboard, or the onboarding step they left off at); everyone else
 * goes to the Welcome page. Nothing is shown in between but a loader — this used
 * to redirect to /welcome unconditionally, so a signed-in vendor saw the sign-up
 * page flash before being forwarded.
 */
export default function Home() {
  const router = useRouter();
  const { pending, signedIn, loading } = useSessionRedirect();

  useEffect(() => {
    // A signed-in vendor is already on their way; only send the rest to Welcome.
    if (!loading && !signedIn) router.replace('/welcome');
  }, [loading, signedIn, router]);

  return pending || !signedIn ? <EntryLoader /> : null;
}
