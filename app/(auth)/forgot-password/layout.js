/**
 * Server wrapper for metadata only, covering /forgot-password and its /otp
 * step. Password-recovery screens are transactional and have nothing to index.
 */
export const metadata = {
  title: 'Reset your password — Keplix Partner',
  robots: { index: false, follow: false },
};

export default function ForgotPasswordLayout({ children }) {
  return children;
}
