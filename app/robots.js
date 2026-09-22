/**
 * Only the three pre-session pages are public; everything else in this portal
 * is a vendor's own workshop data behind an auth guard, so it is kept out of
 * search results at the crawler level as well as via per-page `noindex`.
 *
 * `/sign-up` is allowed as a prefix, which would otherwise also permit
 * `/sign-up/otp` — that one is disallowed explicitly. Crawlers apply the most
 * specific matching rule, so the narrower Disallow wins over the wider Allow.
 *
 * No `sitemap` is emitted: the portal's public origin is not known at build
 * time and a wrong absolute URL is worse than none.
 */
export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/welcome', '/sign-in', '/sign-up'],
        disallow: ['/', '/sign-up/otp'],
      },
    ],
  };
}
