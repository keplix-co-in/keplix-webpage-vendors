'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { usePortalHeader } from '../layout';
import { Card, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import { vendorAPI } from '@/api/vendor';

const FIELDS = [
  { name: 'business_name', label: 'Shop name', required: true },
  { name: 'phone', label: 'Contact number', required: true },
  { name: 'address', label: 'Street & area' },
  { name: 'city', label: 'City' },
  { name: 'state', label: 'State' },
  { name: 'pincode', label: 'Pincode' },
];

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

  const save = async (event) => {
    event.preventDefault();

    const next = {};
    if (!form.business_name?.trim()) next.business_name = 'Your shop needs a name.';
    if (!form.phone?.trim()) next.phone = 'Customers need a number to reach you on.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setBusy(true);
    const result = await vendorAPI.updateProfile(form);
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
              onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
              error={errors[field.name]}
            />
          ))}
        </div>

        <Textarea
          label="About the workshop"
          name="description"
          className="mt-4"
          value={form.description ?? ''}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="What your workshop specialises in."
        />
      </Card>

      <Button type="submit" loading={busy}>
        Save changes
      </Button>
    </form>
  );
}
