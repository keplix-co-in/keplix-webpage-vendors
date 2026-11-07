// Run: node --test lib/__tests__/nextTarget.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isSafeNext } from '../nextTarget.js';

test('allows known portal paths with query/hash', () => {
  for (const p of ['/dashboard', '/bookings/42', '/services?tab=x', '/profile#top']) assert.equal(isSafeNext(p), true, p);
});

test('refuses open-redirect and non-portal values', () => {
  const bad = [null, undefined, 42, '', 'https://evil.com', '//evil.com/dashboard', '/\\evil.com',
    '/dashboard\r\nx', '/dashboard\\x', '/login', '/onboarding', '/dashboardx', 'dashboard', '/' + 'a'.repeat(600)];
  for (const p of bad) assert.equal(isSafeNext(p), false, String(p));
});
