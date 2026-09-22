import { PUBLIC_PATHS, publicSiteUrl } from '@/lib/siteUrl';

/**
 * Lists only the three public pages; every other route is noindex (see
 * app/layout.js) and must never appear here.
 *
 * Empty unless NEXT_PUBLIC_SITE_URL is set, for the same reason robots.js
 * omits its Sitemap line: absolute URLs built from a guessed origin would point
 * search engines at the wrong host. No `lastModified` either — these pages have
 * no real content date, and a build timestamp on every URL teaches Google to
 * ignore the field.
 */
export default function sitemap() {
  const site = publicSiteUrl();
  if (!site) return [];
  return PUBLIC_PATHS.map((path) => ({ url: `${site}${path}` }));
}
