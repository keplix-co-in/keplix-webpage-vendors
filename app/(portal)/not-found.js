import Link from 'next/link';
import { Card, EmptyState } from '@/components/ui/Card';
import Button from '@/components/ui/Button';

/**
 * Portal 404, rendered inside the shell so the vendor keeps their nav.
 *
 * Covers both a bad portal URL and a `notFound()` from a detail page — a
 * booking, walk-in or service id that is not theirs or no longer exists, which
 * previously fell through to the bare app-level 404 outside the shell.
 */
export default function PortalNotFound() {
  return (
    <Card padded={false}>
      <EmptyState
        title="We could not find that"
        body="The page or job you followed a link to does not exist, or it is no longer yours to view."
        action={
          <Link href="/dashboard">
            <Button variant="outline" size="md">
              Back to dashboard
            </Button>
          </Link>
        }
      />
    </Card>
  );
}
