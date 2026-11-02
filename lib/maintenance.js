/**
 * Maintenance mode for the partner portal.
 *
 * Two signals turn the full-page gate on (components/shell/MaintenanceGate.jsx):
 *  1. The shared switch https://keplix.co.in/status.json (a static file on the
 *     main site's Vercel CDN, so it answers even when the backend and database
 *     are down). The same file drives the main site's red banner.
 *  2. A backend answer of 503 with code "MAINTENANCE" (MAINTENANCE_MODE=true on
 *     Cloud Run), reported by lib/api.js through emitBackendMaintenance().
 *
 * Fails OPEN everywhere: only a literal `true` turns it on, and any fetch or
 * parse error means "no maintenance", so a blip never locks vendors out.
 */

export const STATUS_URL = process.env.NEXT_PUBLIC_STATUS_URL || 'https://keplix.co.in/status.json';

export const CLOSED_STATUS = Object.freeze({ maintenance: false, message: '', until: '' });

const text = (v) => (typeof v === 'string' ? v.trim().slice(0, 300) : '');

export function normalizeStatus(raw) {
  if (!raw || typeof raw !== 'object') return CLOSED_STATUS;
  return { maintenance: raw.maintenance === true, message: text(raw.message), until: text(raw.until) };
}

export async function fetchMaintenanceStatus(url = STATUS_URL, fetchImpl = globalThis.fetch) {
  try {
    // no-store: a cached "false" must not hide a fresh "true".
    const res = await fetchImpl(url, { cache: 'no-store', headers: { Accept: 'application/json' } });
    if (!res.ok) return CLOSED_STATUS;
    return normalizeStatus(await res.json());
  } catch {
    return CLOSED_STATUS;
  }
}

/** True for the backend's maintenance answer (see keplix-backend maintenanceMiddleware). */
export const isBackendMaintenance = (status, data) =>
  status === 503 && !!data && typeof data === 'object' && data.code === 'MAINTENANCE';

const listeners = new Set();

export function onBackendMaintenance(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function emitBackendMaintenance(message) {
  for (const fn of [...listeners]) {
    try {
      fn(text(message));
    } catch {
      // One broken listener must not stop the others.
    }
  }
}
