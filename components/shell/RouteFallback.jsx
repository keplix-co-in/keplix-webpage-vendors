'use client';

import Link from 'next/link';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import BrandLockup from '@/components/shell/BrandLockup';

/**
 * The standing-in-for-a-page states: a caught error, a 404, and a route that is
 * still loading. Route boundaries replace a whole segment, so unlike
 * EmptyState/ErrorState (which sit inside a page's own chrome) these have to
 * carry the brand and centre themselves on the canvas.
 *
 * One component so every boundary file reads the same and none of them grows
 * its own layout: error.js / not-found.js only supply copy and an action.
 */
export function FullPageState({ title, body, action, footer }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-7 py-10"
      style={{ background: 'var(--color-canvas)' }}
    >
      <div className="mb-7">
        <BrandLockup label="Keplix Partner" sublabel="Vendor portal" />
      </div>

      <Card className="w-full max-w-[460px] text-center">
        <div className="text-[19px] font-bold tracking-[-0.3px] mb-2">{title}</div>
        <p className="text-[13px] text-[var(--color-muted)] leading-[1.65]">{body}</p>
        {action && <div className="mt-6 flex justify-center gap-3 flex-wrap">{action}</div>}
      </Card>

      {footer && (
        <div className="text-[12px] text-[var(--color-disabled)] mt-5 text-center max-w-[460px]">
          {footer}
        </div>
      )}
    </div>
  );
}

/** Spinner-free loading state: the portal shell already uses plain text for this. */
export function FullPageLoading({ message = 'Loading…' }) {
  return (
    <div
      className="min-h-screen grid place-items-center text-[13px] text-[var(--color-muted)]"
      style={{ background: 'var(--color-canvas)' }}
    >
      {message}
    </div>
  );
}

/**
 * Every error boundary needs the same two things: a Retry that actually
 * re-fetches, and a way out if retrying keeps failing.
 *
 * WHY `retry ?? reset`: this version of Next passes `retry()` (which re-fetches
 * and re-renders the segment) and keeps `reset()` only for the rare case of
 * clearing the boundary without re-fetching — see
 * node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/error.md.
 * Falling back keeps the button working either way.
 */
export function RetryButton({ retry, reset, children = 'Retry' }) {
  const onClick = retry ?? reset;
  return (
    <Button size="md" onClick={() => onClick?.()}>
      {children}
    </Button>
  );
}

export function HomeButton({ href = '/dashboard', children = 'Go to dashboard' }) {
  return (
    <Link href={href}>
      <Button variant="outline" size="md">
        {children}
      </Button>
    </Link>
  );
}

/**
 * Errors are logged, never rendered.
 *
 * `error.message` is the original text for a client-side throw, so it can carry
 * request URLs, ids and server internals; only `digest` is safe to show, and it
 * is shown only as something to quote to support.
 */
export const logBoundaryError = (scope, error) => {
  console.error(`[${scope}] route error`, error);
};

export default FullPageState;
