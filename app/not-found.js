import { FullPageState, HomeButton } from '@/components/shell/RouteFallback';

export const metadata = {
  title: 'Page not found — Keplix Partner',
};

/**
 * The app-wide 404: mistyped URLs and links to pages that no longer exist.
 *
 * Sends the vendor to /dashboard rather than /, because the portal guard
 * bounces an unauthenticated vendor on to sign-in from there anyway, so one
 * button works for both signed-in and signed-out visitors.
 */
export default function NotFound() {
  return (
    <FullPageState
      title="We could not find that page"
      body="The link may be out of date, or the page may have moved. Everything else in your portal is working normally."
      action={<HomeButton />}
    />
  );
}
