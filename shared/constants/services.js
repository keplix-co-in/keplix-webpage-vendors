// Fixed Service Categories for the entire application
// These are the standardized service categories that vendors must use

export const SERVICE_CATEGORIES = [
  {
    id: 'car_service_repairs',
    name: 'Car Service & Repairs',
    label: 'Car Service & Repairs',
    icon: 'car-sport-outline',
    iconLibrary: 'ionicons',
    color: '#E53E3E',
    description: 'General car servicing and repair work'
  },
  {
    id: 'car_cleaning',
    name: 'Car Cleaning',
    label: 'Car Cleaning',
    icon: 'spray-bottle',
    iconLibrary: 'material-community',
    color: '#E53E3E',
    description: 'Professional car washing and detailing services'
  },
  {
    id: 'dents_painting',
    name: 'Dents & Painting',
    label: 'Dents & Painting',
    icon: 'format-paint',
    iconLibrary: 'material-community',
    color: '#E53E3E',
    description: 'Dent removal and car painting services'
  },
  {
    id: 'interior_services',
    name: 'Interior Services',
    label: 'Interior Services',
    icon: 'car-seat',
    iconLibrary: 'material-community',
    color: '#E53E3E',
    description: 'Interior cleaning and maintenance'
  },
  {
    id: 'tyre_wheel_services',
    name: 'Tyre & Wheel Services',
    label: 'Tyre & Wheel Services',
    icon: 'tire',
    iconLibrary: 'material-community',
    color: '#E53E3E',
    description: 'Tire replacement, balancing, and alignment'
  },
  {
    id: 'ac_services_repair',
    name: 'AC Services & Repair',
    label: 'AC Services & Repair',
    icon: 'thermometer-outline',
    iconLibrary: 'ionicons',
    color: '#E53E3E',
    description: 'Air conditioning repair and maintenance'
  },
  {
    id: 'emergency_services',
    name: 'Emergency Services',
    label: 'Emergency Services',
    icon: 'alarm-light-outline',
    iconLibrary: 'material-community',
    color: '#E53E3E',
    description: '24/7 roadside assistance and emergency support'
  },
  {
    id: 'battery_services',
    name: 'Battery Services',
    label: 'Battery Services',
    icon: 'car-battery',
    iconLibrary: 'material-community',
    color: '#E53E3E',
    description: 'Battery replacement and charging services'
  },
  {
    id: 'car_inspection',
    name: 'Car Inspection',
    label: 'Car Inspection',
    icon: 'clipboard-text-outline',
    iconLibrary: 'material-community',
    color: '#E53E3E',
    description: 'Pre-purchase and periodic vehicle inspection'
  },
  {
    id: 'car_insurance',
    name: 'Car Insurance',
    label: 'Car Insurance',
    icon: 'shield-check-outline',
    iconLibrary: 'material-community',
    color: '#E53E3E',
    description: 'Vehicle insurance assistance and renewal'
  },
  {
    id: 'windshield_lights',
    name: 'Windshield & Lights',
    label: 'Windshield & Lights',
    icon: 'car-windshield-outline',
    iconLibrary: 'material-community',
    color: '#E53E3E',
    description: 'Windshield repair and headlight services'
  },
  {
    id: 'mechanical_repairs',
    name: 'Mechanical Repairs',
    label: 'Mechanical Repairs',
    icon: 'target',
    iconLibrary: 'material-community',
    color: '#E53E3E',
    description: 'Engine and transmission repair work'
  }
];

// Get category by ID
export const getCategoryById = (id) => {
  return SERVICE_CATEGORIES.find(cat => cat.id === id);
};

// Get category by name
export const getCategoryByName = (name) => {
  return SERVICE_CATEGORIES.find(cat => 
    cat.name.toLowerCase() === name.toLowerCase() || 
    cat.label.toLowerCase() === name.toLowerCase()
  );
};

// Get all category names
export const getCategoryNames = () => {
  return SERVICE_CATEGORIES.map(cat => cat.name);
};

// Get all category IDs
export const getCategoryIds = () => {
  return SERVICE_CATEGORIES.map(cat => cat.id);
};

// Export default
export default SERVICE_CATEGORIES;
