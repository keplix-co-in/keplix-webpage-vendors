'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Clock } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { usePortalHeader } from '../layout';
import { Card, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import { vendorAPI } from '@/api/vendor';
import { normalizeIndianMobile, rules, validate } from '@/shared/utils/validation';

const FIELDS = [
  { name: 'business_name', label: 'Shop name', required: true },
  { name: 'phone', label: 'Contact number', required: true },
  { name: 'address', label: 'Street & area' },
  { name: 'city', label: 'City' },
  { name: 'state', label: 'State' },
  { name: 'pincode', label: 'Pincode' },
];

const SCHEMA = {
  business_name: [rules.required('Shop name'), rules.maxLength(120, 'Shop name')],
  phone: [rules.required('Contact number'), rules.mobile],
  pincode: [rules.pincode],
  email: [rules.email],
  description: [rules.maxLength(2000, 'Description')],
};

export default function ProfilePage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { vendorProfile, user } = useAuth();
  const [form, setForm] = useState({});
  const [seeded, setSeeded] = useState(null);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});

  usePortalHeader('Business profile', 'Shop details customers see when they book you');

  // Seed the form when the profile arrives, adjusting state during render
  // rather than in an effect (which would cascade an extra render). The
  // vendor's own edits win afterwards because this only runs when the profile
  // object itself changes.
  if (vendorProfile && seeded !== vendorProfile) {
    setSeeded(vendorProfile);
    setForm({
      business_name: vendorProfile.business_name ?? '',
      phone: vendorProfile.phone ?? user?.phone ?? '',
      address: vendorProfile.address ?? '',
      city: vendorProfile.city ?? '',
      state: vendorProfile.state ?? '',
      pincode: vendorProfile.pincode ?? '',
      description: vendorProfile.description ?? '',
    });
  }

  const setField = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  const save = async (event) => {
    event.preventDefault();

    const { errors: nextErrors, isValid } = validate(form, SCHEMA);
    setErrors(nextErrors);
    if (!isValid) return;

    setBusy(true);
    // Stored in the same normalised form the backend uses everywhere else, so
    // this number matches the one on a walk-in or an OTP record.
    const result = await vendorAPI.updateProfile({
      ...form,
      phone: normalizeIndianMobile(form.phone) ?? form.phone,
    });
    setBusy(false);

    if (result?.success) {
      queryClient.invalidateQueries({ queryKey: ['vendor-profile'] });
      toast.success('Profile updated');
    } else {
      toast.error(result?.error || 'Could not save your profile');
    }
  };

  return (
    <form onSubmit={save} className="max-w-[720px]">
      <Card className="mb-5">
        <CardHeader title="Shop details" />
        <div className="grid grid-cols-2 gap-4 max-[880px]:grid-cols-[minmax(0,1fr)]">
          {FIELDS.map((field) => (
            <Input
              key={field.name}
              label={field.label}
              name={field.name}
              required={field.required}
              value={form[field.name] ?? ''}
              onChange={setField(field.name)}
              error={errors[field.name]}
            />
          ))}
        </div>

        <Textarea
          label="About the workshop"
          name="description"
          className="mt-4"
          value={form.description ?? ''}
          onChange={setField('description')}
          error={errors.description}
          placeholder="What your workshop specialises in."
        />
      </Card>

      {/* Timings left the sidebar; this is now the way in to the page. */}
      <Link
        href="/timings"
        className="flex items-center justify-between gap-4 bg-white rounded-[var(--radius-portal)] px-[22px] py-4 mb-5"
        style={{ border: '1px solid var(--color-line)' }}
      >
        <span className="flex items-center gap-3 min-w-0">
          <Clock size={18} color="var(--color-primary)" />
          <span>
            <span className="block text-[13.5px] font-bold">Timings &amp; holidays</span>
            <span className="block text-[12px] text-[var(--color-muted)]">
              Opening hours, mid-day breaks and weekly closures
            </span>
          </span>
        </span>
        <ChevronRight size={16} color="var(--color-disabled)" />
      </Link>

      <Button type="submit" loading={busy}>
        Save changes
      </Button>
    </form>
  );
}
