// Run: node --test lib/__tests__/maintenance.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeStatus, fetchMaintenanceStatus, CLOSED_STATUS,
  isBackendMaintenance, onBackendMaintenance, emitBackendMaintenance,
} from '../maintenance.js';

test('only a literal true turns maintenance on', () => {
  assert.equal(normalizeStatus({ maintenance: true }).maintenance, true);
  for (const v of ['true', 1, 'yes', null]) assert.equal(normalizeStatus({ maintenance: v }).maintenance, false);
  assert.deepEqual(normalizeStatus(null), CLOSED_STATUS);
});

test('fetch errors, non-200 and bad JSON fail open', async () => {
  assert.deepEqual(await fetchMaintenanceStatus('u', async () => { throw new Error('x'); }), CLOSED_STATUS);
  assert.deepEqual(await fetchMaintenanceStatus('u', async () => ({ ok: false })), CLOSED_STATUS);
  assert.deepEqual(await fetchMaintenanceStatus('u', async () => ({ ok: true, json: async () => { throw new Error('html'); } })), CLOSED_STATUS);
});

test('fetch success returns the file, uncached', async () => {
  let opts;
  const s = await fetchMaintenanceStatus('u', async (_u, o) => { opts = o; return { ok: true, json: async () => ({ maintenance: true, message: ' m ', until: '5 PM' }) }; });
  assert.deepEqual(s, { maintenance: true, message: 'm', until: '5 PM' });
  assert.equal(opts.cache, 'no-store');
});

test('isBackendMaintenance needs 503 AND code MAINTENANCE', () => {
  assert.equal(isBackendMaintenance(503, { code: 'MAINTENANCE' }), true);
  assert.equal(isBackendMaintenance(503, { code: 'OTHER' }), false);
  assert.equal(isBackendMaintenance(503, '<html>'), false);
  assert.equal(isBackendMaintenance(500, { code: 'MAINTENANCE' }), false);
  assert.equal(isBackendMaintenance(503, null), false);
});

test('events reach listeners until unsubscribe; a throwing listener is isolated', () => {
  const got = [];
  const offBad = onBackendMaintenance(() => { throw new Error('x'); });
  const off = onBackendMaintenance((m) => got.push(m));
  emitBackendMaintenance('Back soon');
  off(); offBad();
  emitBackendMaintenance('again');
  assert.deepEqual(got, ['Back soon']);
});
