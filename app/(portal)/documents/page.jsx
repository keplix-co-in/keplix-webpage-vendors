'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Lock, FileText } from 'lucide-react';
import { usePortalHeader } from '../layout';
import { Card, CardHeader, Kicker } from '@/components/ui/Card';
import Badge, { statusTone } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import UploadField from '@/components/ui/Upload';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import { vendorAPI, documentsAPI } from '@/api/vendor';
import { unwrap } from '@/lib/queries';
import { formatDate } from '@/lib/format';
import { rules, validate } from '@/shared/utils/validation';

// Format rules only — whether enough was filled in is the bank-or-UPI check in
// savePayout, which cannot be expressed per-field.
const SCHEMA = {
  gst_number: [rules.gstin],
  bank_account_number: [rules.accountNumber],
  ifsc_code: [rules.ifsc],
  bank_account_holder_name: [rules.maxLength(120, 'Account holder name')],
  upi_id: [rules.upi],
};

// PAN and the trade licence are locked once Keplix has verified them — changing
// a verified identity document has to go through support, not a self-serve edit.
const LOCKED_TYPES = ['pan', 'trade_licence', 'trade_license'];

// document_type is stored as a short code ("pan"), so a raw render read "Pan".
const DOC_LABELS = {
  pan: 'PAN card',
  gstin: 'GSTIN certificate',
  trade_licence: 'Trade licence',
  trade_license: 'Trade licence',
  bank_proof: 'Bank proof',
};

const docLabel = (type) =>
  DOC_LABELS[String(type ?? '').toLowerCase()] ?? String(type ?? 'Document').replace(/_/g, ' ');

const isVerified = (doc) =>
  ['verified', 'approved'].includes(String(doc?.status ?? '').toLowerCase());

export default function DocumentsPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { vendorProfile } = useAuth();
  const [payout, setPayout] = useState({});
  const [seeded, setSeeded] = useState(null);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [newDoc, setNewDoc] = useState({ file: null, type: 'bank_proof' });

  usePortalHeader('My documents', 'Payout details you can edit, and the documents we verified');

  const { data: documents = [] } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => unwrap(await documentsAPI.getDocuments(), 'documents'),
  });

  // Seeded during render rather than in an effect, so the form does not flash
  // empty and then repopulate. The vendor's edits win once seeded.
  if (vendorProfile && seeded !== vendorProfile) {
    setSeeded(vendorProfile);
    setPayout({
      // The column is gst_number — `gstin` matched nothing, so the box showed
      // blank and a save wrote a field the backend silently ignores.
      gst_number: vendorProfile.gst_number ?? '',
      bank_account_number: vendorProfile.bank_account_number ?? '',
      ifsc_code: vendorProfile.ifsc_code ?? '',
      bank_account_holder_name: vendorProfile.bank_account_holder_name ?? '',
      upi_id: vendorProfile.upi_id ?? '',
    });
  }

  const setField = (key) => (event) => {
    setPayout((prev) => ({ ...prev, [key]: event.target.value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  const savePayout = async (event) => {
    event.preventDefault();

    // Format first, so "add your bank details" is never shown for a value the
    // vendor did fill in but mistyped.
    const { errors: nextErrors, isValid } = validate(payout, SCHEMA);
    setErrors(nextErrors);
    if (!isValid) return;

    // The backend accepts either a full bank triplet or a UPI id — saving
    // neither would leave payouts with nowhere to land.
    const hasBank =
      payout.bank_account_number?.trim() &&
      payout.ifsc_code?.trim() &&
      payout.bank_account_holder_name?.trim();
    if (!hasBank && !payout.upi_id?.trim()) {
      toast.error('Add either your full bank details or a UPI ID.');
      return;
    }

    setBusy(true);
    const result = await vendorAPI.updateProfile(payout);
    setBusy(false);

    if (result?.success) {
      queryClient.invalidateQueries({ queryKey: ['vendor-profile'] });
      toast.success('Payout details updated');
    } else {
      toast.error(result?.error || 'Could not save your payout details');
    }
  };

  const upload = async () => {
    if (!newDoc.file) return;

    const form = new FormData();
    form.append('file_url', newDoc.file);
    form.append('document_type', newDoc.type);

    setBusy(true);
    const result = await documentsAPI.uploadDocument(form);
    setBusy(false);

    if (result?.success) {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setNewDoc({ file: null, type: newDoc.type });
      toast.success('Document uploaded — the Keplix team will review it.');
    } else {
      toast.error(result?.error || 'Upload failed');
    }
  };

  return (
    <div
      className="grid gap-6 items-start max-[880px]:grid-cols-[minmax(0,1fr)]"
      style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,340px)' }}
    >
      <form onSubmit={savePayout} className="min-w-0">
        <Card className="mb-5">
          <CardHeader title="Payout details" subtitle="Where your earnings are sent" />

          <Input
            label="GSTIN number"
            name="gst_number"
            value={payout.gst_number ?? ''}
            onChange={setField('gst_number')}
            error={errors.gst_number}
            className="mb-4"
          />

          <div className="grid grid-cols-2 gap-4 max-[880px]:grid-cols-[minmax(0,1fr)]">
            <Input
              label="Bank account number"
              name="bank_account_number"
              value={payout.bank_account_number ?? ''}
              onChange={setField('bank_account_number')}
              error={errors.bank_account_number}
            />
            <Input
              label="IFSC code"
              name="ifsc_code"
              value={payout.ifsc_code ?? ''}
              onChange={setField('ifsc_code')}
              error={errors.ifsc_code}
            />
            <Input
              label="Name in the bank"
              name="bank_account_holder_name"
              value={payout.bank_account_holder_name ?? ''}
              onChange={setField('bank_account_holder_name')}
              error={errors.bank_account_holder_name}
            />
            <Input
              label="UPI ID"
              name="upi_id"
              value={payout.upi_id ?? ''}
              onChange={setField('upi_id')}
              error={errors.upi_id}
              hint="Bank details or UPI — either is enough."
            />
          </div>
        </Card>

        <Button type="submit" loading={busy}>
          Save payout details
        </Button>
      </form>

      <div className="min-w-0">
        <Card className="mb-5">
          <CardHeader title="Uploaded documents" />
          {documents.length === 0 ? (
            <p className="text-[12.5px] text-[var(--color-muted)]">Nothing uploaded yet.</p>
          ) : (
            documents.map((doc) => {
              const locked =
                isVerified(doc) && LOCKED_TYPES.includes(String(doc.document_type).toLowerCase());
              return (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 py-3"
                  style={{ borderBottom: '1px solid var(--color-divider)' }}
                >
                  <FileText size={16} className="shrink-0 text-[var(--color-muted)]" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-bold capitalize truncate">
                      {docLabel(doc.document_type)}
                    </div>
                    <div className="text-[11.5px] text-[var(--color-disabled)]">
                      {formatDate(doc.createdAt)}
                      {doc.file_url && (
                        <>
                          {' · '}
                          <a
                            href={doc.file_url}
                            target="_blank"
                            rel="noreferrer"
                            className="font-bold text-[var(--color-primary)]"
                          >
                            View file
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                  {locked && <Lock size={13} className="text-[var(--color-disabled)] shrink-0" />}
                  <Badge tone={statusTone(doc.status)}>
                    {doc.status === 'pending' ? 'In review' : (doc.status ?? 'In review')}
                  </Badge>
                </div>
              );
            })
          )}
        </Card>

        <Card>
          <Kicker className="mb-3">Upload a document</Kicker>
          <select
            value={newDoc.type}
            onChange={(e) => setNewDoc({ ...newDoc, type: e.target.value })}
            className="w-full rounded-[var(--radius-field)] px-4 py-3 text-[13.5px] mb-3 outline-none cursor-pointer"
            style={{ background: 'var(--color-canvas)', border: '1px solid var(--color-line)' }}
          >
            <option value="bank_proof">Bank proof</option>
            <option value="gstin">GSTIN certificate</option>
            <option value="pan">PAN card</option>
            <option value="trade_licence">Trade licence</option>
          </select>

          <UploadField
            value={newDoc.file}
            onChange={(file) => setNewDoc({ ...newDoc, file })}
            onError={(message) => toast.error(message)}
            placeholder="Choose a PDF or photo"
          />

          <Button
            type="button"
            size="md"
            className="mt-3"
            fullWidth
            disabled={!newDoc.file}
            loading={busy}
            onClick={upload}
          >
            Upload
          </Button>
        </Card>
      </div>
    </div>
  );
}
