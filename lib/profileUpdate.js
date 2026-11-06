// Pure helpers for the portal's Business profile page (app/(portal)/profile).
// The vendor can now move their map pin there (a wrong onboarding pin was the
// trigger), so the PUT /accounts/vendor/profile body carries latitude /
// longitude alongside the structured address. The backend rebuilds the
// combined `address` from street/area/city/state/pincode, so it is not sent.

export const ADDRESS_FIELDS = ['street', 'area', 'city', 'state', 'pincode', 'landmark'];

const toCoord = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/** {lat, lng} from a profile, or null when missing/invalid/0,0. */
export const pinFromProfile = (profile) => {
  const lat = toCoord(profile?.latitude);
  const lng = toCoord(profile?.longitude);
  if (lat === null || lng === null) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  if (lat === 0 && lng === 0) return null;
  return { lat, lng };
};

/**
 * Address form fields seeded from a profile. Legacy profiles that only have the
 * combined `address` string get it as the street so nothing is lost on save.
 */
export const addressFormFromProfile = (profile) => {
  const out = {};
  ADDRESS_FIELDS.forEach((k) => {
    out[k] = profile?.[k] != null ? String(profile[k]) : '';
  });
  if (!out.street && profile?.address) out.street = String(profile.address);
  return out;
};

/** Fills only the address fields the map lookup actually returned. */
export const applyPickedAddress = (form, picked) => {
  const next = { ...form };
  ['street', 'area', 'city', 'state', 'pincode'].forEach((k) => {
    if (picked?.[k]) next[k] = picked[k];
  });
  return next;
};

/** Text body for the profile update: form fields, trimmed address, pin. */
export const buildProfileUpdatePayload = (form, pin) => {
  const { address: _ignored, ...rest } = form ?? {};
  const payload = { ...rest };
  ADDRESS_FIELDS.forEach((k) => {
    payload[k] = payload[k] != null ? String(payload[k]).trim() : '';
  });
  const coords = pinFromProfile({ latitude: pin?.lat, longitude: pin?.lng });
  if (coords) {
    payload.latitude = coords.lat;
    payload.longitude = coords.lng;
  }
  return payload;
};
