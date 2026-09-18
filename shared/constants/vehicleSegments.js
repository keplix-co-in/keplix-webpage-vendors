// Vehicle size classes a service's price can vary by. Must match the
// VehicleSegment enum on the backend (prisma/schema.prisma) exactly — these
// values are sent as-is in `segment_prices` and echoed back by the API.

export const VEHICLE_SEGMENTS = [
  {
    id: 'HATCHBACK',
    name: 'Hatchback',
    icon: 'car-outline',
    iconLibrary: 'ionicons',
    description: 'e.g. Swift, i20, Baleno',
  },
  {
    id: 'SEDAN',
    name: 'Sedan',
    icon: 'car-sport-outline',
    iconLibrary: 'ionicons',
    description: 'e.g. City, Verna, Ciaz',
  },
  {
    id: 'COMPACT_SUV',
    name: 'Compact SUV',
    icon: 'car-outline',
    iconLibrary: 'ionicons',
    description: 'e.g. Venue, Brezza, Nexon',
  },
  {
    id: 'MUV',
    name: 'MUV',
    icon: 'bus-outline',
    iconLibrary: 'ionicons',
    description: 'e.g. Ertiga, Innova, Carens',
  },
  {
    id: 'LUXURY',
    name: 'Luxury',
    icon: 'diamond-outline',
    iconLibrary: 'ionicons',
    description: 'e.g. Fortuner, BMW, Mercedes',
  },
];

export const getSegmentById = (id) => VEHICLE_SEGMENTS.find((s) => s.id === id);

export default VEHICLE_SEGMENTS;
