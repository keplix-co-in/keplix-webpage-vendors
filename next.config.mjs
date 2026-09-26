/**
 * Security headers for the vendor portal.
 *
 * The CSP is assembled from what the app actually loads today (grepped, not
 * guessed):
 *   - https://accounts.google.com/gsi/client  -> components/auth/GoogleButton.jsx
 *     (script + the One Tap/button iframe it injects)
 *   - https://nominatim.openstreetmap.org     -> components/onboarding/MapPicker.jsx
 *     (reverse geocode / search fetches)
 *   - https://{s}.tile.openstreetmap.org      -> components/onboarding/MapPicker.jsx
 *     (Leaflet raster tiles; {s} expands to a/b/c subdomains)
 *   - https://res.cloudinary.com              -> vendor/booking images served by the backend
 *   - data: / blob:                           -> local file-picker previews in
 *     components/onboarding/PhotoPickers.jsx and components/bookings/InspectionSheet.jsx
 *   - NEXT_PUBLIC_API_URL origin (http(s) + ws(s)) -> lib/apiConfig.js and the
 *     socket.io client in lib/socket.js
 *
 * Fonts are loaded via next/font/google (app/layout.js), which downloads and
 * self-hosts the files at build time, so no fonts.googleapis.com /
 * fonts.gstatic.com entry is required — they are served from 'self'.
 */

// Derive the backend origin for connect-src. lib/apiConfig.js throws when
// NEXT_PUBLIC_API_URL is unset, but the config must not: `next lint`, codegen
// and some tooling load this file without an env file, and failing here would
// break them with an unrelated-looking error. Unset simply means "no extra
// origin" — the app itself will still complain loudly at runtime.
const apiOrigins = (() => {
  const raw = process.env.NEXT_PUBLIC_API_URL;
  if (!raw) return [];
  try {
    const { origin, protocol, host } = new URL(raw);
    // socket.io upgrades to a WebSocket against the same host, which counts as
    // a separate scheme for connect-src.
    const wsScheme = protocol === 'https:' ? 'wss:' : 'ws:';
    return [origin, `${wsScheme}//${host}`];
  } catch {
    return [];
  }
})();

const isProd = process.env.NODE_ENV === 'production';

const csp = [
  "default-src 'self'",
  // 'unsafe-inline': Next injects inline bootstrap/flight scripts on every
  // page and we are not passing a nonce through yet. 'unsafe-eval' is added
  // only outside production because the dev compiler/React Refresh needs it.
  `script-src 'self' 'unsafe-inline' ${isProd ? '' : "'unsafe-eval' "}https://accounts.google.com`,
  // Tailwind/Next inject style tags; leaflet's CSS is bundled and served from 'self'.
  // accounts.google.com: the Google button loads /gsi/style from there.
  "style-src 'self' 'unsafe-inline' https://accounts.google.com",
  "img-src 'self' data: blob: https://res.cloudinary.com https://*.tile.openstreetmap.org",
  "font-src 'self' data:",
  `connect-src 'self' https://accounts.google.com https://nominatim.openstreetmap.org${apiOrigins.length ? ` ${apiOrigins.join(' ')}` : ''}`,
  // Google Identity Services renders its button/One Tap prompt in an iframe.
  "frame-src 'self' https://accounts.google.com",
  "worker-src 'self' blob:",
  "form-action 'self'",
  // Nobody may frame the portal (the modern equivalent of X-Frame-Options).
  "frame-ancestors 'none'",
  // Pin <base href> so an injected tag cannot re-root every relative URL.
  "base-uri 'self'",
  // No <object>/<embed>/<applet> is used anywhere in the portal.
  "object-src 'none'",
  // Violations land in app/api/csp-report/route.js (Vercel function logs).
  'report-uri /api/csp-report',
  'report-to csp',
].join('; ');

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // The service worker must never be served stale — a cached copy would
        // keep delivering alerts with old code — and is scoped to the whole site.
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
          { key: 'Content-Type', value: 'text/javascript; charset=utf-8' },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            // WHY: the portal handles vendor auth tokens and payout details;
            // pin browsers to HTTPS for two years, subdomains included, so a
            // plain-http first request can never be downgraded/intercepted.
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains',
          },
          {
            // WHY: vendor-uploaded files are served/proxied by the app; stop
            // the browser from sniffing a mislabelled upload into a script.
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            // WHY: booking/vendor ids live in our URLs — send only the origin
            // cross-site (and nothing at all when downgrading to http).
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            // WHY: camera=(self) because vendors photograph vehicles during
            // inspection/completion; geolocation=(self) for the onboarding map
            // picker's "use my location"; microphone=() because nothing in the
            // portal records audio, so deny it outright.
            key: 'Permissions-Policy',
            value: 'camera=(self), geolocation=(self), microphone=()',
          },
          {
            // WHY: legacy backstop for CSP frame-ancestors — blocks clickjacking
            // of the portal's action buttons in browsers that ignore the former.
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            // Names the `report-to csp` group used by the CSP below.
            key: 'Reporting-Endpoints',
            value: 'csp="/api/csp-report"',
          },
          {
            // WHY: report-only on purpose. The allow-list above is derived from
            // a static read of the code, so a missed third-party (an analytics
            // snippet, a new payment widget) would silently break a vendor
            // mid-onboarding if enforced today.
            //
            // TO PROMOTE TO ENFORCING: exercise the real flows — sign-in with
            // Google, onboarding (map picker + photo/document uploads),
            // bookings with live socket updates — in a browser and confirm the
            // console logs no "Report Only" CSP violations. Then rename this
            // key to 'Content-Security-Policy' (keeping the report-only header
            // for one release is fine) and re-test the same flows.
            key: 'Content-Security-Policy-Report-Only',
            value: csp,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
