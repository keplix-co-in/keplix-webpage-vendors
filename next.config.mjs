/**
 * Security headers for the vendor portal.
 *
 * The CSP is assembled from what the app actually loads today (grepped, not
 * guessed):
 *   - https://accounts.google.com/gsi/client  -> components/auth/GoogleButton.jsx
 *     (script + the One Tap/button iframe it injects)
 *   - https://nominatim.openstreetmap.org     -> components/onboarding/MapPicker.jsx
 *     (reverse geocode / search fetches)
 *   - https://keplix.co.in/status.json         -> components/shell/MaintenanceGate.jsx
 *     (maintenance switch, shared with the main site)
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

// Supabase Auth origin (lib/supabase.js) built from the same env var the client
// uses, so pointing the portal at another Supabase project cannot silently
// break sign-in under the enforcing CSP. Falls back to the current project when
// the var is absent (tooling that loads this file without an env file).
const SUPABASE_FALLBACK = 'https://ruvtpvypjgqzfqfdjguz.supabase.co';
const supabaseOrigins = (() => {
  let parsed;
  try {
    parsed = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_FALLBACK);
  } catch {
    parsed = new URL(SUPABASE_FALLBACK);
  }
  // wss: covers supabase-js Realtime, which opens a WebSocket on the same host
  // if it is ever used; connect-src treats ws(s) as a separate scheme.
  return [parsed.origin, `${parsed.protocol === 'https:' ? 'wss:' : 'ws:'}//${parsed.host}`];
})();

const isProd = process.env.NODE_ENV === 'production';

const csp = [
  "default-src 'self'",
  // 'unsafe-inline': Next injects inline bootstrap/flight scripts on every
  // page and we are not passing a nonce through yet. FUTURE WORK: move to a
  // per-request nonce (generated in proxy.js, read via headers() in
  // app/layout.js) plus 'strict-dynamic', then drop 'unsafe-inline' here —
  // that is what turns this CSP into a real XSS barrier for scripts. 'unsafe-eval' is added
  // only outside production because the dev compiler/React Refresh needs it.
  `script-src 'self' 'unsafe-inline' ${isProd ? '' : "'unsafe-eval' "}https://accounts.google.com`,
  // Tailwind/Next inject style tags; leaflet's CSS is bundled and served from 'self'.
  // accounts.google.com: the Google button loads /gsi/style from there.
  "style-src 'self' 'unsafe-inline' https://accounts.google.com",
  "img-src 'self' data: blob: https://res.cloudinary.com https://*.tile.openstreetmap.org",
  "font-src 'self' data:",
  `connect-src 'self' https://accounts.google.com ${supabaseOrigins.join(' ')} https://nominatim.openstreetmap.org https://keplix.co.in${apiOrigins.length ? ` ${apiOrigins.join(' ')}` : ''}`,
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
            // WHY: ENFORCING since 2026-11 (security review). It was report-only
            // first because the allow-list is derived from a static read of the
            // code. Before promotion the origin list was re-grepped against
            // app/, components/, lib/, shared/ and public/sw.js (no new
            // third-party origins) and the portal built with it. Per the
            // original promotion checklist, still exercise Google sign-in,
            // onboarding (map picker + uploads) and live bookings (socket) in a
            // browser after deploy and watch for CSP console errors and
            // /api/csp-report hits; rollback = rename this key back to
            // 'Content-Security-Policy-Report-Only'.
            key: 'Content-Security-Policy',
            value: csp,
          },
          {
            // Kept for one release alongside the enforcing header (as the
            // checklist suggested) so violations keep reporting to
            // /api/csp-report. Remove once the enforcing header has a clean run.
            key: 'Content-Security-Policy-Report-Only',
            value: csp,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
