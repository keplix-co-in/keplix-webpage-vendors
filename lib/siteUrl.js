/**
 * One place that decides the portal's public origin, so the root layout's
 * metadataBase, robots.txt and sitemap.xml can never disagree.
 *
 * NEXT_PUBLIC_SITE_URL is set only on the production Vercel environment
 * (https://partner.keplix.co.in). Everything else falls back:
 *   - Vercel preview builds → https://$VERCEL_URL, so previews never emit a
 *     localhost canonical. Vercel already serves previews with
 *     `X-Robots-Tag: noindex`, so they are not indexed either way.
 *   - local dev / CI → http://localhost:3000.
 */

const stripSlash = (value) => value.replace(/\/+$/, '');

/** The canonical public origin, or null when this build is not production. */
export function publicSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  return configured ? stripSlash(configured) : null;
}

/** Always-absolute base for resolving relative metadata URLs. */
export function metadataBaseUrl() {
  if (publicSiteUrl()) return publicSiteUrl();
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}

/** The pages open to search engines; everything else is noindex by default. */
export const PUBLIC_PATHS = ['/welcome', '/sign-in', '/sign-up'];
