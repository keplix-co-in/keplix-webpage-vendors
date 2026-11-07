// Test-only module hooks: lets node:test import the portal's auth code without
// Next's "@/..." alias or a real Supabase client (which needs env + network).
// Imported first by the auth/api tests; production code is not touched.
import { registerHooks } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const root = path.resolve(here, '..', '..', '..');
const url = (p) => pathToFileURL(path.join(root, p)).href;

const MAP = {
  '@/lib/api': url('lib/__tests__/helpers/mockApi.mjs'),
  '@/lib/supabase': url('lib/__tests__/helpers/mockSupabase.mjs'),
  './supabase': url('lib/__tests__/helpers/mockSupabase.mjs'),
  '@/lib/tokenStore': url('lib/tokenStore.js'),
};

process.env.NEXT_PUBLIC_API_URL ||= 'http://api.test';

// tokenStore only touches storage when `window` exists.
const store = new Map();
globalThis.window = {
  localStorage: {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  },
};
export const storage = store;

registerHooks({
  resolve(specifier, context, next) {
    if (MAP[specifier]) return { url: MAP[specifier], shortCircuit: true };
    // Portal code uses bundler-style extensionless relative imports.
    if (specifier.startsWith('.') && !path.extname(specifier)) {
      try { return next(`${specifier}.js`, context); } catch { /* fall through */ }
    }
    return next(specifier, context);
  },
});
