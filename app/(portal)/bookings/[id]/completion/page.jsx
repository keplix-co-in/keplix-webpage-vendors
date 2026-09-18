'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Camera, X } from 'lucide-react';
import { usePortalHeader } from '../../../layout';
import { Card, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import { bookingsAPI } from '@/api/bookings';

// Notes survive the trip through the health-sheet gate; photos cannot be
// stashed (File objects are not serialisable), and the normal route inspects
// before reaching this screen, so the gate is only a safety net here.
const draftKey = (id) => `keplix_completion_notes_${id}`;

export default function CompletionPage() {
  return (
    <Suspense fallback={null}>
      <CompletionForm />
    </Suspense>
  );
}

function CompletionForm() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { vendorId } = useAuth();
  const fileInput = useRef(null);

  const [notes, setNotes] = useState('');
  const [images, setImages] = useState([]);
  const [busy, setBusy] = useState(false);

  usePortalHeader('Service completion', 'Photos, notes and the final bill');

  // Restored after mount rather than during render: the draft only exists in
  // the browser, so seeding initial state with it would not match the markup
  // rendered on the server.
  useEffect(() => {
    let cancelled = false;

    Promise.resolve()
      .then(() => {
        try {
          return sessionStorage.getItem(draftKey(id));
        } catch {
          return null; // Storage unavailable — the vendor just retypes.
        }
      })
      .then((saved) => {
        if (!cancelled && saved) setNotes(saved);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const addImage = (file) => {
    if (!file) return;
    setImages((prev) => [...prev, { file, preview: URL.createObjectURL(file) }]);
  };

  const removeImage = (index) => {
    setImages((prev) => {
      const next = [...prev];
      const [removed] = next.splice(index, 1);
      if (removed?.preview) URL.revokeObjectURL(removed.preview);
      return next;
    });
  };

  const submit = async () => {
    setBusy(true);

    // Rebuilt per attempt: a FormData consumed by a failed request cannot be
    // safely resent.
    const formData = new FormData();
    formData.append('status', 'completed');
    if (notes.trim()) formData.append('notes', notes.trim());
    images.forEach(({ file }) => formData.append('images', file));

    const result = await bookingsAPI.completeBooking(vendorId, id, formData);
    setBusy(false);

    if (result?.success) {
      try {
        sessionStorage.removeItem(draftKey(id));
      } catch {
        // Nothing to clean up if storage is blocked.
      }
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      router.replace(`/bookings/${id}/completed`);
      return;
    }

    // The mandatory-inspection gate rejected this because no health sheet
    // exists. Recoverable, not an error: nothing was persisted, so the vendor
    // fills the sheet and comes straight back to finish.
    const code = result?.code ?? result?.details?.code;
    if (code === 'HEALTH_SHEET_REQUIRED' || result?.status === 409) {
      try {
        sessionStorage.setItem(draftKey(id), notes);
      } catch {
        // Losing the draft is better than losing the flow.
      }
      toast.info('The health sheet is required first — opening it now.');
      router.push(`/bookings/${id}/inspection`);
      return;
    }

    toast.error(result?.error || 'Could not complete this job.');
  };

  const cameFromInspection = searchParams.get('from') === 'inspection';

  return (
    <div className="max-w-[720px]">
      {cameFromInspection && (
        <p className="text-[12.5px] text-[var(--color-success-dark)] mb-4 font-bold">
          Health sheet saved. Add the finishing photos and close the job.
        </p>
      )}

      <Card className="mb-5">
        <CardHeader title="Completion photos" subtitle="Shown to the customer with the final bill" />

        <div className="flex gap-2.5 flex-wrap items-center">
          {images.map((image, index) => (
            <div
              key={image.preview}
              className="relative w-[96px] h-[96px] rounded-[var(--radius-well)] overflow-hidden"
              style={{ border: '1px solid var(--color-line)' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.preview} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(index)}
                aria-label="Remove photo"
                className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center cursor-pointer"
                style={{ background: 'rgba(17,24,39,.6)' }}
              >
                <X size={11} color="#fff" />
              </button>
            </div>
          ))}

          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              addImage(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="w-[96px] h-[96px] rounded-[var(--radius-well)] flex flex-col items-center justify-center gap-1.5 cursor-pointer text-[var(--color-disabled)]"
            style={{ border: '1px dashed var(--color-line-strong)', background: 'var(--color-canvas)' }}
          >
            <Camera size={20} />
            <span className="text-[11px]">Add photo</span>
          </button>
        </div>
      </Card>

      <Card className="mb-5">
        <CardHeader title="Notes" />
        <Textarea
          label="What was done?"
          placeholder="Work carried out, parts replaced, anything the customer should know"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={5}
        />
      </Card>

      <div className="flex gap-3 flex-wrap">
        <Button variant="outline" onClick={() => router.back()}>
          Back
        </Button>
        <Button variant="teal" loading={busy} onClick={submit}>
          Save &amp; complete
        </Button>
      </div>
    </div>
  );
}
