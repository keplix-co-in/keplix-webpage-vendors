import { publicSiteUrl } from '@/lib/siteUrl';

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
 */
export default function robots() {
  const site = publicSiteUrl();
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/welcome', '/sign-in', '/sign-up'],
        disallow: ['/', '/sign-up/otp'],
      },
    ],
    ...(site && { sitemap: `${site}/sitemap.xml`, host: site }),
  };
}
