/**
 * Server wrapper for metadata only. Confirmation screens are the tail end of a
 * flow — noindex so they cannot become someone's entry point.
 */
export const metadata = {
  title: 'Email verified — Keplix Partner',
  robots: { index: false, follow: false },
};

export default function VerifiedLayout({ children }) {
  return children;
}
