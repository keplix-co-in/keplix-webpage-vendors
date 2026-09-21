'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, X } from 'lucide-react';
import { usePortalHeader } from '../layout';
import { Card, CardHeader, Kicker } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Chip } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import { vendorAPI } from '@/api/vendor';
import TimeSelect, { toMinutes } from '@/components/onboarding/TimeSelect';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/**
 * The backend keeps ONE opening window for the whole week, not a schedule per
 * day: `operating_hours` is a single string ("9:00 AM - 9:00 PM"), `breaks` is
 * a JSON list of strings ("1:00 PM - 1:30 PM") and `holidays` a JSON list of
 * day names. This page used to save a per-day object into a `timings` field the
 * backend has no column for, and read a `working_hours` field it never returns,
 * so nothing a vendor entered here was stored or shown back.
 */
const parseJsonList = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string' || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const splitRange = (value) => {
  const [start = '', end = ''] = String(value ?? '')
    .split(/\s+-\s+/)
    .map((part) => part.trim());
  return { start, end };
};

// Breaks written by older web builds were {start, end} objects; the app writes
// strings. Accept both so nothing already saved disappears.
const toBreak = (item) =>
  typeof item === 'string' ? splitRange(item) : { start: item?.start ?? '', end: item?.end ?? '' };

const validateTimings = ({ open, close }, breaks) => {
  const errors = {};

  const openAt = toMinutes(open);
  const closeAt = toMinutes(close);

  if (openAt === null || closeAt === null) {
    errors.hours = 'Choose both an opening and a closing time.';
  } else if (closeAt <= openAt) {
    errors.hours = 'Closing time must be after opening time.';
  }

  breaks.forEach((item, index) => {
    const start = toMinutes(item.start);
    const end = toMinutes(item.end);

    if (start === null || end === null) {
      errors[`break-${index}`] = 'Choose both a start and an end time.';
    } else if (end <= start) {
      errors[`break-${index}`] = 'A break must end after it starts.';
    } else if (openAt !== null && closeAt !== null && (start < openAt || end > closeAt)) {
      errors[`break-${index}`] = 'This break falls outside your opening hours.';
    }
  });

  return errors;
};

export default function TimingsPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { vendorProfile } = useAuth();

  const [hours, setHours] = useState({ open: '', close: '' });
  const [breaks, setBreaks] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [seeded, setSeeded] = useState(null);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  usePortalHeader('Timings & holidays', 'Business hours, mid-day breaks and weekly closures');

  // Seeded during render rather than in an effect, so a profile refetch does not
  // cascade an extra render. The vendor's edits win until the profile changes.
  if (vendorProfile && seeded !== vendorProfile) {
    setSeeded(vendorProfile);
    const { start, end } = splitRange(vendorProfile.operating_hours);
    setHours({ open: start, close: end });
    setBreaks(parseJsonList(vendorProfile.breaks).map(toBreak));
    setHolidays(parseJsonList(vendorProfile.holidays));
  }

  const openTime = hours.open;
  const closeTime = hours.close;

  const setHour = (key) => (value) => {
    setHours((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, hours: null }));
  };

  const setBreak = (index, key, value) => {
    setBreaks((current) => current.map((item, i) => (i === index ? { ...item, [key]: value } : item)));
    setErrors((current) => ({ ...current, [`break-${index}`]: null }));
  };

  const toggleHoliday = (day) =>
    setHolidays((current) =>
      current.includes(day) ? current.filter((d) => d !== day) : [...current, day]
    );

  const save = async () => {
    const found = validateTimings({ open: openTime, close: closeTime }, breaks);
    setErrors(found);
    if (Object.values(found).some(Boolean)) return;

    setBusy(true);
    const result = await vendorAPI.updateProfile({
      operating_hours: `${openTime} - ${closeTime}`,
      // JSON strings, as the profile route reads them from multipart or JSON.
      breaks: JSON.stringify(breaks.map((b) => `${b.start} - ${b.end}`)),
      holidays: JSON.stringify(holidays),
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
        <CardHeader title="Business hours" subtitle="Your opening window, every working day" />

        <div className="flex items-center gap-3 flex-wrap">
          <TimeSelect ariaLabel="Opening time" value={openTime} onChange={setHour('open')} />
          <span className="text-[var(--color-disabled)]">to</span>
          <TimeSelect ariaLabel="Closing time" value={closeTime} onChange={setHour('close')} />
        </div>

        {errors.hours && (
          <p className="mt-3 text-[11.5px] font-bold text-[var(--color-danger)]">{errors.hours}</p>
        )}
      </Card>

      <Card className="mb-5">
        <CardHeader
          title="Breaks"
          action={
            <Button
              type="button"
              variant="tint"
              size="sm"
              onClick={() => setBreaks([...breaks, { start: '', end: '' }])}
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
            <div key={index} className="py-2">
              <div className="flex items-center gap-2.5 flex-wrap">
                <TimeSelect
                  ariaLabel={`Break ${index + 1} start`}
                  value={item.start}
                  onChange={(value) => setBreak(index, 'start', value)}
                />
                <span className="text-[var(--color-disabled)]">to</span>
                <TimeSelect
                  ariaLabel={`Break ${index + 1} end`}
                  value={item.end}
                  onChange={(value) => setBreak(index, 'end', value)}
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
              {errors[`break-${index}`] && (
                <p className="mt-2 text-[11.5px] font-bold text-[var(--color-danger)]">
                  {errors[`break-${index}`]}
                </p>
              )}
            </div>
          ))
        )}
      </Card>

      <Card className="mb-6">
        <Kicker className="mb-3">Weekly holidays</Kicker>
        <div className="flex gap-2.5 flex-wrap">
          {DAYS.map((day) => (
            <Chip key={day} active={holidays.includes(day)} onClick={() => toggleHoliday(day)}>
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
