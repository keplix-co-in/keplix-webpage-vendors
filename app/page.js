import EntryRouter from './_EntryRouter';

/**
 * `/` is a server page whose only job is to own metadata; the routing decision
 * itself depends on client-side session state (restored from storage in
 * AuthContext), so it stays in <EntryRouter />.
 *
 * Deliberately NOT a server `redirect('/welcome')`: a signed-in vendor must be
 * forwarded to their own landing route (dashboard or their unfinished
 * onboarding step), which is only knowable on the client. A blanket server
 * redirect would push them through /welcome and lose that.
 *
 * noindex: there is nothing to index here — every visitor is redirected — and
 * `/welcome` is the canonical public entry point instead.
 */
export const metadata = {
  title: 'Keplix Partner',
  description:
    'Sign in to the Keplix Partner portal to manage your workshop bookings, walk-ins and earnings.',
  robots: { index: false, follow: true },
};

export default function Home() {
  return <EntryRouter />;
}
