/**
 * Server wrapper for metadata only — welcome/page.jsx is a client component and
 * so cannot export it. This is the portal's public front door and the one page
 * worth indexing, hence the canonical URL and the social cards.
 *
 * The canonical and openGraph URLs are relative on purpose: they resolve
 * against `metadataBase` in app/layout.js, which is driven by
 * NEXT_PUBLIC_SITE_URL rather than a hardcoded origin.
 */
export const metadata = {
  title: 'Keplix Partner — Run your workshop from anywhere',
  description:
    'Sign in or register your workshop on Keplix Partner. Accept bookings, log walk-ins, close jobs and track your earnings — the same account as the Keplix Partner app.',
  alternates: { canonical: '/welcome' },
  // Opts back in: the root layout defaults every route to noindex because the
  // portal is private, and this is one of the three public pages.
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    siteName: 'Keplix Partner',
    url: '/welcome',
    title: 'Keplix Partner — Run your workshop from anywhere',
    description:
      'Accept bookings, log walk-ins, close jobs and track your earnings from the Keplix Partner vendor portal.',
  },
  twitter: {
    card: 'summary',
    title: 'Keplix Partner — Run your workshop from anywhere',
    description:
      'Accept bookings, log walk-ins, close jobs and track your earnings from the Keplix Partner vendor portal.',
  },
};

export default function WelcomeLayout({ children }) {
  return children;
}
