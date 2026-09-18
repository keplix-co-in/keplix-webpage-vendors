'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, X } from 'lucide-react';
import { usePortalHeader } from '../layout';
import { Card, CardHeader, Kicker } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Chip, Toggle } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import { vendorAPI } from '@/api/vendor';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DEFAULT_HOURS = { open: '09:00', close: '21:00', closed: false };

export default function TimingsPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { vendorProfile } = useAuth();

  const [hours, setHours] = useState(() =>
    Object.fromEntries(DAYS.map((day) => [day, { ...DEFAULT_HOURS }]))
  );
  const [breaks, setBreaks] = useState([]);
  const [seeded, setSeeded] = useState(null);
  const [busy, setBusy] = useState(false);

  usePortalHeader('Timings & holidays', 'Business hours, mid-day breaks and weekly closures');

  // Timings and breaks live on the vendor profile — there is no separate
  // endpoint — so they are seeded from it during render rather than in an
  // effect, which would cascade an extra render on every profile refetch.
  if (vendorProfile && seeded !== vendorProfile) {
    setSeeded(vendorProfile);

    const saved = vendorProfile.timings ?? vendorProfile.working_hours;
    const parsed = typeof saved === 'string' ? safeParse(saved) : saved;
    if (parsed) setHours((current) => ({ ...current, ...parsed }));

    const savedBreaks = vendorProfile.breaks;
    const parsedBreaks = typeof savedBreaks === 'string' ? safeParse(savedBreaks) : savedBreaks;
    if (Array.isArray(parsedBreaks)) setBreaks(parsedBreaks);
  }

  const setDay = (day, patch) => setHours((current) => ({ ...current, [day]: { ...current[day], ...patch } }));

  const save = async () => {
    setBusy(true);
    // The profile route is multipart-aware but accepts JSON too; breaks are sent
    // as a JSON string because that is how the mobile client writes them.
    const result = await vendorAPI.updateProfile({
      timings: hours,
      breaks: JSON.stringify(breaks),
    });
    setBusy(false);

    if (result?.success) {
      queryClient.invalidateQueries({ queryKey: ['vendor-profile'] });
      toast.success('Timings saved');
    } else {
      toast.error(result?.error || 'Could not save your timings');
    }
  };

  return (
    <div className="max-w-[760px]">
      <Card className="mb-5">
        <CardHeader title="Business hours" />
        {DAYS.map((day) => {
          const value = hours[day] ?? DEFAULT_HOURS;
          return (
            <div
              key={day}
              className="flex items-center gap-4 py-3 flex-wrap"
              style={{ borderBottom: '1px solid var(--color-divider)' }}
            >
              <span className="text-[13.5px] font-bold w-[110px] shrink-0">{day}</span>

              {value.closed ? (
                <span className="flex-1 text-[13px] font-bold text-[var(--color-danger)]">Closed</span>
              ) : (
                <span className="flex-1 flex items-center gap-2.5 flex-wrap">
                  <input
                    type="time"
                    value={value.open}
                    onChange={(e) => setDay(day, { open: e.target.value })}
                    aria-label={`${day} opening time`}
                    className="rounded-[var(--radius-well)] px-3 py-2 text-[13px] outline-none"
                    style={{ border: '1px solid var(--color-line-strong)' }}
                  />
                  <span className="text-[var(--color-disabled)]">–</span>
                  <input
                    type="time"
                    value={value.close}
                    onChange={(e) => setDay(day, { close: e.target.value })}
                    aria-label={`${day} closing time`}
                    className="rounded-[var(--radius-well)] px-3 py-2 text-[13px] outline-none"
                    style={{ border: '1px solid var(--color-line-strong)' }}
                  />
                </span>
              )}

              <span className="flex items-center gap-2.5 shrink-0">
                <span className="text-[11.5px] font-bold text-[var(--color-muted)]">Open</span>
                <Toggle
                  checked={!value.closed}
                  onChange={(next) => setDay(day, { closed: !next })}
                  label={`${day} open`}
                />
              </span>
            </div>
          );
        })}
      </Card>

      <Card className="mb-5">
        <CardHeader
          title="Breaks"
          action={
            <Button
              type="button"
              variant="tint"
              size="sm"
              onClick={() => setBreaks([...breaks, { start: '13:00', end: '13:30' }])}
            >
              <Plus size={14} /> Add break
            </Button>
          }
        />

        {breaks.length === 0 ? (
          <p className="text-[12.5px] text-[var(--color-muted)]">
            No breaks set. Add one to stop bookings landing while the shop is shut.
          </p>
        ) : (
          breaks.map((item, index) => (
            <div key={index} className="flex items-center gap-2.5 py-2 flex-wrap">
              <input
                type="time"
                value={item.start}
                onChange={(e) =>
                  setBreaks(breaks.map((b, i) => (i === index ? { ...b, start: e.target.value } : b)))
                }
                aria-label={`Break ${index + 1} start`}
                className="rounded-[var(--radius-well)] px-3 py-2 text-[13px] outline-none"
                style={{ border: '1px solid var(--color-line-strong)' }}
              />
              <span className="text-[var(--color-disabled)]">–</span>
              <input
                type="time"
                value={item.end}
                onChange={(e) =>
                  setBreaks(breaks.map((b, i) => (i === index ? { ...b, end: e.target.value } : b)))
                }
                aria-label={`Break ${index + 1} end`}
                className="rounded-[var(--radius-well)] px-3 py-2 text-[13px] outline-none"
                style={{ border: '1px solid var(--color-line-strong)' }}
              />
              <button
                type="button"
                onClick={() => setBreaks(breaks.filter((_, i) => i !== index))}
                aria-label={`Remove break ${index + 1}`}
                className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
                style={{ border: '1px solid var(--color-line)' }}
              >
                <X size={13} color="var(--color-danger)" />
              </button>
            </div>
          ))
        )}
      </Card>

      <Card className="mb-6">
        <Kicker className="mb-3">Weekly closures</Kicker>
        <div className="flex gap-2.5 flex-wrap">
          {DAYS.map((day) => (
            <Chip
              key={day}
              active={hours[day]?.closed}
              onClick={() => setDay(day, { closed: !hours[day]?.closed })}
            >
              {day}
            </Chip>
          ))}
        </div>
      </Card>

      <Button onClick={save} loading={busy}>
        Save timings
      </Button>
    </div>
  );
}

const safeParse = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};
