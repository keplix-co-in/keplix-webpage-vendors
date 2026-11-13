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
 * Indexable with a canonical to `/welcome` (changed from noindex 2026-11-13):
 * Google takes the favicon and the site name shown in results from the
 * homepage, so a noindex/blocked `/` made it show a generic globe. The
 * canonical still sends ranking signals to `/welcome`, the real entry page.
 */
export const metadata = {
  title: 'Keplix Partner — Workshop & Garage Management Portal',
  description:
    'Sign in to the Keplix Partner portal to manage your workshop bookings, walk-ins and earnings.',
  alternates: { canonical: '/welcome' },
  robots: { index: true, follow: true },
};

// WebSite markup on the homepage is what Google reads for the site name in
// results ("Keplix Partner" rather than just "Keplix"). Static data only.
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Keplix Partner',
  alternateName: ['Keplix Partner Portal', 'Keplix for Workshops'],
  url: 'https://partner.keplix.co.in/',
  publisher: {
    '@type': 'Organization',
    name: 'Keplix',
    url: 'https://keplix.co.in',
    logo: 'https://partner.keplix.co.in/icon.png',
  },
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <EntryRouter />
    </>
  );
}
