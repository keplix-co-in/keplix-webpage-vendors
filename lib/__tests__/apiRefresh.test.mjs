// Run: node --test lib/__tests__/apiRefresh.test.mjs
// lib/api.js 401 -> Supabase refresh handling, with a fake axios adapter.
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { storage } from './helpers/hooks.mjs';

const sbMock = await import('@/lib/supabase');
const { default: api } = await import('../api.js');
const { onSessionExpired } = await import('../sessionExpiry.js');
const { handlers, calls, reset } = sbMock;

// Each request is answered by `respond(config)`; status >= 400 rejects like axios.
let respond;
api.defaults.adapter = async (config) => {
  const { status, data = {} } = await respond(config);
  const response = { status, data, headers: {}, config, statusText: '' };
  if (status >= 400) {
    const err = new Error(`HTTP ${status}`);
    err.config = config;
    err.response = response;
    throw err;
  }
  return response;
};

const refreshes = () => calls.filter(([n]) => n === 'refreshSession').length;
let expired = 0;
onSessionExpired(() => { expired += 1; });

beforeEach(() => {
  reset();
  storage.clear();
  storage.set('keplix_vendor_access', 'OLD');
  storage.set('keplix_vendor_user', '{"id":1}');
  expired = 0;
});

test('concurrent 401s share a single refresh, then retry with the new token', async () => {
  handlers.refreshSession = async () => {
    await new Promise((r) => setTimeout(r, 10));
    return { data: { session: { access_token: 'NEW' } }, error: null };
  };
  respond = (c) => (c.headers.Authorization === 'Bearer NEW' ? { status: 200, data: { ok: c.url } } : { status: 401 });
  const results = await Promise.all([api.get('/a'), api.get('/b'), api.get('/c')]);
  assert.equal(refreshes(), 1);
  assert.deepEqual(results.map((r) => r.success), [true, true, true]);
  assert.equal(storage.get('keplix_vendor_access'), 'NEW');
});

test('_retry stops the loop when the retried request is 401 again', async () => {
  handlers.refreshSession = async () => ({ data: { session: { access_token: 'NEW' } }, error: null });
  let hits = 0;
  respond = () => { hits += 1; return { status: 401, data: { message: 'nope' } }; };
  const r = await api.get('/x');
  assert.equal(r.success, false);
  assert.equal(r.status, 401);
  assert.equal(hits, 2);
  assert.equal(refreshes(), 1);
});

test('401 on a credential path is not refreshed', async () => {
  respond = () => ({ status: 401 });
  await api.post('/accounts/auth/supabase/sync', {});
  assert.equal(refreshes(), 0);
});

test('retryable refresh failure keeps the session', async () => {
  handlers.refreshSession = async () => ({ data: {}, error: { status: 0, name: 'AuthRetryableFetchError', message: 'fetch failed' } });
  respond = () => ({ status: 401 });
  const r = await api.get('/x');
  assert.equal(r.status, 0);
  assert.equal(r.requiresLogin, undefined);
  assert.equal(storage.get('keplix_vendor_access'), 'OLD');
  assert.equal(expired, 0);
});

test('Supabase 5xx on refresh is transient too', async () => {
  handlers.refreshSession = async () => ({ data: {}, error: { status: 503, message: 'down' } });
  respond = () => ({ status: 401 });
  const r = await api.get('/x');
  assert.equal(r.status, 503);
  assert.equal(storage.get('keplix_vendor_access'), 'OLD');
});

test('rejected refresh token -> clearAll + notifySessionExpired', async () => {
  handlers.refreshSession = async () => ({ data: {}, error: { status: 400, message: 'Invalid Refresh Token' } });
  respond = () => ({ status: 401 });
  const r = await api.get('/x');
  assert.equal(r.requiresLogin, true);
  assert.equal(storage.size, 0);
  assert.equal(expired, 1);
});

test('missing session after refresh is treated as dead', async () => {
  handlers.refreshSession = async () => ({ data: { session: null }, error: null });
  respond = () => ({ status: 401 });
  assert.equal((await api.get('/x')).requiresLogin, true);
});
