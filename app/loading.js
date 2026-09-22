import { FullPageLoading } from '@/components/shell/RouteFallback';

/**
 * Shown while a top-level route's code is still being fetched. Route groups that
 * want their own wording ((portal)) override this with a closer loading.js.
 */
export default function Loading() {
  return <FullPageLoading />;
}
