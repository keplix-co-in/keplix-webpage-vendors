/**
 * Server wrapper for metadata only. Reached with a reset token in the flow's
 * store; never a valid search result.
 */
export const metadata = {
  title: 'Choose a new password — Keplix Partner',
  robots: { index: false, follow: false },
};

export default function ResetPasswordLayout({ children }) {
  return children;
}
