// Service duration options, copied from keplix-frontend
// components/Vendor/VendorServices/EditService.jsx (~L31-36).
//
// These are a fixed list, not user data: the label is what the vendor picks and
// the minutes are what the backend stores (Service.duration is an Int). Keep in
// step with the mobile list or the same service reads differently in each app.

export const DURATIONS = [
  '30 min',
  '45 min',
  '1 Hour',
  '1.5 Hours',
  '2 Hours',
  '2.5 Hours',
  '3 Hours',
  '4 Hours',
];

export const DURATION_MAP = {
  '30 min': 30,
  '45 min': 45,
  '1 Hour': 60,
  '1.5 Hours': 90,
  '2 Hours': 120,
  '2.5 Hours': 150,
  '3 Hours': 180,
  '4 Hours': 240,
};

export const durationLabelFor = (minutes) =>
  Object.keys(DURATION_MAP).find((label) => DURATION_MAP[label] === Number(minutes)) ?? null;

export default DURATIONS;
