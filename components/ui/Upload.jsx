'use client';

import { useRef } from 'react';
import { Upload as UploadIcon, X } from 'lucide-react';

// Cloudinary is fed through the API and rejects anything else; checking here
// means the vendor finds out before a 20MB upload, not after.
const ACCEPTED = 'image/jpeg,image/png,image/webp,application/pdf';
const MAX_BYTES = 20 * 1024 * 1024;

/**
 * Document/photo picker. An uploaded file shows as a solid teal chip with the
 * filename and a dismiss cross; an empty slot is a dashed grey drop target.
 */
export default function UploadField({
  label,
  value,
  onChange,
  onError,
  accept = ACCEPTED,
  placeholder = 'Tap to upload',
  required = false,
}) {
  const inputRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    if (file.size > MAX_BYTES) {
      onError?.('That file is over 20MB. Please upload a smaller file.');
      return;
    }
    onChange(file);
  };

  const filename = value?.name || (typeof value === 'string' ? value.split('/').pop() : null);

  return (
    <div className="w-full">
      {label && (
        <div className="text-[12.5px] font-bold text-[var(--color-ink-body)] mb-2">
          {label}
          {required && <span className="text-[var(--color-danger)]"> *</span>}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {filename ? (
        <div
          className="flex items-center justify-between gap-3 rounded-[var(--radius-field)] px-[18px] py-[14px]"
          style={{ background: 'var(--color-teal)' }}
        >
          <span className="text-white text-[13.5px] font-semibold truncate">{filename}</span>
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label={`Remove ${filename}`}
            className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer"
            style={{ background: 'rgba(255,255,255,.22)' }}
          >
            <X size={13} color="#fff" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFile(e.dataTransfer.files?.[0]);
          }}
          className="w-full rounded-[var(--radius-field)] py-6 px-4 flex flex-col items-center justify-center gap-2 cursor-pointer text-[var(--color-disabled)]"
          style={{ border: '1px dashed var(--color-line-strong)', background: 'var(--color-canvas)' }}
        >
          <UploadIcon size={18} />
          <span className="text-[13px]">{placeholder}</span>
        </button>
      )}
    </div>
  );
}
