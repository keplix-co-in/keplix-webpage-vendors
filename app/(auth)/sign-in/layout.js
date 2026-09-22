/**
 * Server wrapper for metadata only — sign-in/page.jsx is a client component.
 */
export const metadata = {
  title: 'Sign in — Keplix Partner',
  description:
    'Sign in to the Keplix Partner portal with your workshop email to manage bookings, walk-ins and earnings.',
  alternates: { canonical: '/sign-in' },
  // Opts back in: the root layout defaults every route to noindex because the
  // portal is private, and this is one of the three public pages.
  robots: { index: true, follow: true },
};

export default function SignInLayout({ children }) {
  return children;
}
