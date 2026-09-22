/**
 * Server wrapper for metadata only — welcome/page.jsx is a client component and
 * so cannot export it. This is the portal's public front door and the one page
 * worth indexing, hence the canonical URL, the social cards and the JSON-LD.
 *
 * The canonical and openGraph URLs are relative on purpose: they resolve
 * against `metadataBase` in app/layout.js (see lib/siteUrl.js) rather than a
 * hardcoded origin. The share image comes from app/opengraph-image.js.
 *
 * Title and description target what a garage owner searches for ("garage
 * management", "workshop software") rather than the brand alone; the marketing
 * pitch for vendors lives on keplix.co.in/business, which links here.
 */
const title = 'Keplix Partner — Workshop & Garage Management Portal';
const description =
  'Run your car workshop on Keplix: accept service bookings, log walk-ins, send job cards and health reports, and track your earnings — one account for the web portal and the Keplix Partner app.';

export const metadata = {
  title,
  description,
  alternates: { canonical: '/welcome' },
  // Opts back in: the root layout defaults every route to noindex because the
  // portal is private, and this is one of the three public pages.
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    siteName: 'Keplix Partner',
    locale: 'en_IN',
    url: '/welcome',
    title,
    description,
  },
  twitter: { card: 'summary_large_image', title, description },
};

// Tells search engines this is Keplix's own web app, published by the same
// organization as keplix.co.in, so the two properties are understood as one
// brand rather than as competing sites. Static data only, no user input.
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Keplix Partner',
  url: 'https://partner.keplix.co.in/welcome',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  inLanguage: 'en-IN',
  description,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
  publisher: { '@type': 'Organization', name: 'Keplix', url: 'https://keplix.co.in' },
};

export default function WelcomeLayout({ children }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
