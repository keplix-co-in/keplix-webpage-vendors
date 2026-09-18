'use client';

import { useParams } from 'next/navigation';
import { usePortalHeader } from '../../../layout';
import ServiceForm from '@/components/services/ServiceForm';
import { useServices } from '@/lib/queries';
import { Card } from '@/components/ui/Card';

export default function EditServicePage() {
  // params is a Promise in Next 16, so client components read it through the hook.
  const { id } = useParams();
  const { data: services = [], isLoading } = useServices();
  const service = services.find((s) => String(s.id) === String(id));

  usePortalHeader('Edit Service', service?.name ?? '');

  if (isLoading) {
    return (
      <Card>
        <div className="text-[13px] text-[var(--color-muted)]">Loading service…</div>
      </Card>
    );
  }

  if (!service) {
    return (
      <Card>
        <div className="text-[13px] text-[var(--color-muted)]">
          That service no longer exists in your catalog.
        </div>
      </Card>
    );
  }

  return <ServiceForm service={service} />;
}
