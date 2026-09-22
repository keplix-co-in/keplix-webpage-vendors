/**
 * Server wrapper for metadata only. Confirmation screen at the end of the
 * password-reset flow — noindex so it cannot become someone's entry point.
 */
export const metadata = {
  title: 'Password changed — Keplix Partner',
  robots: { index: false, follow: false },
};

export default function PasswordChangedLayout({ children }) {
  return children;
}
