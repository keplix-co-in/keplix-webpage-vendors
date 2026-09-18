'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { Pencil } from 'lucide-react';
import { usePortalHeader } from '../layout';
import { Card, EmptyState } from '@/components/ui/Card';
import { Chip, Toggle } from '@/components/ui/Field';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import { useServices } from '@/lib/queries';
import { servicesAPI } from '@/api/services';
import { SERVICE_CATEGORIES } from '@/shared/constants/services';
import { formatMoney } from '@/lib/format';
import { formatDuration } from '@/shared/utils/duration';

export default function ServicesPage() {
  const { vendorId } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { data: services = [], isLoading } = useServices();
  const [category, setCategory] = useState('All');
  const [pausing, setPausing] = useState(null);

  usePortalHeader(
    'Service catalog',
    `${services.length} service${services.length === 1 ? '' : 's'} across the Keplix categories`
  );

  // Only categories the vendor actually offers are worth filtering by.
  const categories = useMemo(() => {
    const used = new Set(services.map((s) => s.category).filter(Boolean));
    return ['All', ...SERVICE_CATEGORIES.map((c) => c.name).filter((name) => used.has(name))];
  }, [services]);

  const visible = useMemo(
    () => (category === 'All' ? services : services.filter((s) => s.category === category)),
    [services, category]
  );

  const togglePause = async (service) => {
    setPausing(service.id);
    const result = await servicesAPI.updateService(vendorId, service.id, {
      ...service,
      is_active: !service.is_active,
    });
    setPausing(null);

    if (result?.success) {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success(service.is_active ? 'Service paused' : 'Service is live again');
    } else {
      toast.error(result?.error || 'Could not update that service');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
        <div className="flex gap-2.5 flex-wrap">
          {categories.map((name) => (
            <Chip key={name} active={category === name} onClick={() => setCategory(name)}>
              {name}
            </Chip>
          ))}
        </div>
        <Link href="/services/new">
          <Button size="md">+ Add service</Button>
        </Link>
      </div>

      {isLoading ? (
        <Card>
          <div className="text-[13px] text-[var(--color-muted)]">Loading your catalog…</div>
        </Card>
      ) : visible.length === 0 ? (
        <Card>
          <EmptyState
            title="No services yet"
            body="Add the work your workshop offers, with a price and a duration, so customers can book it."
            action={
              <Link href="/services/new">
                <Button size="md">Add your first service</Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-2 max-[880px]:grid-cols-[minmax(0,1fr)]">
          {visible.map((service) => (
            <Card key={service.id} className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[10.5px] font-bold tracking-[1px] text-[var(--color-disabled)] uppercase mb-1.5">
                    {service.category}
                  </div>
                  <div className="text-[15px] font-bold truncate">{service.name}</div>
                </div>
                <Link
                  href={`/services/${service.id}/edit`}
                  aria-label={`Edit ${service.name}`}
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{ border: '1px solid var(--color-line)' }}
                >
                  <Pencil size={14} color="var(--color-ink-body)" />
                </Link>
              </div>

              {service.description && (
                <p className="text-[13px] text-[var(--color-muted)] leading-[1.6] line-clamp-2">
                  {service.description}
                </p>
              )}

              <div className="flex items-center justify-between gap-3 pt-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-[17px] font-bold">{formatMoney(service.price)}</span>
                  {formatDuration(service.duration) && (
                    <span className="text-[12px] text-[var(--color-muted)]">
                      · {formatDuration(service.duration)}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2.5">
                  <span className="text-[11.5px] font-bold text-[var(--color-muted)]">
                    {service.is_active ? 'Live' : 'Paused'}
                  </span>
                  <Toggle
                    checked={Boolean(service.is_active)}
                    onChange={() => pausing !== service.id && togglePause(service)}
                    label={`${service.is_active ? 'Pause' : 'Resume'} ${service.name}`}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
