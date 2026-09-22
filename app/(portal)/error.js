'use client';

import { useEffect } from 'react';
import { Card, ErrorState } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import { logBoundaryError } from '@/components/shell/RouteFallback';

/**
 * Boundary for every portal page (dashboard, bookings, earnings, services…).
 *
 * WHY at the group rather than the app level: error.js does not wrap the layout
 * in its own segment, so this renders *inside* the portal shell — the vendor
 * keeps the nav and the header and can walk to another page instead of being
 * dropped onto a bare screen. Individual pages still handle their own
 * fetch failures inline (see ErrorState usage on the dashboard); this catches
 * what actually throws during render.
 */
export default function PortalError({ error, retry, reset }) {
  useEffect(() => {
    logBoundaryError('portal', error);
  }, [error]);

  return (
    <Card padded={false}>
      <ErrorState
        title="This page ran into a problem"
        body="Nothing you have saved is affected. Retry to load it again, or move on to another page and come back."
        onRetry={() => (retry ?? reset)?.()}
      />
      <div className="pb-8 flex justify-center">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            Back to dashboard
          </Button>
        </Link>
      </div>
      {error?.digest && (
        <div className="pb-6 text-center text-[11px] text-[var(--color-disabled)]">
          {/* Only the digest, never error.message — it can carry server internals. */}
          Reference: {error.digest}
        </div>
      )}
    </Card>
  );
}
