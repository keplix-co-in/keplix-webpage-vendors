'use client';

import { usePortalHeader } from '../../layout';
import ServiceForm from '@/components/services/ServiceForm';

export default function NewServicePage() {
  usePortalHeader('Add Service', 'Set what you offer, for which vehicles, and at what price');
  return <ServiceForm />;
}
