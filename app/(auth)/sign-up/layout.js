/**
 * Server wrapper for metadata only — sign-up/page.jsx is a client component.
 * The nested /sign-up/otp segment overrides this with its own noindex metadata.
 */
export const metadata = {
  title: 'Register your workshop — Keplix Partner',
  description:
    'Create a Keplix Partner account for your workshop and start receiving service bookings from nearby car owners.',
  alternates: { canonical: '/sign-up' },
  // Opts back in: the root layout defaults every route to noindex because the
  // portal is private, and this is one of the three public pages.
  robots: { index: true, follow: true },
};

export default function SignUpLayout({ children }) {
  return children;
}
