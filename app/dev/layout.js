import { notFound } from 'next/navigation';

/**
 * /dev/* is a developer tool (the screen index and the preview-session toggle).
 * The page already renders a notice instead of the index in a production build,
 * but the route itself still existed and was reachable. This makes the whole
 * segment 404 in production, so the tooling is not part of the shipped surface
 * at all — and noindex keeps it out of search in every environment.
 */
export const metadata = {
  title: 'Dev tools — Keplix Partner',
  robots: { index: false, follow: false },
};

export default function DevLayout({ children }) {
  if (process.env.NODE_ENV === 'production') notFound();
  return children;
}
