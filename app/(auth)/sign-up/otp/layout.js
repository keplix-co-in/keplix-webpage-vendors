/**
 * Server wrapper for metadata only. This step is mid-signup and meaningless
 * without the email address held in the flow's store, so it is kept out of
 * search results (robots.txt disallows it too).
 */
export const metadata = {
  title: 'Verify your email — Keplix Partner',
  robots: { index: false, follow: false },
};

export default function SignUpOtpLayout({ children }) {
  return children;
}
