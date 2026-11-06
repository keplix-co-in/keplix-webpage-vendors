// Run: node --test lib/__tests__/profileUpdate.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  pinFromProfile,
  addressFormFromProfile,
  applyPickedAddress,
  buildProfileUpdatePayload,
} from '../profileUpdate.js';

test('pinFromProfile parses valid coordinates and rejects bad ones', () => {
  assert.deepEqual(pinFromProfile({ latitude: '28.5', longitude: 77.1 }), { lat: 28.5, lng: 77.1 });
  assert.equal(pinFromProfile({ latitude: 0, longitude: 0 }), null);
  assert.equal(pinFromProfile({ latitude: null, longitude: 77 }), null);
  assert.equal(pinFromProfile({ latitude: 100, longitude: 77 }), null);
  assert.equal(pinFromProfile(undefined), null);
});

test('addressFormFromProfile falls back to the legacy address string', () => {
  assert.equal(addressFormFromProfile({ address: 'Old addr' }).street, 'Old addr');
  assert.deepEqual(addressFormFromProfile({ street: 'S', pincode: 110001 }), {
    street: 'S', area: '', city: '', state: '', pincode: '110001', landmark: '',
  });
});

test('applyPickedAddress keeps typed values the lookup did not return', () => {
  assert.deepEqual(applyPickedAddress({ street: 'Typed', city: 'X' }, { city: 'Delhi', street: '' }), {
    street: 'Typed', city: 'Delhi',
  });
});

test('buildProfileUpdatePayload sends lat/lng and drops address', () => {
  const p = buildProfileUpdatePayload(
    { business_name: 'B', address: 'stale', street: ' 1 Rd ', city: 'Delhi' },
    { lat: 28.6, lng: 77.2 }
  );
  assert.equal(p.address, undefined);
  assert.equal(p.street, '1 Rd');
  assert.equal(p.area, '');
  assert.equal(p.latitude, 28.6);
  assert.equal(p.longitude, 77.2);
  assert.equal(p.business_name, 'B');
});

test('buildProfileUpdatePayload omits coordinates without a valid pin', () => {
  const p = buildProfileUpdatePayload({ city: 'Delhi' }, null);
  assert.equal('latitude' in p, false);
});
