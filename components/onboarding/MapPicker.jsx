'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Crosshair, Loader2, MapPin, Search } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import Button from '@/components/ui/Button';

/**
 * Shop location picker, matching the mobile app's WorkshopAddressMap.jsx:
 * Leaflet with OpenStreetMap tiles and a fixed centre pin — the map moves under
 * the pin, rather than the pin being dragged — and the address is resolved from
 * wherever the pin lands.
 *
 * Mobile reverse-geocodes through expo-location; the browser has no equivalent,
 * so this uses Nominatim, OpenStreetMap's own geocoder, which keeps the tiles
 * and the addresses coming from the same dataset. Nominatim asks callers to
 * identify themselves and to keep it to one request a second, so lookups are
 * debounced and only fire when the map stops moving.
 */

const DEFAULT_CENTER = { lat: 28.6448, lng: 77.216 }; // New Delhi
const NOMINATIM = 'https://nominatim.openstreetmap.org';

/** Maps a Nominatim result onto the same fields the mobile screen fills in. */
const toAddress = (result) => {
  const a = result?.address ?? {};
  return {
    street: a.road ?? a.pedestrian ?? a.neighbourhood ?? '',
    area: a.suburb ?? a.city_district ?? a.village ?? a.town ?? '',
    city: a.city ?? a.town ?? a.village ?? a.state_district ?? '',
    state: a.state ?? '',
    pincode: a.postcode ?? '',
    label: result?.display_name ?? '',
  };
};

export default function MapPicker({ value, onPick }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const debounceRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState('');
  const [label, setLabel] = useState(value?.label ?? '');
  const [error, setError] = useState(null);

  const resolve = useCallback(
    async (lat, lng) => {
      setBusy(true);
      setError(null);
      try {
        const response = await fetch(
          `${NOMINATIM}/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`,
          { headers: { Accept: 'application/json' } }
        );
        if (!response.ok) throw new Error('lookup failed');
        const data = await response.json();
        const address = toAddress(data);
        setLabel(address.label);
        onPick({ ...address, lat, lng });
      } catch {
        // The pin is still valid even when the lookup fails — keep the
        // coordinates and let the vendor type the address themselves.
        setError('Could not look up that address. You can still type it below.');
        onPick({ lat, lng });
      } finally {
        setBusy(false);
      }
    },
    [onPick]
  );

  // Leaflet touches window on import, so it is loaded only in the browser.
  useEffect(() => {
    let map;
    let cancelled = false;

    (async () => {
      const L = (await import('leaflet')).default;
      if (cancelled || !containerRef.current || mapRef.current) return;

      const start = value?.lat && value?.lng ? [value.lat, value.lng] : [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng];

      map = L.map(containerRef.current, { zoomControl: true, attributionControl: true }).setView(
        start,
        17
      );
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap',
      }).addTo(map);

      map.on('moveend', () => {
        const centre = map.getCenter();
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => resolve(centre.lat, centre.lng), 600);
      });

      mapRef.current = map;
    })();

    return () => {
      cancelled = true;
      clearTimeout(debounceRef.current);
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // Re-running this would tear down the map mid-interaction; the pin position
    // is driven through the map instance instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const search = async (event) => {
    event.preventDefault();
    if (!query.trim()) return;

    setBusy(true);
    setError(null);
    try {
      const response = await fetch(
        `${NOMINATIM}/search?format=jsonv2&limit=1&addressdetails=1&q=${encodeURIComponent(query)}`,
        { headers: { Accept: 'application/json' } }
      );
      const [hit] = await response.json();
      if (!hit) {
        setError('Could not find that location.');
        return;
      }
      const lat = Number(hit.lat);
      const lng = Number(hit.lon);
      mapRef.current?.setView([lat, lng], 17);
      const address = toAddress(hit);
      setLabel(address.label);
      onPick({ ...address, lat, lng });
    } catch {
      setError('Search failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('This browser cannot share your location.');
      return;
    }

    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        mapRef.current?.setView([coords.latitude, coords.longitude], 17);
        resolve(coords.latitude, coords.longitude);
      },
      () => {
        setBusy(false);
        setError('Location permission is needed to use your current location.');
      },
      { enableHighAccuracy: true, timeout: 20000 }
    );
  };

  return (
    <div className="mb-[22px]">
      <form onSubmit={search} className="flex gap-2.5 mb-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search
            size={15}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-disabled)]"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for your shop's area"
            aria-label="Search for a location"
            className="w-full rounded-[var(--radius-field)] pl-10 pr-4 py-3 text-[13.5px] outline-none"
            style={{ background: 'var(--color-canvas)', border: '1px solid var(--color-line)' }}
          />
        </div>
        <Button type="submit" size="md" disabled={busy || !query.trim()}>
          Search
        </Button>
        <Button type="button" variant="outline" size="md" onClick={useCurrentLocation} disabled={busy}>
          <Crosshair size={15} /> Current
        </Button>
      </form>

      <div className="relative rounded-[18px] overflow-hidden" style={{ border: '1px solid var(--color-line)' }}>
        <div ref={containerRef} className="h-[280px] w-full" style={{ zIndex: 0 }} />

        {/* Fixed centre pin, as on mobile: the map moves beneath it. */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center pb-6">
          <MapPin size={34} color="var(--color-primary)" fill="var(--color-primary-tint)" />
        </div>

        {busy && (
          <div
            className="absolute top-3 right-3 flex items-center gap-2 rounded-[var(--radius-pill)] px-3 py-1.5 text-[11.5px] font-bold"
            style={{ background: 'white', border: '1px solid var(--color-line)' }}
          >
            <Loader2 size={12} className="animate-spin" /> Locating…
          </div>
        )}
      </div>

      <p className="text-[12px] text-[var(--color-muted)] mt-2.5 leading-[1.6]">
        {label ? (
          <>
            Pin is on: <span className="font-bold text-[var(--color-ink-body)]">{label}</span>
          </>
        ) : (
          'Move the map so the pin sits on your shop entrance.'
        )}
      </p>

      {error && <p className="text-[11.5px] font-bold text-[var(--color-danger)] mt-1.5">{error}</p>}
    </div>
  );
}
