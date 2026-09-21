// Single source of truth for the backend origin.
//
// Fails loudly at import time rather than defaulting to production: the mobile
// app falls back to the live Cloud Run URL when EXPO_PUBLIC_API_URL is unset,
// which means a misconfigured local build silently reads and writes real vendor
// data. On the web that mistake is cheaper to make and more costly to miss.
const rawApiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

if (!rawApiBaseUrl) {
  throw new Error(
    'NEXT_PUBLIC_API_URL is not set. Copy .env.example to .env.local and point it at the Keplix backend.'
  );
}

// Strip trailing slashes: every call site concatenates a path that already
// starts with '/', so a value like 'http://localhost:8000/' would produce
// '//accounts/...'. That double slash is not just cosmetic — it bypasses the
// backend's route matching and 404s, and it breaks the CREDENTIAL_PATHS
// substring checks in api.js that decide whether a 401 may be refreshed.
export const API_BASE_URL = rawApiBaseUrl.replace(/\/+$/, '');

export default API_BASE_URL;