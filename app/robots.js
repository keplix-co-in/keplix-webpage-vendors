import { PUBLIC_PATHS, publicSiteUrl } from '@/lib/siteUrl';

/**
 * Only the three pre-session pages are public; everything else in this portal
 * is a vendor's own workshop data behind an auth guard, so it is kept out of
 * search results at the crawler level as well as via per-page `noindex`.
 *
 * `/sign-up` is allowed as a prefix, which would otherwise also permit
 * `/sign-up/otp` — that one is disallowed explicitly. Crawlers apply the most
 * specific matching rule, so the narrower Disallow wins over the wider Allow.
 *
 * The `Sitemap:` and `Host:` lines are emitted only when NEXT_PUBLIC_SITE_URL
 * is set (production, https://partner.keplix.co.in). A preview or local build
 * does not know its public origin, and a wrong absolute URL is worse than none.
 *
 * `Disallow: /` also caught the files the public pages depend on, so they are
 * allowed explicitly (2026-10-23):
 *   - /sitemap.xml: Search Console showed "Couldn't fetch" for a month, and a
 *     live URL Inspection test reported "Blocked by robots.txt". Google honours
 *     robots.txt for sitemap fetches, so it had never read the sitemap.
 *   - /_next/static, /_next/image: the CSS, JS and images Googlebot needs to
 *     render /welcome. Blocking them makes Google see an unstyled shell.
 *   - the icon and manifest routes, for the favicon shown in search results.
 * None of these expose vendor data, and the portal pages stay disallowed.
 */
const PUBLIC_ASSETS = [
  '/sitemap.xml',
  '/_next/static/',
  '/_next/image',
  '/favicon.ico',
  '/icon.png',
  '/apple-icon.png',
  '/manifest.webmanifest',
];

export default function robots() {
  const site = publicSiteUrl();
  return {
    rules: [
      {
        userAgent: '*',
        allow: [...PUBLIC_PATHS, ...PUBLIC_ASSETS],
        disallow: ['/', '/sign-up/otp'],
      },
    ],
    ...(site && { sitemap: `${site}/sitemap.xml`, host: site }),
  };
}
