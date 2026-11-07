// Run: node --test lib/__tests__/authApi.test.mjs
// api/auth.js (Supabase Auth migration) with Supabase and lib/api mocked.
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { storage } from './helpers/hooks.mjs';

// Dynamic imports: the hooks above must be registered before these resolve.
const sbMock = await import('@/lib/supabase');
const apiMock = await import('@/lib/api');
const { authAPI } = await import('../../api/auth.js');
const { handlers, calls, reset } = sbMock;

const signOuts = () => calls.filter(([n]) => n === 'signOut');

beforeEach(() => {
  reset();
  storage.clear();
  apiMock.apiCalls.length = 0;
  apiMock.apiHandlers.post = async () => ({ success: true, data: { user: { id: 1 }, isNewUser: false } });
});

test('signup with an existing email (no identities) -> already exists', async () => {
  handlers.signUp = async () => ({ data: { user: { identities: [] } }, error: null });
  const r = await authAPI.signup({ email: 'a@b.c', password: 'pw123456' });
  assert.equal(r.success, false);
  assert.match(r.error, /already exists/);
});

test('signup success suppresses the duplicate first OTP send, later resends go out', async () => {
  handlers.signUp = async () => ({ data: { user: { identities: [{}] } }, error: null });
  assert.equal((await authAPI.signup({ email: ' A@b.c ', password: 'x' })).success, true);
  await authAPI.sendEmailOTP('a@b.c');
  assert.equal(calls.filter(([n]) => n === 'resend').length, 0);
  await authAPI.sendEmailOTP('a@b.c');
  assert.equal(calls.filter(([n]) => n === 'resend').length, 1);
});

test('login on an unconfirmed account -> UNVERIFIED 403', async () => {
  handlers.signInWithPassword = async () => ({ data: {}, error: { message: 'Email not confirmed' } });
  const r = await authAPI.login({ email: 'a@b.c', password: 'x' });
  assert.equal(r.success, false);
  assert.equal(r.details.code, 'UNVERIFIED');
  assert.equal(r.status, 403);
});

test('login with bad credentials -> 401 friendly message', async () => {
  handlers.signInWithPassword = async () => ({ data: {}, error: { message: 'Invalid login credentials' } });
  const r = await authAPI.login({ email: 'a@b.c', password: 'x' });
  assert.equal(r.status, 401);
  assert.equal(r.error, 'Invalid email or password');
});

test('login success syncs with the backend and returns the access token', async () => {
  handlers.signInWithPassword = async () => ({ data: { session: { access_token: 'AT' } }, error: null });
  const r = await authAPI.login({ email: 'a@b.c', password: 'x' });
  assert.equal(r.success, true);
  assert.equal(r.data.access, 'AT');
  assert.equal(apiMock.apiCalls[0][1], '/accounts/auth/supabase/sync');
});

test('wrong or expired signup code -> friendly error, no sign-out', async () => {
  handlers.verifyOtp = async () => ({ error: { message: 'Token has expired or is invalid' } });
  const r = await authAPI.verifyEmailOTP('a@b.c', '000000');
  assert.equal(r.success, false);
  assert.equal(r.error, 'Invalid or expired code');
  assert.equal(signOuts().length, 0);
});

test('correct signup code drops the unsynced session locally', async () => {
  const r = await authAPI.verifyEmailOTP('a@b.c', '123456');
  assert.equal(r.success, true);
  assert.deepEqual(signOuts()[0][1], { scope: 'local' });
});

test('reset with a bad code stops before updateUser', async () => {
  handlers.verifyOtp = async () => ({ error: { message: 'expired' } });
  const r = await authAPI.resetPasswordOTP('a@b.c', '1', 'newpass');
  assert.match(r.error, /code/);
  assert.equal(calls.filter(([n]) => n === 'updateUser').length, 0);
});

test('reset where updateUser fails still signs out and clears tokens', async () => {
  storage.set('keplix_vendor_access', 'stale');
  handlers.updateUser = async () => ({ error: { message: 'Password should be at least 8 characters' } });
  const r = await authAPI.resetPasswordOTP('a@b.c', '123456', 'x');
  assert.equal(r.success, false);
  assert.match(r.error, /8 characters/);
  assert.deepEqual(signOuts()[0][1], { scope: 'local' });
  assert.equal(storage.has('keplix_vendor_access'), false);
});

test('Google sign-in whose backend sync fails signs out locally and clears tokens', async () => {
  handlers.signInWithIdToken = async () => ({ data: { session: { access_token: 'G' } }, error: null });
  apiMock.apiHandlers.post = async () => ({ success: false, error: 'Not a vendor', status: 403 });
  const r = await authAPI.googleAuth({ idToken: 'id' });
  assert.equal(r.success, false);
  assert.deepEqual(signOuts()[0][1], { scope: 'local' });
  assert.equal(storage.has('keplix_vendor_access'), false);
});

test('logout uses local scope and never throws', async () => {
  handlers.signOut = async () => { throw new Error('offline'); };
  assert.equal((await authAPI.logout()).success, true);
  assert.deepEqual(calls[0][1], { scope: 'local' });
});
