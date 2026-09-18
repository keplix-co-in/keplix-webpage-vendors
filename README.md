# keplix-webpage-vendors

The Keplix Partner **vendor web portal** — a browser counterpart to the
`keplix-frontend` Expo app, for workshop owners. Same account, same backend,
same data.

Next.js 16 (App Router, JavaScript) · React 19 · Tailwind 4 · TanStack Query ·
socket.io-client. Built from the design handoff `design_handoff_keplix_vendor_portal`.

## Running it

```bash
cp .env.example .env.local   # then fill in the values
npm install
npm run dev                  # http://localhost:3000
```

The backend must be running first (`keplix-backend`). `NEXT_PUBLIC_API_URL` has
no default on purpose — the app throws at startup rather than silently talking
to production the way the mobile app's fallback does.

`npm run build` · `npx eslint .`

## How it is put together

- `app/(auth)` — sign in/up, phone and email OTP, password recovery.
- `app/(onboarding)` — the four-step registration **hub** (completable in any
  order, not a wizard), ending in one submit.
- `app/(portal)` — the signed-in app behind a sidebar shell. `layout.jsx`
  exports `usePortalHeader(title, subtitle)`, which every portal page calls.
- `api/` — one module per feature, mapped 1:1 to the backend's real routes.
- `lib/api.js` — port of the mobile client: bearer token, single-flight refresh,
  and the same `{ success, data, error, status }` envelope (it resolves errors
  rather than throwing, except on 429).
- `shared/` — logic copied from `keplix-frontend` so the two apps cannot drift:
  `resolveVendorLanding`, the dashboard's job buckets, service categories,
  vehicle segments, durations, FAQs, reject reasons, inspection items.

## Things worth knowing before you change something

- **Scope is parity with the mobile app.** Anything in the design without a
  working mobile equivalent was left out rather than faked: Apple sign-in, the
  community forum, promotions/inventory. Support chat is local notes plus email,
  exactly as the app does it, because no support-chat backend exists.
- **`vendorId` is the *user* id**, not the vendor profile id. Both the
  vendor-scoped REST paths and the socket's `user_<id>` room are keyed by it.
- **The health sheet gates job completion.** Closing sends status, amount and
  payment mode in one request; a 409 persists nothing, so the portal saves the
  payload, routes to the inspection, and replays it afterwards.
- **Payouts are settled by the Keplix team.** The portal shows the payout
  account and history; there is deliberately nothing to request.
- The design's sidebar entries for a single booking (booking detail, inspection,
  completion, receipt) are intentionally absent — they need a specific job, so
  they are reached through the flow that picks one.

## Deploying

Vercel, like `kepix-admin` and `keplix-website`; intended origin
`vendor.keplix.co.in`. Two backend requirements:

1. The origin must pass `keplix-backend/util/cors.js` (the `*.keplix.co.in`
   regex covers it) **and** the socket CORS check, which now reuses the same
   function.
2. The web OAuth client ID must be added to `GOOGLE_ALLOWED_AUDIENCES` on the
   `--set-env-vars` line in `keplix-backend/.github/workflows/deploy.yml` —
   that flag replaces the service's whole environment, so edit it in place.
