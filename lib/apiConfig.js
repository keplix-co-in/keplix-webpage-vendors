// Single source of truth for the backend origin.
//
// Fails loudly at import time rather than defaulting to production: the mobile
// app falls back to the live Cloud Run URL when EXPO_PUBLIC_API_URL is unset,
// which means a misconfigured local build silently reads and writes real vendor
// data. On the web that mistake is cheaper to make and more costly to miss.
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_BASE_URL) {
  throw new Error(
    'NEXT_PUBLIC_API_URL is not set. Copy .env.example to .env.local and point it at the Keplix backend.'
  );
}

export default API_BASE_URL;