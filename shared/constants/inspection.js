/**
 * Vehicle health sheet constants, ported from
 * keplix-frontend/components/Vendor/Bookings/VehicleInspection.jsx (~L29).
 *
 * Icons are keyed by HealthComponent.key — the stable machine key — so an admin
 * renaming a component's label does not break the mapping. Walk-in sheets
 * render *service* cards instead, which have no component key, and fall back to
 * the generic wrench.
 */
export const COMPONENT_ICON = {
  engine_oil: '/assets/icons/oil_coin.png',
  brakes: '/assets/icons/brake.png',
  battery: '/assets/icons/battery.png',
  tyres: '/assets/icons/tyre.png',
  ac_filter: '/assets/icons/ac.png',
};

export const FALLBACK_ICON = '/assets/icons/wrench.png';

export const iconFor = (componentKey) => COMPONENT_ICON[componentKey] ?? FALLBACK_ICON;

export const STATUS_OPTIONS = [
  { value: 'GOOD', label: 'Good', color: '#16A34A', bg: '#ECFDF5' },
  { value: 'ATTENTION', label: 'Attention', color: '#D97706', bg: '#FFFBEB' },
  { value: 'REPLACE', label: 'Replace', color: '#DC2626', bg: '#FEF2F2' },
];

// Unselected segment styling, per the handoff.
export const STATUS_UNSELECTED = { color: '#9CA3AF', bg: '#FFFFFF', border: '#E5E7EB' };

// The mechanic clears exceptions rather than touching every item on a normal
// service, so everything starts as GOOD.
export const DEFAULT_STATUS = 'GOOD';

export const MAX_PHOTOS_PER_ITEM = 2;
