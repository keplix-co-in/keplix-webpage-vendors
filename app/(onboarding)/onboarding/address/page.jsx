'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import OnboardingShell, { StepActions } from '@/components/onboarding/OnboardingShell';
import { useDraft } from '@/components/onboarding/DraftProvider';
import MapPicker from '@/components/onboarding/MapPicker';
import Input from '@/components/ui/Input';
import { rules, validate } from '@/shared/utils/validation';

const SCHEMA = {
  street: [rules.required('Road / lane'), rules.maxLength(200, 'Road / lane')],
  area: [rules.required('Area'), rules.maxLength(200, 'Area')],
  city: [rules.required('City'), rules.maxLength(100, 'City')],
  pincode: [rules.required('Pincode'), rules.pincode],
  state: [rules.maxLength(100, 'State')],
  landmark: [rules.maxLength(200, 'Landmark')],
};

export default function AddressEntryPage() {
  const router = useRouter();
  const { draft, patch } = useDraft();
  const { address } = draft;
  const [errors, setErrors] = useState({});

  const field = (key) => ({
    name: key,
    value: address[key],
    error: errors[key],
    onChange: (e) => {
      patch({ address: { [key]: e.target.value } });
      setErrors((current) => (current[key] ? { ...current, [key]: null } : current));
    },
  });

  // The pin fills the address fields in, but never overwrites something the
  // vendor has already typed — the geocoder is a shortcut, not the authority.
  const onPick = useCallback(
    ({ lat, lng, label, ...resolved }) => {
      const next = {};
      Object.entries(resolved).forEach(([key, val]) => {
        if (val && !address[key]) next[key] = val;
      });
      // Coordinates live under `location`, which is what the submit payload
      // reads for latitude/longitude.
      patch({ address: next, location: { latitude: lat, longitude: lng, label: label ?? '' } });
    },
    [address, patch]
  );

  const save = () => {
    const { errors: found, isValid } = validate(address, SCHEMA);
    setErrors(found);
    if (!isValid) return;

    router.push('/onboarding/workshop');
  };

  return (
    <OnboardingShell
      title="Shop Address"
      subtitle="As per your shop's location."
      footer={
        <StepActions
          backHref="/onboarding/workshop"
          nextLabel="Save workshop address"
          onNext={save}
        />
      }
    >
      <MapPicker
        value={{ lat: draft.location.latitude, lng: draft.location.longitude, label: draft.location.label }}
        onPick={onPick}
      />

      <div className="grid grid-cols-2 gap-4 max-[880px]:grid-cols-1">
        <Input label="Shop no / building no (optional)" {...field('building')} />
        <Input label="Floor / Tower (optional)" {...field('floor')} />
        <Input label="Road / Lane" required {...field('street')} />
        <Input label="Area / Sector / Locality" required {...field('area')} />
        <Input label="City" required {...field('city')} />
        <Input label="State" {...field('state')} />
        <Input label="Pincode" required inputMode="numeric" {...field('pincode')} />
      </div>

      <Input
        label="Add any nearby landmark (optional)"
        className="mt-[18px]"
        {...field('landmark')}
      />
    </OnboardingShell>
  );
}
