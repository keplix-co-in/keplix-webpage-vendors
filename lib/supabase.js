'use client';

/**
 * Supabase Auth client (2026-11 auth migration).
 *
 * Supabase owns vendor sign-in, passwords and sessions; Keplix's database no
 * longer stores passwords. The backend only verifies the Supabase access token.
 * Both values are PUBLIC (the publishable key is meant to ship in browsers).
 *
 * The current access token is mirrored into tokenStore's existing key, so
 * lib/api.js, the socket and web push keep reading it exactly as before.
 */
import { createClient } from '@supabase/supabase-js';
import { tokenStore } from './tokenStore';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  throw new Error(
    'NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are not set. Add them to .env.local.'
  );
}

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    // No OAuth/magic-link redirects: Google uses signInWithIdToken, email uses codes.
    detectSessionInUrl: false,
    storageKey: 'keplix-vendor-auth',
  },
});

// True between a Supabase sign-in and the backend sync/landing check, so the
// mirror can't publish a token for an account that is about to be refused
// (e.g. a customer account signing in to the vendor portal).
let holdMirror = false;
export const setHoldMirror = (value) => {
  holdMirror = value;
};

if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange((event, session) => {
    if (holdMirror) return;
    if (session?.access_token) tokenStore.setAccessToken(session.access_token);
    else if (event === 'SIGNED_OUT') tokenStore.clearTokens();
  });
}

export default supabase;
